import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useClinics } from '../hooks/useClinics';
import { useAvailableSlots, useScheduleData } from '../hooks/useAvailableSlots';
import { useDoctor } from '../hooks/useDoctor';
import { useBooking } from '../hooks/useBooking';
import { FullPageLoader } from '../components/common/LoadingSpinner';

import { BookingProgress } from '../components/booking/BookingProgress';
import { ClinicSelect } from '../components/booking/ClinicSelect';
import { DatePicker } from '../components/booking/DatePicker';
import { SlotInfo } from '../components/booking/SlotInfo';
import { PatientForm } from '../components/booking/PatientForm';
import { PaymentMethodSelect } from '../components/booking/PaymentMethodSelect';
import { ReviewConfirm } from '../components/booking/ReviewConfirm';
import { BookingConfirmation } from '../components/booking/BookingConfirmation';
import { PaymentCheckoutModal } from '../components/booking/PaymentCheckoutModal';

import './BookingPage.css';

export default function BookingPage() {
  const { doctor } = useDoctor();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchParams] = useSearchParams();
  const preselectedClinicId = searchParams.get('clinicId');

  const { clinics, loading: clinicsLoading } = useClinics();
  const {
    step,
    formData,
    confirmation,
    submitting,
    submitError,
    updateField,
    goToStep,
    nextStep,
    prevStep,
    validatePatientForm,
    submitBooking,
    resetBooking,
  } = useBooking();

  const { slots: availableSlots, loading: slotsLoading, fetchSlots } = useAvailableSlots();
  const { schedules, blockedDates, fetchScheduleData } = useScheduleData(formData.clinic_id || null);

  // Preselect clinic if clinicId is passed in URL query params
  useEffect(() => {
    if (preselectedClinicId && clinics.length > 0 && !formData.clinic_id) {
      const match = clinics.find(c => c.id === preselectedClinicId);
      if (match) {
        updateField('clinic_id', match.id);
        updateField('clinic_name', match.name);
      }
    }
  }, [preselectedClinicId, clinics, formData.clinic_id, updateField]);

  // Auto-scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [step]);

  // Fetch schedule and blocked dates when clinic changes
  useEffect(() => {
    if (formData.clinic_id) {
      fetchScheduleData();
    }
  }, [formData.clinic_id, fetchScheduleData]);

  // Fetch slot availability when clinic or date changes
  useEffect(() => {
    if (formData.clinic_id && formData.schedule_date) {
      fetchSlots(formData.clinic_id, formData.schedule_date);
    }
  }, [formData.clinic_id, formData.schedule_date, fetchSlots]);

  if (clinicsLoading) return <FullPageLoader />;

  return (
    <div className="booking-page">
      <div className="booking-page__header">
        <div className="container">
          <h1>Book an Appointment</h1>
          <p>Quick digital token booking — {doctor?.full_name || 'Doctor Clinic'}</p>
        </div>
      </div>

      <div className="container container-narrow booking-page__content">
        <BookingProgress currentStep={step} totalSteps={7} />

        <div className="booking-page__step-container">
          {/* Step 1: Select Clinic */}
          {step === 1 && (
            <ClinicSelect
              clinics={clinics}
              selectedClinicId={formData.clinic_id}
              onSelect={(id, name) => {
                updateField('clinic_id', id);
                updateField('clinic_name', name);
                updateField('schedule_date', '');
              }}
              onContinue={nextStep}
            />
          )}

          {/* Step 2: Date Picker */}
          {step === 2 && (
            <DatePicker
              clinicId={formData.clinic_id}
              selectedDate={formData.schedule_date}
              onSelectDate={(date) => {
                updateField('schedule_date', date);
              }}
              schedules={schedules}
              blockedDates={blockedDates}
              onContinue={() => goToStep(4)}
            />
          )}

          {/* Step 3: Slot Info */}
          {step === 3 && (
            <SlotInfo
              clinicName={formData.clinic_name}
              selectedDate={formData.schedule_date}
              availableSlots={availableSlots}
              loading={slotsLoading}
              onContinue={nextStep}
            />
          )}

          {/* Step 4: Patient Details */}
          {step === 4 && (
            <PatientForm
              formData={formData}
              onUpdate={updateField}
              errors={validatePatientForm()}
              onContinue={() => {
                const errors = validatePatientForm();
                if (Object.keys(errors).length === 0) {
                  nextStep();
                }
              }}
            />
          )}

          {/* Step 5: Payment Method */}
          {step === 5 && (
            <PaymentMethodSelect
              selectedMethod={formData.payment_method}
              onSelect={(method) => {
                updateField('payment_method', method as 'pay_online' | 'pay_at_clinic');
              }}
              onContinue={nextStep}
            />
          )}

          {/* Step 6: Review & Confirm */}
          {step === 6 && (
            <>
              <ReviewConfirm
                formData={formData}
                onConfirm={async () => {
                  if (formData.payment_method === 'pay_online') {
                    setShowPaymentModal(true);
                  } else {
                    await submitBooking();
                  }
                }}
                onEdit={(stepNumber) => goToStep(stepNumber as 1 | 2 | 3 | 4 | 5 | 6 | 7)}
                submitting={submitting}
                submitError={submitError}
              />

              {showPaymentModal && (
                <PaymentCheckoutModal
                  amount={clinics.find(c => c.id === formData.clinic_id)?.consultation_fee || 500}
                  clinicName={formData.clinic_name}
                  patientName={formData.patient_name}
                  onCancel={() => setShowPaymentModal(false)}
                  onSuccess={async () => {
                    setShowPaymentModal(false);
                    await submitBooking();
                  }}
                />
              )}
            </>
          )}

          {/* Step 7: Confirmation */}
          {step === 7 && confirmation && (
            <BookingConfirmation
              confirmation={confirmation}
              formData={formData}
              onBookAnother={resetBooking}
            />
          )}
        </div>

        {/* Back navigation button if step > 1 and < 7 */}
        {step > 1 && step < 7 && (
          <div className="booking-page__back-wrapper">
            <button 
              className="booking-page__back-btn" 
              onClick={() => {
                if (step === 4) {
                  goToStep(2);
                } else {
                  prevStep();
                }
              }}
            >
              &larr; Back to previous step
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
