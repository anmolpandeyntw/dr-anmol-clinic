-- Migration 003: Admin Authentication, Role-Based Access Control, Queue Management & Audit Logging

-- 1. Create Enum for Roles
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'staff');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create user_roles Table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_roles_user UNIQUE (user_id)
);

-- 3. Create appointment_events Audit Table
CREATE TABLE IF NOT EXISTS appointment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  actor_role TEXT NOT NULL DEFAULT 'system',
  action TEXT NOT NULL,
  old_status appointment_status,
  new_status appointment_status,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create Performance & Uniqueness Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_clinic_date_token
  ON appointments (clinic_id, schedule_date, token_number)
  WHERE (status NOT IN ('cancelled', 'pending') AND token_number IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_appointments_queue_lookup
  ON appointments (clinic_id, schedule_date, status, token_number);

CREATE INDEX IF NOT EXISTS idx_appointments_date_status
  ON appointments (schedule_date, status);

CREATE INDEX IF NOT EXISTS idx_appointment_events_apt
  ON appointment_events (appointment_id, created_at DESC);

-- 5. Helper Function: get_auth_user_role() with NULL safety
CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 'anon';
  END IF;

  SELECT role::text INTO v_role
  FROM user_roles
  WHERE user_id = auth.uid();

  RETURN COALESCE(v_role, 'authenticated_without_role');
END;
$$;

-- 6. Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_events ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for user_roles (Zero client-side insert/update/delete)
DROP POLICY IF EXISTS "users_read_own_role" ON user_roles;
CREATE POLICY "users_read_own_role"
  ON user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR get_auth_user_role() = 'admin');

-- 8. RLS Policies for appointment_events (Read-only for staff/admin, zero client write)
DROP POLICY IF EXISTS "staff_admin_select_events" ON appointment_events;
CREATE POLICY "staff_admin_select_events"
  ON appointment_events FOR SELECT TO authenticated
  USING (get_auth_user_role() IN ('admin', 'staff'));

-- 9. RLS Policies for appointments (Revoke direct client UPDATE/DELETE)
DROP POLICY IF EXISTS "admin_all_appointments" ON appointments;
DROP POLICY IF EXISTS "admin_select_appointments" ON appointments;
DROP POLICY IF EXISTS "staff_select_appointments" ON appointments;
DROP POLICY IF EXISTS "staff_select_recent_appointments" ON appointments;

-- Admin can read all appointments across all dates
CREATE POLICY "admin_select_all_appointments"
  ON appointments FOR SELECT TO authenticated
  USING (get_auth_user_role() = 'admin');

-- Staff can read recent appointments (within last 30 days)
CREATE POLICY "staff_select_recent_appointments"
  ON appointments FOR SELECT TO authenticated
  USING (
    get_auth_user_role() = 'staff'
    AND schedule_date >= (CURRENT_DATE - INTERVAL '30 days')
  );

