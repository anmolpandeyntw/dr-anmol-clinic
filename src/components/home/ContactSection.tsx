import React from 'react';
import type { Clinic } from '../../types/database';
import { MapPin, Phone, Clock } from 'lucide-react';
import { Card } from '../common/Card';
import './ContactSection.css';

interface ContactSectionProps {
  clinics: Clinic[];
}

export const ContactSection: React.FC<ContactSectionProps> = ({ clinics }) => {
  if (!clinics || clinics.length === 0) return null;

  return (
    <section className="contact-section">
      <h2 className="section-title">Contact Us</h2>
      <div className="contact-grid">
        {clinics.map(clinic => (
          <Card key={clinic.id} className="contact-card">
            <h3 className="contact-clinic-name">{clinic.name}</h3>
            
            <div className="contact-detail">
              <MapPin size={20} className="contact-icon" />
              <span className="contact-text">{clinic.address}</span>
            </div>
            
            {clinic.phone && (
              <div className="contact-detail">
                <Phone size={20} className="contact-icon" />
                <a href={`tel:${clinic.phone}`} className="contact-link">
                  {clinic.phone}
                </a>
              </div>
            )}
            
            {clinic.operating_hours && (
              <div className="contact-detail">
                <Clock size={20} className="contact-icon" />
                <span className="contact-text">
                  {typeof clinic.operating_hours === 'string' ? clinic.operating_hours : 'Open Mon-Sat'}
                </span>
              </div>
            )}
            
            {clinic.map_url && (
              <a href={clinic.map_url} target="_blank" rel="noopener noreferrer" className="map-btn">
                View on Map
              </a>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
};

export default ContactSection;
