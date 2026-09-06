-- Migration: Global Settings Security & RLS Policies for Site Settings & Bank Details
-- Dr. Anmol Pandey Clinic

-- 1. Create site_settings table if not exists (Notice: doctor_name deprecated; doctors.full_name is canonical source)
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

-- 2. Enable RLS on site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 3. Anonymous public SELECT policy (allows public to read site branding & contact details)
CREATE POLICY "Public read site_settings" ON site_settings
  FOR SELECT TO anon, authenticated
  USING (true);

-- 4. Strictly require AUTHENTICATED ADMIN session for INSERT / UPDATE
CREATE POLICY "Authenticated admin update site_settings" ON site_settings
  FOR UPDATE TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated admin insert site_settings" ON site_settings
  FOR INSERT TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

-- 5. Seed default record if table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM site_settings) THEN
    INSERT INTO site_settings (
      main_phone, main_whatsapp, main_email,
      upi_id, payment_qr_url, bank_account_number, account_holder_name, ifsc_code, logo_url
    ) VALUES (
      '+91 73172 86787', '7317286787', 'anmolpandeyntw@gmail.com',
      '7317286787@upi', '/images/payment_qr.jpg', 'XXXXXXXX4829', 'Dr. Anmol Pandey', 'SBIN0004521', '/images/clinic_logo.jpg'
    );
  END IF;
END $$;
