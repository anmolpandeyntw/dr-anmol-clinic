-- Migration 008: Enable Anon RLS Policies for Appointment Booking & Selection

-- Grant permissions to anon & authenticated roles
GRANT ALL ON public.appointments TO anon, authenticated;
GRANT ALL ON public.doctors TO anon, authenticated;
GRANT ALL ON public.clinics TO anon, authenticated;
GRANT ALL ON public.schedules TO anon, authenticated;
GRANT ALL ON public.specializations TO anon, authenticated;

-- Enable RLS on appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Allow public anon to insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public anon to select appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public anon to update appointments" ON public.appointments;

-- Create permissive RLS policies for appointments table
CREATE POLICY "Allow public anon to insert appointments"
  ON public.appointments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public anon to select appointments"
  ON public.appointments
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public anon to update appointments"
  ON public.appointments
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
