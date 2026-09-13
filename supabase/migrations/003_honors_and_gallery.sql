-- Migration: Honors, Medals & Photo Gallery Tables
-- Description: Create tables for doctor's academic standing medals and photo gallery posts with RLS policies

-- 1. Table for Medals & Academic Badges
CREATE TABLE IF NOT EXISTS honors_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat TEXT NOT NULL,          -- e.g. "GOLD MEDAL", "ISN HONOR", "NABH CERTIFIED"
  title TEXT NOT NULL,         -- e.g. "DNB Nephrology Academic Standing"
  sub TEXT NOT NULL,           -- e.g. "Dr. RML Institute of Medical Sciences, Lucknow"
  image_url TEXT NOT NULL,     -- image URL or data URI
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table for Photo Gallery & Media Items
CREATE TABLE IF NOT EXISTS gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('awards', 'lectures', 'clinics', 'dialysis')),
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  year TEXT NOT NULL DEFAULT '2025',
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE honors_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public READ for everyone
CREATE POLICY "Public honors_milestones select" ON honors_milestones FOR SELECT USING (true);
CREATE POLICY "Public gallery_items select" ON gallery_items FOR SELECT USING (true);

-- RLS Policies: Authenticated Admin WRITE/UPDATE/DELETE
CREATE POLICY "Admin honors_milestones all" ON honors_milestones FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin gallery_items all" ON gallery_items FOR ALL USING (auth.role() = 'authenticated');

-- Seed Data: Milestones
INSERT INTO honors_milestones (stat, title, sub, image_url, display_order) VALUES
('GOLD MEDAL', 'DNB Nephrology Academic Standing', 'Dr. RML Institute of Medical Sciences, Lucknow', '/images/gold_medal_badge.jpg', 1),
('ISN HONOR', 'ISN Research Excellence Award', 'Indian Society of Nephrology (ISNCON Conference)', '/images/isn_award_badge.jpg', 2),
('NABH CERTIFIED', 'NABH Quality Healthcare Standards', 'Certified OPD & Dialysis Care Protocol', '/images/nabh_accredited_badge.jpg', 3)
ON CONFLICT DO NOTHING;

-- Seed Data: Gallery Items
INSERT INTO gallery_items (category, title, location, year, image_url, caption, display_order) VALUES
('lectures', 'Guest Lecture on Living Donor Renal Transplant Protocols', 'Dr. RML Institute of Medical Sciences, Lucknow', '2025', '/images/anmol_lecture.png', 'Dr. Anmol Pandey in formal suit delivering an interactive keynote guest lecture at the International Medical Conference.', 1),
('awards', 'Felicitation & Medical Association Honor', 'Lucknow Medical Association Convention', '2024', '/images/anmol_award.png', 'Dr. Anmol Pandey honored for clinical contributions in kidney disease management and renal transplant medicine.', 2),
('clinics', 'Dr. Anmol Pandey Clinical Visit & Site Inspection', 'Vibhuti Khand, Gomti Nagar, Lucknow', '2025', '/images/anmol_real_original.png', 'Dr. Anmol Pandey during clinic site visits and patient facility inspections.', 3)
ON CONFLICT DO NOTHING;
