import React, { useState } from 'react';
import { Button } from '../common/Button';
import type { ValidationErrors } from '../../hooks/useBooking';
import type { BookingFormData } from '../../types/database';
import { User, UserCheck, Users, Stethoscope, Sparkles, AlertCircle, HeartHandshake, PhoneCall } from 'lucide-react';
import styles from './PatientForm.module.css';

interface PatientFormProps {
  formData: BookingFormData;
  onUpdate: (field: keyof BookingFormData, value: any) => void;
  errors: ValidationErrors;
  onContinue: () => void;
}

const COMMON_SYMPTOMS = [
  'High Creatinine / KFT',
  'Kidney Stones',
  'Dialysis Consultation',
  'Hypertension & Kidney Care',
  'Routine Kidney Checkup'
];

const RELATIONSHIPS = [
  'Parent (Mother/Father)',
  'Spouse (Husband/Wife)',
  'Child (Son/Daughter)',
  'Grandparent',
  'Relative / Friend'
];

export const PatientForm: React.FC<PatientFormProps> = ({ 
  formData, onUpdate, errors, onContinue 
}) => {
  const [submitted, setSubmitted] = useState(false);
  const bookingFor = formData.booking_for || 'self';
  const isFamily = bookingFor === 'family';

  const handleProceed = () => {
    setSubmitted(true);
    onContinue();
  };

  return (
    <div className={styles.container}>
      <div className={styles.formHeader}>
        <h2 className={styles.title}>Patient Details</h2>
        <p className={styles.subtitle}>Who are you booking this appointment for?</p>
      </div>

      {/* Booking For Toggle (Myself vs Family Member) */}
      <div className={styles.bookingForToggleRow}>
        <button
          type="button"
          className={`${styles.toggleBtn} ${!isFamily ? styles.toggleBtnActive : ''}`}
          onClick={() => {
            onUpdate('booking_for', 'self');
          }}
        >
          <User size={18} />
          <span>Booking for Myself</span>
        </button>

        <button
          type="button"
          className={`${styles.toggleBtn} ${isFamily ? styles.toggleBtnActive : ''}`}
          onClick={() => {
            onUpdate('booking_for', 'family');
          }}
        >
          <HeartHandshake size={18} />
          <span>Booking for Family Member</span>
        </button>
      </div>
      
      {/* --- IF BOOKING FOR FAMILY MEMBER --- */}
      {isFamily ? (
        <>
          {/* Booker's Mobile Number */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Your Mobile Number (Booker) *</label>
            <p className={styles.fieldHint}>
              <PhoneCall size={12} /> Digital token confirmation & WhatsApp updates will be sent to your number.
            </p>
            <div className={styles.phoneInputWrapper}>
              <span className={styles.phonePrefix}>+91</span>
              <input 
                type="tel" 
                inputMode="numeric"
                maxLength={10}
                className={`${styles.input} ${styles.phoneInput} ${(submitted || formData.booker_mobile) && errors.patient_mobile ? styles.inputError : ''}`}
                placeholder="Your 10-digit mobile number"
                value={formData.booker_mobile || ''}
                onChange={(e) => {
                  const sanitized = e.target.value.replace(/\D/g, '').slice(0, 10);
                  onUpdate('booker_mobile', sanitized);
                  if (!formData.patient_mobile) {
                    onUpdate('patient_mobile', sanitized);
                  }
                }}
              />
            </div>
            {submitted && errors.patient_mobile && (
              <span className={styles.errorMessage}><AlertCircle size={13} /> {errors.patient_mobile}</span>
            )}
          </div>

          {/* Patient Full Name */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Patient's Full Name (Family Member) *</label>
            <input 
              type="text" 
              maxLength={50}
              className={`${styles.input} ${(submitted || formData.patient_name) && errors.patient_name ? styles.inputError : ''}`}
              placeholder="Enter family member's full name"
              value={formData.patient_name}
              onChange={(e) => {
                const sanitized = e.target.value.replace(/[<>]/g, '').slice(0, 50);
                onUpdate('patient_name', sanitized);
              }}
            />
            {(submitted || formData.patient_name) && errors.patient_name && (
              <span className={styles.errorMessage}><AlertCircle size={13} /> {errors.patient_name}</span>
            )}
          </div>

          {/* Relationship Chips */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Relationship with Patient <span className={styles.optionalTag}>(Optional)</span>
            </label>
            <div className={styles.symptomChipsRow}>
              {RELATIONSHIPS.map((rel) => (
                <button
                  key={rel}
                  type="button"
                  className={`${styles.symptomChip} ${formData.relationship === rel ? styles.symptomChipActive : ''}`}
                  onClick={() => onUpdate('relationship', rel)}
                >
                  {rel}
                </button>
              ))}
            </div>
          </div>

          {/* Patient Direct Mobile (Optional) */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Patient's Mobile Number <span className={styles.optionalTag}>(Optional)</span>
            </label>
            <div className={styles.phoneInputWrapper}>
              <span className={styles.phonePrefix}>+91</span>
              <input 
                type="tel" 
                inputMode="numeric"
                maxLength={10}
                className={`${styles.input} ${styles.phoneInput}`}
                placeholder="Patient's own mobile number (if different)"
                value={formData.patient_mobile && formData.patient_mobile !== formData.booker_mobile ? formData.patient_mobile : ''}
                onChange={(e) => {
                  const sanitized = e.target.value.replace(/\D/g, '').slice(0, 10);
                  onUpdate('patient_mobile', sanitized || formData.booker_mobile || '');
                }}
              />
            </div>
          </div>
        </>
      ) : (
        /* --- IF BOOKING FOR MYSELF --- */
        <>
          {/* Full Name */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name *</label>
            <input 
              type="text" 
              maxLength={50}
              className={`${styles.input} ${(submitted || formData.patient_name) && errors.patient_name ? styles.inputError : ''}`}
              placeholder="Enter your full name"
              value={formData.patient_name}
              onChange={(e) => {
                const sanitized = e.target.value.replace(/[<>]/g, '').slice(0, 50);
                onUpdate('patient_name', sanitized);
              }}
            />
            {(submitted || formData.patient_name) && errors.patient_name && (
              <span className={styles.errorMessage}><AlertCircle size={13} /> {errors.patient_name}</span>
            )}
          </div>
          
          {/* Mobile Number */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Your Mobile Number *</label>
            <div className={styles.phoneInputWrapper}>
              <span className={styles.phonePrefix}>+91</span>
              <input 
                type="tel" 
                inputMode="numeric"
                maxLength={10}
                className={`${styles.input} ${styles.phoneInput} ${(submitted || formData.patient_mobile) && errors.patient_mobile ? styles.inputError : ''}`}
                placeholder="10-digit mobile number"
                value={formData.patient_mobile}
                onChange={(e) => {
                  const sanitized = e.target.value.replace(/\D/g, '').slice(0, 10);
                  onUpdate('patient_mobile', sanitized);
                  onUpdate('booker_mobile', sanitized);
                }}
              />
            </div>
            {(submitted || formData.patient_mobile) && errors.patient_mobile && (
              <span className={styles.errorMessage}><AlertCircle size={13} /> {errors.patient_mobile}</span>
            )}
          </div>
        </>
      )}
      
      {/* Patient Age (Common for both) */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Patient's Age (Years) *</label>
        <input 
          type="text" 
          inputMode="numeric"
          maxLength={3}
          className={`${styles.input} ${(submitted || formData.patient_age) && errors.patient_age ? styles.inputError : ''}`}
          placeholder="e.g. 45"
          value={formData.patient_age || ''}
          onChange={(e) => {
            const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 3);
            let val = digitsOnly ? parseInt(digitsOnly, 10) : '';
            if (typeof val === 'number' && val > 115) {
              val = 115;
            }
            onUpdate('patient_age', val);
          }}
        />
        {(submitted || formData.patient_age) && errors.patient_age && (
          <span className={styles.errorMessage}><AlertCircle size={13} /> {errors.patient_age}</span>
        )}
      </div>

      {/* Patient Gender Selection (Common for both) */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Patient's Gender *</label>
        <div className={styles.genderGrid}>
          <button
            type="button"
            className={`${styles.genderButton} ${formData.patient_gender === 'male' ? styles.genderSelected : ''}`}
            onClick={() => onUpdate('patient_gender', 'male')}
          >
            <User size={18} className={formData.patient_gender === 'male' ? styles.genderIconSelected : styles.genderIcon} />
            <span>Male</span>
          </button>

          <button
            type="button"
            className={`${styles.genderButton} ${formData.patient_gender === 'female' ? styles.genderSelected : ''}`}
            onClick={() => onUpdate('patient_gender', 'female')}
          >
            <UserCheck size={18} className={formData.patient_gender === 'female' ? styles.genderIconSelected : styles.genderIcon} />
            <span>Female</span>
          </button>

          <button
            type="button"
            className={`${styles.genderButton} ${formData.patient_gender === 'other' ? styles.genderSelected : ''}`}
            onClick={() => onUpdate('patient_gender', 'other')}
          >
            <Users size={18} className={formData.patient_gender === 'other' ? styles.genderIconSelected : styles.genderIcon} />
            <span>Other</span>
          </button>
        </div>
        {submitted && errors.patient_gender && (
          <span className={styles.errorMessage}><AlertCircle size={13} /> {errors.patient_gender}</span>
        )}
      </div>

      {/* Reason for Visit (Optional) */}
      <div className={styles.formGroup}>
        <label className={styles.label}>
          Reason for Visit / Main Symptom <span className={styles.optionalTag}>(Optional)</span>
        </label>
        <input
          type="text"
          maxLength={100}
          className={styles.input}
          placeholder="e.g. High Creatinine, Routine Checkup, Kidney Stone"
          value={formData.reason_for_visit || ''}
          onChange={(e) => onUpdate('reason_for_visit', e.target.value.replace(/[<>]/g, '').slice(0, 100))}
        />

        {/* Quick Suggestion Chips */}
        <div className={styles.symptomChipsRow}>
          <span className={styles.symptomHint}><Sparkles size={12} /> Tap to select symptom:</span>
          {COMMON_SYMPTOMS.map((symptom) => (
            <button
              key={symptom}
              type="button"
              className={`${styles.symptomChip} ${formData.reason_for_visit === symptom ? styles.symptomChipActive : ''}`}
              onClick={() => onUpdate('reason_for_visit', symptom)}
            >
              {symptom}
            </button>
          ))}
        </div>
      </div>
      
      {/* Footer CTA */}
      <div className={styles.footer}>
        <Button 
          variant="primary" 
          onClick={handleProceed} 
          fullWidth
          size="lg"
          icon={<Stethoscope size={20} />}
        >
          Proceed to Payment & Review
        </Button>
      </div>
    </div>
  );
};

export default PatientForm;
