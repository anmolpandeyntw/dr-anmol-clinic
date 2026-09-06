import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useClinics } from '../../hooks/useClinics';
import { StatCard } from '../../components/admin/StatCard';
import { CurrentTokenCard } from '../../components/admin/CurrentTokenCard';
import type { PatientSummary } from '../../components/admin/CurrentTokenCard';
import { NextPatientCard } from '../../components/admin/NextPatientCard';
import { AppointmentsTable } from '../../components/admin/AppointmentsTable';
import type { AppointmentRow } from '../../components/admin/AppointmentsTable';
import { Button } from '../../components/common/Button';
import { CalendarCheck, Users, Activity, CheckCircle, IndianRupee, ArrowRight, RefreshCw, XCircle, Calendar, Clock, MapPin, ShieldCheck, Wallet, Building2 } from 'lucide-react';
import './AdminDashboardPage.css';

interface DashboardStats {
  total: number;
  pending: number;
  confirmed: number;
  checked_in: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  no_show: number;
  verified_revenue: number;
  pending_cash: number;
  current_patient: PatientSummary | null;
  next_patient: PatientSummary | null;
}

const INITIAL_STATS: DashboardStats = {
  total: 0,
  pending: 0,
  confirmed: 0,
  checked_in: 0,
  in_progress: 0,
  completed: 0,
  cancelled: 0,
  no_show: 0,
  verified_revenue: 0,
  pending_cash: 0,
  current_patient: null,
  next_patient: null,
};