-- 10. RPC: perform_queue_action (Transactional State Machine + Token Lock + Audit Log)
CREATE OR REPLACE FUNCTION perform_queue_action(
  p_appointment_id UUID,
  p_action TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_appointment appointments%ROWTYPE;
  v_old_status appointment_status;
  v_new_status appointment_status;
  v_token INTEGER;
  v_actor_role TEXT;
BEGIN
  -- Authenticate caller
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_actor_role := get_auth_user_role();
  IF v_actor_role NOT IN ('admin', 'staff') THEN
    RAISE EXCEPTION 'Unauthorized role: %', v_actor_role;
  END IF;

  -- Lock target row
  SELECT * INTO v_appointment FROM appointments WHERE id = p_appointment_id FOR UPDATE;
  IF v_appointment.id IS NULL THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  v_old_status := v_appointment.status;
  v_token := v_appointment.token_number;

  -- State Machine Transitions
  IF p_action = 'confirm' OR p_action = 'mark_arrived' THEN
    IF v_old_status IN ('completed', 'cancelled') THEN
      RAISE EXCEPTION 'Cannot confirm or check-in appointment in status: %', v_old_status;
    END IF;

    v_new_status := CASE WHEN p_action = 'confirm' THEN 'confirmed'::appointment_status ELSE 'checked_in'::appointment_status END;

    -- Assign Token Number Monotonically with Advisory Lock
    IF v_token IS NULL THEN
      PERFORM pg_advisory_xact_lock(hashtext('token_' || v_appointment.clinic_id::text || v_appointment.schedule_date::text));
      SELECT COALESCE(MAX(token_number), 0) + 1 INTO v_token
      FROM appointments
      WHERE clinic_id = v_appointment.clinic_id
        AND schedule_date = v_appointment.schedule_date
        AND status NOT IN ('cancelled');
    END IF;

  ELSIF p_action = 'start_consultation' THEN
    IF v_old_status NOT IN ('checked_in', 'confirmed', 'pending') THEN
      RAISE EXCEPTION 'Cannot start consultation for appointment in status: %', v_old_status;
    END IF;

    -- If started from pending without token, assign token
    IF v_token IS NULL THEN
      PERFORM pg_advisory_xact_lock(hashtext('token_' || v_appointment.clinic_id::text || v_appointment.schedule_date::text));
      SELECT COALESCE(MAX(token_number), 0) + 1 INTO v_token
      FROM appointments
      WHERE clinic_id = v_appointment.clinic_id
        AND schedule_date = v_appointment.schedule_date
        AND status NOT IN ('cancelled');
    END IF;

    v_new_status := 'in_progress'::appointment_status;

  ELSIF p_action = 'complete_consultation' THEN
    IF v_old_status != 'in_progress' AND v_old_status != 'checked_in' THEN
      RAISE EXCEPTION 'Cannot complete consultation that is not in progress or checked in';
    END IF;
    v_new_status := 'completed'::appointment_status;

  ELSIF p_action = 'mark_no_show' THEN
    IF v_old_status IN ('completed', 'cancelled', 'no_show') THEN
      RAISE EXCEPTION 'Cannot mark appointment as no-show from status: %', v_old_status;
    END IF;
    v_new_status := 'no_show'::appointment_status;

  ELSIF p_action = 'cancel' THEN
    IF v_old_status IN ('completed', 'cancelled') THEN
      RAISE EXCEPTION 'Cannot cancel appointment that is already %', v_old_status;
    END IF;
    v_new_status := 'cancelled'::appointment_status;

  ELSE
    RAISE EXCEPTION 'Unknown queue action: %', p_action;
  END IF;

  -- Apply Update
  UPDATE appointments
  SET status = v_new_status,
      token_number = v_token,
      notes = COALESCE(p_notes, notes),
      updated_at = now()
  WHERE id = p_appointment_id;

  -- Write Audit Log
  INSERT INTO appointment_events (
    appointment_id, actor_id, actor_role, action, old_status, new_status, notes
  ) VALUES (
    p_appointment_id, auth.uid(), v_actor_role, p_action, v_old_status, v_new_status, p_notes
  );

  RETURN json_build_object(
    'appointment_id', p_appointment_id,
    'token_number', v_token,
    'status', v_new_status,
    'action', p_action
  );
END;
$$;

GRANT EXECUTE ON FUNCTION perform_queue_action(UUID, TEXT, TEXT) TO authenticated;

-- 11. RPC: call_next_patient (Single-Click Queue Advancement)
CREATE OR REPLACE FUNCTION call_next_patient(
  p_clinic_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_next_apt UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Lock queue processing for this clinic+date
  PERFORM pg_advisory_xact_lock(hashtext('queue_call_' || p_clinic_id::text || p_date::text));

  -- Find next checked_in patient first, fallback to confirmed
  SELECT id INTO v_next_apt
  FROM appointments
  WHERE clinic_id = p_clinic_id
    AND schedule_date = p_date
    AND status IN ('checked_in', 'confirmed')
  ORDER BY 
    CASE WHEN status = 'checked_in' THEN 1 ELSE 2 END,
    token_number ASC NULLS LAST,
    created_at ASC
  LIMIT 1;

  IF v_next_apt IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'No waiting patients in queue');
  END IF;

  RETURN perform_queue_action(v_next_apt, 'start_consultation', 'Called next from dashboard');
END;
$$;

GRANT EXECUTE ON FUNCTION call_next_patient(UUID, DATE) TO authenticated;

-- 12. RPC: get_admin_dashboard_stats
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats(
  p_clinic_id UUID DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total INTEGER;
  v_pending INTEGER;
  v_confirmed INTEGER;
  v_checked_in INTEGER;
  v_in_progress INTEGER;
  v_completed INTEGER;
  v_cancelled INTEGER;
  v_no_show INTEGER;
  v_revenue INTEGER;
  v_current_patient JSON;
  v_next_patient JSON;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT COUNT(*),
         COUNT(*) FILTER (WHERE status = 'pending'),
         COUNT(*) FILTER (WHERE status = 'confirmed'),
         COUNT(*) FILTER (WHERE status = 'checked_in'),
         COUNT(*) FILTER (WHERE status = 'in_progress'),
         COUNT(*) FILTER (WHERE status = 'completed'),
         COUNT(*) FILTER (WHERE status = 'cancelled'),
         COUNT(*) FILTER (WHERE status = 'no_show')
  INTO v_total, v_pending, v_confirmed, v_checked_in, v_in_progress, v_completed, v_cancelled, v_no_show
  FROM appointments
  WHERE (p_clinic_id IS NULL OR clinic_id = p_clinic_id)
    AND schedule_date = p_date;

  -- Estimate revenue from clinics consultation_fee for completed/confirmed
  SELECT COALESCE(SUM(c.consultation_fee), 0) INTO v_revenue
  FROM appointments a
  JOIN clinics c ON a.clinic_id = c.id
  WHERE (p_clinic_id IS NULL OR a.clinic_id = p_clinic_id)
    AND a.schedule_date = p_date
    AND a.status IN ('completed', 'in_progress', 'checked_in');

  -- Get current patient in progress
  SELECT json_build_object(
    'id', a.id,
    'token_number', a.token_number,
    'patient_name', a.patient_name,
    'patient_mobile', a.patient_mobile,
    'patient_age', a.patient_age,
    'patient_gender', a.patient_gender,
    'clinic_id', a.clinic_id,
    'status', a.status
  ) INTO v_current_patient
  FROM appointments a
  WHERE (p_clinic_id IS NULL OR a.clinic_id = p_clinic_id)
    AND a.schedule_date = p_date
    AND a.status = 'in_progress'
  ORDER BY a.updated_at DESC
  LIMIT 1;

  -- Get next patient in queue
  SELECT json_build_object(
    'id', a.id,
    'token_number', a.token_number,
    'patient_name', a.patient_name,
    'patient_mobile', a.patient_mobile,
    'patient_age', a.patient_age,
    'patient_gender', a.patient_gender,
    'clinic_id', a.clinic_id,
    'status', a.status
  ) INTO v_next_patient
  FROM appointments a
  WHERE (p_clinic_id IS NULL OR a.clinic_id = p_clinic_id)
    AND a.schedule_date = p_date
    AND a.status IN ('checked_in', 'confirmed')
  ORDER BY 
    CASE WHEN a.status = 'checked_in' THEN 1 ELSE 2 END,
    a.token_number ASC NULLS LAST,
    a.created_at ASC
  LIMIT 1;

  RETURN json_build_object(
    'total', COALESCE(v_total, 0),
    'pending', COALESCE(v_pending, 0),
    'confirmed', COALESCE(v_confirmed, 0),
    'checked_in', COALESCE(v_checked_in, 0),
    'in_progress', COALESCE(v_in_progress, 0),
    'completed', COALESCE(v_completed, 0),
    'cancelled', COALESCE(v_cancelled, 0),
    'no_show', COALESCE(v_no_show, 0),
    'revenue', COALESCE(v_revenue, 0),
    'current_patient', v_current_patient,
    'next_patient', v_next_patient
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats(UUID, DATE) TO authenticated;
