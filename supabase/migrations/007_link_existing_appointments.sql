-- Migration 007: Link Existing Appointments to Active Clinic & Ensure Valid Foreign Keys

DO $$
DECLARE
  v_clinic_id UUID;
BEGIN
  -- Find or insert a default clinic UUID
  SELECT id INTO v_clinic_id FROM public.clinics ORDER BY created_at LIMIT 1;

  IF v_clinic_id IS NULL THEN
    INSERT INTO public.clinics (
      name, address, consultation_fee, is_active
    ) VALUES (
      'Dr. Anmol Pandey Private Clinic',
      'Lucknow, Uttar Pradesh',
      600,
      true
    ) RETURNING id INTO v_clinic_id;
  END IF;

  -- Update any NULL clinic_id rows in appointments to link to v_clinic_id
  UPDATE public.appointments
  SET clinic_id = v_clinic_id
  WHERE clinic_id IS NULL;
END $$;
