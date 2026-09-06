import React from 'react';
import { Link } from 'react-router-dom';
import type { Doctor } from '../../types/database';
import { Award, CheckCircle2, UserCheck } from 'lucide-react';
import './AboutDoctor.css';

interface AboutDoctorProps {
  doctor: Doctor | null;
}

export const AboutDoctor: React.FC<AboutDoctorProps> = ({ doctor }) => {
  if (!doctor) return null;

  const photo = doctor.photo_url || '/images/doctor_portrait.jpg';

  return (
    <section className="about-section">
      <div className="container about-container">
        <div className="about-photo-wrapper">
          <img 
            src={photo} 
            alt={doctor.full_name} 
            className="about-doctor-img"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/doctor_portrait.jpg';
            }}
          />
          <div className="about-exp-badge">
            <Award size={20} />
            <div>
              <span className="exp-num">{doctor.years_of_experience}+ Years</span>
              <span className="exp-label">Clinical Excellence</span>
            </div>
          </div>
        </div>

        <div className="about-content">
          <span className="about-section-badge">Meet Your Specialist</span>
          <h2 className="about-title">About {doctor.full_name}</h2>
          <p className="about-bio">{doctor.bio || 'Senior Consultant in Nephrology & Renal Transplant Medicine committed to providing comprehensive, patient-centric kidney care.'}</p>
          
          <ul className="about-highlights">
            <li><CheckCircle2 size={18} className="highlight-icon" /> <span><strong>Qualifications:</strong> {doctor.title}</span></li>
            <li><CheckCircle2 size={18} className="highlight-icon" /> <span><strong>Experience:</strong> {doctor.years_of_experience}+ Years in Managing Critical Nephrology Cases</span></li>
            {doctor.experience && doctor.experience.length > 0 && (
              <li><CheckCircle2 size={18} className="highlight-icon" /> <span><strong>Current Role:</strong> {doctor.experience[0].role} ({doctor.experience[0].institution})</span></li>
            )}
          </ul>
          
          <Link to="/doctor" className="view-profile-btn">
            <UserCheck size={18} /> View Complete Academic Profile & Publications &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AboutDoctor;
