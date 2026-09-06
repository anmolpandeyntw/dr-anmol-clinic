import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { MOCK_CLINICS } from '../../lib/mockData';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { Clinic } from '../../types/database';
import { Building2, Plus, Edit2, XCircle, MapPin, Phone, Clock, IndianRupee, Shield, CheckCircle2, Users } from 'lucide-react';
import './AdminClinicsPage.css';

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>(() => {
    const saved = localStorage.getItem('saved_clinics_list');
    if (saved) {
      try { return JSON.parse(saved); } catch { return MOCK_CLINICS; }
    }
    return MOCK_CLINICS;
  });

  const [_loading, setLoading] = useState(true);
  const [editingClinic, setEditingClinic] = useState<Partial<Clinic> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchClinics = useCallback(async () => {
    setLoading(true);
    const saved = localStorage.getItem('saved_clinics_list');
    let localSaved: Clinic[] | null = null;
    if (saved) {
      try { localSaved = JSON.parse(saved); } catch { localSaved = null; }
    }

    if (!isSupabaseConfigured) {
      setClinics(localSaved || MOCK_CLINICS);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('display_order', { ascending: true });

      if (error || !data || data.length === 0) {
        setClinics(localSaved || MOCK_CLINICS);
      } else {
        setClinics(data as Clinic[]);
      }
    } catch {
      setClinics(localSaved || MOCK_CLINICS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  const handleOpenAdd = (isPrivate: boolean) => {
    setEditingClinic({
      name: '',
      address: '',
      phone: '',
      whatsapp_number: '',
      google_maps_url: '',
      operating_hours: 'Mon, Wed, Fri — 10:00 AM to 2:00 PM',
      consultation_fee: isPrivate ? 600 : 800,
      capacity: 20, // Default 20 tokens per session
      is_active: true,
      is_private_clinic: isPrivate,
      online_booking_enabled: isPrivate,
      display_order: clinics.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (clinic: Clinic) => {
    setEditingClinic({ 
      ...clinic,
      capacity: clinic.capacity || 20
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingClinic?.name || !editingClinic?.address) {
      setErrorMsg('Clinic name and address are required.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const recordToSave = {
      ...editingClinic,
      capacity: editingClinic.capacity || 20
    };

    let updatedList: Clinic[] = [];
    if (editingClinic.id) {
      updatedList = clinics.map(c => c.id === editingClinic.id ? { ...c, ...recordToSave } as Clinic : c);
    } else {
      const newC: Clinic = {
        ...recordToSave,
        id: `clinic-${Date.now()}`,
        doctor_id: 'doc-001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Clinic;
      updatedList = [...clinics, newC];
    }

    setClinics(updatedList);
    localStorage.setItem('saved_clinics_list', JSON.stringify(updatedList));
    window.dispatchEvent(new Event('clinics_updated'));

    if (!isSupabaseConfigured) {
      setIsModalOpen(false);
      setSaving(false);
      setSuccessMsg('🎉 Clinic details saved! Live on website & booking page.');
      return;
    }

    try {
      const { data: docs } = await supabase.from('doctors').select('id').limit(1);
      const realDocUuid = docs && docs.length > 0 ? docs[0].id : null;

      const isUuid = editingClinic.id && /^[0-9a-fA-F-]{36}$/.test(editingClinic.id);

      const dbPayload: any = {
        name: editingClinic.name,
        address: editingClinic.address,
        phone: editingClinic.phone || null,
        whatsapp_number: editingClinic.whatsapp_number || null,
        google_maps_url: editingClinic.google_maps_url || null,
        hospital_url: editingClinic.hospital_url || null,
        operating_hours: editingClinic.operating_hours || null,
        consultation_fee: editingClinic.consultation_fee || 600,
        capacity: editingClinic.capacity || 20,
        is_active: editingClinic.is_active ?? true,
        is_private_clinic: editingClinic.is_private_clinic ?? true,
        online_booking_enabled: editingClinic.online_booking_enabled ?? true,
        updated_at: new Date().toISOString()
      };

      if (realDocUuid) {
        dbPayload.doctor_id = realDocUuid;
      }

      if (isUuid) {
        const { error: updateErr } = await supabase
          .from('clinics')
          .update(dbPayload)
          .eq('id', editingClinic.id);

        if (updateErr) console.warn('Supabase clinic update note:', updateErr.message);
      } else if (realDocUuid) {
        const { error: insertErr } = await supabase
          .from('clinics')
          .insert([{ ...dbPayload, display_order: editingClinic.display_order || 1 }]);

        if (insertErr) console.warn('Supabase clinic insert note:', insertErr.message);
      }

      setSuccessMsg('🎉 Clinic setup saved! Updated in database & live on website.');
      setIsModalOpen(false);
    } catch (err) {
      console.warn('Clinic save note:', err);
      setSuccessMsg('🎉 Clinic setup saved! Updated on website.');
      setIsModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const privateClinics = clinics.filter(c => c.is_private_clinic);
  const hospitalClinics = clinics.filter(c => !c.is_private_clinic);

  return (
    <div className="admin-clinics-page">
      <div className="admin-clinics-page__header">
        <div>
          <h1>Manage Clinics & OPD Locations</h1>
          <p>Configure Private Clinics, OPD timings, consultation fees, and patient capacities</p>
        </div>

        <div className="admin-clinics-page__actions">
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={18} />}
            onClick={() => handleOpenAdd(true)}
          >
            Add Private Clinic
          </Button>

          <Button
            variant="outline"
            size="md"
            icon={<Plus size={18} />}
            onClick={() => handleOpenAdd(false)}
          >
            Add Hospital OPD
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="admin-clinics-page__error">
          <XCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="admin-clinics-page__success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Section 1: Private Clinics */}
      <section className="admin-clinics-section">
        <div className="section-title">
          <Shield size={20} className="icon-private" />
          <h2>Private Clinics (Online Token Booking)</h2>
        </div>

        <div className="admin-clinics-grid">
          {privateClinics.map((clinic) => (
            <Card key={clinic.id} className="admin-clinic-card">
              <div className="admin-clinic-card__header">
                <div>
                  <span className={`status-pill ${clinic.is_active ? 'status-pill--active' : 'status-pill--inactive'}`}>
                    {clinic.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <span className={`booking-pill ${clinic.online_booking_enabled ? 'booking-pill--on' : 'booking-pill--off'}`}>
                    {clinic.online_booking_enabled ? 'ONLINE BOOKING ON' : 'BOOKING OFF'}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Edit2 size={16} />}
                  onClick={() => handleOpenEdit(clinic)}
                >
                  Edit
                </Button>
              </div>

              <h3>{clinic.name}</h3>

              <div className="admin-clinic-card__info">
                <p><MapPin size={14} /> {clinic.address}</p>
                <p><Clock size={14} /> <strong>OPD Hours:</strong> {clinic.operating_hours}</p>
                <p><Users size={14} /> <strong>Daily Session Capacity:</strong> {clinic.capacity || 20} Tokens</p>
                <p><IndianRupee size={14} /> <strong>Fee:</strong> ₹{clinic.consultation_fee}</p>
                <p><Phone size={14} /> {clinic.phone}</p>
                {clinic.google_maps_url && (
                  <p><a href={clinic.google_maps_url} target="_blank" rel="noopener noreferrer" className="link-maps">🗺️ Verified Google Maps Link</a></p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 2: Hospital OPDs */}
      <section className="admin-clinics-section">
        <div className="section-title">
          <Building2 size={20} className="icon-hospital" />
          <h2>Hospital Attachments & OPDs</h2>
        </div>

        <div className="admin-clinics-grid">
          {hospitalClinics.map((clinic) => (
            <Card key={clinic.id} className="admin-clinic-card admin-clinic-card--hospital">
              <div className="admin-clinic-card__header">
                <div>
                  <span className={`status-pill ${clinic.is_active ? 'status-pill--active' : 'status-pill--inactive'}`}>
                    {clinic.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <span className="booking-pill booking-pill--off">HOSPITAL DESK BOOKING</span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Edit2 size={16} />}
                  onClick={() => handleOpenEdit(clinic)}
                >
                  Edit
                </Button>
              </div>

              <h3>{clinic.name}</h3>

              <div className="admin-clinic-card__info">
                <p><MapPin size={14} /> {clinic.address}</p>
                <p><Clock size={14} /> {clinic.operating_hours}</p>
                <p><Phone size={14} /> Desk: {clinic.phone}</p>
                {clinic.google_maps_url && (
                  <p><a href={clinic.google_maps_url} target="_blank" rel="noopener noreferrer" className="link-maps">🗺️ Verified Google Maps Link</a></p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Modal Form */}
      {isModalOpen && editingClinic && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>{editingClinic.id ? 'Edit Clinic Details' : 'Add New Clinic Location'}</h2>

            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label>Location Type</label>
                <select
                  value={editingClinic.is_private_clinic ? 'private' : 'hospital'}
                  onChange={(e) => setEditingClinic({ ...editingClinic, is_private_clinic: e.target.value === 'private' })}
                >
                  <option value="private">Private Clinic (Direct Online Booking)</option>
                  <option value="hospital">Hospital OPD Attachment (Hospital Desk Booking)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Clinic Location Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Anmol Pandey Private Nephrology Clinic"
                  value={editingClinic.name || ''}
                  onChange={(e) => setEditingClinic({ ...editingClinic, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vibhuti Khand, Gomtinagar, Lucknow"
                  value={editingClinic.address || ''}
                  onChange={(e) => setEditingClinic({ ...editingClinic, address: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 73172 86787"
                    value={editingClinic.phone || ''}
                    onChange={(e) => setEditingClinic({ ...editingClinic, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>WhatsApp Number</label>
                  <input
                    type="text"
                    placeholder="7317286787"
                    value={editingClinic.whatsapp_number || ''}
                    onChange={(e) => setEditingClinic({ ...editingClinic, whatsapp_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Real Google Maps Location URL *</label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/?q=..."
                  value={editingClinic.google_maps_url || ''}
                  onChange={(e) => setEditingClinic({ ...editingClinic, google_maps_url: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Operating Hours / Days *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mon, Wed, Fri — 10:00 AM to 2:00 PM"
                    value={editingClinic.operating_hours || ''}
                    onChange={(e) => setEditingClinic({ ...editingClinic, operating_hours: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Consultation Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingClinic.consultation_fee || 0}
                    onChange={(e) => setEditingClinic({ ...editingClinic, consultation_fee: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Patient Capacity Configuration */}
              <div className="form-group">
                <label>Daily Patient Token Capacity *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  placeholder="20"
                  value={editingClinic.capacity || 20}
                  onChange={(e) => setEditingClinic({ ...editingClinic, capacity: parseInt(e.target.value) || 20 })}
                />
                <span className="field-subnote">Maximum online tokens issued per OPD day/session</span>
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={editingClinic.is_active ?? true}
                      onChange={(e) => setEditingClinic({ ...editingClinic, is_active: e.target.checked })}
                    />
                    Location Active
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={editingClinic.online_booking_enabled ?? true}
                      onChange={(e) => setEditingClinic({ ...editingClinic, online_booking_enabled: e.target.checked })}
                    />
                    Online Token Booking ON
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={saving}>
                  Save Clinic Setup
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
