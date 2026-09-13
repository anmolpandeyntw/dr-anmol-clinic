import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useClinics } from '../../hooks/useClinics';
import { StatCard } from '../../components/admin/StatCard';
import { CurrentTokenCard } from '../../components/admin/CurrentTokenCard';
import type { PatientSummary } from '../../components/admin/CurrentTokenCard';
import { NextPatientCard } from '../../components/admin/NextPatientCard';
import { AppointmentsTable } from '../../components/admin/AppointmentsTable';
import type { AppointmentRow } from '../../components/admin/AppointmentsTable';
import { Button } from '../../components/common/Button';
import {
  CalendarCheck,
  Users,
  Activity,
  IndianRupee,
  RefreshCw,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
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

export default function AdminDashboardPage({ clinicId: propClinicId }: { clinicId: string }) {
  const { clinics } = useClinics();

  const [selectedClinicId, setSelectedClinicId] = useState<string>(propClinicId || '');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');

  const [rawAppointments, setRawAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  useEffect(() => {
    if (propClinicId !== undefined) {
      setSelectedClinicId(propClinicId);
    }
  }, [propClinicId]);

  // Helper to resolve exact clinic name dynamically for any clinic
  const getExactClinicName = useCallback((cId: string, fallbackName?: string) => {
    if (cId && cId !== 'unassigned') {
      const matchById = clinics.find(c => c.id === cId);
      if (matchById) return matchById.name;
    }
    if (fallbackName && fallbackName.trim().length > 0) {
      const fbLow = fallbackName.toLowerCase().trim();
      if (!fbLow.includes('to be confirmed') && !fbLow.includes('private clinic')) {
        const matchByName = clinics.find(c => {
          const cLow = c.name.toLowerCase().trim();
          return cLow === fbLow || cLow.includes(fbLow) || fbLow.includes(cLow);
        });
        if (matchByName) return matchByName.name;
        return fallbackName;
      }
    }
    return clinics[0]?.name || 'Dr. Anmol Pandey Clinic';
  }, [clinics]);

  // Fetch all appointments
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    const saved = localStorage.getItem('saved_appointments_list');
    let localSaved: AppointmentRow[] | null = null;
    if (saved) {
      try { localSaved = JSON.parse(saved); } catch { localSaved = null; }
    }

    let fetched: AppointmentRow[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data: aptsData, error } = await supabase
          .from('appointments')
          .select('*, clinics(name)')
          .order('schedule_date', { ascending: true });

        if (!error && aptsData && aptsData.length > 0) {
          fetched = aptsData.map((row: any) => {
            const resolvedClinicName = getExactClinicName(row.clinic_id, row.clinics?.name || row.clinic_name);
            return {
              id: row.id,
              clinic_id: row.clinic_id || 'unassigned',
              clinic_name: resolvedClinicName,
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
            };
          });
        }
      } catch (e) {
        console.warn('Dashboard Supabase fetch note:', e);
      }
    }

    if (localSaved && localSaved.length > 0) {
      if (fetched.length > 0) {
        fetched = fetched.map(dbr => {
          const match = localSaved!.find(ls => ls.id === dbr.id);
          const resolvedClinicName = getExactClinicName(dbr.clinic_id, dbr.clinic_name || match?.clinic_name);
          return match
            ? { ...dbr, status: match.status, clinic_name: resolvedClinicName }
            : { ...dbr, clinic_name: resolvedClinicName };
        });
      } else {
        fetched = localSaved.map(ls => ({
          ...ls,
          clinic_name: getExactClinicName(ls.clinic_id, ls.clinic_name)
        }));
      }
    }

    setRawAppointments(fetched);
    setLoading(false);
  }, [getExactClinicName]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Selected Clinic Info
  const activeClinicObj = useMemo(() => {
    if (!selectedClinicId) return null;
    return clinics.find(c => c.id === selectedClinicId) || null;
  }, [clinics, selectedClinicId]);

  // Dynamic Filter appointments by selected clinic
  const clinicFilteredAppointments = useMemo(() => {
    if (!selectedClinicId) return rawAppointments;
    const activeClinic = clinics.find(c => c.id === selectedClinicId);
    if (!activeClinic) return rawAppointments;

    const targetNameLow = activeClinic.name.toLowerCase().trim();

    return rawAppointments.filter(apt => {
      if (apt.clinic_id === selectedClinicId) return true;
      if (apt.clinic_name) {
        const aptNameLow = apt.clinic_name.toLowerCase().trim();
        if (aptNameLow === targetNameLow || aptNameLow.includes(targetNameLow) || targetNameLow.includes(aptNameLow)) {
          return true;
        }
      }
      return false;
    });
  }, [rawAppointments, selectedClinicId, clinics]);

  // Compute total counts per clinic dynamically
  const clinicCountsMap = useMemo(() => {
    const map: Record<string, number> = {};
    clinics.forEach(c => {
      const targetNameLow = c.name.toLowerCase().trim();
      const count = rawAppointments.filter(apt => {
        if (apt.clinic_id === c.id) return true;
        if (apt.clinic_name) {
          const aptNameLow = apt.clinic_name.toLowerCase().trim();
          return aptNameLow === targetNameLow || aptNameLow.includes(targetNameLow) || targetNameLow.includes(aptNameLow);
        }
        return false;
      }).length;
      map[c.id] = count;
    });
    return map;
  }, [rawAppointments, clinics]);

  // Date-wise booking counter map
  const dateCountsMap = useMemo(() => {
    const map: Record<string, number> = {};
    clinicFilteredAppointments.forEach(apt => {
      if (apt.schedule_date) {
        map[apt.schedule_date] = (map[apt.schedule_date] || 0) + 1;
      }
    });
    return map;
  }, [clinicFilteredAppointments]);

  const uniqueDatesList = useMemo(() => {
    return Object.keys(dateCountsMap).sort((a, b) => a.localeCompare(b));
  }, [dateCountsMap]);

  // Apply Date Filter
  const finalFilteredAppointments = useMemo(() => {
    if (selectedDateFilter === 'all') return clinicFilteredAppointments;
    return clinicFilteredAppointments.filter(apt => apt.schedule_date === selectedDateFilter);
  }, [clinicFilteredAppointments, selectedDateFilter]);

  // Compute Dashboard Stats
  const stats: DashboardStats = useMemo(() => {
    const total = clinicFilteredAppointments.length;
    const todayApts = clinicFilteredAppointments.filter(a => a.schedule_date === todayStr);

    const in_progress = todayApts.filter(a => a.status === 'in_progress').length;
    const checked_in = todayApts.filter(a => a.status === 'checked_in').length;
    const completed = todayApts.filter(a => a.status === 'completed').length;
    const confirmed = todayApts.filter(a => a.status === 'confirmed').length;
    const pending = todayApts.filter(a => a.status === 'pending').length;
    const cancelled = todayApts.filter(a => a.status === 'cancelled').length;
    const no_show = todayApts.filter(a => a.status === 'no_show').length;

    const verified_revenue = clinicFilteredAppointments.reduce((acc, a) => {
      const fee = a.fee_amount || 600;
      const isOnlinePaid = a.payment_method === 'pay_online';
      const isDoneAtClinic = a.payment_method === 'pay_at_clinic' && (a.status === 'completed' || a.status === 'checked_in' || a.status === 'in_progress');
      return (isOnlinePaid || isDoneAtClinic) ? acc + fee : acc;
    }, 0);

    const pending_cash = clinicFilteredAppointments.reduce((acc, a) => {
      const fee = a.fee_amount || 600;
      const isPayAtClinic = a.payment_method === 'pay_at_clinic';
      const isUnvisited = a.status === 'pending' || a.status === 'confirmed';
      return (isPayAtClinic && isUnvisited) ? acc + fee : acc;
    }, 0);

    const currentApt = todayApts.find(a => a.status === 'in_progress' || a.status === 'checked_in') || null;
    const nextApt = todayApts.find(a => a.id !== currentApt?.id && (a.status === 'confirmed' || a.status === 'pending')) || null;

    const currentPatientSummary: PatientSummary | null = currentApt ? {
      id: currentApt.id,
      token_number: currentApt.token_number || 1,
      patient_name: currentApt.patient_name,
      patient_mobile: currentApt.patient_mobile,
      patient_age: currentApt.patient_age || 30,
      patient_gender: currentApt.patient_gender || 'male',
      clinic_id: currentApt.clinic_id,
      status: currentApt.status
    } : null;

    const nextPatientSummary: PatientSummary | null = nextApt ? {
      id: nextApt.id,
      token_number: nextApt.token_number || 2,
      patient_name: nextApt.patient_name,
      patient_mobile: nextApt.patient_mobile,
      patient_age: nextApt.patient_age || 25,
      patient_gender: nextApt.patient_gender || 'male',
      clinic_id: nextApt.clinic_id,
      status: nextApt.status
    } : null;

    return {
      total,
      pending,
      confirmed,
      checked_in,
      in_progress,
      completed,
      cancelled,
      no_show,
      verified_revenue,
      pending_cash,
      current_patient: currentPatientSummary,
      next_patient: nextPatientSummary
    };
  }, [clinicFilteredAppointments, todayStr]);

  // Handle appointment actions
  const handleAppointmentAction = async (appointmentId: string, action: string) => {
    setActionLoading(true);

    const updatedList = rawAppointments.map(apt => {
      if (apt.id === appointmentId) {
        if (action === 'complete_consultation') {
          return { ...apt, status: 'completed' as const };
        }
        if (action === 'call_patient') {
          return { ...apt, status: 'in_progress' as const };
        }
      }
      return apt;
    }).filter(apt => !(action === 'delete' && apt.id === appointmentId));

    setRawAppointments(updatedList);
    localStorage.setItem('saved_appointments_list', JSON.stringify(updatedList));

    if (isSupabaseConfigured) {
      try {
        if (action === 'delete') {
          await supabase.from('appointments').delete().eq('id', appointmentId);
        } else if (action === 'complete_consultation') {
          await supabase.from('appointments').update({ status: 'completed' }).eq('id', appointmentId);
        } else if (action === 'call_patient') {
          await supabase.from('appointments').update({ status: 'in_progress' }).eq('id', appointmentId);
        }
      } catch (err) {
        console.warn('Action Supabase sync note:', err);
      }
    }

    setActionLoading(false);
  };

  const handleFormatDateDisplay = (dateStr: string) => {
    if (dateStr === todayStr) return 'Today';
    if (dateStr === tomorrowStr) return 'Tomorrow';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="admin-dashboard">
      {/* 1. Interactive Clinic Selector Cards Bar */}
      <div className="clinic-selector-cards-strip">
        <div
          className={`clinic-card-chip ${selectedClinicId === '' ? 'active' : ''}`}
          onClick={() => setSelectedClinicId('')}
        >
          <div className="clinic-chip-icon">
            <Building2 size={18} />
          </div>
          <div className="clinic-chip-info">
            <span className="clinic-chip-name">🏥 All Clinics</span>
            <span className="clinic-chip-sub">Combined Overview</span>
          </div>
          <span className="clinic-chip-count-badge">{rawAppointments.length}</span>
        </div>

        {clinics.map((clinic) => {
          const count = clinicCountsMap[clinic.id] || 0;
          const isSelected = selectedClinicId === clinic.id;

          return (
            <div
              key={clinic.id}
              className={`clinic-card-chip ${isSelected ? 'active' : ''}`}
              onClick={() => setSelectedClinicId(clinic.id)}
            >
              <div className="clinic-chip-icon">
                <MapPin size={18} />
              </div>
              <div className="clinic-chip-info">
                <span className="clinic-chip-name">{clinic.name}</span>
                <span className="clinic-chip-sub">{clinic.address || 'Lucknow'}</span>
              </div>
              <span className="clinic-chip-count-badge">{count}</span>
            </div>
          );
        })}
      </div>

      {/* 2. Clinic Greeting & Status Banner */}
      <div className="clinic-greeting-card">
        <div className="greeting-left">
          <div className="greeting-icon-wrapper">
            <Building2 size={26} />
          </div>
          <div>
            <h2 className="greeting-title">
              🏥 Welcome to {activeClinicObj ? activeClinicObj.name : 'All Clinics Combined Portal'}
            </h2>
            <p className="greeting-sub">
              <span className="greeting-meta-item">
                <MapPin size={13} /> {activeClinicObj ? activeClinicObj.address : 'Multiple Locations across Lucknow'}
              </span>
              <span>•</span>
              <span className="greeting-meta-item">
                <Clock size={13} /> {activeClinicObj ? activeClinicObj.operating_hours || 'OPD Hours' : 'OPD Operating Hours'}
              </span>
            </p>
          </div>
        </div>

        <div className="greeting-right-badge">
          <Sparkles size={15} />
          <span>{stats.total} Total Booked Patients</span>
        </div>
      </div>

      {/* 3. Dashboard Header & Refresh Action */}
      <div className="admin-dashboard__header">
        <div>
          <h1>Clinic Dashboard</h1>
          <p className="admin-dashboard__date">
            Real-time OPD Queue & Patient Management • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="admin-dashboard__actions">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            loading={loading}
            icon={<RefreshCw size={14} />}
          >
            Refresh Records
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="admin-dashboard__error">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4. Statistics Summary Cards */}
      <div className="admin-dashboard__stats">
        <StatCard
          title="Today's Total OPD Patients"
          value={stats.completed + stats.confirmed + stats.pending}
          trend={`${stats.completed} Checked In / Done`}
          variant="primary"
          icon={<Users size={22} />}
        />
        <StatCard
          title="Verified Revenue"
          value={`₹${stats.verified_revenue.toLocaleString('en-IN')}`}
          trend="Paid Online & Counter"
          variant="success"
          icon={<IndianRupee size={22} />}
        />
        <StatCard
          title="Pending Cash to Collect"
          value={`₹${stats.pending_cash.toLocaleString('en-IN')}`}
          trend="Uncollected Counter Fees"
          variant="warning"
          icon={<Activity size={22} />}
        />
        <StatCard
          title="Total Active Bookings"
          value={stats.total}
          trend="All Upcoming & Past Dates"
          variant="default"
          icon={<CalendarCheck size={22} />}
        />
      </div>

      {/* 5. Live Patient Consultation Queue */}
      <div className="admin-dashboard__live-queue">
        <CurrentTokenCard
          currentPatient={stats.current_patient}
          onComplete={(id) => handleAppointmentAction(id, 'complete_consultation')}
          loading={actionLoading}
        />

        <NextPatientCard
          nextPatient={stats.next_patient}
          onCallNext={() => {
            if (stats.next_patient) handleAppointmentAction(stats.next_patient.id, 'call_patient');
          }}
          loading={actionLoading}
        />
      </div>

      {/* 6. Date-Wise Daily Booking Counter Bar */}
      <div className="date-summary-box">
        <div className="date-summary-title">
          <Calendar size={14} /> Quick Filter by Date • Daily Patient Counts:
        </div>
        <div className="date-chips-scroll-bar">
          <button
            className={`date-chip-btn ${selectedDateFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedDateFilter('all')}
          >
            Show All Dates <span className="date-chip-count">{clinicFilteredAppointments.length}</span>
          </button>

          {uniqueDatesList.map(dateStr => {
            const count = dateCountsMap[dateStr];
            const isSelected = selectedDateFilter === dateStr;

            return (
              <button
                key={dateStr}
                className={`date-chip-btn ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedDateFilter(dateStr)}
              >
                {handleFormatDateDisplay(dateStr)} ({dateStr})
                <span className="date-chip-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 7. Categorized Appointments Table */}
      <AppointmentsTable
        appointments={finalFilteredAppointments}
        onAction={handleAppointmentAction}
        loading={loading || actionLoading}
      />
    </div>
  );
}
