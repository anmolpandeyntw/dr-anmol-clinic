import React from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import type { BookingFormData } from '../../types/database';
import styles from './ReviewConfirm.module.css';

interface ReviewConfirmProps {
  formData: BookingFormData;
  onConfirm: () => void;
  onEdit: (step: number) => void;
  submitting: boolean;
  submitError: string | null;
  slotsInfo?: { start_time: string; end_time: string } | null;
}

export const ReviewConfirm: React.FC<ReviewConfirmProps> = ({ 
  formData, onConfirm, onEdit, submitting, submitError, slotsInfo
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const maskMobile = (mobile: string) => {
    if (!mobile || mobile.length < 10) return mobile;
    return `******${mobile.slice(-4)}`;
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Review Booking</h2>
      
      {submitError && (
        <div className={styles.errorAlert}>
          {submitError}
        </div>
      )}
      
      <Card className={styles.summaryCard}>
        <div className={styles.summaryRow}>
          <div className={styles.rowContent}>
            <span className={styles.label}>Clinic</span>
            <span className={styles.value}>{formData.clinic_name}</span>
          </div>
          <button className={styles.editLink} onClick={() => onEdit(1)}>Edit</button>
        </div>
        
        <div className={styles.divider} />
        
        <div className={styles.summaryRow}>
          <div className={styles.rowContent}>
            <span className={styles.label}>Date & Time</span>
            <span className={styles.value}>
              {formatDate(formData.schedule_date)}
              {slotsInfo && ` • ${slotsInfo.start_time.substring(0, 5)} - ${slotsInfo.end_time.substring(0, 5)}`}
            </span>
          </div>
          <button className={styles.editLink} onClick={() => onEdit(2)}>Edit</button>
        </div>
        
        <div className={styles.divider} />
        
        <div className={styles.summaryRow}>
          <div className={styles.rowContent}>
            <span className={styles.label}>Patient Details</span>
            <span className={styles.value}>{formData.patient_name}</span>
            <span className={styles.subValue}>
              {maskMobile(formData.patient_mobile)} • {formData.patient_age} yrs • {formData.patient_gender.charAt(0).toUpperCase() + formData.patient_gender.slice(1)}
            </span>
          </div>
          <button className={styles.editLink} onClick={() => onEdit(4)}>Edit</button>
        </div>
        
        <div className={styles.divider} />
        
        <div className={styles.summaryRow}>
          <div className={styles.rowContent}>
            <span className={styles.label}>Payment Method</span>
            <span className={styles.value}>
              {formData.payment_method === 'pay_at_clinic' ? 'Pay at Clinic' : 'Pay Online'}
            </span>
          </div>
          <button className={styles.editLink} onClick={() => onEdit(5)}>Edit</button>
        </div>
      </Card>
      
      <p className={styles.disclaimer}>
        By confirming, you agree that the information provided is accurate.
      </p>
      
      <div className={styles.footer}>
        <Button 
          variant="primary" 
          onClick={onConfirm} 
          disabled={submitting}
          fullWidth
        >
          {submitting ? 'Confirming...' : 'Confirm Booking'}
        </Button>
      </div>
    </div>
  );
};