export default function AdminDashboardPage({ clinicId }: { clinicId: string }) {
  const { clinics } = useClinics();
  const [dateMode, setDateMode] = useState<'today' | 'tomorrow' | 'all' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const activeClinicInfo = clinicId ? clinics.find(c => c.id === clinicId) : null;

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    const targetClinic = clinicId ? clinics.find(c => c.id === clinicId) : null;
    const targetClinicName = targetClinic?.name;

    const saved = localStorage.getItem('saved_appointments_list');
    let localSaved: AppointmentRow[] | null = null;
    if (saved) {
      try { localSaved = JSON.parse(saved); } catch { localSaved = null; }
    }

    let formatted: AppointmentRow[] = [];

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('appointments')
          .select('*, clinics(name)')
          .order('schedule_date', { ascending: true });

        if (dateMode === 'today') {
          query = query.eq('schedule_date', todayStr);
        } else if (dateMode === 'tomorrow') {
          query = query.eq('schedule_date', tomorrowStr);
        } else if (dateMode === 'custom' && customDate) {
          query = query.eq('schedule_date', customDate);
        }

        const { data: aptsData, error } = await query;
        if (!error && aptsData && aptsData.length > 0) {
          formatted = aptsData.map((row: any) => ({
            id: row.id,
            clinic_id: row.clinic_id || 'unassigned',
            clinic_name: row.clinics?.name || targetClinicName || 'Dr. Anmol Pandey Private Clinic',
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
        }
      } catch (e) {
        console.warn('Dashboard Supabase fetch note:', e);
      }
    }

    if (localSaved && localSaved.length > 0) {
      if (formatted.length > 0) {
        formatted = formatted.map(dbr => {
          const match = localSaved!.find(ls => ls.id === dbr.id);
          return match ? { ...dbr, status: match.status } : dbr;
        });
      } else {
        formatted = [...localSaved];
        if (dateMode === 'today') {
          formatted = formatted.filter(a => a.schedule_date === todayStr);
        } else if (dateMode === 'tomorrow') {
          formatted = formatted.filter(a => a.schedule_date === tomorrowStr);
        } else if (dateMode === 'custom' && customDate) {
          formatted = formatted.filter(a => a.schedule_date === customDate);
        }
      }
    }

    // Clinic Filter
    if (clinicId && targetClinicName) {
      formatted = formatted.filter(a => {
        if (!a.clinic_id || a.clinic_id === 'unassigned') return true;
        if (a.clinic_id === clinicId) return true;
        const lowAptName = (a.clinic_name || '').toLowerCase();
        const lowTargetName = targetClinicName.toLowerCase();
        if (lowTargetName.includes('gomti') && lowAptName.includes('gomti')) return true;
        if (lowTargetName.includes('vikas') && lowAptName.includes('vikas')) return true;
        if (lowTargetName.includes('alam') && lowAptName.includes('alam')) return true;
        return lowAptName.includes(lowTargetName);
      });
    }

    // Strict Date-Wise Sort: Today first, then chronological
    formatted.sort((a, b) => {
      const aIsToday = a.schedule_date === todayStr;
      const bIsToday = b.schedule_date === todayStr;
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;

      const aIsFuture = a.schedule_date > todayStr;
      const bIsFuture = b.schedule_date > todayStr;
      if (aIsFuture && !bIsFuture) return -1;
      if (!aIsFuture && bIsFuture) return 1;

      if (a.schedule_date !== b.schedule_date) {
        return a.schedule_date.localeCompare(b.schedule_date);
      }
      return (a.token_number || 0) - (b.token_number || 0);
    });

    const total = formatted.length;
    const in_progress = formatted.filter(a => a.status === 'in_progress').length;
    const checked_in = formatted.filter(a => a.status === 'checked_in').length;
    const confirmed = formatted.filter(a => a.status === 'confirmed').length;
    const completed = formatted.filter(a => a.status === 'completed' || a.status === 'checked_in' || a.status === 'in_progress').length;
    const pending = formatted.filter(a => a.status === 'pending').length;

    // Financial Revenue
    const verified_revenue = formatted.reduce((acc, a) => {
      const fee = a.fee_amount || 600;
      const isOnlinePaid = a.payment_method === 'pay_online';
      const hasVisited = a.status === 'completed' || a.status === 'checked_in' || a.status === 'in_progress';
      if (isOnlinePaid || hasVisited) {
        return acc + fee;
      }
      return acc;
    }, 0);

    const pending_cash = formatted.reduce((acc, a) => {
      const fee = a.fee_amount || 600;
      const isClinicPay = a.payment_method !== 'pay_online';
      const notVisitedYet = a.status === 'pending' || a.status === 'confirmed';
      if (isClinicPay && notVisitedYet) {
        return acc + fee;
      }
      return acc;
    }, 0);

    const curr = formatted.find(a => a.status === 'in_progress');
    const nxt = formatted.find(a => a.status === 'checked_in' || a.status === 'confirmed');

    setAppointments(formatted);
    setStats({
      total,
      pending,
      confirmed,
      checked_in,
      in_progress,
      completed,
      cancelled: formatted.filter(a => a.status === 'cancelled').length,
      no_show: formatted.filter(a => a.status === 'no_show').length,
      verified_revenue,
      pending_cash,
      current_patient: curr ? {
        id: curr.id,
        token_number: curr.token_number || 1,
        patient_name: curr.patient_name,
        patient_mobile: curr.patient_mobile,
        patient_age: curr.patient_age,
        patient_gender: curr.patient_gender as any,
        clinic_id: curr.clinic_id,
        status: curr.status as any
      } : null,
      next_patient: nxt ? {
        id: nxt.id,
        token_number: nxt.token_number || 1,
        patient_name: nxt.patient_name,
        patient_mobile: nxt.patient_mobile,
        patient_age: nxt.patient_age,
        patient_gender: nxt.patient_gender as any,
        clinic_id: nxt.clinic_id,
        status: nxt.status as any
      } : null
    });
    setLoading(false);
  }, [clinicId, clinics, dateMode, customDate, todayStr, tomorrowStr]);

  useEffect(() => {
    fetchDashboardData();

    const handleUpdate = () => fetchDashboardData();
    window.addEventListener('appointments_updated', handleUpdate);
    return () => window.removeEventListener('appointments_updated', handleUpdate);
  }, [fetchDashboardData]);

  const handleQueueAction = async (appointmentId: string, action: string) => {
    setActionLoading(true);
    setErrorMsg(null);

    let targetStatus = 'completed';
    if (action === 'cancel') targetStatus = 'cancelled';
    if (action === 'confirm') targetStatus = 'confirmed';

    // Update state and localStorage
    const saved = localStorage.getItem('saved_appointments_list');
    if (saved) {
      try {
        let fullList: AppointmentRow[] = JSON.parse(saved);
        if (action === 'delete') {
          fullList = fullList.filter(a => a.id !== appointmentId);
        } else {
          fullList = fullList.map(a => a.id === appointmentId ? { ...a, status: targetStatus as any } : a);
        }
        localStorage.setItem('saved_appointments_list', JSON.stringify(fullList));
      } catch {}
    }

    setAppointments(prev => {
      if (action === 'delete') return prev.filter(a => a.id !== appointmentId);
      return prev.map(a => a.id === appointmentId ? { ...a, status: targetStatus as any } : a);
    });

    window.dispatchEvent(new Event('appointments_updated'));

    if (isSupabaseConfigured) {
      try {
        if (action === 'delete') {
          await supabase.from('appointments').delete().eq('id', appointmentId);
        } else {
          await supabase
            .from('appointments')
            .update({ status: targetStatus, updated_at: new Date().toISOString() })
            .eq('id', appointmentId);
        }
      } catch (e) {
        console.warn('Queue action note:', e);
      }
    }

    setActionLoading(false);
    fetchDashboardData();
  };

  const handleCallNext = async () => {
    setActionLoading(true);
    setErrorMsg(null);

    if (stats.next_patient) {
      await handleQueueAction(stats.next_patient.id, 'complete_consultation');
    } else {
      setErrorMsg('No waiting patients in queue for today.');
    }
    setActionLoading(false);
  };

  return (
    <div className="admin-dashboard">
      {/* Sleek Active Clinic Banner */}
      <div className="active-clinic-strip">
        <div className="strip-left">
          <div className="strip-badge">
            <Building2 size={13} /> {activeClinicInfo ? activeClinicInfo.name : 'All Clinic Locations'}
          </div>
          {activeClinicInfo && (
            <span className="strip-address"><MapPin size={13} /> {activeClinicInfo.address}</span>
          )}
        </div>

        {activeClinicInfo && (
          <div className="strip-right">
            <span className="strip-time"><Clock size={13} /> {activeClinicInfo.operating_hours || 'OPD Session Hours'}</span>
            <span className="strip-fee"><IndianRupee size={13} /> ₹{activeClinicInfo.consultation_fee || 600} Fee</span>
          </div>
        )}
      </div>

      {/* Main Header Bar */}
      <div className="admin-dashboard__header">
        <div>
          <h1>Doctor's Daily OPD Dashboard</h1>
          <p className="admin-dashboard__date">
            Showing queue for: <strong className="highlight-date">{dateMode === 'today' ? `Today (${todayStr})` : dateMode === 'tomorrow' ? `Tomorrow (${tomorrowStr})` : dateMode === 'custom' ? customDate : 'All Dates (Date-Wise)'}</strong>
          </p>
        </div>

        <div className="admin-dashboard__actions">
          {/* Quick Date Selector */}
          <div className="dashboard-filter-bar">
            <div className="filter-select-wrapper">
              <Calendar size={15} className="filter-icon" />
              <select
                className="date-mode-select"
                value={dateMode}
                onChange={(e) => setDateMode(e.target.value as any)}
              >
                <option value="all">All Dates (Date-Wise)</option>
                <option value="today">Today's Queue ({todayStr})</option>
                <option value="tomorrow">Tomorrow ({tomorrowStr})</option>
                <option value="custom">Select Specific Date</option>
              </select>
            </div>

            {dateMode === 'custom' && (
              <div className="date-picker-wrapper">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                />
              </div>
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            loading={actionLoading}
            icon={<ArrowRight size={20} />}
            onClick={handleCallNext}
          >
            CALL NEXT PATIENT
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchDashboardData}
            icon={<RefreshCw size={16} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="admin-dashboard__error">
          <XCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Verified Financial & Patient Metrics */}
      <div className="admin-dashboard__metrics">
        <StatCard
          title="Total Scheduled"
          value={stats.total}
          icon={<CalendarCheck size={20} />}
          variant="primary"
        />
        <StatCard
          title="In Consultation"
          value={stats.in_progress}
          icon={<Activity size={20} />}
          variant="warning"
        />
        <StatCard
          title="Waiting / Arrived"
          value={stats.checked_in + stats.confirmed}
          icon={<Users size={20} />}
          variant="primary"
        />
        <StatCard
          title="Verified Visited"
          value={stats.completed}
          icon={<CheckCircle size={20} />}
          variant="success"
        />
        <StatCard
          title="Collected Revenue"
          value={`₹${stats.verified_revenue}`}
          icon={<ShieldCheck size={20} />}
          variant="success"
        />
        <StatCard
          title="Pending Clinic Cash"
          value={`₹${stats.pending_cash}`}
          icon={<Wallet size={20} />}
          variant="warning"
        />
      </div>

      {/* Focus Cards Row */}
      <div className="admin-dashboard__focus-grid">
        <div className="focus-grid__current">
          <CurrentTokenCard
            currentPatient={stats.current_patient}
            onComplete={(id) => handleQueueAction(id, 'complete_consultation')}
            loading={actionLoading}
          />
        </div>

        <div className="focus-grid__next">
          <NextPatientCard
            nextPatient={stats.next_patient}
            onCallNext={handleCallNext}
            loading={actionLoading}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="admin-dashboard__table-section">
        <div className="section-header">
          <h2>
            {dateMode === 'today' ? "Today's Patient Queue" : dateMode === 'tomorrow' ? "Tomorrow's Patient Queue" : "All Scheduled Patient Bookings (Date-Wise)"}
            {activeClinicInfo ? ` • ${activeClinicInfo.name}` : ''}
          </h2>
        </div>

        <AppointmentsTable
          appointments={appointments}
          onAction={handleQueueAction}
          loading={loading || actionLoading}
        />
      </div>
    </div>
  );
}
