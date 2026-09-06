import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { QueueTable } from '../../components/admin/QueueTable';
import type { AppointmentRow } from '../../components/admin/AppointmentsTable';
import { Button } from '../../components/common/Button';
import { RefreshCw, ArrowRight, XCircle } from 'lucide-react';
import './AdminQueuePage.css';

export default function AdminQueuePage({ clinicId }: { clinicId: string }) {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchQueueData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    if (!isSupabaseConfigured) {
      setAppointments([
        {
          id: 'apt-001',
          clinic_id: 'mock-clinic-uuid-a',
          clinic_name: '[CLINIC A — TO BE CONFIRMED]',
          schedule_date: todayStr,
          patient_name: 'Rahul Sharma',
          patient_mobile: '9876543210',
          patient_age: 45,
          patient_gender: 'male',
          payment_method: 'pay_at_clinic',
          status: 'in_progress',
          token_number: 1,
          fee_amount: 500,
          notes: null,
          created_at: new Date().toISOString()
        },
        {
          id: 'apt-002',
          clinic_id: 'mock-clinic-uuid-a',
          clinic_name: '[CLINIC A — TO BE CONFIRMED]',
          schedule_date: todayStr,
          patient_name: 'Priya Verma',
          patient_mobile: '9876543211',
          patient_age: 32,
          patient_gender: 'female',
          payment_method: 'pay_at_clinic',
          status: 'checked_in',
          token_number: 2,
          fee_amount: 500,
          notes: null,
          created_at: new Date().toISOString()
        },
        {
          id: 'apt-003',
          clinic_id: 'mock-clinic-uuid-a',
          clinic_name: '[CLINIC A — TO BE CONFIRMED]',
          schedule_date: todayStr,
          patient_name: 'Amit Patel',
          patient_mobile: '9876543212',
          patient_age: 58,
          patient_gender: 'male',
          payment_method: 'pay_at_clinic',
          status: 'confirmed',
          token_number: 3,
          fee_amount: 500,
          notes: null,
          created_at: new Date().toISOString()
        }
      ]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('appointments')
        .select('*, clinics(name)')
        .eq('schedule_date', todayStr)
        .order('token_number', { ascending: true, nullsFirst: false });

      if (clinicId) query = query.eq('clinic_id', clinicId);

      const { data, error } = await query;
      if (error) throw error;

      const formatted: AppointmentRow[] = (data || []).map((row: any) => ({
        id: row.id,
        clinic_id: row.clinic_id,
        clinic_name: row.clinics?.name,
        schedule_date: row.schedule_date,
        patient_name: row.patient_name,
        patient_mobile: row.patient_mobile,
        patient_age: row.patient_age,
        patient_gender: row.patient_gender,
        payment_method: row.payment_method,
        status: row.status,
        token_number: row.token_number,
        fee_amount: row.fee_amount,
        notes: row.notes,
        created_at: row.created_at
      }));

      setAppointments(formatted);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to fetch queue data');
    } finally {
      setLoading(false);
    }
  }, [clinicId, todayStr]);

  useEffect(() => {
    fetchQueueData();
  }, [fetchQueueData]);

  const handleAction = async (appointmentId: string, action: string) => {
    setActionLoading(true);
    setErrorMsg(null);

    if (!isSupabaseConfigured) {
      setAppointments(prev => prev.map(a => {
        if (a.id === appointmentId) {
          const newStatus = action === 'complete_consultation' ? 'completed'
            : action === 'start_consultation' ? 'in_progress'
            : action === 'mark_arrived' ? 'checked_in'
            : action === 'mark_no_show' ? 'no_show'
            : action === 'cancel' ? 'cancelled' : a.status;
          return { ...a, status: newStatus as any };
        }
        return a;
      }));
      setActionLoading(false);
      return;
    }

    try {
      const { error } = await supabase.rpc('perform_queue_action', {
        p_appointment_id: appointmentId,
        p_action: action
      });

      if (error) throw error;
      await fetchQueueData();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Queue action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCallNext = async () => {
    if (!clinicId) {
      setErrorMsg('Please select a clinic to call the next patient.');
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);

    if (!isSupabaseConfigured) {
      const nextApt = appointments.find(a => a.status === 'checked_in' || a.status === 'confirmed');
      if (nextApt) handleAction(nextApt.id, 'start_consultation');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('call_next_patient', {
        p_clinic_id: clinicId,
        p_date: todayStr
      });

      if (error) throw error;
      if (data && data.success === false) {
        setErrorMsg(data.message);
      } else {
        await fetchQueueData();
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Call next failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-queue-page">
      <div className="admin-queue-page__header">
        <div>
          <h1>Live Patient Queue</h1>
          <p>Real-time patient flow and token status management</p>
        </div>

        <div className="admin-queue-page__actions">
          <Button
            variant="primary"
            size="lg"
            loading={actionLoading}
            icon={<ArrowRight size={18} />}
            onClick={handleCallNext}
          >
            Call Next Patient
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={fetchQueueData}
            icon={<RefreshCw size={16} />}
          >
            Refresh Queue
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="admin-queue-page__error">
          <XCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <QueueTable
        appointments={appointments}
        onAction={handleAction}
        loading={loading || actionLoading}
      />
    </div>
  );
}
