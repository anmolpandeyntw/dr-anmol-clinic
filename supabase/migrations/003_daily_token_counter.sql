-- Migration 003: Daily Token Counter RPC Update
-- Ensures token numbers start at 1 for new dates and increment sequentially up to 50 max per date

CREATE OR REPLACE FUNCTION book_appointment(
  p_clinic_id UUID,
  p_date DATE,
  p_name TEXT,
  p_mobile TEXT,
  p_age INTEGER,
  p_gender TEXT,
  p_payment_method TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_max_tokens INTEGER := 50; -- Default max 50 tokens per day
  v_current_count INTEGER;
  v_next_token INTEGER;
  v_appointment_id UUID;
  v_clinic_name TEXT;
BEGIN
  -- 1. Validate inputs
  IF char_length(trim(p_name)) < 2 OR char_length(trim(p_name)) > 35 THEN
    RAISE EXCEPTION 'Patient name must be between 2 and 35 letters';
  END IF;
  IF p_mobile !~ '^[6-9][0-9]{9}$' THEN
    RAISE EXCEPTION 'Invalid mobile number. Must be 10 digits starting with 6-9';
  END IF;
  IF p_age < 1 OR p_age > 115 THEN
    RAISE EXCEPTION 'Age must be between 1 and 115 years';
  END IF;
  IF p_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot book appointments for past dates';
  END IF;

  -- 2. Verify clinic exists and is active
  SELECT name INTO v_clinic_name
  FROM clinics WHERE id = p_clinic_id AND is_active = true;
  IF v_clinic_name IS NULL THEN
    RAISE EXCEPTION 'Clinic not found or inactive';
  END IF;

  -- 3. Check date is not blocked by doctor
  IF EXISTS (SELECT 1 FROM blocked_dates WHERE clinic_id = p_clinic_id AND date = p_date) THEN
    RAISE EXCEPTION 'Doctor is unavailable on this date';
  END IF;

  -- 4. Serialize concurrent bookings for same clinic + date
  PERFORM pg_advisory_xact_lock(hashtext(p_clinic_id::text || p_date::text));

  -- 5. Calculate next token number for this clinic + date (starts at 1 for new dates)
  SELECT COUNT(*) INTO v_current_count
  FROM appointments
  WHERE clinic_id = p_clinic_id AND schedule_date = p_date AND status != 'cancelled';

  v_next_token := v_current_count + 1;

  IF v_next_token > v_max_tokens THEN
    RAISE EXCEPTION 'Daily limit of 50 tokens reached for this date';
  END IF;

  -- 6. Insert appointment with assigned daily token number
  INSERT INTO appointments (
    clinic_id, schedule_date, patient_name, patient_mobile,
    patient_age, patient_gender, payment_method, token_number, status
  ) VALUES (
    p_clinic_id, p_date, trim(p_name), p_mobile,
    p_age, p_gender::patient_gender, p_payment_method::payment_method_type, v_next_token, 'confirmed'
  ) RETURNING id INTO v_appointment_id;

  -- 7. Return confirmation JSON with token number
  RETURN json_build_object(
    'appointment_id', v_appointment_id,
    'clinic_name', v_clinic_name,
    'date', p_date,
    'token_number', v_next_token,
    'status', 'confirmed'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION book_appointment(UUID, DATE, TEXT, TEXT, INTEGER, TEXT, TEXT) TO anon;
