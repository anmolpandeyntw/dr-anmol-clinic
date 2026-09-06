-- Migration 004: Task 3 - Doctor/Admin Self-Service Management, Site Settings, RLS Security & Storage Policies

-- 1. Create site_settings Table (Centralized Contact Info)
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_phone TEXT NOT NULL DEFAULT '+91 94150 00000',
  main_whatsapp TEXT NOT NULL DEFAULT '919415000000',
  main_email TEXT NOT NULL DEFAULT 'contact@dramitsingh.com',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed initial site_settings if empty
INSERT INTO site_settings (main_phone, main_whatsapp, main_email)
SELECT '+91 94150 00000', '919415000000', 'contact@dramitsingh.com'
WHERE NOT EXISTS (SELECT 1 FROM site_settings);

-- 2. Alter clinics Table with New Columns & CHECK Constraints
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS is_private_clinic BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS online_booking_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
  ADD COLUMN IF NOT EXISTS opening_time TIME DEFAULT '10:00:00',
  ADD COLUMN IF NOT EXISTS closing_time TIME DEFAULT '18:00:00',
  ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 20,
  ADD COLUMN IF NOT EXISTS opd_days TEXT,
  ADD COLUMN IF NOT EXISTS opd_timing TEXT;

-- Add CHECK constraints for clinics
DO $$ BEGIN
  ALTER TABLE clinics ADD CONSTRAINT chk_consultation_fee_non_negative CHECK (consultation_fee >= 0);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE clinics ADD CONSTRAINT chk_capacity_positive CHECK (capacity > 0);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Alter schedules Table with slot_duration & CHECK Constraints
ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS slot_duration INTEGER NOT NULL DEFAULT 15;

DO $$ BEGIN
  ALTER TABLE schedules ADD CONSTRAINT chk_max_tokens_positive CHECK (max_tokens > 0);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE schedules ADD CONSTRAINT chk_slot_duration_positive CHECK (slot_duration > 0);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 4. Alter appointments Table with agreed_fee Snapshot
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS agreed_fee INTEGER NOT NULL DEFAULT 0;

-- 5. Enable RLS on site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 6. Strict RLS Policies for Configuration Tables (ADMIN Only Writes, STAFF Read-Only)
-- site_settings
DROP POLICY IF EXISTS "public_read_site_settings" ON site_settings;
CREATE POLICY "public_read_site_settings" ON site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_manage_site_settings" ON site_settings;
CREATE POLICY "admin_manage_site_settings" ON site_settings FOR ALL TO authenticated USING (get_auth_user_role() = 'admin');

-- clinics
DROP POLICY IF EXISTS "public_read_clinics" ON clinics;
CREATE POLICY "public_read_clinics" ON clinics FOR SELECT USING (is_active = true OR get_auth_user_role() IN ('admin', 'staff'));

DROP POLICY IF EXISTS "admin_manage_clinics" ON clinics;
CREATE POLICY "admin_manage_clinics" ON clinics FOR ALL TO authenticated USING (get_auth_user_role() = 'admin');

-- schedules
DROP POLICY IF EXISTS "public_read_schedules" ON schedules;
CREATE POLICY "public_read_schedules" ON schedules FOR SELECT USING (is_active = true OR get_auth_user_role() IN ('admin', 'staff'));

DROP POLICY IF EXISTS "admin_manage_schedules" ON schedules;
CREATE POLICY "admin_manage_schedules" ON schedules FOR ALL TO authenticated USING (get_auth_user_role() = 'admin');

-- blocked_dates
DROP POLICY IF EXISTS "public_read_blocked_dates" ON blocked_dates;
CREATE POLICY "public_read_blocked_dates" ON blocked_dates FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_manage_blocked_dates" ON blocked_dates;
CREATE POLICY "admin_manage_blocked_dates" ON blocked_dates FOR ALL TO authenticated USING (get_auth_user_role() = 'admin');

-- special_schedules
DROP POLICY IF EXISTS "public_read_special_schedules" ON special_schedules;
CREATE POLICY "public_read_special_schedules" ON special_schedules FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_manage_special_schedules" ON special_schedules;
CREATE POLICY "admin_manage_special_schedules" ON special_schedules FOR ALL TO authenticated USING (get_auth_user_role() = 'admin');

-- doctors
DROP POLICY IF EXISTS "public_read_doctors" ON doctors;
CREATE POLICY "public_read_doctors" ON doctors FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_manage_doctors" ON doctors;
CREATE POLICY "admin_manage_doctors" ON doctors FOR ALL TO authenticated USING (get_auth_user_role() = 'admin');

-- 7. Update book_appointment RPC to Save agreed_fee Snapshot
CREATE OR REPLACE FUNCTION book_appointment(
  p_clinic_id UUID,
  p_date DATE,
  p_name TEXT,
  p_mobile TEXT,
  p_age INTEGER,
  p_gender TEXT,
  p_payment_method TEXT,
  p_reason_for_visit TEXT DEFAULT NULL
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
  v_fee INTEGER;
  v_is_private BOOLEAN;
  v_online_enabled BOOLEAN;
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

  -- 2. Verify clinic exists, is active, and online booking is allowed
  SELECT name, consultation_fee, is_private_clinic, online_booking_enabled
  INTO v_clinic_name, v_fee, v_is_private, v_online_enabled
  FROM clinics WHERE id = p_clinic_id AND is_active = true;

  IF v_clinic_name IS NULL THEN
    RAISE EXCEPTION 'Clinic not found or inactive';
  END IF;

  IF v_online_enabled = false THEN
    RAISE EXCEPTION 'Online token booking is currently disabled for this location';
  END IF;

  -- 3. Check date is not blocked
  IF EXISTS (SELECT 1 FROM blocked_dates WHERE clinic_id = p_clinic_id AND date = p_date) THEN
    RAISE EXCEPTION 'Doctor is not available on this date';
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

  -- 6. Duplicate check
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
    RAISE EXCEPTION 'No slots available for this date (capacity full)';
  END IF;

  -- 8. Insert Appointment with agreed_fee snapshot
  INSERT INTO appointments (
    clinic_id, schedule_date, patient_name, patient_mobile,
    patient_age, patient_gender, payment_method, fee_amount, agreed_fee, notes
  ) VALUES (
    p_clinic_id, p_date, trim(p_name), p_mobile,
    p_age, p_gender::patient_gender, p_payment_method::payment_method_type,
    v_fee, v_fee, p_reason_for_visit
  ) RETURNING id INTO v_appointment_id;

  -- 9. Return Minimal Confirmation
  RETURN json_build_object(
    'appointment_id', v_appointment_id,
    'clinic_name', v_clinic_name,
    'date', p_date,
    'status', 'pending',
    'agreed_fee', v_fee
  );
END;
$$;

GRANT EXECUTE ON FUNCTION book_appointment(UUID, DATE, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION book_appointment(UUID, DATE, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT) TO authenticated;

-- 8. Supabase Storage Bucket Setup for Clinic Assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic-assets', 'clinic-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public Read Clinic Assets" ON storage.objects;
CREATE POLICY "Public Read Clinic Assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'clinic-assets');

DROP POLICY IF EXISTS "Admin Manage Clinic Assets" ON storage.objects;
CREATE POLICY "Admin Manage Clinic Assets" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'clinic-assets' AND get_auth_user_role() = 'admin');
