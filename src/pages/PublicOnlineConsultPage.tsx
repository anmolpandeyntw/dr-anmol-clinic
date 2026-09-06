import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Video, User, Phone, Shield, XCircle } from 'lucide-react';
import './PublicOnlineConsultPage.css';

export default function PublicOnlineConsultPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('11:00 AM');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    if (!isSupabaseConfigured) {
      setTimeout(() => {
        const mockToken = `mock-token-${Date.now()}`;
        setSubmitting(false);
        navigate(`/appointment/${mockToken}`);
      }, 1000);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('consultation_requests')
        .insert({
          patient_name: name,
          patient_mobile: mobile,
          patient_age: Number(age),
          patient_gender: gender,
          preferred_date: date,
          preferred_time: time,
          reason_for_visit: reason || null
        })
        .select('appointment_token')
        .single();

      if (error) throw error;
      if (data?.appointment_token) {
        navigate(`/appointment/${data.appointment_token}`);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="public-online-consult-page">
      <div className="consult-hero-banner">
        <div className="banner-icon">
          <Video size={40} />
        </div>
        <h1>Online Video Consultation Request</h1>
        <p>Consult Dr. Amit Kumar Singh securely from home for kidney disorders and second opinions</p>
      </div>

      {errorMsg && (
        <div className="consult-error-box">
          <XCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <Card className="consult-request-card">
        <form onSubmit={handleSubmit} className="consult-form">
          <div className="form-group">
            <label htmlFor="patient-name">Patient Full Name *</label>
            <div className="input-with-icon">
              <User size={18} className="field-icon" />
              <input
                id="patient-name"
                type="text"
                required
                placeholder="e.g. Ramesh Chandra"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="patient-mobile">10-Digit Mobile Number *</label>
              <div className="input-with-icon">
                <Phone size={18} className="field-icon" />
                <input
                  id="patient-mobile"
                  type="tel"
                  required
                  pattern="[6-9][0-9]{9}"
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="patient-age">Age *</label>
              <input
                id="patient-age"
                type="number"
                required
                min="0"
                max="120"
                placeholder="e.g. 45"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || '')}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="patient-gender">Gender *</label>
              <select
                id="patient-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="preferred-date">Preferred Date *</label>
              <input
                id="preferred-date"
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="preferred-time">Preferred Time Slot *</label>
            <select
              id="preferred-time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            >
              <option value="10:00 AM – 11:00 AM">10:00 AM – 11:00 AM</option>
              <option value="11:00 AM – 12:00 PM">11:00 AM – 12:00 PM</option>
              <option value="04:00 PM – 05:00 PM">04:00 PM – 05:00 PM</option>
              <option value="05:00 PM – 06:00 PM">05:00 PM – 06:00 PM</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="consult-reason">Brief Reason for Visit / Medical Query (Optional)</label>
            <textarea
              id="consult-reason"
              rows={3}
              placeholder="e.g. Swelling in feet, High Creatinine level, Kidney Transplant advice"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <Button type="submit" variant="primary" size="lg" loading={submitting} icon={<Video size={18} />}>
            Submit Video Consultation Request
          </Button>

          <p className="privacy-note">
            <Shield size={14} /> Doctor will review request and share your secure meeting link via WhatsApp/SMS notification.
          </p>
        </form>
      </Card>
    </div>
  );
}
