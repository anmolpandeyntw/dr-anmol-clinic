import React from 'react';
import { Link } from 'react-router-dom';
import type { Clinic } from '../../types/database';
import { MapPin, Clock, IndianRupee } from 'lucide-react';
import { Card } from '../common/Card';
import './ClinicsPreview.css';

interface ClinicsPreviewProps {
  clinics: Clinic[];
}

export const ClinicsPreview: React.FC<ClinicsPreviewProps> = ({ clinics }) => {
  // Filter ONLY Private Clinics for Homepage "Our Clinics"
  const privateClinicsOnly = (clinics || []).filter(c =>
    c.is_private_clinic !== false &&
    !c.name.toLowerCase().includes('hospital') &&
    !c.name.toLowerCase().includes('kgmu')
  );

  if (privateClinicsOnly.length === 0) return null;

  return (
    <section className="clinics-preview-section">
      <h2 className="section-title">Our Private Clinics</h2>
      <div className="clinics-grid">
        {privateClinicsOnly.map(clinic => (
          <Card key={clinic.id} className="clinic-preview-card">
            <h3 className="clinic-name">{clinic.name}</h3>

            <div className="clinic-detail">
              <MapPin size={18} className="clinic-icon" />
              <span className="clinic-text truncate">{clinic.address}</span>
            </div>

            {clinic.operating_hours && (
              <div className="clinic-detail">
                <Clock size={18} className="clinic-icon" />
                <span className="clinic-text">
                  {typeof clinic.operating_hours === 'string' ? clinic.operating_hours : 'Open Mon-Sat'}
                </span>
              </div>
            )}

            <div className="clinic-detail">
              <IndianRupee size={18} className="clinic-icon" />
              <span className="clinic-text">₹{clinic.consultation_fee} Consultation Fee</span>
            </div>
          </Card>
        ))}
      </div>
      <div className="clinics-action">
        <Link to="/clinics" className="view-all-link">
          View All Clinics & Hospital OPDs &rarr;
        </Link>
      </div>
    </section>
  );
};

export default ClinicsPreview;
