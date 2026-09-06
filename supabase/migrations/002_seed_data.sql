-- Seed Data for Dr. Amit Kumar Singh Clinic

DO $$
DECLARE
  v_doctor_id UUID;
  v_clinic_a_id UUID;
  v_clinic_b_id UUID;
BEGIN
  -- Insert Doctor
  INSERT INTO doctors (
    full_name, title, subtitle, bio, years_of_experience,
    qualifications, experience, memberships, publications
  ) VALUES (
    'Dr. Amit Kumar Singh',
    'MBBS, MD (Medicine), DNB (Nephrology & Renal Transplant Medicine)',
    'Senior Consultant – Nephrology & Renal Transplant Medicine',
    'Dr. Amit Kumar Singh is a Senior Consultant in Nephrology & Renal Transplant Medicine with over 13 years of experience in managing complex kidney disorders, dialysis, and transplant medicine. He is known for his patient-centric approach and expertise in critical care nephrology.',
    13,
    '[{"degree": "DNB", "field": "Nephrology & Renal Transplant Medicine", "institution": "Dr. RML Institute of Medical Sciences, Lucknow", "year": 2022}, {"degree": "MD", "field": "Internal Medicine", "institution": "S.N. Medical College, Agra", "year": 2015}, {"degree": "MBBS", "field": "Medicine", "institution": "G.S.V.M. Medical College, Kanpur", "year": 2012}]'::jsonb,
    '[{"role": "Senior Consultant – Nephrology & Renal Transplant Medicine", "institution": "Mirus Critical Care Centre, Lucknow", "period": "Jan 2023 – Present", "current": true}, {"role": "Resident, Dept. of Nephrology", "institution": "Dr. RML Institute of Medical Sciences, Lucknow", "period": "2019 – 2022", "current": false}, {"role": "Senior Resident, Medicine & Nephrology", "institution": "VMMC & Safdarjung Hospital, New Delhi", "period": "2016 – 2019", "current": false}, {"role": "Resident Doctor, Internal Medicine", "institution": "AIIMS New Delhi", "period": "2016", "current": false}, {"role": "Junior Resident, Internal Medicine", "institution": "S.N. Medical College, Agra", "period": "2012 – 2015", "current": false}]'::jsonb,
    '["Indian Society of Nephrology", "International Society of Nephrology"]'::jsonb,
    '[{"title": "COVID-19 Infection in Kidney Transplant Recipients – First vs Second Wave"}, {"title": "Recurrent Proteinuria with Graft Dysfunction"}, {"title": "Phialemonium Obovatum Infection in the Renal Allograft"}, {"title": "Calcium Phosphate Product & PTH Levels in Stage 5 CKD Patients"}]'::jsonb
  ) RETURNING id INTO v_doctor_id;

  -- Insert Clinics
  INSERT INTO clinics (
    doctor_id, name, address, phone, operating_hours,
    consultation_fee, display_order
  ) VALUES (
    v_doctor_id,
    '[CLINIC A — TO BE CONFIRMED]',
    '[Address Line 1, Lucknow — TO BE CONFIRMED]',
    '[PHONE — TO BE CONFIRMED]',
    'Mon, Wed, Fri, Sat — 10:00 AM to 2:00 PM [TO BE CONFIRMED]',
    500,
    1
  ) RETURNING id INTO v_clinic_a_id;

  INSERT INTO clinics (
    doctor_id, name, address, phone, operating_hours,
    consultation_fee, display_order
  ) VALUES (
    v_doctor_id,
    '[CLINIC B — TO BE CONFIRMED]',
    '[Address Line 2, Lucknow — TO BE CONFIRMED]',
    '[PHONE — TO BE CONFIRMED]',
    'Tue, Thu, Sat — 5:00 PM to 8:00 PM [TO BE CONFIRMED]',
    700,
    2
  ) RETURNING id INTO v_clinic_b_id;

  -- Insert Specializations
  INSERT INTO specializations (doctor_id, name, display_order) VALUES
    (v_doctor_id, 'Critical Care Nephrology', 1),
    (v_doctor_id, 'Primary & Secondary Kidney Disorders', 2),
    (v_doctor_id, 'Diabetes & Hypertension-Related Kidney Disease', 3),
    (v_doctor_id, 'Renal Replacement Therapy', 4),
    (v_doctor_id, 'Hemodialysis', 5),
    (v_doctor_id, 'CRRT', 6),
    (v_doctor_id, 'Peritoneal Dialysis', 7),
    (v_doctor_id, 'Kidney Transplantation Medicine', 8),
    (v_doctor_id, 'Interventional Nephrology', 9),
    (v_doctor_id, 'Vascular Access', 10),
    (v_doctor_id, 'Peritoneal Dialysis Catheter Procedures', 11),
    (v_doctor_id, 'Kidney Biopsy', 12),
    (v_doctor_id, 'Clinical Research & Medical Writing', 13);

  -- Insert Schedules for Clinic A
  INSERT INTO schedules (clinic_id, day_of_week, start_time, end_time, max_tokens) VALUES
    (v_clinic_a_id, 1, '10:00:00', '14:00:00', 20),
    (v_clinic_a_id, 3, '10:00:00', '14:00:00', 20),
    (v_clinic_a_id, 5, '10:00:00', '14:00:00', 20),
    (v_clinic_a_id, 6, '10:00:00', '14:00:00', 20);

  -- Insert Schedules for Clinic B
  INSERT INTO schedules (clinic_id, day_of_week, start_time, end_time, max_tokens) VALUES
    (v_clinic_b_id, 2, '17:00:00', '20:00:00', 15),
    (v_clinic_b_id, 4, '17:00:00', '20:00:00', 15),
    (v_clinic_b_id, 6, '17:00:00', '20:00:00', 15);

  -- Insert Blocked Dates
  INSERT INTO blocked_dates (clinic_id, date, reason) VALUES
    (v_clinic_a_id, '2026-08-15', 'Independence Day'),
    (v_clinic_a_id, '2026-10-02', 'Gandhi Jayanti'),
    (v_clinic_b_id, '2026-08-15', 'Independence Day');

END;
$$;
