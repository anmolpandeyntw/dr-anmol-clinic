-- Migration: Initial Schema for Dr. Amit Kumar Singh Clinic

-- 1. Enums
CREATE TYPE appointment_status AS ENUM (
  'pending', 'confirmed', 'checked_in', 'in_progress',
  'completed', 'cancelled', 'no_show'
);
CREATE TYPE patient_gender AS ENUM ('male', 'female', 'other');
CREATE TYPE payment_method_type AS ENUM ('pay_online', 'pay_at_clinic');

-- 2. Tables
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  bio TEXT,
  years_of_experience INTEGER NOT NULL DEFAULT 0,
  photo_url TEXT,
  qualifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  memberships JSONB NOT NULL DEFAULT '[]'::jsonb,
  publications JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  operating_hours TEXT,
  consultation_fee INTEGER,
  map_url TEXT,
  photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_tokens INTEGER NOT NULL CHECK (max_tokens > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_schedule_clinic_day UNIQUE (clinic_id, day_of_week)
);

CREATE TABLE blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_blocked_clinic_date UNIQUE (clinic_id, date)
);

CREATE TABLE special_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_tokens INTEGER NOT NULL CHECK (max_tokens > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_special_clinic_date UNIQUE (clinic_id, date)
);

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  schedule_date DATE NOT NULL,
  patient_name TEXT NOT NULL,
  patient_mobile TEXT NOT NULL,
  patient_age INTEGER NOT NULL,
  patient_gender patient_gender NOT NULL,
  payment_method payment_method_type NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  token_number INTEGER,
  fee_amount INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_patient_name CHECK (char_length(trim(patient_name)) BETWEEN 2 AND 100),
  CONSTRAINT chk_patient_mobile CHECK (patient_mobile ~ '^[6-9][0-9]{9}$'),
  CONSTRAINT chk_patient_age CHECK (patient_age BETWEEN 0 AND 120),
  CONSTRAINT chk_schedule_date_not_past CHECK (schedule_date >= CURRENT_DATE)
);

CREATE UNIQUE INDEX idx_appointments_no_duplicate
  ON appointments (patient_mobile, clinic_id, schedule_date)
  WHERE (status != 'cancelled');

-- 3. RLS Policies
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_doctors" ON doctors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "select_clinics" ON clinics FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "select_specializations" ON specializations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "select_schedules" ON schedules FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "select_blocked_dates" ON blocked_dates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "select_special_schedules" ON special_schedules FOR SELECT TO anon, authenticated USING (true);

-- Admin Full Access Policies (Authenticated Role)
CREATE POLICY "admin_manage_doctors" ON doctors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_manage_clinics" ON clinics FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_manage_specializations" ON specializations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_manage_schedules" ON schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_manage_blocked_dates" ON blocked_dates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_manage_special_schedules" ON special_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_manage_appointments" ON appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. BEFORE INSERT Trigger
CREATE OR REPLACE FUNCTION fn_enforce_appointment_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.status := 'pending';
  NEW.token_number := NULL;
  NEW.fee_amount := NULL;
  NEW.notes := NULL;
  NEW.created_at := now();
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_appointment_defaults
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION fn_enforce_appointment_defaults();

-- 5. RPC: book_appointment()
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
  v_max_tokens INTEGER;
  v_current_count INTEGER;
  v_appointment_id UUID;
  v_clinic_name TEXT;
