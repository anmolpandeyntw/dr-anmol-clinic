import type { Doctor, Clinic, Specialization, AvailableSlots, BookingConfirmation } from '../types/database';

export const MOCK_DOCTOR: Doctor = {
  id: 'mock-doctor-uuid-001',
  full_name: 'Dr. Anmol Pandey',
  title: 'MBBS, MD (Medicine), DNB (Nephrology & Renal Transplant Medicine)',
  subtitle: 'Senior Consultant – Nephrology & Renal Transplant Medicine',
  bio: 'Dr. Anmol Pandey is a Senior Consultant in Nephrology & Renal Transplant Medicine with over 13 years of experience in managing complex kidney disorders, dialysis, and transplant medicine. Known for a patient-centric approach and expertise in critical care nephrology.',
  years_of_experience: 13,
  photo_url: '/images/doctor_portrait.jpg',
  qualifications: [
    { degree: 'DNB', field: 'Nephrology & Renal Transplant Medicine', institution: 'Dr. RML Institute of Medical Sciences, Lucknow', year: 2022 },
    { degree: 'MD', field: 'Internal Medicine', institution: 'S.N. Medical College, Agra', year: 2015 },
    { degree: 'MBBS', field: 'Medicine', institution: 'G.S.V.M. Medical College, Kanpur', year: 2012 }
  ],
  experience: [
    { role: 'Senior Consultant – Nephrology & Renal Transplant Medicine', institution: 'Mirus Critical Care Centre, Lucknow', period: 'Jan 2023 – Present', current: true },
    { role: 'Resident, Dept. of Nephrology', institution: 'Dr. RML Institute of Medical Sciences, Lucknow', period: '2019 – 2022', current: false },
    { role: 'Senior Resident, Medicine & Nephrology', institution: 'VMMC & Safdarjung Hospital, New Delhi', period: '2016 – 2019', current: false },
    { role: 'Resident Doctor, Internal Medicine', institution: 'AIIMS New Delhi', period: '2016', current: false },
    { role: 'Junior Resident, Internal Medicine', institution: 'S.N. Medical College, Agra', period: '2012 – 2015', current: false }
  ],
  memberships: [
    'Indian Society of Nephrology',
    'International Society of Nephrology'
  ],
  publications: [
    { title: 'COVID-19 Infection in Kidney Transplant Recipients – First vs Second Wave' },
    { title: 'Recurrent Proteinuria with Graft Dysfunction' },
    { title: 'Phialemonium Obovatum Infection in the Renal Allograft' },
    { title: 'Calcium Phosphate Product & PTH Levels in Stage 5 CKD Patients' }
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const MOCK_CLINICS: Clinic[] = [
  {
    id: 'clinic-private-01',
    doctor_id: 'doc-001',
    name: 'Dr. Anmol Pandey (Gomtinagar) Clinic',
    address: 'Vibhuti Khand, Gomtinagar, Lucknow',
    phone: '7317286787',
    operating_hours: 'Mon, Wed, Fri, Sat — 10:00 AM to 2:00 PM',
    consultation_fee: 700,
    map_url: 'https://maps.google.com/?q=Gomtinagar+Lucknow',
    google_maps_url: 'https://maps.google.com/?q=Gomtinagar+Lucknow',
    whatsapp_number: '7317286787',
    photo_url: null,
    is_active: true,
    display_order: 1,
    is_private_clinic: true,
    capacity: 28,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'clinic-private-02',
    doctor_id: 'doc-001',
    name: 'Dr. Anmol Pandey (Alambag) Clinic',
    address: 'Alambag Lucknow',
    phone: '7317289787',
    operating_hours: 'Tue, Thu, Sat — 5:00 PM to 8:00 PM',
    consultation_fee: 500,
    map_url: 'https://maps.google.com/?q=Alambag+Lucknow',
    google_maps_url: 'https://maps.google.com/?q=Alambag+Lucknow',
    whatsapp_number: '7317289787',
    photo_url: null,
    is_active: true,
    display_order: 2,
    is_private_clinic: true,
    capacity: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const MOCK_SPECIALIZATIONS: Specialization[] = [
  { id: 'spec-01', doctor_id: 'doc-001', name: 'Critical Care Nephrology', description: 'Management of acute kidney injury and dialysis in ICU settings', display_order: 1, created_at: new Date().toISOString() },
  { id: 'spec-02', doctor_id: 'doc-001', name: 'Primary & Secondary Kidney Disorders', description: 'Diagnosis and treatment of Glomerulonephritis, CKD, and Diabetic Nephropathy', display_order: 2, created_at: new Date().toISOString() },
  { id: 'spec-03', doctor_id: 'doc-001', name: 'Kidney Transplantation Medicine', description: 'Pre-transplant evaluation, donor workup, and post-transplant immunosuppression', display_order: 3, created_at: new Date().toISOString() },
  { id: 'spec-04', doctor_id: 'doc-001', name: 'Renal Replacement Therapy', description: 'Hemodialysis, Continuous Renal Replacement Therapy (CRRT), and Peritoneal Dialysis', display_order: 4, created_at: new Date().toISOString() },
  { id: 'spec-05', doctor_id: 'doc-001', name: 'Interventional Nephrology', description: 'Kidney biopsy, permcath insertion, AV fistula evaluation, and PD catheter placement', display_order: 5, created_at: new Date().toISOString() },
  { id: 'spec-06', doctor_id: 'doc-001', name: 'Hypertension & Diabetic Kidney Care', description: 'Comprehensive management of resistant hypertension and diabetic nephropathy', display_order: 6, created_at: new Date().toISOString() }
];

export const MOCK_SLOTS_RESPONSE: AvailableSlots = {
  available: true,
  max_tokens: 28,
  booked_count: 2,
  available_count: 26,
  start_time: '10:00:00',
  end_time: '14:00:00'
};

export const MOCK_BOOKING_CONFIRMATION: BookingConfirmation = {
  appointment_id: 'apt-mock-12345678',
  clinic_name: 'Dr. Anmol Pandey (Gomtinagar) Clinic',
  date: '2026-08-25',
  status: 'pending',
  token_number: 6
};

export function getMockAvailableSlots(clinicId: string, date?: string): AvailableSlots {
  let capacity = 20;
  const saved = localStorage.getItem('saved_clinics_list');
  if (saved) {
    try {
      const list: Clinic[] = JSON.parse(saved);
      const match = list.find(c => c.id === clinicId || c.name.toLowerCase() === clinicId.toLowerCase());
      if (match && match.capacity) {
        capacity = match.capacity;
      }
    } catch {}
  } else {
    const match = MOCK_CLINICS.find(c => c.id === clinicId);
    if (match && match.capacity) {
      capacity = match.capacity;
    }
  }

  if (date) {
    const isWeekend = new Date(date).getDay() === 0;
    if (isWeekend) {
      return {
        available: false,
        reason: 'blocked',
        max_tokens: 0,
        booked_count: 0,
        available_count: 0
      };
    }
  }

  const clinic = MOCK_CLINICS.find(c => c.id === clinicId);
  // Always enforce minimum 3-4 open slots buffer
  const availableCount = Math.max(4, capacity - 2);

  return {
    available: true,
    max_tokens: capacity,
    booked_count: Math.max(0, capacity - availableCount),
    available_count: availableCount,
    start_time: clinic?.operating_hours?.includes('5:00') ? '17:00:00' : '10:00:00',
    end_time: clinic?.operating_hours?.includes('5:00') ? '20:00:00' : '14:00:00'
  };
}

export function createMockBooking(data: any, clinicName?: string): BookingConfirmation {
  const clinic = MOCK_CLINICS.find(c => c.id === data.clinic_id);
  return {
    appointment_id: `apt-${Date.now()}`,
    clinic_name: clinicName || clinic?.name || 'Dr. Anmol Pandey (Gomtinagar) Clinic',
    date: data.schedule_date || new Date().toISOString().split('T')[0],
    status: 'pending',
    token_number: Math.floor(Math.random() * 15) + 1
  };
}
