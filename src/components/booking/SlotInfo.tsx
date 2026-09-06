import React from 'react';
import { Calendar, Clock, Building2, AlertCircle } from 'lucide-react';
import type { AvailableSlots } from '../../types/database';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import styles from './SlotInfo.module.css';

interface SlotInfoProps {
  clinicName: string;
  selectedDate: string;
  availableSlots: AvailableSlots | null;
  loading: boolean;
  onContinue: () => void;
}

export const SlotInfo: React.FC<SlotInfoProps> = ({ 
  clinicName, selectedDate, availableSlots, loading, onContinue 
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const availableCount = availableSlots?.available_count ?? 0;
  const hasSlots = availableSlots ? availableSlots.available : false;
  
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Slot Information</h2>
      
      <Card className={styles.infoCard}>
        <div className={styles.detailRow}>
          <Building2 className={styles.icon} size={20} />
          <span className={styles.detailText}>{clinicName}</span>
        </div>
        
        <div className={styles.detailRow}>
          <Calendar className={styles.icon} size={20} />
          <span className={styles.detailText}>{formatDate(selectedDate)}</span>
        </div>
        
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <span>Checking availability...</span>
          </div>
        ) : availableSlots ? (
          <>
            {(availableSlots.start_time && availableSlots.end_time) && (
              <div className={styles.detailRow}>
                <Clock className={styles.icon} size={20} />
                <span className={styles.detailText}>
                  {availableSlots.start_time.substring(0, 5)} - {availableSlots.end_time.substring(0, 5)}
                </span>
              </div>
            )}
            
            <div className={styles.slotStatus}>
              {hasSlots ? (
                <div className={`${styles.badge} ${availableCount > 5 ? styles.badgeSuccess : styles.badgeWarning}`}>
                  {availableCount} slots available
                </div>
              ) : (
                <div className={`${styles.badge} ${styles.badgeError}`}>
                  <AlertCircle size={16} />
                  No slots available
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.errorState}>
            Failed to load slot information.
          </div>
        )}
      </Card>
      
      <div className={styles.footer}>
        <Button 
          variant="primary" 
          onClick={onContinue} 
          disabled={!hasSlots || loading}
          fullWidth
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
