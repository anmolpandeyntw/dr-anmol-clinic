-- ============================================================
-- FINAL MASTER CUMULATIVE MIGRATION SCRIPT
-- Project: Dr. Anmol Pandey Clinic Management System
-- Run this single script in the Supabase SQL Editor to apply
-- all tables, security RPCs, rate limits, permissions, and seed data!
-- ============================================================

-- ------------------------------------------------------------
-- 1. ENUMS
-- ------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM (
    'pending', 'confirmed', 'checked_in', 'in_progress',
    'completed', 'cancelled', 'no_show'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE patient_gender AS ENUM ('male', 'female', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_type AS ENUM ('pay_online', 'pay_at_clinic');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ------------------------------------------------------------
-- 2. CORE TABLES & COLUMN UPGRADES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctors (
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

CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  whatsapp_number TEXT,
  operating_hours TEXT,
  consultation_fee INTEGER DEFAULT 600,
  map_url TEXT,
  google_maps_url TEXT,
  photo_url TEXT,
  hospital_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_private_clinic BOOLEAN NOT NULL DEFAULT true,
  online_booking_enabled BOOLEAN NOT NULL DEFAULT true,
  capacity INTEGER NOT NULL DEFAULT 20,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure columns exist if table was created previously
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS is_private_clinic BOOLEAN DEFAULT true;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS online_booking_enabled BOOLEAN DEFAULT true;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 20;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS hospital_url TEXT;

CREATE TABLE IF NOT EXISTS specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_tokens INTEGER NOT NULL CHECK (max_tokens > 0),
  slot_duration INTEGER DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id TEXT NOT NULL,
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS special_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_tokens INTEGER NOT NULL CHECK (max_tokens > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  patient_name TEXT NOT NULL,
  patient_mobile TEXT NOT NULL,
  patient_age INTEGER NOT NULL CHECK (patient_age BETWEEN 0 AND 120),
  patient_gender patient_gender NOT NULL,
  payment_method payment_method_type NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  token_number INTEGER,
  fee_amount INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_phone TEXT NOT NULL DEFAULT '+91 73172 86787',
  main_whatsapp TEXT NOT NULL DEFAULT '7317286787',
  main_email TEXT NOT NULL DEFAULT 'anmolpandeyntw@gmail.com',
  upi_id TEXT DEFAULT '7317286787@upi',
  payment_qr_url TEXT DEFAULT '/images/payment_qr.jpg',
  bank_account_number TEXT DEFAULT 'XXXXXXXX4829',
  account_holder_name TEXT DEFAULT 'Dr. Anmol Pandey',
  ifsc_code TEXT DEFAULT 'SBIN0004521',
  logo_url TEXT DEFAULT '/images/clinic_logo.jpg',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Upgrade site_settings table columns if created in earlier migration
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS upi_id TEXT DEFAULT '7317286787@upi';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS payment_qr_url TEXT DEFAULT '/images/payment_qr.jpg';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bank_account_number TEXT DEFAULT 'XXXXXXXX4829';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS account_holder_name TEXT DEFAULT 'Dr. Anmol Pandey';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS ifsc_code TEXT DEFAULT 'SBIN0004521';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '/images/clinic_logo.jpg';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS main_whatsapp TEXT DEFAULT '7317286787';

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_roles_user UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'pay_at_clinic',
  amount INTEGER NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED')),
  transaction_ref TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consultation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  patient_mobile TEXT NOT NULL,
  patient_age INTEGER NOT NULL CHECK (patient_age BETWEEN 0 AND 120),
  patient_gender TEXT NOT NULL CHECK (patient_gender IN ('male', 'female', 'other')),
  preferred_date DATE NOT NULL,
  preferred_time TEXT,
  reason_for_visit TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED')),
  meeting_link TEXT,
  appointment_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  action_type TEXT NOT NULL,
  attempt_count INT NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  blocked_until TIMESTAMPTZ,
  CONSTRAINT uq_rate_limit_identifier_action UNIQUE (identifier, action_type)
);

-- ------------------------------------------------------------
-- 3. PERMISSIONS & RLS POLICIES (Full Access for Admin/Anon Booking)
-- ------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_doctors_policy" ON doctors;
CREATE POLICY "public_doctors_policy" ON doctors FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_clinics_policy" ON clinics;
CREATE POLICY "public_clinics_policy" ON clinics FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_schedules_policy" ON schedules;
CREATE POLICY "public_schedules_policy" ON schedules FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_blocked_dates_policy" ON blocked_dates;
CREATE POLICY "public_blocked_dates_policy" ON blocked_dates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_appointments_policy" ON appointments;
CREATE POLICY "public_appointments_policy" ON appointments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_site_settings_policy" ON site_settings;
CREATE POLICY "public_site_settings_policy" ON site_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_consultation_requests_policy" ON consultation_requests;
CREATE POLICY "public_consultation_requests_policy" ON consultation_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "rate_limits_policy" ON rate_limits;
CREATE POLICY "rate_limits_policy" ON rate_limits FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 4. RPC FUNCTIONS
-- ------------------------------------------------------------

-- A. Rate Limiter RPC
CREATE OR REPLACE FUNCTION check_and_increment_rate_limit(
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

-- B. Appointment Slot Availability RPC
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

-- C. Book Appointment RPC
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
  v_appointment_id UUID;
  v_clinic_name TEXT;
  v_token_number INTEGER;
BEGIN
  SELECT name INTO v_clinic_name FROM clinics WHERE id = p_clinic_id;
  
  SELECT COALESCE(MAX(token_number), 0) + 1 INTO v_token_number
  FROM appointments WHERE clinic_id = p_clinic_id AND schedule_date = p_date;

  INSERT INTO appointments (
    clinic_id, schedule_date, patient_name, patient_mobile,
    patient_age, patient_gender, payment_method, token_number, status
  ) VALUES (
    p_clinic_id, p_date, trim(p_name), p_mobile,
    p_age, p_gender::patient_gender, p_payment_method::payment_method_type,
    v_token_number, 'pending'
  ) RETURNING id INTO v_appointment_id;

  RETURN json_build_object(
    'appointment_id', v_appointment_id,
    'clinic_name', COALESCE(v_clinic_name, 'Private Clinic'),
    'date', p_date,
    'token_number', v_token_number,
    'status', 'pending'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION check_and_increment_rate_limit(TEXT, TEXT, INT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_available_slots(UUID, DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION book_appointment(UUID, DATE, TEXT, TEXT, INTEGER, TEXT, TEXT) TO anon, authenticated;

-- ------------------------------------------------------------
-- 5. SEED DEFAULT DOCTOR & PRACTICE DATA
-- ------------------------------------------------------------
INSERT INTO doctors (id, full_name, title, subtitle, years_of_experience)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Dr. Anmol Pandey',
  'MBBS, MD (Medicine), DNB (Nephrology & Renal Transplant Medicine)',
  'Senior Consultant – Nephrology & Renal Transplant Medicine',
  13
)
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Dr. Anmol Pandey',
  title = 'MBBS, MD (Medicine), DNB (Nephrology & Renal Transplant Medicine)',
  subtitle = 'Senior Consultant – Nephrology & Renal Transplant Medicine',
  years_of_experience = 13;

INSERT INTO site_settings (main_phone, main_whatsapp, main_email, upi_id)
VALUES ('+91 73172 86787', '7317286787', 'anmolpandeyntw@gmail.com', '7317286787@upi')
ON CONFLICT DO NOTHING;
