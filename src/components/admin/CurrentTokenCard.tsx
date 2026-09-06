import { Activity, CheckCircle2, Phone, User } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import './CurrentTokenCard.css';

export interface PatientSummary {
  id: string;
  token_number: number | null;
  patient_name: string;
  patient_mobile: string;
  patient_age: number;
  patient_gender: string;
  clinic_id: string;
  status: string;
}

interface CurrentTokenCardProps {
  currentPatient: PatientSummary | null;
  onComplete: (appointmentId: string) => void;
  loading?: boolean;
}

export function CurrentTokenCard({ currentPatient, onComplete, loading }: CurrentTokenCardProps) {
  if (!currentPatient) {
    return (
      <Card className="current-token-card current-token-card--empty">
        <div className="current-token-card__empty-icon">
          <Activity size={40} />
        </div>
        <h3>No Patient Currently In Consultation</h3>
        <p>Click <strong>Call Next Patient</strong> to invite the next waiting patient into the doctor's room.</p>
      </Card>
    );
  }

  return (
    <Card className="current-token-card">
      <div className="current-token-card__header">
        <span className="current-token-card__badge">
          <Activity size={16} className="pulse-icon" /> IN CONSULTATION
        </span>
        <span className="current-token-card__time">Active Now</span>
      </div>

      <div className="current-token-card__body">
        <div className="current-token-card__token-display">
          <span className="current-token-card__label">TOKEN NUMBER</span>
          <span className="current-token-card__number">
            #{currentPatient.token_number ?? '--'}
          </span>
        </div>

        <div className="current-token-card__patient-info">
          <h3 className="current-token-card__patient-name">{currentPatient.patient_name}</h3>
          
          <div className="current-token-card__details">
            <span><User size={16} /> {currentPatient.patient_age} yrs • {currentPatient.patient_gender}</span>
            <span><Phone size={16} /> <a href={`tel:${currentPatient.patient_mobile}`}>{currentPatient.patient_mobile}</a></span>
          </div>
        </div>
      </div>

      <div className="current-token-card__actions">
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          loading={loading}
          icon={<CheckCircle2 size={20} />}
          onClick={() => onComplete(currentPatient.id)}
        >
          Complete Consultation
        </Button>
      </div>
    </Card>
  );
}
