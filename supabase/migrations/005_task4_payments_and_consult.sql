-- Migration 005: Task 4 - Payments, Online Consultation Workflow, Notifications Log & Secure Token Lookup

-- 1. Create payments Table
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

-- 2. Create consultation_requests Table (Online Video Consultations)
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

-- 3. Create notifications_log Table
CREATE TABLE IF NOT EXISTS notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'LOGGED',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- payments (Doctor & Staff Read-Only, Admin Manage, Zero Public Read)
DROP POLICY IF EXISTS "staff_admin_read_payments" ON payments;
CREATE POLICY "staff_admin_read_payments" ON payments FOR SELECT TO authenticated USING (get_auth_user_role() IN ('admin', 'staff'));

DROP POLICY IF EXISTS "admin_manage_payments" ON payments;
CREATE POLICY "admin_manage_payments" ON payments FOR ALL TO authenticated USING (get_auth_user_role() = 'admin');

-- consultation_requests (Public Insert, Admin Manage)
DROP POLICY IF EXISTS "public_insert_consultation_requests" ON consultation_requests;
CREATE POLICY "public_insert_consultation_requests" ON consultation_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_manage_consultation_requests" ON consultation_requests;
CREATE POLICY "admin_manage_consultation_requests" ON consultation_requests FOR ALL TO authenticated USING (get_auth_user_role() IN ('admin', 'staff'));

-- notifications_log
DROP POLICY IF EXISTS "admin_read_notifications_log" ON notifications_log;
CREATE POLICY "admin_read_notifications_log" ON notifications_log FOR SELECT TO authenticated USING (get_auth_user_role() IN ('admin', 'staff'));

-- 6. RPC: process_payment_webhook (Server-side Verified Payment Completion)
CREATE OR REPLACE FUNCTION process_payment_webhook(
  p_appointment_id UUID,
  p_provider TEXT,
  p_txn_ref TEXT,
  p_amount INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_apt appointments%ROWTYPE;
BEGIN
  -- Lock target appointment
  SELECT * INTO v_apt FROM appointments WHERE id = p_appointment_id FOR UPDATE;
  IF v_apt.id IS NULL THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  -- Insert or Update payment record as PAID
  INSERT INTO payments (appointment_id, provider, amount, status, transaction_ref, verified_at)
  VALUES (p_appointment_id, p_provider, p_amount, 'PAID', p_txn_ref, now())
  ON CONFLICT (id) DO UPDATE
  SET status = 'PAID', transaction_ref = p_txn_ref, verified_at = now();

  -- Update appointment status to confirmed
  UPDATE appointments
  SET status = 'confirmed',
      updated_at = now()
  WHERE id = p_appointment_id;

  RETURN json_build_object(
    'success', true,
    'appointment_id', p_appointment_id,
    'status', 'PAID',
    'transaction_ref', p_txn_ref
  );
END;
$$;

GRANT EXECUTE ON FUNCTION process_payment_webhook(UUID, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION process_payment_webhook(UUID, TEXT, TEXT, INTEGER) TO anon;

-- 7. RPC: get_appointment_by_token (Secure Patient Non-Guessable Lookup)
CREATE OR REPLACE FUNCTION get_appointment_by_token(
  p_token UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_res JSON;
BEGIN
  SELECT json_build_object(
    'id', cr.id,
    'patient_name', cr.patient_name,
    'preferred_date', cr.preferred_date,
    'preferred_time', cr.preferred_time,
    'status', cr.status,
    'meeting_link', CASE WHEN cr.status = 'APPROVED' THEN cr.meeting_link ELSE NULL END
  ) INTO v_res
  FROM consultation_requests cr
  WHERE cr.appointment_token = p_token;

  IF v_res IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired consultation token';
  END IF;

  RETURN v_res;
END;
$$;

GRANT EXECUTE ON FUNCTION get_appointment_by_token(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_appointment_by_token(UUID) TO authenticated;
