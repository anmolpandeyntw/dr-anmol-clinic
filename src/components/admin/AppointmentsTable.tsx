import { useState } from 'react';
import { Search, Phone, Calendar, CheckCircle2, Eye, X, MessageSquare, CreditCard, Clock, FileText, User, Trash2, AlertCircle, CalendarDays, History } from 'lucide-react';
import type { AppointmentStatus } from '../../types/database';
import { Button } from '../common/Button';
import { useDoctor } from '../../hooks/useDoctor';
import './AppointmentsTable.css';

export interface AppointmentRow {
  id: string;
  clinic_id: string;
  clinic_name?: string;
  schedule_date: string;
  patient_name: string;
  patient_mobile: string;
  patient_age: number;
  patient_gender: string;
  payment_method: string;
  status: AppointmentStatus;
  token_number: number | null;
  fee_amount: number | null;
  notes: string | null;
  reason_for_visit?: string | null;
  created_at: string;
}

interface AppointmentsTableProps {
  appointments: AppointmentRow[];
  onAction: (appointmentId: string, action: string) => void;
  loading?: boolean;
}

export function AppointmentsTable({ appointments, onAction, loading }: AppointmentsTableProps) {
  const { doctor } = useDoctor();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPatientRecord, setSelectedPatientRecord] = useState<AppointmentRow | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = appointments.filter((apt) => {
    const matchesSearch =
      apt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient_mobile.includes(searchTerm) ||
      (apt.token_number && apt.token_number.toString().includes(searchTerm));

    const isPastDate = apt.schedule_date < todayStr;
    const isMissed = isPastDate && (apt.status === 'pending' || apt.status === 'confirmed') && apt.payment_method === 'pay_at_clinic';

    let matchesStatus = true;
    if (statusFilter === 'all') {
      matchesStatus = true;
    } else if (statusFilter === 'completed' || statusFilter === 'done') {
      matchesStatus = apt.status === 'completed' || apt.status === 'checked_in' || apt.status === 'in_progress';
    } else if (statusFilter === 'no_show' || statusFilter === 'missed') {
      matchesStatus = apt.status === 'no_show' || isMissed;
    } else {
      matchesStatus = apt.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  // Group into 3 clean time windows
  const todayList = filtered.filter(a => a.schedule_date === todayStr);
  const upcomingList = filtered.filter(a => a.schedule_date > todayStr);
  const pastList = filtered.filter(a => a.schedule_date < todayStr);

  const getStatusBadge = (apt: AppointmentRow) => {
    const isPastDate = apt.schedule_date < todayStr;
    const isMissed = isPastDate && (apt.status === 'pending' || apt.status === 'confirmed') && apt.payment_method === 'pay_at_clinic';

    if (apt.status === 'completed' || apt.status === 'checked_in' || apt.status === 'in_progress') {
      return (
        <span className="apt-badge apt-badge--completed">
          <CheckCircle2 size={12} /> Done
        </span>
      );
    }

    if (isMissed || apt.status === 'no_show') {
      return (
        <span className="apt-badge apt-badge--noshow">
          <AlertCircle size={12} /> Missed / No-Show
        </span>
      );
    }

    if (apt.status === 'confirmed' || apt.status === 'pending') {
      return <span className="apt-badge apt-badge--confirmed">Booked</span>;
    }

    if (apt.status === 'cancelled') {
      return <span className="apt-badge apt-badge--cancelled">Cancelled</span>;
    }

    return <span className="apt-badge">{apt.status}</span>;
  };

  const renderSingleRow = (apt: AppointmentRow, category: 'today' | 'upcoming' | 'past') => {
    const isPastDate = category === 'past';
    const isDone = apt.status === 'completed' || apt.status === 'checked_in' || apt.status === 'in_progress';
    const isMissedNoShow = (isPastDate && (apt.status === 'pending' || apt.status === 'confirmed') && apt.payment_method === 'pay_at_clinic') || apt.status === 'no_show';

    let rowClass = `apt-table-row apt-table-row--${category}`;
    if (isMissedNoShow) rowClass += " apt-table-row--missed";

    return (
      <tr key={apt.id} className={rowClass}>
        <td className="col-token" onClick={() => setSelectedPatientRecord(apt)}>
          {apt.token_number ? (
            <span className="token-pill">#{apt.token_number}</span>
          ) : (
            <span className="token-pill token-pill--none">#--</span>
          )}
        </td>
        <td className="col-patient" onClick={() => setSelectedPatientRecord(apt)}>
          <span className="patient-name-link">{apt.patient_name}</span>
          {isMissedNoShow && (
            <span className="missed-subnote">Did not arrive on scheduled date</span>
          )}
        </td>
        <td className="col-mobile">
          <span className="patient-mobile">
            <Phone size={14} /> {apt.patient_mobile}
          </span>
        </td>
        <td className="col-demographics">
          {apt.patient_age} yrs • {apt.patient_gender}
        </td>
        <td className="col-reason">
          <span className="reason-text">{apt.reason_for_visit || 'General Consultation'}</span>
        </td>
        <td className="col-clinic">
          {apt.clinic_name || 'Dr. Anmol Pandey Private Clinic'}
        </td>
        <td className="col-date">
          <span className="date-cell">
            <Calendar size={14} /> {apt.schedule_date}
          </span>
        </td>
        <td className="col-payment">
          <span className={`payment-method ${apt.payment_method === 'pay_online' ? 'pay-online-pill' : 'pay-clinic-pill'}`}>
            {apt.payment_method === 'pay_at_clinic' ? 'Pay at Clinic' : 'Paid Online'}
          </span>
        </td>
        <td className="col-status">
          {getStatusBadge(apt)}
        </td>
        <td className="col-actions">
          <div className="action-buttons">
            <button
              type="button"
              className="contact-btn view-btn"
              title="View Full Patient Record"
              onClick={() => setSelectedPatientRecord(apt)}
            >
              <Eye size={14} /> View
            </button>

            <a
              href={`tel:${apt.patient_mobile}`}
              className="contact-btn call-btn"
              title="Call Patient"
            >
              <Phone size={14} /> Call
            </a>

            <a
              href={`https://wa.me/91${apt.patient_mobile}?text=${encodeURIComponent(`Hello ${apt.patient_name}, regarding your appointment Token #${apt.token_number || ''} with ${doctor?.full_name || 'Dr. Anmol Pandey'}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-btn whatsapp-btn"
              title="WhatsApp Patient"
            >
              WhatsApp
            </a>

            {!isDone && apt.status !== 'cancelled' && (
              <Button
                variant="primary"
                size="sm"
                disabled={loading}
                icon={<CheckCircle2 size={14} />}
                onClick={() => onAction(apt.id, 'complete_consultation')}
                title="1-Click Mark Patient as Arrived & Done"
              >
                Arrived / Done
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              disabled={loading}
              icon={<Trash2 size={14} />}
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete appointment for ${apt.patient_name}?`)) {
                  onAction(apt.id, 'delete');
                }
              }}
              className="btn-delete-row"
              title="Delete Record"
            >
              Delete
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="appointments-table-container">
      <div className="appointments-table__toolbar">
        <div className="appointments-table__search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by patient name, mobile, or token #"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="appointments-table__filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Booked</option>
            <option value="completed">Done</option>
            <option value="no_show">🔴 Missed / No-Show Zone</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="appointments-table__wrapper">
        <table className="appointments-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Patient</th>
              <th>Mobile</th>
              <th>Age/Gender</th>
              <th>Reason for Visit</th>
              <th>Clinic</th>
              <th>Date</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* SECTION 1: TODAY'S QUEUE */}
            <tr className="section-divider-row section-divider--today">
              <td colSpan={10}>
                <div className="divider-content">
                  <span className="divider-badge divider-badge--today">🟢 TODAY'S OPD QUEUE</span>
                  <span className="divider-date">{todayStr} • {todayList.length} Patient(s)</span>
                </div>
              </td>
            </tr>
            {todayList.map(apt => renderSingleRow(apt, 'today'))}
            {todayList.length === 0 && (
              <tr className="empty-section-row">
                <td colSpan={10}>No appointments scheduled for today.</td>
              </tr>
            )}

            {/* SECTION 2: UPCOMING DATES */}
            <tr className="section-divider-row section-divider--upcoming">
              <td colSpan={10}>
                <div className="divider-content">
                  <span className="divider-badge divider-badge--upcoming"><CalendarDays size={14} /> 🟦 UPCOMING BOOKINGS</span>
                  <span className="divider-date">Future Dates • {upcomingList.length} Patient(s)</span>
                </div>
              </td>
            </tr>
            {upcomingList.map(apt => renderSingleRow(apt, 'upcoming'))}
            {upcomingList.length === 0 && (
              <tr className="empty-section-row">
                <td colSpan={10}>No upcoming bookings scheduled for future dates.</td>
              </tr>
            )}

            {/* SECTION 3: PAST DATES & HISTORY */}
            <tr className="section-divider-row section-divider--past">
              <td colSpan={10}>
                <div className="divider-content">
                  <span className="divider-badge divider-badge--past"><History size={14} /> ⚪ PAST RECORDS & HISTORY</span>
                  <span className="divider-date">Previous Days • {pastList.length} Record(s)</span>
                </div>
              </td>
            </tr>
            {pastList.map(apt => renderSingleRow(apt, 'past'))}
            {pastList.length === 0 && (
              <tr className="empty-section-row">
                <td colSpan={10}>No past records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FULL PATIENT RECORD MODAL */}
      {selectedPatientRecord && (
        <div className="patient-modal-overlay" onClick={() => setSelectedPatientRecord(null)}>
          <div className="patient-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-token-pill">Token #{selectedPatientRecord.token_number || 1}</span>
                <h2>{selectedPatientRecord.patient_name}</h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedPatientRecord(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="record-grid">
                <div className="record-item">
                  <span className="record-label"><Phone size={14} /> Mobile Number</span>
                  <span className="record-value">{selectedPatientRecord.patient_mobile}</span>
                </div>

                <div className="record-item">
                  <span className="record-label"><User size={14} /> Age & Gender</span>
                  <span className="record-value">{selectedPatientRecord.patient_age} Years • {selectedPatientRecord.patient_gender}</span>
                </div>

                <div className="record-item">
                  <span className="record-label"><Calendar size={14} /> Schedule Date</span>
                  <span className="record-value">{selectedPatientRecord.schedule_date}</span>
                </div>

                <div className="record-item">
                  <span className="record-label"><CreditCard size={14} /> Payment & Fee</span>
                  <span className="record-value">
                    {selectedPatientRecord.payment_method === 'pay_at_clinic' ? 'Pay at Clinic' : 'Paid Online'} • ₹{selectedPatientRecord.fee_amount || 600}
                  </span>
                </div>

                <div className="record-item full-width">
                  <span className="record-label"><FileText size={14} /> Clinic Location</span>
                  <span className="record-value">{selectedPatientRecord.clinic_name || 'Dr. Anmol Pandey Private Clinic'}</span>
                </div>

                <div className="record-item full-width">
                  <span className="record-label"><MessageSquare size={14} /> Clinical Notes / Reason for Visit</span>
                  <span className="record-value notes-box">
                    {selectedPatientRecord.notes || selectedPatientRecord.reason_for_visit || 'General Kidney Consultation & Regular Checkup'}
                  </span>
                </div>

                <div className="record-item full-width">
                  <span className="record-label"><Clock size={14} /> Booking Created At</span>
                  <span className="record-value muted-time">
                    {selectedPatientRecord.created_at ? new Date(selectedPatientRecord.created_at).toLocaleString() : 'Recent Booking'}
                  </span>
                </div>
              </div>

              {/* Action Buttons inside Modal */}
              <div className="modal-action-bar">
                <a
                  href={`tel:${selectedPatientRecord.patient_mobile}`}
                  className="modal-btn modal-btn--call"
                >
                  <Phone size={16} /> Call
                </a>

                <a
                  href={`https://wa.me/91${selectedPatientRecord.patient_mobile}?text=${encodeURIComponent(`Hello ${selectedPatientRecord.patient_name}, your appointment token #${selectedPatientRecord.token_number || ''} is confirmed with ${doctor?.full_name || 'Dr. Anmol Pandey'}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-btn modal-btn--whatsapp"
                >
                  WhatsApp
                </a>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    onAction(selectedPatientRecord.id, 'complete_consultation');
                    setSelectedPatientRecord(prev => prev ? { ...prev, status: 'completed' } : null);
                  }}
                >
                  Mark Done
                </Button>

                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    if (window.confirm(`Delete appointment record for ${selectedPatientRecord.patient_name}?`)) {
                      onAction(selectedPatientRecord.id, 'delete');
                      setSelectedPatientRecord(null);
                    }
                  }}
                  className="btn-delete-modal"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
