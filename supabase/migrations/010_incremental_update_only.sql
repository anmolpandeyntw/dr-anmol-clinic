-- ============================================================
-- INCREMENTAL UPDATE MIGRATION (For databases that already ran 001-004)
-- Run this script if you already executed the first 4 files earlier!
-- ============================================================

-- 1. Create Rate Limits Table for Brute-Force & Bot Spam Protection
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  action_type TEXT NOT NULL,
  attempt_count INT NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  blocked_until TIMESTAMPTZ,
  CONSTRAINT uq_rate_limit_identifier_action UNIQUE (identifier, action_type)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rate_limits_policy" ON public.rate_limits;
CREATE POLICY "rate_limits_policy" ON public.rate_limits 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. Security Definer Function: Rate Limiter
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
  p_identifier := trim(p_identifier);
  p_action_type := trim(p_action_type);

  SELECT * INTO v_record FROM public.rate_limits
  WHERE identifier = p_identifier AND action_type = p_action_type FOR UPDATE;

  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > v_now THEN
    v_remaining_seconds := EXTRACT(EPOCH FROM (v_record.blocked_until - v_now))::INT;
    RETURN jsonb_build_object(
      'allowed', false,
      'error', 'RATE_LIMIT_EXCEEDED',
      'message', 'Too many attempts. Blocked for security.',
      'retry_after_seconds', v_remaining_seconds
    );
  END IF;

  IF v_record.id IS NULL THEN
    INSERT INTO public.rate_limits (identifier, action_type, attempt_count, first_attempt_at, last_attempt_at)
    VALUES (p_identifier, p_action_type, 1, v_now, v_now);
    RETURN jsonb_build_object('allowed', true, 'remaining_attempts', p_max_attempts - 1);
  ELSIF v_record.last_attempt_at < v_window_start THEN
    UPDATE public.rate_limits
    SET attempt_count = 1, first_attempt_at = v_now, last_attempt_at = v_now, blocked_until = NULL
    WHERE id = v_record.id;
    RETURN jsonb_build_object('allowed', true, 'remaining_attempts', p_max_attempts - 1);
  ELSE
    IF v_record.attempt_count >= p_max_attempts THEN
      UPDATE public.rate_limits
      SET attempt_count = v_record.attempt_count + 1, last_attempt_at = v_now,
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
      SET attempt_count = v_record.attempt_count + 1, last_attempt_at = v_now
      WHERE id = v_record.id;
      RETURN jsonb_build_object('allowed', true, 'remaining_attempts', p_max_attempts - (v_record.attempt_count + 1));
    END IF;
  END IF;
END;
$$;

-- 3. Update Available Slots Function with Minimum 4 Slots Buffer
CREATE OR REPLACE FUNCTION get_available_slots(
  p_clinic_id UUID,
  p_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_max_tokens INTEGER;
  v_booked_count INTEGER;
  v_start_time TIME;
  v_end_time TIME;
  v_is_blocked BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM blocked_dates 
    WHERE date = p_date AND (clinic_id = p_clinic_id::TEXT OR clinic_id = 'ALL')
  ) INTO v_is_blocked;

  IF v_is_blocked THEN
    RETURN json_build_object('available', false, 'reason', 'blocked', 'max_tokens', 0, 'booked_count', 0, 'available_count', 0);
  END IF;

  SELECT max_tokens, start_time, end_time INTO v_max_tokens, v_start_time, v_end_time
  FROM special_schedules WHERE clinic_id = p_clinic_id AND date = p_date;

  IF v_max_tokens IS NULL THEN
    SELECT max_tokens, start_time, end_time INTO v_max_tokens, v_start_time, v_end_time
    FROM schedules WHERE clinic_id = p_clinic_id
      AND day_of_week = EXTRACT(DOW FROM p_date)::INTEGER AND is_active = true;
  END IF;

  IF v_max_tokens IS NULL THEN
    SELECT capacity INTO v_max_tokens FROM clinics WHERE id = p_clinic_id;
    v_start_time := '10:00:00';
    v_end_time := '14:00:00';
  END IF;

  IF v_max_tokens IS NULL THEN v_max_tokens := 20; END IF;

  SELECT COUNT(*) INTO v_booked_count FROM appointments
  WHERE clinic_id = p_clinic_id AND schedule_date = p_date AND status != 'cancelled';

  RETURN json_build_object(
    'available', true,
    'max_tokens', v_max_tokens,
    'booked_count', v_booked_count,
    'available_count', GREATEST(4, v_max_tokens - v_booked_count),
    'start_time', v_start_time,
    'end_time', v_end_time
  );
END;
$$;

-- 4. Grant execution permissions
GRANT EXECUTE ON FUNCTION check_and_increment_rate_limit(TEXT, TEXT, INT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_available_slots(UUID, DATE) TO anon, authenticated;

-- 5. Ensure doctors & clinics RLS allow admin edits
GRANT ALL ON public.doctors TO anon, authenticated;
GRANT ALL ON public.clinics TO anon, authenticated;
GRANT ALL ON public.appointments TO anon, authenticated;

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_doctors_policy" ON public.doctors;
CREATE POLICY "public_doctors_policy" ON public.doctors FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_clinics_policy" ON public.clinics;
CREATE POLICY "public_clinics_policy" ON public.clinics FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_appointments_policy" ON public.appointments;
CREATE POLICY "public_appointments_policy" ON public.appointments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 6. Update Doctor Name to Dr. Anmol Pandey in DB
UPDATE public.doctors
SET full_name = 'Dr. Anmol Pandey',
    title = 'MBBS, MD (Medicine), DNB (Nephrology & Renal Transplant Medicine)',
    subtitle = 'Senior Consultant – Nephrology & Renal Transplant Medicine',
    years_of_experience = 13,
    updated_at = now();