BEGIN
  -- 1. Validate inputs
  IF char_length(trim(p_name)) < 2 OR char_length(trim(p_name)) > 100 THEN
    RAISE EXCEPTION 'Patient name must be between 2 and 100 characters';
  END IF;
  IF p_mobile !~ '^[6-9][0-9]{9}$' THEN
    RAISE EXCEPTION 'Invalid mobile number. Must be 10 digits starting with 6-9';
  END IF;
  IF p_age < 0 OR p_age > 120 THEN
    RAISE EXCEPTION 'Age must be between 0 and 120';
  END IF;
  IF p_gender NOT IN ('male', 'female', 'other') THEN
    RAISE EXCEPTION 'Gender must be male, female, or other';
  END IF;
  IF p_payment_method NOT IN ('pay_online', 'pay_at_clinic') THEN
    RAISE EXCEPTION 'Payment method must be pay_online or pay_at_clinic';
  END IF;
  IF p_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot book appointments in the past';
  END IF;

  -- 2. Verify clinic exists and is active
  SELECT name INTO v_clinic_name
  FROM clinics WHERE id = p_clinic_id AND is_active = true;
  IF v_clinic_name IS NULL THEN
    RAISE EXCEPTION 'Clinic not found or inactive';
  END IF;

  -- 3. Check date is not blocked
  IF EXISTS (SELECT 1 FROM blocked_dates WHERE clinic_id = p_clinic_id AND date = p_date) THEN
    RAISE EXCEPTION 'This date is not available for appointments';
  END IF;

  -- 4. Advisory lock to serialize concurrent bookings for same clinic+date
  PERFORM pg_advisory_xact_lock(hashtext(p_clinic_id::text || p_date::text));

  -- 5. Get capacity (special_schedules first, fallback to regular)
  SELECT max_tokens INTO v_max_tokens
  FROM special_schedules WHERE clinic_id = p_clinic_id AND date = p_date;
  IF v_max_tokens IS NULL THEN
    SELECT max_tokens INTO v_max_tokens
    FROM schedules WHERE clinic_id = p_clinic_id
      AND day_of_week = EXTRACT(DOW FROM p_date)::INTEGER
      AND is_active = true;
  END IF;
  IF v_max_tokens IS NULL THEN
    RAISE EXCEPTION 'No schedule available for this date';
  END IF;

  -- 6. Duplicate check (friendly error)
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE patient_mobile = p_mobile AND clinic_id = p_clinic_id
      AND schedule_date = p_date AND status != 'cancelled'
  ) THEN
    RAISE EXCEPTION 'You already have a booking for this date at this clinic';
  END IF;

  -- 7. Capacity check
  SELECT COUNT(*) INTO v_current_count
  FROM appointments
  WHERE clinic_id = p_clinic_id AND schedule_date = p_date AND status != 'cancelled';
  IF v_current_count >= v_max_tokens THEN
    RAISE EXCEPTION 'No slots available for this date';
  END IF;

  -- 8. Insert
  INSERT INTO appointments (
    clinic_id, schedule_date, patient_name, patient_mobile,
    patient_age, patient_gender, payment_method
  ) VALUES (
    p_clinic_id, p_date, trim(p_name), p_mobile,
    p_age, p_gender::patient_gender, p_payment_method::payment_method_type
  ) RETURNING id INTO v_appointment_id;

  -- 9. Return minimal confirmation
  RETURN json_build_object(
    'appointment_id', v_appointment_id,
    'clinic_name', v_clinic_name,
    'date', p_date,
    'status', 'pending'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION book_appointment(UUID, DATE, TEXT, TEXT, INTEGER, TEXT, TEXT) TO anon;

-- 6. RPC: get_available_slots()
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
  SELECT EXISTS (SELECT 1 FROM blocked_dates WHERE clinic_id = p_clinic_id AND date = p_date) INTO v_is_blocked;
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
    RETURN json_build_object('available', false, 'reason', 'no_schedule', 'max_tokens', 0, 'booked_count', 0, 'available_count', 0);
  END IF;

  SELECT COUNT(*) INTO v_booked_count FROM appointments
  WHERE clinic_id = p_clinic_id AND schedule_date = p_date AND status != 'cancelled';

  RETURN json_build_object(
    'available', v_booked_count < v_max_tokens,
    'max_tokens', v_max_tokens,
    'booked_count', v_booked_count,
    'available_count', v_max_tokens - v_booked_count,
    'start_time', v_start_time,
    'end_time', v_end_time
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_available_slots(UUID, DATE) TO anon;
