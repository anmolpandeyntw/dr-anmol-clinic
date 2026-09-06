import React from 'react';
import type { Doctor } from '../../types/database';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { ShieldCheck, Star, Award, Users, Stethoscope, Building2 } from 'lucide-react';
import './TrustStrip.css';

interface TrustStripProps {
  doctor: Doctor | null;
  clinicCount: number;
}

export const TrustStrip: React.FC<TrustStripProps> = ({ doctor, clinicCount }) => {
  const expYears = doctor?.years_of_experience || 13;

  return (
    <section className="trust-strip-section">
      <div className="container">
        {/* Main Trust Metrics Grid */}
        <div className="trust-metrics-card">
          <div className="trust-stat-item">
            <div className="trust-icon-wrapper trust-icon--exp">
              <Award size={24} />
            </div>
            <div className="trust-text">
              <div className="trust-number">
                <AnimatedCounter end={expYears} suffix="+" />
              </div>
              <div className="trust-label">Years Clinical Experience</div>
            </div>
          </div>

          <div className="trust-divider"></div>

          <div className="trust-stat-item">
            <div className="trust-icon-wrapper trust-icon--clinic">
              <Building2 size={24} />
            </div>
            <div className="trust-text">
              <div className="trust-number">
                <AnimatedCounter end={clinicCount > 0 ? clinicCount : 2} suffix=" Locations" />
              </div>
              <div className="trust-label">Private OPD Clinics</div>
            </div>
          </div>

          <div className="trust-divider"></div>

          <div className="trust-stat-item">
            <div className="trust-icon-wrapper trust-icon--spec">
              <Stethoscope size={24} />
            </div>
            <div className="trust-text">
              <div className="trust-number">
                <AnimatedCounter end={13} suffix="+" />
              </div>
              <div className="trust-label">Medical Super Specialties</div>
            </div>
          </div>

          <div className="trust-divider"></div>

          <div className="trust-stat-item">
            <div className="trust-icon-wrapper trust-icon--patients">
              <Users size={24} />
            </div>
            <div className="trust-text">
              <div className="trust-number">
                <AnimatedCounter end={5000} suffix="+" />
              </div>
              <div className="trust-label">Satisfied Patients Treated</div>
            </div>
          </div>
        </div>

        {/* Verification & Review Badges Bar */}
        <div className="trust-verification-bar">
          <div className="trust-badge-item">
            <ShieldCheck size={18} className="badge-icon badge-icon--green" />
            <span>MCI & UP Medical Council Verified Specialist</span>
          </div>

          <div className="trust-badge-item">
            <div className="stars-row">
              <Star size={14} className="star-fill" />
              <Star size={14} className="star-fill" />
              <Star size={14} className="star-fill" />
              <Star size={14} className="star-fill" />
              <Star size={14} className="star-fill" />
            </div>
            <span className="rating-text"><strong>4.9 / 5.0</strong> (500+ Verified Patient Reviews)</span>
          </div>

          <div className="trust-badge-item">
            <span className="nabh-tag">NABH Quality Standards</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
