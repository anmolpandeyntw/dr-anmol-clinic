import { UserCheck, Play, CheckCircle2, XCircle, Phone } from 'lucide-react';
import type { AppointmentRow } from './AppointmentsTable';
import { Button } from '../common/Button';
import './QueueTable.css';

interface QueueTableProps {
  appointments: AppointmentRow[];
  onAction: (appointmentId: string, action: string) => void;
  loading?: boolean;
}

export function QueueTable({ appointments, onAction, loading }: QueueTableProps) {
  const waitingPatients = appointments.filter(
    (a) => a.status === 'checked_in' || a.status === 'confirmed' || a.status === 'pending'
  );
  const inProgressPatients = appointments.filter((a) => a.status === 'in_progress');
  const completedPatients = appointments.filter((a) => a.status === 'completed');
  const missedPatients = appointments.filter((a) => a.status === 'no_show' || a.status === 'cancelled');

  return (
    <div className="queue-board">
      {/* Column 1: Waiting Room */}
      <div className="queue-column">
        <div className="queue-column__header queue-column__header--waiting">
          <h3>Waiting Room</h3>
          <span className="queue-column__count">{waitingPatients.length}</span>
        </div>

        <div className="queue-column__cards">
          {waitingPatients.map((apt) => (
            <div key={apt.id} className="queue-card">
              <div className="queue-card__header">
                <span className="queue-card__token">
                  #{apt.token_number ?? '--'}
                </span>
                <span className={`queue-card__status queue-card__status--${apt.status}`}>
                  {apt.status === 'checked_in' ? 'ARRIVED' : apt.status.toUpperCase()}
                </span>
              </div>

              <div className="queue-card__body">
                <h4 className="queue-card__name">{apt.patient_name}</h4>
                <p className="queue-card__meta">
                  {apt.patient_age} yrs • {apt.patient_gender} • <Phone size={12} /> {apt.patient_mobile}
                </p>
                <p className="queue-card__clinic">{apt.clinic_name || 'Clinic'}</p>
              </div>

              <div className="queue-card__actions">
                {apt.status === 'pending' && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    icon={<UserCheck size={14} />}
                    onClick={() => onAction(apt.id, 'confirm')}
                  >
                    Confirm
                  </Button>
                )}

                {(apt.status === 'confirmed' || apt.status === 'pending') && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={loading}
                    icon={<UserCheck size={14} />}
                    onClick={() => onAction(apt.id, 'mark_arrived')}
                  >
                    Mark Arrived
                  </Button>
                )}

                {apt.status === 'checked_in' && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={loading}
                    icon={<Play size={14} />}
                    onClick={() => onAction(apt.id, 'start_consultation')}
                  >
                    Start Consultation
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={loading}
                  icon={<XCircle size={14} />}
                  onClick={() => onAction(apt.id, 'mark_no_show')}
                >
                  No Show
                </Button>
              </div>
            </div>
          ))}

          {waitingPatients.length === 0 && (
            <div className="queue-column__empty">No patients waiting in queue.</div>
          )}
        </div>
      </div>

      {/* Column 2: In Consultation */}
      <div className="queue-column">
        <div className="queue-column__header queue-column__header--active">
          <h3>In Consultation</h3>
          <span className="queue-column__count">{inProgressPatients.length}</span>
        </div>

        <div className="queue-column__cards">
          {inProgressPatients.map((apt) => (
            <div key={apt.id} className="queue-card queue-card--active">
              <div className="queue-card__header">
                <span className="queue-card__token queue-card__token--active">
                  #{apt.token_number ?? '--'}
                </span>
                <span className="queue-card__status queue-card__status--in_progress">
                  IN CONSULTATION
                </span>
              </div>

              <div className="queue-card__body">
                <h4 className="queue-card__name">{apt.patient_name}</h4>
                <p className="queue-card__meta">
                  {apt.patient_age} yrs • {apt.patient_gender} • <Phone size={12} /> {apt.patient_mobile}
                </p>
                <p className="queue-card__clinic">{apt.clinic_name || 'Clinic'}</p>
              </div>

              <div className="queue-card__actions">
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  disabled={loading}
                  icon={<CheckCircle2 size={14} />}
                  onClick={() => onAction(apt.id, 'complete_consultation')}
                >
                  Complete Consultation
                </Button>
              </div>
            </div>
          ))}

          {inProgressPatients.length === 0 && (
            <div className="queue-column__empty">No patient currently in consultation.</div>
          )}
        </div>
      </div>

      {/* Column 3: Completed Today */}
      <div className="queue-column">
        <div className="queue-column__header queue-column__header--completed">
          <h3>Completed Today</h3>
          <span className="queue-column__count">{completedPatients.length}</span>
        </div>

        <div className="queue-column__cards">
          {completedPatients.map((apt) => (
            <div key={apt.id} className="queue-card queue-card--completed">
              <div className="queue-card__header">
                <span className="queue-card__token">#{apt.token_number ?? '--'}</span>
                <span className="queue-card__status">COMPLETED</span>
              </div>
              <div className="queue-card__body">
                <h4 className="queue-card__name">{apt.patient_name}</h4>
                <p className="queue-card__meta">{apt.patient_age} yrs • {apt.patient_gender}</p>
              </div>
            </div>
          ))}

          {completedPatients.length === 0 && (
            <div className="queue-column__empty">No completed consultations yet today.</div>
          )}
        </div>
      </div>

      {/* Column 4: Missed / Cancelled */}
      <div className="queue-column">
        <div className="queue-column__header queue-column__header--missed">
          <h3>Missed / Cancelled</h3>
          <span className="queue-column__count">{missedPatients.length}</span>
        </div>

        <div className="queue-column__cards">
          {missedPatients.map((apt) => (
            <div key={apt.id} className="queue-card queue-card--missed">
              <div className="queue-card__header">
                <span className="queue-card__token">#{apt.token_number ?? '--'}</span>
                <span className="queue-card__status">{apt.status.toUpperCase()}</span>
              </div>
              <div className="queue-card__body">
                <h4 className="queue-card__name">{apt.patient_name}</h4>
                <p className="queue-card__meta">{apt.patient_age} yrs • {apt.patient_gender}</p>
              </div>
            </div>
          ))}

          {missedPatients.length === 0 && (
            <div className="queue-column__empty">No missed or cancelled appointments today.</div>
          )}
        </div>
      </div>
    </div>
  );
}
