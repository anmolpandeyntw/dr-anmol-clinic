import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { AppointmentsTable } from '../../components/admin/AppointmentsTable';
import type { AppointmentRow } from '../../components/admin/AppointmentsTable';
import { Button } from '../../components/common/Button';
import { Calendar, RefreshCw, XCircle, Building2, Filter } from 'lucide-react';
import './AdminAppointmentsPage.css';

interface AdminAppointmentsPageProps {
  clinicId?: string;
}

export default function AdminAppointmentsPage({ clinicId: propClinicId }: AdminAppointmentsPageProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [dateMode, setDateMode] = useState<'all' | 'today' | 'specific'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedClinicId, setSelectedClinicId] = useState<string>(propClinicId || 'all');
  const [clinicsList, setClinicsList] = useState<{ id: string; name: string }[]>([]);

  const sortAppointmentsDateWise = (apts: AppointmentRow[]): AppointmentRow[] => {
    return [...apts].sort((a, b) => {
      // Today's appointments first
      const aIsToday = a.schedule_date === todayStr;
      const bIsToday = b.schedule_date === todayStr;
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;

      // Future/Upcoming dates next
      const aIsFuture = a.schedule_date > todayStr;
      const bIsFuture = b.schedule_date > todayStr;
      if (aIsFuture && !bIsFuture) return -1;
      if (!aIsFuture && bIsFuture) return 1;

      // Chronological date order (nearest first)
      if (a.schedule_date !== b.schedule_date) {
        return a.schedule_date.localeCompare(b.schedule_date);
      }

      // Token order for same date
      return (a.token_number || 0) - (b.token_number || 0);
    });
  };

  const [appointments, setAppointments] = useState<AppointmentRow[]>(() => {
    const saved = localStorage.getItem('saved_appointments_list');
    let initialApts: AppointmentRow[] = [];
    if (saved) {
      try { initialApts = JSON.parse(saved); } catch {}
    }
    if (!initialApts || initialApts.length === 0) {
      initialApts = [
        {
          id: 'apt-201',
          clinic_id: 'clinic-private-01',
          clinic_name: 'Dr. Anmol Pandey (Gomtinagar) Clinic',
          schedule_date: todayStr,
          patient_name: 'Rahul Sharma (Today Patient)',
          patient_mobile: '9876543210',
          patient_age: 35,
          patient_gender: 'male',
          payment_method: 'pay_at_clinic',
          status: 'pending',
          token_number: 1,
          fee_amount: 600,
          notes: null,
          created_at: new Date().toISOString()
        },
        {
          id: 'apt-101',
          clinic_id: 'clinic-private-02',
          clinic_name: 'Dr. Anmol Pandey (Gomtinagar) Clinic',
          schedule_date: '2026-08-28',
          patient_name: 'Max Singh',
          patient_mobile: '7879546655',
          patient_age: 29,
          patient_gender: 'male',
          payment_method: 'pay_at_clinic',
          status: 'completed',
          token_number: 1,
          fee_amount: 600,
          notes: null,
          created_at: new Date().toISOString()
        },
        {
          id: 'apt-102',
          clinic_id: 'clinic-private-02',
          clinic_name: 'Dr. Anmol Pandey (Gomtinagar) Clinic',
          schedule_date: '2026-08-29',
          patient_name: 'sujal',
          patient_mobile: '8596656748',
          patient_age: 23,
          patient_gender: 'male',
          payment_method: 'pay_online',
          status: 'confirmed',
          token_number: 6,
          fee_amount: 600,
          notes: null,
          created_at: new Date().toISOString()
        },
        {
          id: 'apt-103',
          clinic_id: 'clinic-private-02',
          clinic_name: 'Dr. Anmol Pandey (Alambag) Clinic',
          schedule_date: '2026-08-24',
          patient_name: 'sanya singh',
          patient_mobile: '7898745555',
          patient_age: 23,
          patient_gender: 'female',
          payment_method: 'pay_online',
          status: 'confirmed',
          token_number: 9,
          fee_amount: 500,
          notes: null,
          created_at: new Date().toISOString()
        },
        {
          id: 'apt-104',
          clinic_id: 'clinic-private-02',
          clinic_name: 'Dr. Anmol Pandey (Alambag) Clinic',
          schedule_date: '2026-08-24',
          patient_name: 'jhon',
          patient_mobile: '7854562552',
          patient_age: 26,
          patient_gender: 'female',
          payment_method: 'pay_online',
          status: 'confirmed',
          token_number: 8,
          fee_amount: 500,
          notes: null,
          created_at: new Date().toISOString()
        }
      ];
    }
    return sortAppointmentsDateWise(initialApts);
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch clinics list for dropdown filter
  useEffect(() => {
    async function loadClinics() {
      if (!isSupabaseConfigured) return;
      try {
        const { data } = await supabase.from('clinics').select('id, name').order('name');
        if (data && data.length > 0) {
          setClinicsList(data);
        }
      } catch (err) {
        console.warn('Failed to load clinics list:', err);
      }
    }
    loadClinics();
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    const saved = localStorage.getItem('saved_appointments_list');
    let localSaved: AppointmentRow[] | null = null;
    if (saved) {
      try { localSaved = JSON.parse(saved); } catch { localSaved = null; }
    }

    if (!isSupabaseConfigured) {
      if (localSaved && localSaved.length > 0) {
        setAppointments(sortAppointmentsDateWise(localSaved));
      }
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('appointments')
        .select('*, clinics(name)')
        .order('schedule_date', { ascending: true })
        .order('token_number', { ascending: true, nullsFirst: false });

      if (dateMode === 'today') {
        query = query.eq('schedule_date', todayStr);
      } else if (dateMode === 'specific' && selectedDate) {
        query = query.eq('schedule_date', selectedDate);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Supabase fetch note:', error.message);
      }

      if (data && data.length > 0) {
        let dbRows: AppointmentRow[] = data.map((row: any) => ({
          id: row.id,
          clinic_id: row.clinic_id || 'unassigned',
          clinic_name: row.clinics?.name || 'Dr. Anmol Pandey Private Clinic',
          schedule_date: row.schedule_date,
          patient_name: row.patient_name,
          patient_mobile: row.patient_mobile,
          patient_age: row.patient_age || 30,
          patient_gender: row.patient_gender || 'male',
          payment_method: row.payment_method || 'pay_at_clinic',
          status: row.status || 'confirmed',
          token_number: row.token_number || 1,
          fee_amount: row.fee_amount || 600,
          notes: row.notes,
          created_at: row.created_at
        }));

        if (localSaved && localSaved.length > 0) {
          dbRows = dbRows.map(dbr => {
            const match = localSaved!.find(ls => ls.id === dbr.id);
            return match ? { ...dbr, status: match.status } : dbr;
          });
        }

        if (selectedClinicId !== 'all') {
          dbRows = dbRows.filter(a => !a.clinic_id || a.clinic_id === 'unassigned' || a.clinic_id === selectedClinicId);
        }

        const sorted = sortAppointmentsDateWise(dbRows);
        setAppointments(sorted);
        localStorage.setItem('saved_appointments_list', JSON.stringify(sorted));
      } else if (localSaved && localSaved.length > 0) {
        setAppointments(sortAppointmentsDateWise(localSaved));
      }
    } catch (e) {
      console.warn('Appointments fetch caught note:', e);
      if (localSaved && localSaved.length > 0) {
        setAppointments(sortAppointmentsDateWise(localSaved));
      }
    } finally {
      setLoading(false);
    }
  }, [selectedClinicId, dateMode, selectedDate, todayStr]);

  useEffect(() => {
    fetchAppointments();

    const handleUpdate = () => fetchAppointments();
    window.addEventListener('appointments_updated', handleUpdate);
    return () => window.removeEventListener('appointments_updated', handleUpdate);
  }, [fetchAppointments]);

  const handleAction = async (appointmentId: string, action: string) => {
    setActionLoading(true);
    setErrorMsg(null);

    let updatedList: AppointmentRow[] = [];

    if (action === 'delete') {
      updatedList = appointments.filter(a => a.id !== appointmentId);
    } else {
      const statusMap: Record<string, string> = {
        confirm: 'confirmed',
        mark_arrived: 'completed',
        start_consultation: 'completed',
        complete_consultation: 'completed',
        cancel: 'cancelled'
      };
      const newStatus = statusMap[action] || action;
      updatedList = appointments.map(a => a.id === appointmentId ? { ...a, status: newStatus as any } : a);
    }

    const sorted = sortAppointmentsDateWise(updatedList);
    setAppointments(sorted);
    localStorage.setItem('saved_appointments_list', JSON.stringify(sorted));
    window.dispatchEvent(new Event('appointments_updated'));

    if (isSupabaseConfigured) {
      try {
        if (action === 'delete') {
          await supabase.from('appointments').delete().eq('id', appointmentId);
        } else {
          const statusMap: Record<string, string> = {
            confirm: 'confirmed',
            mark_arrived: 'completed',
            start_consultation: 'completed',
            complete_consultation: 'completed',
            cancel: 'cancelled'
          };
          const newStatus = statusMap[action] || action;
          await supabase
            .from('appointments')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', appointmentId);
        }
      } catch (e) {
        console.warn('Supabase action update note:', e);
      }
    }

    setActionLoading(false);
  };

  return (
    <div className="admin-appointments-page">
      <div className="admin-appointments-page__header">
        <div>
          <h1>Live Appointments Directory</h1>
          <p>Chronological date-wise order: Today's queue first ➔ Upcoming dates ➔ Past records</p>
        </div>

        <div className="admin-appointments-page__actions">
          {/* Clinic Filter */}
          <div className="filter-select-wrapper">
            <Building2 size={16} className="filter-icon" />
            <select
              value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
              className="clinic-filter-select"
            >
              <option value="all">All Private Clinics</option>
              {clinicsList
                .filter(c => !c.name.toLowerCase().includes('hospital') && !c.name.toLowerCase().includes('super specialty'))
                .map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>

          {/* Date Filter Mode */}
          <div className="filter-select-wrapper">
            <Filter size={16} className="filter-icon" />
            <select
              value={dateMode}
              onChange={(e) => setDateMode(e.target.value as any)}
              className="date-mode-select"
            >
              <option value="all">Date-Wise Chronological</option>
              <option value="today">Today ({todayStr})</option>
              <option value="specific">Select Specific Date</option>
            </select>
          </div>

          {/* Custom Date Input if specific date selected */}
          {dateMode === 'specific' && (
            <div className="date-picker-wrapper">
              <Calendar size={18} className="date-icon" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          )}

          <Button
            variant="outline"
            size="md"
            onClick={fetchAppointments}
            icon={<RefreshCw size={16} />}
          >
            Refresh Live
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="admin-appointments-page__error">
          <XCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <AppointmentsTable
        appointments={appointments}
        onAction={handleAction}
        loading={loading || actionLoading}
      />
    </div>
  );
}
