import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useClinics } from '../../hooks/useClinics';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { Schedule } from '../../types/database';
import { Clock, Plus, Edit2, CheckCircle2, Calendar, Trash2, Building2 } from 'lucide-react';
import './AdminSchedulePage.css';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminSchedulePage() {
  const { clinics } = useClinics();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [_loading, setLoading] = useState(true);
  const [selectedClinicFilter, setSelectedClinicFilter] = useState<string>('ALL');
  
  const [editingSchedule, setEditingSchedule] = useState<Partial<Schedule> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const getDefaultSchedules = useCallback((): Schedule[] => {
    const c1 = clinics[0]?.id || 'clinic-private-01';
    const c2 = clinics[1]?.id || 'clinic-private-02';
    return [
      { id: 'sch-001', clinic_id: c1, day_of_week: 1, start_time: '10:00:00', end_time: '14:00:00', max_tokens: 20, is_active: true, slot_duration: 15, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'sch-002', clinic_id: c1, day_of_week: 3, start_time: '10:00:00', end_time: '14:00:00', max_tokens: 20, is_active: true, slot_duration: 15, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'sch-003', clinic_id: c1, day_of_week: 5, start_time: '10:00:00', end_time: '14:00:00', max_tokens: 20, is_active: true, slot_duration: 15, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'sch-004', clinic_id: c2, day_of_week: 2, start_time: '17:00:00', end_time: '20:00:00', max_tokens: 15, is_active: true, slot_duration: 15, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'sch-005', clinic_id: c2, day_of_week: 4, start_time: '17:00:00', end_time: '20:00:00', max_tokens: 15, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'sch-006', clinic_id: c2, day_of_week: 6, start_time: '17:00:00', end_time: '20:00:00', max_tokens: 15, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];
  }, [clinics]);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);

    const saved = localStorage.getItem('saved_weekly_schedules');
    let localSchedules: Schedule[] = [];
    if (saved) {
      try {
        localSchedules = JSON.parse(saved);
      } catch {}
    }

    if (localSchedules.length === 0) {
      localSchedules = getDefaultSchedules();
      localStorage.setItem('saved_weekly_schedules', JSON.stringify(localSchedules));
    }

    if (!isSupabaseConfigured) {
      setSchedules(localSchedules);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('day_of_week', { ascending: true });

      if (error || !data || data.length === 0) {
        setSchedules(localSchedules);
      } else {
        setSchedules(data as Schedule[]);
        localStorage.setItem('saved_weekly_schedules', JSON.stringify(data));
      }
    } catch {
      setSchedules(localSchedules);
    } finally {
      setLoading(false);
    }
  }, [getDefaultSchedules]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleOpenAdd = () => {
    setEditingSchedule({
      clinic_id: clinics[0]?.id || '',
      day_of_week: 1,
      start_time: '10:00',
      end_time: '14:00',
      max_tokens: 20,
      slot_duration: 15,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sch: Schedule) => {
    setEditingSchedule({ ...sch });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this schedule slot?')) return;

    const updated = schedules.filter(s => s.id !== id);
    setSchedules(updated);
    localStorage.setItem('saved_weekly_schedules', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('schedules').delete().eq('id', id);
      } catch {}
    }

    setSuccessMsg('🗑️ Weekly schedule slot removed successfully!');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingSchedule?.clinic_id) {
      return;
    }

    setSaving(true);

    const updatedRecord: Schedule = {
      id: editingSchedule.id || `sch-${Date.now()}`,
      clinic_id: editingSchedule.clinic_id,
      day_of_week: editingSchedule.day_of_week ?? 1,
      start_time: editingSchedule.start_time || '10:00:00',
      end_time: editingSchedule.end_time || '14:00:00',
      max_tokens: editingSchedule.max_tokens || 20,
      slot_duration: editingSchedule.slot_duration || 15,
      is_active: editingSchedule.is_active ?? true,
      created_at: editingSchedule.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let updatedList: Schedule[];
    if (editingSchedule.id) {
      updatedList = schedules.map(s => s.id === editingSchedule.id ? updatedRecord : s);
    } else {
      updatedList = [...schedules, updatedRecord];
    }

    setSchedules(updatedList);
    localStorage.setItem('saved_weekly_schedules', JSON.stringify(updatedList));

    if (isSupabaseConfigured) {
      try {
        if (editingSchedule.id) {
          await supabase.from('schedules').update({
            clinic_id: updatedRecord.clinic_id,
            day_of_week: updatedRecord.day_of_week,
            start_time: updatedRecord.start_time,
            end_time: updatedRecord.end_time,
            max_tokens: updatedRecord.max_tokens,
            slot_duration: updatedRecord.slot_duration,
            is_active: updatedRecord.is_active,
            updated_at: updatedRecord.updated_at
          }).eq('id', editingSchedule.id);
        } else {
          await supabase.from('schedules').insert([{
            clinic_id: updatedRecord.clinic_id,
            day_of_week: updatedRecord.day_of_week,
            start_time: updatedRecord.start_time,
            end_time: updatedRecord.end_time,
            max_tokens: updatedRecord.max_tokens,
            slot_duration: updatedRecord.slot_duration,
            is_active: updatedRecord.is_active
          }]);
        }
      } catch {}
    }

    setIsModalOpen(false);
    setSaving(false);
    setSuccessMsg('🎉 Weekly schedule updated live and saved to backend!');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const filteredSchedules = selectedClinicFilter === 'ALL'
    ? schedules
    : schedules.filter(s => s.clinic_id === selectedClinicFilter);

  return (
    <div className="admin-schedule-page">
      <div className="admin-schedule-page__header">
        <div>
          <h1>Weekly Schedule Manager</h1>
          <p>Configure regular OPD consultation days, timings, and token capacities per clinic</p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus size={18} />}
          onClick={handleOpenAdd}
        >
          Add Weekly Schedule Slot
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="schedule-filter-bar">
        <label className="filter-label">
          <Building2 size={16} /> Filter by Clinic Location:
        </label>
        <select
          className="clinic-filter-select"
          value={selectedClinicFilter}
          onChange={(e) => setSelectedClinicFilter(e.target.value)}
        >
          <option value="ALL">🏥 All Private Clinics</option>
          {clinics.map((c) => (
            <option key={c.id} value={c.id}>📍 {c.name}</option>
          ))}
        </select>
      </div>

      {successMsg && (
        <div className="admin-schedule-status-alert">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="admin-schedule-grid">
        {filteredSchedules.map((sch) => {
          const clinicObj = clinics.find(c => c.id === sch.clinic_id);
          const clinicName = clinicObj?.name || 'Private OPD Clinic';
          const dayName = DAYS_OF_WEEK[sch.day_of_week];

          return (
            <Card key={sch.id} className="admin-schedule-card">
              <div className="admin-schedule-card__header">
                <span className="day-badge">{dayName}</span>
                <div className="card-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit2 size={15} />}
                    onClick={() => handleOpenEdit(sch)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="btn-danger-ghost"
                    icon={<Trash2 size={15} />}
                    onClick={() => handleDelete(sch.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>

              <h3 className="clinic-title">{clinicName}</h3>

              <div className="admin-schedule-card__info">
                <p><Clock size={15} /> <strong>OPD Hours:</strong> {sch.start_time} - {sch.end_time}</p>
                <p><Calendar size={15} /> <strong>Token Capacity:</strong> {sch.max_tokens} Patients per day</p>
                <p>⏱️ <strong>Slot Duration:</strong> {sch.slot_duration || 15} minutes per patient</p>
              </div>

              <div className="admin-schedule-card__footer">
                <span className={`status-tag ${sch.is_active ? 'status-tag--active' : 'status-tag--inactive'}`}>
                  {sch.is_active ? 'ACTIVE SCHEDULE' : 'INACTIVE'}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && editingSchedule && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>{editingSchedule.id ? 'Edit Weekly Schedule' : 'Add Weekly Schedule Slot'}</h2>

            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label>Clinic Location *</label>
                <select
                  value={editingSchedule.clinic_id}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, clinic_id: e.target.value })}
                >
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Day of Week *</label>
                <select
                  value={editingSchedule.day_of_week}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, day_of_week: parseInt(e.target.value) })}
                >
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <option key={day} value={idx}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="time"
                    required
                    value={editingSchedule.start_time || '10:00'}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, start_time: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>End Time *</label>
                  <input
                    type="time"
                    required
                    value={editingSchedule.end_time || '14:00'}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Max Patients Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingSchedule.max_tokens || 20}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, max_tokens: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="form-group">
                  <label>Slot Duration (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    value={editingSchedule.slot_duration || 15}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, slot_duration: parseInt(e.target.value) || 15 })}
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editingSchedule.is_active ?? true}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, is_active: e.target.checked })}
                  />
                  Schedule Active
                </label>
              </div>

              <div className="modal-actions">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={saving}>
                  Save Schedule Slot
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
