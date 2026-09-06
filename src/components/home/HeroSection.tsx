import React from 'react';
import { Link } from 'react-router-dom';
import type { Doctor } from '../../types/database';
import { Button } from '../common/Button';
import { ShieldCheck, Phone, Award, CheckCircle2, CalendarPlus } from 'lucide-react';
import './HeroSection.css';

interface HeroSectionProps {
  doctor: Doctor | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ doctor }) => {
  const doctorName = doctor?.full_name || 'Dr. Anmol Pandey';
  const doctorTitle = doctor?.title || 'MBBS, MD (Medicine), DNB (Nephrology & Renal Transplant Medicine)';
  const doctorSubtitle = doctor?.subtitle || 'Senior Consultant – Nephrology & Renal Transplant Medicine';
  const photo = doctor?.photo_url || '/images/doctor_portrait.jpg';

  return (
    <section className="hero-section">
      <div className="hero-bg-overlay"></div>
      <div className="container hero-container">
        
        {/* Left Column: Ultra-Clean Headline & Direct CTAs */}
        <div className="hero-content">
          <div className="hero-live-badge">
            <span className="live-pulse-dot"></span>
            <span>Live Appointments Open For Today</span>
          </div>

          <h1 className="hero-name">
            {doctorName} <ShieldCheck className="verified-check" size={26} />
          </h1>

          <p className="hero-title-tag">{doctorTitle}</p>
          <p className="hero-subtitle-tag">{doctorSubtitle}</p>

          {/* Clean Direct Buttons */}
          <div className="hero-direct-ctas">
            <Link to="/book">
              <Button variant="primary" size="lg" icon={<CalendarPlus size={20} />}>
                Book Appointment Token
              </Button>
            </Link>

            <a href="tel:7317286787">
              <Button variant="outline" size="lg" icon={<Phone size={18} />}>
                Call Helpline: 7317286787
              </Button>
            </a>
          </div>

          {/* Key Assurance Highlights */}
          <div className="hero-highlights">
            <span className="h-item"><CheckCircle2 size={14} className="h-icon" /> Zero Reception Wait Time</span>
            <span className="h-item"><CheckCircle2 size={14} className="h-icon" /> Medical Council Verified</span>
            <span className="h-item"><CheckCircle2 size={14} className="h-icon" /> Instant WhatsApp Confirmation</span>
          </div>
        </div>

        {/* Right Column: High-Trust Doctor Portrait */}
        <div className="hero-media">
          <div className="hero-portrait-card">
            <img 
              src={photo} 
              alt={doctorName}
              className="portrait-img"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/doctor_portrait.jpg';
              }}
            />
            
            <div className="portrait-floating-badge portrait-badge--exp">
              <Award size={18} />
              <div>
                <span className="badge-val">13+ Years</span>
                <span className="badge-sub">Clinical Experience</span>
              </div>
            </div>

            <div className="portrait-floating-badge portrait-badge--trust">
              <ShieldCheck size={18} />
              <div>
                <span className="badge-val">MCI Verified</span>
                <span className="badge-sub">Reg. UP-68421</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
