import { useDoctor } from '../hooks/useDoctor';
import { useClinics } from '../hooks/useClinics';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { MapPin, Phone, Clock, IndianRupee, MessageSquare, Building2, CheckCircle2, Shield, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FullPageLoader } from '../components/common/LoadingSpinner';
import './ClinicsPage.css';

export default function ClinicsPage() {
  const { doctor } = useDoctor();
  const { clinics, loading } = useClinics();

  const doctorName = doctor?.full_name || 'Dr. Anmol Pandey';

  if (loading) return <FullPageLoader />;

  const privateClinics = clinics.filter((c) => c.is_private_clinic !== false && !c.name.toLowerCase().includes('hospital') && !c.name.toLowerCase().includes('kgmu'));
  const hospitalClinics = clinics.filter((c) => c.is_private_clinic === false || c.name.toLowerCase().includes('hospital') || c.name.toLowerCase().includes('kgmu'));

  return (
    <div className="clinics-page">
      <div className="clinics-page__hero">
        <div className="clinics-page__container">
          <span className="clinics-page__badge">
            <Building2 size={16} /> PRACTICE LOCATIONS
          </span>
          <h1>Clinics & Hospital Attachments</h1>
          <p>
            {doctorName} consults at his Private Clinic for direct online token bookings,
            as well as leading Super Specialty Hospitals across Lucknow.
          </p>
        </div>
      </div>

      <div className="clinics-page__container clinics-page__content">
        {/* Section 1: Private Clinic */}
        <section className="clinics-section">
          <div className="section-title-wrapper">
            <div className="section-icon-badge section-icon-badge--private">
              <Shield size={20} />
            </div>
            <div>
              <h2>Private Clinics (Direct Online Token Booking)</h2>
              <p>Book your token online directly for {doctorName}'s private consultation clinics.</p>
            </div>
          </div>

          <div className="clinics-grid">
            {privateClinics.map((clinic) => (
              <Card key={clinic.id} className="clinic-card clinic-card--private">
                <div className="clinic-card__header">
                  <span className="online-badge">
                    <CheckCircle2 size={14} /> ONLINE TOKEN BOOKING ENABLED
                  </span>
                  <h3>{clinic.name}</h3>
                </div>

                <div className="clinic-card__details">
                  <div className="detail-item">
                    <MapPin size={18} className="detail-icon" />
                    <span>{clinic.address}</span>
                  </div>

                  <div className="detail-item">
                    <Clock size={18} className="detail-icon" />
                    <span>{clinic.operating_hours}</span>
                  </div>

                  <div className="detail-item">
                    <IndianRupee size={18} className="detail-icon" />
                    <span>Consultation Fee: ₹{clinic.consultation_fee}</span>
                  </div>

                  <div className="detail-item">
                    <Phone size={18} className="detail-icon" />
                    <span>{clinic.phone}</span>
                  </div>
                </div>

                <div className="clinic-card__actions">
                  <Link to={`/book?clinic=${clinic.id}`}>
                    <Button variant="primary" size="md">
                      Book Online Token
                    </Button>
                  </Link>

                  {clinic.google_maps_url && (
                    <a
                      href={clinic.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="map-btn"
                    >
                      <MapPin size={16} /> Google Maps Location
                    </a>
                  )}

                  {clinic.whatsapp_number && (
                    <a
                      href={`https://wa.me/${clinic.whatsapp_number}?text=Hello%20${encodeURIComponent(doctorName)}%27s%20clinic,%20I%20have%20an%20inquiry.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whatsapp-btn"
                    >
                      <MessageSquare size={16} /> WhatsApp Inquiry
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 2: Hospital OPD Attachments */}
        {hospitalClinics.length > 0 && (
          <section className="clinics-section">
            <div className="section-title-wrapper">
              <div className="section-icon-badge section-icon-badge--hospital">
                <Building2 size={20} />
              </div>
              <div>
                <h2>Hospital Attachments & OPD Consultation</h2>
                <p>{doctorName} leads Nephrology & Medical departments at top Lucknow hospitals. Hospital OPD registration takes place at the hospital desk.</p>
              </div>
            </div>

            <div className="clinics-grid">
              {hospitalClinics.map((clinic) => (
                <Card key={clinic.id} className="clinic-card clinic-card--hospital">
                  <div className="clinic-card__header">
                    <span className="hospital-badge">HOSPITAL OPD DESK BOOKING</span>
                    <h3>{clinic.name}</h3>
                  </div>

                  <div className="clinic-card__details">
                    <div className="detail-item detail-item--address">
                      <MapPin size={18} className="detail-icon" />
                      <span>{clinic.address}</span>
                      {clinic.hospital_url && (
                        <a
                          href={clinic.hospital_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hosp-inline-link"
                        >
                          <Globe size={14} /> Hospital Web Page ↗
                        </a>
                      )}
                    </div>

                    <div className="detail-item">
                      <Clock size={18} className="detail-icon" />
                      <span>{clinic.operating_hours}</span>
                    </div>

                    <div className="detail-item">
                      <Phone size={18} className="detail-icon" />
                      <span>Hospital Desk: {clinic.phone}</span>
                    </div>
                  </div>

                  <div className="clinic-card__actions">
                    <a href={`tel:${clinic.phone}`} className="call-hospital-btn">
                      <Phone size={16} /> Call Hospital Desk to Book
                    </a>

                    {clinic.hospital_url && (
                      <a
                        href={clinic.hospital_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="map-btn"
                        style={{ background: '#F0F9FF', color: '#0284C7', borderColor: '#BAE6FD' }}
                      >
                        <Globe size={16} /> Official Hospital Profile Page ↗
                      </a>
                    )}

                    {clinic.google_maps_url && (
                      <a
                        href={clinic.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="map-btn"
                      >
                        <MapPin size={16} /> Google Maps Location
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
