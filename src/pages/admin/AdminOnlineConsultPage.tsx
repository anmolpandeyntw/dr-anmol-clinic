import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { sendNotification } from '../../lib/notifications';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { CheckCircle2, XCircle, Clock, Link as LinkIcon, RefreshCw } from 'lucide-react';
import './AdminOnlineConsultPage.css';

export interface ConsultRequestRow {
  id: string;
  patient_name: string;
  patient_mobile: string;
  patient_age: number;
  patient_gender: string;
  preferred_date: string;
  preferred_time: string;
  reason_for_visit: string | null;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  meeting_link: string | null;
  appointment_token: string;
  created_at: string;
}

export default function AdminOnlineConsultPage() {
  const [requests, setRequests] = useState<ConsultRequestRow[]>([]);
  const [_loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Approve Modal State
  const [selectedReq, setSelectedReq] = useState<ConsultRequestRow | null>(null);
  const [meetingLinkInput, setMeetingLinkInput] = useState('https://meet.google.com/abc-defg-hij');
  const [approving, setApproving] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    if (!isSupabaseConfigured) {
      setRequests([
        {
          id: 'req-001',
          patient_name: 'Suresh Verma',
          patient_mobile: '9876543210',
          patient_age: 52,
          patient_gender: 'male',
          preferred_date: '2026-08-18',
          preferred_time: '11:00 AM – 12:00 PM',
          reason_for_visit: 'Second opinion for CKD stage 3 report',
          status: 'PENDING_APPROVAL',
          meeting_link: null,
          appointment_token: 'token-uuid-001',
          created_at: new Date().toISOString()
        },
        {
          id: 'req-002',
          patient_name: 'Anita Roy',
          patient_mobile: '9876543211',
          patient_age: 44,
          patient_gender: 'female',
          preferred_date: '2026-08-16',
          preferred_time: '04:00 PM – 05:00 PM',
          reason_for_visit: 'Hypertension and Proteinuria review',
          status: 'APPROVED',
          meeting_link: 'https://meet.google.com/xyz-pqrs-tuv',
          appointment_token: 'token-uuid-002',
          created_at: new Date().toISOString()
        }
      ]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('consultation_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load consultation requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApproveSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    setApproving(true);
    setErrorMsg(null);

    if (!isSupabaseConfigured) {
      setRequests(prev => prev.map(r => r.id === selectedReq.id ? { ...r, status: 'APPROVED', meeting_link: meetingLinkInput } : r));
      setSelectedReq(null);
      setApproving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('consultation_requests')
        .update({
          status: 'APPROVED',
          meeting_link: meetingLinkInput
        })
        .eq('id', selectedReq.id);

      if (error) throw error;

      // Send notification stub
      await sendNotification('consultation_approved', selectedReq.id, {
        patientName: selectedReq.patient_name,
        patientMobile: selectedReq.patient_mobile,
        meetingLink: meetingLinkInput
      });

      await fetchRequests();
      setSelectedReq(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!isSupabaseConfigured) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'REJECTED' } : r));
      return;
    }
    await supabase.from('consultation_requests').update({ status: 'REJECTED' }).eq('id', id);
    fetchRequests();
  };

  return (
    <div className="admin-consult-page">
      <div className="admin-consult-page__header">
        <div>
          <h1>Online Video Consultation Requests</h1>
          <p>Review tele-nephrology consultation requests, approve schedule, and assign video meeting links</p>
        </div>

        <Button variant="outline" size="md" onClick={fetchRequests} icon={<RefreshCw size={16} />}>
          Refresh
        </Button>
      </div>

      {errorMsg && (
        <div className="admin-consult-page__error">
          <XCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="consult-requests-grid">
        {requests.map((req) => (
          <Card key={req.id} className="consult-req-card">
            <div className="req-card__header">
              <span className={`status-badge status-badge--${req.status.toLowerCase()}`}>
                {req.status.replace('_', ' ')}
              </span>
              <span className="req-date"><Clock size={14} /> {req.preferred_date} • {req.preferred_time}</span>
            </div>

            <div className="req-card__body">
              <h3 className="patient-title">{req.patient_name}</h3>
              <p className="patient-meta">{req.patient_gender.toUpperCase()} • {req.patient_age} Yrs • Mobile: {req.patient_mobile}</p>

              {req.reason_for_visit && (
                <div className="reason-box">
                  <strong>Reason / Complaint:</strong>
                  <p>{req.reason_for_visit}</p>
                </div>
              )}

              {req.meeting_link && (
                <div className="link-box">
                  <LinkIcon size={14} />
                  <a href={req.meeting_link} target="_blank" rel="noopener noreferrer">
                    {req.meeting_link}
                  </a>
                </div>
              )}
            </div>

            <div className="req-card__footer">
              {req.status === 'PENDING_APPROVAL' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<XCircle size={14} />}
                    onClick={() => handleReject(req.id)}
                  >
                    Reject
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle2 size={14} />}
                    onClick={() => {
                      setSelectedReq(req);
                      setMeetingLinkInput('https://meet.google.com/abc-defg-hij');
                    }}
                  >
                    Approve & Link
                  </Button>
                </>
              )}

              {req.status === 'APPROVED' && (
                <span className="approved-text"><CheckCircle2 size={14} /> Link Sent via Notification</span>
              )}
            </div>
          </Card>
        ))}

        {requests.length === 0 && (
          <p className="empty-msg">No consultation requests found.</p>
        )}
      </div>

      {/* Approve Modal */}
      {selectedReq && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Approve Online Consultation</h2>
            <p>Assign video consultation meeting link for {selectedReq.patient_name}</p>

            <form onSubmit={handleApproveSubmit} className="modal-form">
              <div className="form-group">
                <label>Video Meeting URL (Google Meet / Doxy.me / Zoom) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/..."
                  value={meetingLinkInput}
                  onChange={(e) => setMeetingLinkInput(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <Button type="button" variant="outline" onClick={() => setSelectedReq(null)}>Cancel</Button>
                <Button type="submit" variant="primary" loading={approving}>Confirm Approval</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
