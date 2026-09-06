-- Migration 010: Rate Limiting & Security Hardening
-- Prevents Brute-Force attacks on Admin Login and Spam / Bot attacks on Appointment Booking

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP address, mobile number, or email
  action_type TEXT NOT NULL, -- 'book_appointment', 'admin_login', 'password_reset'
  attempt_count INT NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  blocked_until TIMESTAMPTZ,
  CONSTRAINT uq_rate_limit_identifier_action UNIQUE (identifier, action_type)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow RPC security definer access, block direct anon mutations
CREATE POLICY "rate_limits_admin_policy" ON public.rate_limits 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Security Definer Function: Rate Limiting Guard
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_identifier TEXT,
  p_action_type TEXT,
  p_max_attempts INT,
  p_window_seconds INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_record public.rate_limits%ROWTYPE;
  v_now TIMESTAMPTZ := now();
  v_window_start TIMESTAMPTZ := v_now - (p_window_seconds || ' seconds')::INTERVAL;
  v_remaining_seconds INT;
BEGIN
  -- 1. Clean input
  p_identifier := trim(p_identifier);
  p_action_type := trim(p_action_type);

  -- 2. Fetch existing rate limit record
  SELECT * INTO v_record
  FROM public.rate_limits
  WHERE identifier = p_identifier AND action_type = p_action_type
  FOR UPDATE;

  -- 3. Check if currently blocked
  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > v_now THEN
    v_remaining_seconds := EXTRACT(EPOCH FROM (v_record.blocked_until - v_now))::INT;
    RETURN jsonb_build_object(
      'allowed', false,
      'error', 'RATE_LIMIT_EXCEEDED',
      'message', 'Too many attempts. Blocked for security.',
      'retry_after_seconds', v_remaining_seconds
    );
  END IF;

  -- 4. If record does not exist or window expired, reset counter
  IF v_record.id IS NULL THEN
    INSERT INTO public.rate_limits (identifier, action_type, attempt_count, first_attempt_at, last_attempt_at)
    VALUES (p_identifier, p_action_type, 1, v_now, v_now);

    RETURN jsonb_build_object('allowed', true, 'remaining_attempts', p_max_attempts - 1);
  ELSIF v_record.last_attempt_at < v_window_start THEN
    UPDATE public.rate_limits
    SET attempt_count = 1,
        first_attempt_at = v_now,
        last_attempt_at = v_now,
        blocked_until = NULL
    WHERE id = v_record.id;

    RETURN jsonb_build_object('allowed', true, 'remaining_attempts', p_max_attempts - 1);
  ELSE
    -- Increment attempt count within current window
    IF v_record.attempt_count >= p_max_attempts THEN
      -- Block user for window duration
      UPDATE public.rate_limits
      SET attempt_count = v_record.attempt_count + 1,
          last_attempt_at = v_now,
          blocked_until = v_now + (p_window_seconds || ' seconds')::INTERVAL
      WHERE id = v_record.id;

      RETURN jsonb_build_object(
        'allowed', false,
        'error', 'RATE_LIMIT_EXCEEDED',
        'message', 'Maximum attempt limit reached. Access temporarily locked for protection.',
        'retry_after_seconds', p_window_seconds
      );
    ELSE
      UPDATE public.rate_limits
      SET attempt_count = v_record.attempt_count + 1,
          last_attempt_at = v_now
      WHERE id = v_record.id;

      RETURN jsonb_build_object('allowed', true, 'remaining_attempts', p_max_attempts - (v_record.attempt_count + 1));
    END IF;
  END IF;
END;
$$;

-- Grant execution to anon and authenticated
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(TEXT, TEXT, INT, INT) TO anon, authenticated;
