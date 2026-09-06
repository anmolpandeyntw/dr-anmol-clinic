import React from 'react';
import type { Doctor } from '../../types/database';
import { GraduationCap, Calendar } from 'lucide-react';
import { Card } from '../common/Card';
import './DoctorCredentials.css';

interface DoctorCredentialsProps {
  doctor: Doctor | null;
}

export const DoctorCredentials: React.FC<DoctorCredentialsProps> = ({ doctor }) => {
  if (!doctor || !doctor.qualifications || doctor.qualifications.length === 0) return null;

  return (
    <section className="credentials-section">
      <div className="container">
        <div className="credentials-grid">
          {doctor.qualifications.map((qual, index) => (
            <Card key={index} className="credential-card">
              <div className="credential-card-top">
                <div className="credential-icon-box">
                  <GraduationCap size={22} />
                </div>
                <span className="credential-year-pill">
                  <Calendar size={12} /> {qual.year}
                </span>
              </div>
              <div className="credential-info">
                <h3 className="credential-degree">{qual.degree}</h3>
                <p className="credential-field">{qual.field}</p>
                <p className="credential-institution">{qual.institution}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DoctorCredentials;
