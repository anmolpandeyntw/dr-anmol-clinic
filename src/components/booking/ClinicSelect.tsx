import React from 'react';
import { Building2, MapPin, Clock, IndianRupee, CheckCircle2, ArrowRight, Phone } from 'lucide-react';
import type { Clinic } from '../../types/database';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import styles from './ClinicSelect.module.css';

interface ClinicSelectProps {
  clinics: Clinic[];
  selectedClinicId: string;
  onSelect: (clinic_id: string, clinic_name: string) => void;
  onContinue: () => void;
}

export const ClinicSelect: React.FC<ClinicSelectProps> = ({ clinics, selectedClinicId, onSelect, onContinue }) => {
  return (
    <div className={styles.container}>
      <div className={styles.headerGroup}>
        <h2 className={styles.title}>Select a Clinic Location</h2>
        <p className={styles.subtitle}>Click the "Select & Pick Date" button on your preferred clinic to proceed</p>
      </div>

      <div className={styles.clinicList}>
        {clinics.map((clinic) => {
          const isSelected = clinic.id === selectedClinicId;
          const isPrivate = clinic.is_private_clinic !== false;

          return (
            <div key={clinic.id} className={styles.clinicCardWrapper}>
              <Card 
                className={`${styles.clinicCard} ${isSelected ? styles.selected : ''} ${!isPrivate ? styles.opdCard : ''}`}
                onClick={() => isPrivate && onSelect(clinic.id, clinic.name)}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.clinicNameGroup}>
                    <div className={`${styles.iconCircle} ${isPrivate ? styles.iconCirclePrivate : styles.iconCircleOpd}`}>
                      <Building2 size={20} />
                    </div>
                    <div>
                      <span className={`${styles.badge} ${isPrivate ? styles.badgePrivate : styles.badgeOpd}`}>
                        {isPrivate ? 'Private Clinic • Online Tokens' : 'Hospital OPD Attachment'}
                      </span>
                      <h3 className={styles.clinicName}>{clinic.name}</h3>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className={styles.checkIcon} size={24} />}
                </div>
                
                <div className={styles.clinicDetails}>
                  <div className={styles.detailRow}>
                    <MapPin className={styles.detailIcon} size={16} />
                    <span>{clinic.address}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <Clock className={styles.detailIcon} size={16} />
                    <span>{clinic.operating_hours || 'Contact clinic for hours'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <IndianRupee className={styles.detailIcon} size={16} />
                    <span className={styles.feeText}>₹{clinic.consultation_fee || 600} Consultation Fee</span>
                  </div>
                </div>

                {/* Explicit Button Action ONLY */}
                <div className={styles.inlineActionArea}>
                  {isPrivate ? (
                    <Button 
                      variant="primary" 
                      size="md" 
                      fullWidth
                      icon={<ArrowRight size={18} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(clinic.id, clinic.name);
                        onContinue();
                      }}
                    >
                      {isSelected ? 'Continue with Selected Clinic' : 'Select & Pick Date'}
                    </Button>
                  ) : (
                    <a 
                      href={`tel:${clinic.phone}`} 
                      className={styles.telLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="outline" size="md" fullWidth icon={<Phone size={16} />}>
                        Call OPD Desk: {clinic.phone}
                      </Button>
                    </a>
                  )}
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClinicSelect;
