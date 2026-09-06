import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useClinics } from '../../hooks/useClinics';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { BlockedDate, SpecialSchedule } from '../../types/database';
import { Calendar, Ban, Sparkles, Trash2, CheckCircle2 } from 'lucide-react';
import './AdminSpecialDatesPage.css';

const DEFAULT_BLOCKED_DATES: BlockedDate[] = [
  {
    id: 'blk-001',
    clinic_id: 'ALL',
    date: '2026-08-15',
    reason: 'Independence Day Holiday (All Clinics Closed)',
    created_at: new Date().toISOString()
  },
  {
    id: 'blk-002',
    clinic_id: 'clinic-private-01',
    date: '2026-10-02',
    reason: 'Gandhi Jayanti',
    created_at: new Date().toISOString()
  }
];

const DEFAULT_SPECIAL_SCHEDULES: SpecialSchedule[] = [
  {
    id: 'spc-001',
    clinic_id: 'clinic-private-01',
    date: '2026-08-30',
    start_time: '10:00:00',
    end_time: '14:00:00',
    max_tokens: 15,
    created_at: new Date().toISOString()
  }
];

export default function AdminSpecialDatesPage() {
  const { clinics } = useClinics();
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(() => {
    const saved = localStorage.getItem('saved_blocked_dates');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_BLOCKED_DATES;
  });

  const [specialSchedules, setSpecialSchedules] = useState<SpecialSchedule[]>(() => {
    const saved = localStorage.getItem('saved_special_schedules');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_SPECIAL_SCHEDULES;
  });

  const [_loading, setLoading] = useState(true);

  // Block Modal Checkboxes state
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [selectedClinicIds, setSelectedClinicIds] = useState<string[]>([]);
  const [blockDate, setBlockDate] = useState<string>('');
  const [blockReason, setBlockReason] = useState<string>('');

  // Auto-select all clinics when opening block modal
  useEffect(() => {
    if (clinics.length > 0 && selectedClinicIds.length === 0) {
      setSelectedClinicIds(clinics.map(c => c.id));
    }
  }, [clinics, selectedClinicIds.length]);

  // Special Day Modal
  const [isSpecialModalOpen, setIsSpecialModalOpen] = useState(false);
  const [specialClinicId, setSpecialClinicId] = useState<string>('');
  const [specialDate, setSpecialDate] = useState<string>('');
  const [specialStartTime, setSpecialStartTime] = useState<string>('10:00');
  const [specialEndTime, setSpecialEndTime] = useState<string>('14:00');
  const [specialCapacity, setSpecialCapacity] = useState<number>(20);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      const { data: bData, error: bErr } = await supabase
        .from('blocked_dates')
        .select('*')
        .order('date', { ascending: true });

      if (!bErr && bData && bData.length > 0) {
        setBlockedDates(bData);
        localStorage.setItem('saved_blocked_dates', JSON.stringify(bData));
      }

      const { data: sData, error: sErr } = await supabase
        .from('special_schedules')
        .select('*')
        .order('date', { ascending: true });

      if (!sErr && sData && sData.length > 0) {
        setSpecialSchedules(sData);
        localStorage.setItem('saved_special_schedules', JSON.stringify(sData));
      }
    } catch (e) {
      console.warn('Fetch special dates note:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle All Clinics Checkbox
  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClinicIds(clinics.map(c => c.id));
    } else {
      setSelectedClinicIds([]);
    }
  };

  // Toggle Individual Clinic Checkbox
  const handleToggleClinic = (clinicId: string, checked: boolean) => {
    if (checked) {
      setSelectedClinicIds(prev => [...prev, clinicId]);
    } else {
      setSelectedClinicIds(prev => prev.filter(id => id !== clinicId));
    }
  };

  // Save Block Date (Supports multiple selected clinics or ALL at once)
  const handleSaveBlockDate = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedClinicIds.length === 0 || !blockDate) {
      alert('Please select at least one clinic location.');
      return;
    }

    setSaving(true);
    setSuccessMsg(null);

    const isAllSelected = selectedClinicIds.length === clinics.length;
    const reasonText = blockReason || (isAllSelected ? 'Doctor Full Leave (All Clinics Off)' : 'Doctor Leave / Holiday');

    const newBlockedItems: BlockedDate[] = [];

    if (isAllSelected) {
      newBlockedItems.push({
        id: `blk-ALL-${Date.now()}`,
        clinic_id: 'ALL',
        date: blockDate,
        reason: reasonText,
        created_at: new Date().toISOString()
      });
    } else {
      selectedClinicIds.forEach((cId, idx) => {
        newBlockedItems.push({
          id: `blk-${Date.now()}-${idx}`,
          clinic_id: cId,
          date: blockDate,
          reason: reasonText,
          created_at: new Date().toISOString()
        });
      });
    }

    const updated = [...blockedDates, ...newBlockedItems];
    setBlockedDates(updated);
    localStorage.setItem('saved_blocked_dates', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        for (const item of newBlockedItems) {
          await supabase.from('blocked_dates').insert({
            clinic_id: item.clinic_id === 'ALL' ? (clinics[0]?.id || 'clinic-private-01') : item.clinic_id,
            date: blockDate,
            reason: reasonText
          });
        }
      } catch (err) {
        console.warn('Supabase block date insert note:', err);
      }
    }

    setSaving(false);
    setIsBlockModalOpen(false);
    setBlockDate('');
    setBlockReason('');
    setSuccessMsg(isAllSelected ? '🎉 Full Leave Applied! All clinics blocked for this date.' : '🎉 Date successfully blocked for selected clinic(s)!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Save Special Clinic Day
  const handleSaveSpecialDay = async (e: FormEvent) => {
    e.preventDefault();
    if (!specialClinicId || !specialDate) return;

    setSaving(true);
    setSuccessMsg(null);

    const newSpecial: SpecialSchedule = {
      id: `spc-${Date.now()}`,
      clinic_id: specialClinicId,
      date: specialDate,
      start_time: specialStartTime,
      end_time: specialEndTime,
      max_tokens: specialCapacity,
      created_at: new Date().toISOString()
    };

    const updated = [...specialSchedules, newSpecial];
    setSpecialSchedules(updated);
    localStorage.setItem('saved_special_schedules', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('special_schedules').insert({
          clinic_id: specialClinicId,
          date: specialDate,
          start_time: specialStartTime,
          end_time: specialEndTime,
          max_tokens: specialCapacity
        });
      } catch (err) {
        console.warn('Supabase special schedule insert note:', err);
      }
    }

    setSaving(false);
    setIsSpecialModalOpen(false);
    setSpecialDate('');
    setSuccessMsg('🎉 Special clinic day successfully added!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Delete handlers
  const handleDeleteBlocked = async (id: string) => {
    const updated = blockedDates.filter(b => b.id !== id);
    setBlockedDates(updated);
    localStorage.setItem('saved_blocked_dates', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('blocked_dates').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete block date note:', e);
      }
    }
  };

  const handleDeleteSpecial = async (id: string) => {
    const updated = specialSchedules.filter(s => s.id !== id);
    setSpecialSchedules(updated);
    localStorage.setItem('saved_special_schedules', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('special_schedules').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete special schedule note:', e);
      }
    }
  };

  const isAllClinicsChecked = clinics.length > 0 && selectedClinicIds.length === clinics.length;

  return (
    <div className="admin-special-dates-page">
      <div className="admin-special-dates-page__header">
        <div>
          <h1>Special Dates & Availability Manager</h1>
          <p>Block doctor leave dates or add special extra clinic days overriding weekly schedules</p>
        </div>

        <div className="header-actions">
          <Button
            variant="outline"
            size="md"
            icon={<Ban size={18} />}
            onClick={() => {
              setSelectedClinicIds(clinics.map(c => c.id));
              setIsBlockModalOpen(true);
            }}
          >
            Block a Date (Leave)
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={<Sparkles size={18} />}
            onClick={() => {
              setSpecialClinicId(clinics[0]?.id || 'clinic-private-01');
              setIsSpecialModalOpen(true);
            }}
          >
            Add Special Clinic Day
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="admin-special-dates-page__success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="special-dates-sections-grid">
        {/* Section 1: Blocked Dates */}
        <Card className="special-section-card">
          <div className="section-header section-header--blocked">
            <Ban size={20} />
            <h2>Blocked Dates (Doctor Unavailable)</h2>
          </div>

          <div className="dates-list">
            {blockedDates.map((b) => {
              const isAllClinics = b.clinic_id === 'ALL';
              const clinicName = isAllClinics 
                ? '🏥 ALL CLINICS (FULL LEAVE)' 
                : (clinics.find(c => c.id === b.clinic_id)?.name || 'Private Clinic');

              return (
                <div key={b.id} className={`date-item ${isAllClinics ? 'date-item--all-blocked' : 'date-item--blocked'}`}>
                  <div className="date-item__info">
                    <span className={`date-pill ${isAllClinics ? 'date-pill--dark-red' : 'date-pill--red'}`}>
                      <Calendar size={14} /> {b.date}
                    </span>
                    <span className={`clinic-name ${isAllClinics ? 'clinic-name--all' : ''}`}>{clinicName}</span>
                    {b.reason && <span className="reason-tag">{b.reason}</span>}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={16} />}
                    onClick={() => handleDeleteBlocked(b.id)}
                  />
                </div>
              );
            })}

            {blockedDates.length === 0 && (
              <p className="empty-msg">No dates currently blocked.</p>
            )}
          </div>
        </Card>

        {/* Section 2: Special Clinic Days */}
        <Card className="special-section-card">
          <div className="section-header section-header--special">
            <Sparkles size={20} />
            <h2>Special Clinic Days (Overrides Regular Schedule)</h2>
          </div>

          <div className="dates-list">
            {specialSchedules.map((s) => {
              const clinicName = clinics.find(c => c.id === s.clinic_id)?.name || 'Private Clinic';
              return (
                <div key={s.id} className="date-item date-item--special">
                  <div className="date-item__info">
                    <span className="date-pill date-pill--blue"><Calendar size={14} /> {s.date}</span>
                    <span className="clinic-name">{clinicName}</span>
                    <span className="timing-tag">{s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)} ({s.max_tokens} Tokens)</span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={16} />}
                    onClick={() => handleDeleteSpecial(s.id)}
                  />
                </div>
              );
            })}

            {specialSchedules.length === 0 && (
              <p className="empty-msg">No special clinic days added.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Block Date Modal with Checkbox Multi-Clinic Selection */}
      {isBlockModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Block a Date (Doctor Leave / Holiday)</h2>
            <form onSubmit={handleSaveBlockDate} className="modal-form">
              <div className="form-group">
                <label>Select Clinics to Block *</label>
                <div className="clinics-checkbox-container">
                  {/* Master Checkbox */}
                  <label className="checkbox-item checkbox-item--master">
                    <input
                      type="checkbox"
                      checked={isAllClinicsChecked}
                      onChange={(e) => handleToggleSelectAll(e.target.checked)}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-title">
                      🏥 <strong>All Private Clinics (Full Doctor Leave / Vacation)</strong>
                    </span>
                  </label>

                  <div className="checkbox-divider"></div>

                  {/* Individual Clinic Checkboxes */}
                  <div className="checkboxes-list">
                    {clinics.map((c) => (
                      <label key={c.id} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedClinicIds.includes(c.id)}
                          onChange={(e) => handleToggleClinic(c.id, e.target.checked)}
                        />
                        <span className="checkbox-custom"></span>
                        <span>📍 {c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <span className="field-help-text">
                  {isAllClinicsChecked 
                    ? '⚡ All clinics selected! Doctor will be completely unavailable for bookings on this date.' 
                    : `${selectedClinicIds.length} of ${clinics.length} clinics selected.`}
                </span>
              </div>

              <div className="form-group">
                <label>Date Unavailable *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Doctor Vacation, Out of Town, National Holiday"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <Button type="button" variant="outline" onClick={() => setIsBlockModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" loading={saving} disabled={selectedClinicIds.length === 0}>
                  {isAllClinicsChecked ? 'Block All Clinics' : `Block ${selectedClinicIds.length} Clinic(s)`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Special Day Modal */}
      {isSpecialModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Add Special Clinic Day</h2>
            <form onSubmit={handleSaveSpecialDay} className="modal-form">
              <div className="form-group">
                <label>Clinic Location *</label>
                <select value={specialClinicId} onChange={(e) => setSpecialClinicId(e.target.value)}>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={specialDate}
                  onChange={(e) => setSpecialDate(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time *</label>
                  <input type="time" required value={specialStartTime} onChange={(e) => setSpecialStartTime(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>End Time *</label>
                  <input type="time" required value={specialEndTime} onChange={(e) => setSpecialEndTime(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>Special Patient Capacity *</label>
                <input type="number" min="1" required value={specialCapacity} onChange={(e) => setSpecialCapacity(parseInt(e.target.value) || 1)} />
              </div>

              <div className="modal-actions">
                <Button type="button" variant="outline" onClick={() => setIsSpecialModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" loading={saving}>Add Special Day</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
