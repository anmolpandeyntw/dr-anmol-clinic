-- Migration 009: Persist Doctor Profile & Enable Full Clinic Permissions

-- Grant full permissions to anon & authenticated on doctors and clinics tables
GRANT ALL ON public.doctors TO anon, authenticated;
GRANT ALL ON public.clinics TO anon, authenticated;

-- Enable RLS
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- Drop restrictive policies if any
DROP POLICY IF EXISTS "Allow all users to select and update doctors" ON public.doctors;
DROP POLICY IF EXISTS "Allow all users to select and update clinics" ON public.clinics;

-- Permissive RLS policies for doctors
CREATE POLICY "Allow all users to select and update doctors"
  ON public.doctors
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Permissive RLS policies for clinics
CREATE POLICY "Allow all users to select and update clinics"
  ON public.clinics
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Update default doctor record in Supabase to Dr. Anmol Pandey
UPDATE public.doctors
SET full_name = 'Dr. Anmol Pandey',
    title = 'MBBS, MD (Medicine), DNB (Nephrology & Renal Transplant Medicine)',
    subtitle = 'Senior Consultant – Nephrology & Renal Transplant Medicine',
    years_of_experience = 13,
    updated_at = now();
