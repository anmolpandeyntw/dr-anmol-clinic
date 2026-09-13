import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useClinics } from '../../hooks/useClinics';
import { AppointmentsTable } from '../../components/admin/AppointmentsTable';
import type { AppointmentRow } from '../../components/admin/AppointmentsTable';
import { Button } from '../../components/common/Button';
import {
  Calendar,
  RefreshCw,
  Building2,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import './AdminAppointmentsPage.css';

interface AdminAppointmentsPageProps {
  clinicId?: string;
}

export default function AdminAppointmentsPage({ clinicId: propClinicId }: AdminAppointmentsPageProps) {
  const { clinics } = useClinics();

  const [selectedClinicId, setSelectedClinicId] = useState<string>(propClinicId || '');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all'); // 'all' or specific YYYY-MM-DD

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
  const fetchAppointments = useCallback(async () => {
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
          .order('schedule_date', { ascending: true })
          .order('token_number', { ascending: true, nullsFirst: false });

        if (!error && aptsData && aptsData.length > 0) {
          fetched = aptsData.map((row: any) => ({
            id: row.id,
            clinic_id: row.clinic_id || 'unassigned',
            clinic_name: getExactClinicName(row.clinic_id, row.clinics?.name || row.clinic_name),
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
        console.warn('Appointments fetch note:', e);
      }
    }

    if (localSaved && localSaved.length > 0) {
      if (fetched.length > 0) {
        fetched = fetched.map(dbr => {
          const match = localSaved!.find(ls => ls.id === dbr.id);
          const resolvedName = getExactClinicName(dbr.clinic_id, dbr.clinic_name || match?.clinic_name);
          return match
            ? { ...dbr, status: match.status, clinic_name: resolvedName }
            : { ...dbr, clinic_name: resolvedName };
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
    fetchAppointments();
  }, [fetchAppointments]);

  // Selected Clinic Object
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
    <div className="admin-appointments-page">
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
            <span className="clinic-chip-sub">Combined Bookings View</span>
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

      {/* 2. Clinic Greeting Banner */}
      <div className="clinic-greeting-card">
        <div className="greeting-left">
          <div className="greeting-icon-wrapper">
            <Building2 size={26} />
          </div>
          <div>
            <h2 className="greeting-title">
              🏥 {activeClinicObj ? activeClinicObj.name : 'All Clinic Locations'} Appointments
            </h2>
            <p className="greeting-sub">
              <span className="greeting-meta-item">
                <MapPin size={13} /> {activeClinicObj ? activeClinicObj.address : 'Lucknow Branches'}
              </span>
              <span>•</span>
              <span className="greeting-meta-item">
                <Clock size={13} /> {activeClinicObj ? activeClinicObj.operating_hours || 'OPD Hours' : 'OPD Timings'}
              </span>
            </p>
          </div>
        </div>

        <div className="greeting-right-badge">
          <Sparkles size={15} />
          <span>{clinicFilteredAppointments.length} Patient Records</span>
        </div>
      </div>

      {/* 3. Header Actions */}
      <div className="admin-appointments-page__header">
        <div>
          <h1>Appointments Directory</h1>
          <p>
            Filter, manage arrival status, call patients, and view clinical history
          </p>
        </div>

        <div className="admin-appointments-page__actions">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAppointments}
            loading={loading}
            icon={<RefreshCw size={14} />}
          >
            Refresh List
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="admin-appointments-page__error">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4. Date-Wise Daily Booking Counter Bar */}
      <div className="date-summary-box">
        <div className="date-summary-title">
          <Calendar size={14} /> Quick Date Filter • Daily Patient Load:
        </div>
        <div className="date-chips-scroll-bar">
          <button
            className={`date-chip-btn ${selectedDateFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedDateFilter('all')}
          >
            All Dates <span className="date-chip-count">{clinicFilteredAppointments.length}</span>
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

      {/* 5. Appointments Table */}
      <AppointmentsTable
        appointments={finalFilteredAppointments}
        onAction={handleAppointmentAction}
        loading={loading || actionLoading}
      />
    </div>
  );
}
