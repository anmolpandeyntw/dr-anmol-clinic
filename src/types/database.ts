/* ============================================================
   TypeScript types matching the Supabase schema
   ============================================================ */

// --- Enums ---

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PatientGender = 'male' | 'female' | 'other';

export type PaymentMethodType = 'pay_online' | 'pay_at_clinic';

// --- JSONB field types ---

export interface Qualification {
  degree: string;
  field: string;
  institution: string;
  year: number;
}

export interface Experience {
  role: string;
  institution: string;
  period: string;
  current: boolean;
}

export interface Publication {
  title: string;
}

// --- Table row types ---

export interface Doctor {
  id: string;
  full_name: string;
  title: string;
  subtitle: string;
  bio: string | null;
  years_of_experience: number;
  photo_url: string | null;
  qualifications: Qualification[];
  experience: Experience[];
  memberships: string[];
  publications: Publication[];
  created_at: string;
  updated_at: string;
}

export interface Clinic {
  id: string;
  doctor_id: string;
  name: string;
  address: string;
  phone: string | null;
  operating_hours: string | null;
  consultation_fee: number | null;
  map_url: string | null;
  google_maps_url?: string | null;
  whatsapp_number?: string | null;
  photo_url: string | null;
  is_active: boolean;
  display_order: number;
  hospital_url?: string | null;
  is_private_clinic?: boolean;
  online_booking_enabled?: boolean;
  capacity?: number;
  slot_duration?: number;
  created_at: string;
  updated_at: string;
}

export interface Specialization {
  id: string;
  doctor_id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

export interface Schedule {
  id: string;
  clinic_id: string;
  day_of_week: number; // 0=Sun, 1=Mon, ..., 6=Sat
  start_time: string; // TIME formatted e.g. "10:00:00"
  end_time: string;   // TIME formatted e.g. "14:00:00"
  max_tokens: number;
  slot_duration?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlockedDate {
  id: string;
  clinic_id: string;
  date: string; // DATE formatted YYYY-MM-DD
  reason: string | null;
  created_at: string;
}

export interface SpecialSchedule {
  id: string;
  clinic_id: string;
  date: string; // DATE formatted YYYY-MM-DD
  start_time: string;
  end_time: string;
  max_tokens: number;
  created_at: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  schedule_date: string; // DATE formatted YYYY-MM-DD
  patient_name: string;
  patient_mobile: string;
  patient_age: number;
  patient_gender: PatientGender;
  payment_method: PaymentMethodType;
  status: AppointmentStatus;
  token_number: number | null;
  fee_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  clinic?: Clinic;
}

export interface SiteSettings {
  id?: string;
  main_phone: string;
  main_whatsapp: string;
  main_email: string;
  upi_id?: string;
  payment_qr_url?: string | null;
  bank_account_number?: string;
  account_holder_name?: string;
  ifsc_code?: string;
  logo_url?: string | null;
  updated_at?: string;
}

// --- RPC response types ---

export interface AvailableSlots {
  available: boolean;
  reason?: 'blocked' | 'no_schedule';
  max_tokens: number;
  booked_count: number;
  available_count: number;
  start_time?: string;
  end_time?: string;
}

export interface BookingConfirmation {
  appointment_id: string;
  clinic_name: string;
  date: string;
  status: string;
  token_number?: number | null;
}

// --- Booking form state ---

export interface BookingFormData {
  clinic_id: string;
  clinic_name: string;
  schedule_date: string;
  patient_name: string;
  patient_mobile: string;
  patient_age: number | '';
  patient_gender: PatientGender;
  payment_method: PaymentMethodType;
  reason_for_visit?: string;
  booking_for?: 'self' | 'family';
  booker_mobile?: string;
  relationship?: string;
}

export const INITIAL_BOOKING_FORM: BookingFormData = {
  clinic_id: '',
  clinic_name: '',
  schedule_date: '',
  patient_name: '',
  patient_mobile: '',
  patient_age: '',
  patient_gender: 'male',
  payment_method: 'pay_at_clinic',
  reason_for_visit: '',
  booking_for: 'self',
  booker_mobile: '',
  relationship: '',
};
