import { Users, Phone, ArrowRight, UserCheck } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import type { PatientSummary } from './CurrentTokenCard';
import './NextPatientCard.css';

interface NextPatientCardProps {
  nextPatient: PatientSummary | null;
  onCallNext: () => void;
  loading?: boolean;
}

export function NextPatientCard({ nextPatient, onCallNext, loading }: NextPatientCardProps) {
  if (!nextPatient) {
    return (
      <Card className="next-patient-card next-patient-card--empty">
        <div className="next-patient-card__empty-icon">
          <Users size={32} />
        </div>
        <h4>Queue Clear</h4>
        <p>No waiting patients in line.</p>
      </Card>
    );
  }

  const isCheckedIn = nextPatient.status === 'checked_in';

  return (
    <Card className="next-patient-card">
      <div className="next-patient-card__header">
        <span className="next-patient-card__label">NEXT IN QUEUE</span>
        {isCheckedIn ? (
          <span className="badge badge--arrived">
            <UserCheck size={12} /> ARRIVED IN CLINIC
          </span>
        ) : (
          <span className="badge badge--confirmed">CONFIRMED</span>
        )}
      </div>

      <div className="next-patient-card__body">
        <div className="next-patient-card__token">
          #{nextPatient.token_number ?? '--'}
        </div>
        <div className="next-patient-card__info">
          <h4 className="next-patient-card__name">{nextPatient.patient_name}</h4>
          <div className="next-patient-card__meta">
            <span>{nextPatient.patient_age} yrs • {nextPatient.patient_gender}</span>
            <span><Phone size={14} /> {nextPatient.patient_mobile}</span>
          </div>
        </div>
      </div>

      <div className="next-patient-card__action">
        <Button
          variant="primary"
          size="md"
          fullWidth
          loading={loading}
          icon={<ArrowRight size={18} />}
          onClick={onCallNext}
        >
          Call Patient #{nextPatient.token_number ?? ''}
        </Button>
      </div>
    </Card>
  );
}
