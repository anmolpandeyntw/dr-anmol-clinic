import os
import sys

project_root = r"C:\Users\anmol\.gemini\antigravity\scratch\dr-amit-clinic"
components_dir = os.path.join(project_root, "src", "components", "home")

os.makedirs(components_dir, exist_ok=True)

files = {
    "HeroSection.tsx": """import React from 'react';
import { Link } from 'react-router-dom';
import { Doctor } from '../../types/database';
import Button from '../common/Button';
import './HeroSection.css';

interface HeroSectionProps {
  doctor: Doctor | null;
}

const HeroSection: React.FC<HeroSectionProps> = ({ doctor }) => {
  if (!doctor) {
    return <div className="hero-section hero-skeleton"></div>;
  }

  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">{doctor.full_name}</h1>
        <h2 className="hero-subtitle">{doctor.title}</h2>
        {doctor.subtitle && <p className="hero-description">{doctor.subtitle}</p>}
        <div className="hero-actions">
          <Link to="/book" tabIndex={-1}>
            <Button variant="primary">Book Appointment</Button>
          </Link>
          <Link to="/doctor" tabIndex={-1}>
            <Button variant="outline">View Doctor Profile</Button>
          </Link>
        </div>
      </div>
      <div className="hero-wave"></div>
    </section>
  );
};

export default HeroSection;
""",
    "HeroSection.css": """.hero-section {
  background: linear-gradient(135deg, var(--color-primary), var(--color-medical-blue));
  color: var(--color-white);
  padding: var(--space-8) var(--space-4);
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.hero-skeleton {
  background: var(--color-bg-alt);
  animation: pulse 1.5s infinite ease-in-out;
  min-height: 70vh;
}

.hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  text-align: center;
  align-items: center;
}

.hero-title {
  font-size: 2.5rem;
  margin: 0;
  font-weight: 700;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--color-accent);
  margin: 0;
}

.hero-description {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  max-width: 600px;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-4);
  width: 100%;
}

.hero-actions a {
  text-decoration: none;
  width: 100%;
}

.hero-actions button {
  width: 100%;
  min-height: 48px;
}

.hero-wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50px;
  background: linear-gradient(to top, var(--color-bg), transparent);
}

@media (min-width: 768px) {
  .hero-section {
    min-height: 60vh;
    padding: var(--space-12) var(--space-8);
  }
  
  .hero-content {
    text-align: left;
    align-items: flex-start;
  }
  
  .hero-actions {
    flex-direction: row;
    width: auto;
  }
  
  .hero-actions a {
    width: auto;
  }
  
  .hero-actions button {
    width: auto;
  }
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}
""",
    "DoctorCredentials.tsx": """import React from 'react';
import { Doctor } from '../../types/database';
import { GraduationCap } from 'lucide-react';
import Card from '../common/Card';
import './DoctorCredentials.css';

interface DoctorCredentialsProps {
  doctor: Doctor | null;
}

const DoctorCredentials: React.FC<DoctorCredentialsProps> = ({ doctor }) => {
  if (!doctor || !doctor.qualifications || doctor.qualifications.length === 0) return null;

  return (
    <section className="credentials-section">
      <div className="credentials-scroll">
        {doctor.qualifications.map((qual, index) => (
          <Card key={index} className="credential-card">
            <div className="credential-icon">
              <GraduationCap size={24} />
            </div>
            <div className="credential-info">
              <h3 className="credential-degree">{qual.degree}</h3>
              <p className="credential-institution">{qual.institution}</p>
              <span className="credential-year">{qual.year}</span>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default DoctorCredentials;
""",
    "DoctorCredentials.css": """.credentials-section {
  padding: var(--space-6) var(--space-4);
  background-color: var(--color-bg);
}

.credentials-scroll {
  display: flex;
  overflow-x: auto;
  gap: var(--space-4);
  padding-bottom: var(--space-4);
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.credentials-scroll::-webkit-scrollbar {
  display: none;
}

.credential-card {
  flex: 0 0 280px;
  scroll-snap-align: start;
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-4);
  border-left: 4px solid var(--color-accent);
}

.credential-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.credential-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.credential-degree {
  margin: 0;
  font-size: 1.125rem;
  color: var(--color-text-primary);
}

.credential-institution {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.credential-year {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-weight: 600;
}

@media (min-width: 1024px) {
  .credentials-scroll {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    overflow-x: visible;
  }
  .credential-card {
    flex: auto;
  }
}
""",
    "TrustStrip.tsx": """import React from 'react';
import { Doctor } from '../../types/database';
import Card from '../common/Card';
import './TrustStrip.css';

interface TrustStripProps {
  doctor: Doctor | null;
  clinicCount: number;
}

const TrustStrip: React.FC<TrustStripProps> = ({ doctor, clinicCount }) => {
  return (
    <section className="trust-strip-section">
      <Card className="trust-strip-card">
        <div className="trust-stat">
          <div className="trust-number">{doctor?.years_of_experience || 0}+</div>
          <div className="trust-label">Years Experience</div>
        </div>
        <div className="trust-stat">
          <div className="trust-number">{clinicCount}</div>
          <div className="trust-label">Clinics</div>
        </div>
        <div className="trust-stat">
          <div className="trust-number">{doctor?.specializations?.length || '5+'}</div>
          <div className="trust-label">Specialties</div>
        </div>
        <div className="trust-stat">
          <div className="trust-number">5000+</div>
          <div className="trust-label">Patients Treated</div>
        </div>
      </Card>
    </section>
  );
};

export default TrustStrip;
""",
    "TrustStrip.css": """.trust-strip-section {
  padding: var(--space-4);
  margin-top: calc(-1 * var(--space-8));
  position: relative;
  z-index: 10;
}

.trust-strip-card {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-6);
  padding: var(--space-6);
  text-align: center;
  background: var(--color-white);
}

.trust-stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.trust-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-medical-blue);
}

.trust-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

@media (min-width: 768px) {
  .trust-strip-card {
    grid-template-columns: repeat(4, 1fr);
  }
}
""",
    "TodayAvailability.tsx": """import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clinic, AvailableSlots } from '../../types/database';
import { supabase } from '../../lib/supabase';
import Card from '../common/Card';
import Button from '../common/Button';
import './TodayAvailability.css';

interface TodayAvailabilityProps {
  clinics: Clinic[];
}

const TodayAvailability: React.FC<TodayAvailabilityProps> = ({ clinics }) => {
  const [availability, setAvailability] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const newAvailability: Record<string, number> = {};
      
      for (const clinic of clinics) {
        try {
          const { data, error } = await supabase.rpc('get_available_slots', {
            p_clinic_id: clinic.id,
            p_date: today
          });
          
          if (!error && data) {
            newAvailability[clinic.id] = data.length;
          }
        } catch (err) {
          console.error('Error fetching availability for clinic', clinic.id, err);
        }
      }
      
      setAvailability(newAvailability);
      setLoading(false);
    };

    if (clinics.length > 0) {
      fetchAvailability();
    } else {
      setLoading(false);
    }
  }, [clinics]);

  if (loading || clinics.length === 0) return null;

  return (
    <section className="availability-section">
      <h2 className="section-title">Today's Availability</h2>
      <div className="availability-grid">
        {clinics.map(clinic => {
          const slots = availability[clinic.id] || 0;
          const isAvailable = slots > 0;
          
          return (
            <Card key={clinic.id} className="availability-card">
              <h3 className="availability-clinic-name">{clinic.name}</h3>
              <p className="availability-date">{new Date().toLocaleDateString()}</p>
              
              <div className="availability-status">
                {isAvailable ? (
                  <span className="badge badge-success">{slots} slots available</span>
                ) : (
                  <span className="badge badge-muted">Not Available Today</span>
                )}
              </div>
              
              {isAvailable && (
                <Link to={`/book?clinicId=${clinic.id}`} tabIndex={-1}>
                  <Button variant="primary" className="book-now-btn">Book Now</Button>
                </Link>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default TodayAvailability;
""",
    "TodayAvailability.css": """.availability-section {
  padding: var(--space-8) var(--space-4);
  background-color: var(--color-bg);
}

.section-title {
  font-size: 1.5rem;
  margin-bottom: var(--space-6);
  color: var(--color-text-primary);
  text-align: center;
}

.availability-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.availability-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
}

.availability-clinic-name {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-primary);
}

.availability-date {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.availability-status {
  margin: var(--space-2) 0;
}

.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-success {
  background-color: #e6f4ea;
  color: #137333;
}

.badge-muted {
  background-color: #f1f3f4;
  color: #5f6368;
}

.book-now-btn {
  width: 100%;
  min-height: 48px;
}

@media (min-width: 768px) {
  .availability-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}
""",
    "ClinicsPreview.tsx": """import React from 'react';
import { Link } from 'react-router-dom';
import { Clinic } from '../../types/database';
import { MapPin, Clock, IndianRupee } from 'lucide-react';
import Card from '../common/Card';
import './ClinicsPreview.css';

interface ClinicsPreviewProps {
  clinics: Clinic[];
}

const ClinicsPreview: React.FC<ClinicsPreviewProps> = ({ clinics }) => {
  if (!clinics || clinics.length === 0) return null;

  return (
    <section className="clinics-preview-section">
      <h2 className="section-title">Our Clinics</h2>
      <div className="clinics-grid">
        {clinics.map(clinic => (
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
          View All Clinics &rarr;
        </Link>
      </div>
    </section>
  );
};

export default ClinicsPreview;
""",
    "ClinicsPreview.css": """.clinics-preview-section {
  padding: var(--space-8) var(--space-4);
  background-color: var(--color-bg-alt);
}

.clinics-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.clinic-preview-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.clinic-preview-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.clinic-name {
  margin: 0 0 var(--space-2) 0;
  font-size: 1.25rem;
  color: var(--color-primary);
}

.clinic-detail {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text-secondary);
}

.clinic-icon {
  color: var(--color-medical-blue);
  flex-shrink: 0;
}

.clinic-text {
  font-size: 0.875rem;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clinics-action {
  text-align: center;
}

.view-all-link {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  padding: var(--space-2) var(--space-4);
  display: inline-block;
  min-height: 48px;
  line-height: 32px;
}

@media (min-width: 1024px) {
  .clinics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
""",
    "SpecializationsGrid.tsx": """import React from 'react';
import { Activity, Stethoscope } from 'lucide-react';
import './SpecializationsGrid.css';

interface Specialization {
  id: string;
  name: string;
  description?: string;
}

interface SpecializationsGridProps {
  specializations: Specialization[];
}

const SpecializationsGrid: React.FC<SpecializationsGridProps> = ({ specializations }) => {
  if (!specializations || specializations.length === 0) return null;

  return (
    <section className="specializations-section">
      <h2 className="section-title">Specializations</h2>
      <div className="specializations-grid">
        {specializations.map((spec, index) => (
          <div key={spec.id || index} className="specialization-card">
            {index % 2 === 0 ? <Activity size={20} className="spec-icon" /> : <Stethoscope size={20} className="spec-icon" />}
            <span className="spec-name">{spec.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SpecializationsGrid;
""",
    "SpecializationsGrid.css": """.specializations-section {
  padding: var(--space-8) var(--space-4);
  background-color: var(--color-white);
}

.specializations-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.specialization-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: var(--color-bg-alt);
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: var(--radius-md);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.specialization-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.spec-icon {
  color: var(--color-accent);
}

.spec-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

@media (min-width: 768px) {
  .specializations-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .specializations-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
""",
    "AboutDoctor.tsx": """import React from 'react';
import { Link } from 'react-router-dom';
import { Doctor } from '../../types/database';
import './AboutDoctor.css';

interface AboutDoctorProps {
  doctor: Doctor | null;
}

const AboutDoctor: React.FC<AboutDoctorProps> = ({ doctor }) => {
  if (!doctor) return null;

  return (
    <section className="about-section">
      <div className="about-container">
        <div className="about-photo-wrapper">
          <div className="about-photo-placeholder"></div>
        </div>
        <div className="about-content">
          <h2 className="about-title">About {doctor.full_name}</h2>
          <p className="about-bio">{doctor.bio || 'Experienced medical professional committed to providing excellent patient care.'}</p>
          
          <ul className="about-highlights">
            <li><strong>Experience:</strong> {doctor.years_of_experience}+ Years</li>
            {doctor.experience && doctor.experience.length > 0 && (
              <li><strong>Current Position:</strong> {doctor.experience[0].position} at {doctor.experience[0].hospital}</li>
            )}
          </ul>
          
          <Link to="/doctor" className="view-profile-link">
            View Full Profile &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AboutDoctor;
""",
    "AboutDoctor.css": """.about-section {
  padding: var(--space-12) var(--space-4);
  background-color: var(--color-bg);
}

.about-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.about-photo-wrapper {
  width: 100%;
}

.about-photo-placeholder {
  width: 100%;
  aspect-ratio: 4/5;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--color-medical-blue), var(--color-accent));
  opacity: 0.8;
}

.about-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.about-title {
  font-size: 2rem;
  margin-top: 0;
  margin-bottom: var(--space-4);
  color: var(--color-primary);
}

.about-bio {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-6);
}

.about-highlights {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-6) 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.about-highlights li {
  font-size: 0.95rem;
  color: var(--color-text-primary);
}

.about-highlights strong {
  color: var(--color-primary);
}

.view-profile-link {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  min-height: 48px;
}

@media (min-width: 768px) {
  .about-container {
    flex-direction: row;
    align-items: stretch;
  }
  
  .about-photo-wrapper {
    flex: 1;
  }
  
  .about-content {
    flex: 1.5;
  }
}
""",
    "HowItWorks.tsx": """import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Calendar, UserPlus, Ticket } from 'lucide-react';
import Button from '../common/Button';
import './HowItWorks.css';

const steps = [
  { id: 1, title: 'Select Clinic', desc: 'Choose a convenient location', icon: Building2 },
  { id: 2, title: 'Pick a Date', desc: 'Find an available slot', icon: Calendar },
  { id: 3, title: 'Enter Details', desc: 'Provide basic information', icon: UserPlus },
  { id: 4, title: 'Get Token', desc: 'Receive your token number', icon: Ticket },
];

const HowItWorks: React.FC = () => {
  return (
    <section className="how-it-works-section">
      <h2 className="section-title">How It Works</h2>
      
      <div className="steps-container">
        {steps.map((step, idx) => (
          <div key={step.id} className="step-item">
            <div className="step-icon-wrapper">
              <div className="step-number">{step.id}</div>
              <step.icon size={28} className="step-icon" />
            </div>
            <div className="step-content">
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
            </div>
            {idx < steps.length - 1 && <div className="step-connector"></div>}
          </div>
        ))}
      </div>
      
      <div className="how-it-works-action">
        <Link to="/book" tabIndex={-1}>
          <Button variant="primary">Book Your Appointment</Button>
        </Link>
      </div>
    </section>
  );
};

export default HowItWorks;
""",
    "HowItWorks.css": """.how-it-works-section {
  padding: var(--space-12) var(--space-4);
  background-color: var(--color-white);
  text-align: center;
}

.steps-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  margin-top: var(--space-8);
  margin-bottom: var(--space-10);
  position: relative;
}

.step-item {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  position: relative;
  text-align: left;
}

.step-icon-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: var(--color-bg-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 2;
}

.step-icon {
  color: var(--color-primary);
}

.step-number {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 24px;
  height: 24px;
  background-color: var(--color-accent);
  color: var(--color-white);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
}

.step-content {
  flex: 1;
}

.step-title {
  margin: 0 0 var(--space-1) 0;
  font-size: 1.125rem;
  color: var(--color-text-primary);
}

.step-desc {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.step-connector {
  position: absolute;
  left: 31px;
  top: 64px;
  bottom: -32px;
  width: 2px;
  background-image: linear-gradient(to bottom, var(--color-medical-blue) 50%, transparent 50%);
  background-size: 2px 10px;
  z-index: 1;
}

.how-it-works-action button {
  min-height: 48px;
  padding: 0 var(--space-8);
}

@media (min-width: 768px) {
  .steps-container {
    flex-direction: row;
    justify-content: center;
    gap: var(--space-4);
  }
  
  .step-item {
    flex-direction: column;
    text-align: center;
    width: 200px;
  }
  
  .step-connector {
    left: 100px;
    top: 31px;
    width: calc(100% - 32px);
    height: 2px;
    background-image: linear-gradient(to right, var(--color-medical-blue) 50%, transparent 50%);
    background-size: 10px 2px;
  }
}
""",
    "OnlineConsultation.tsx": """import React from 'react';
import { Video } from 'lucide-react';
import './OnlineConsultation.css';

const OnlineConsultation: React.FC = () => {
  return (
    <section className="online-consultation-section">
      <div className="online-consultation-card">
        <span className="coming-soon-badge">Coming Soon</span>
        <div className="oc-icon-wrapper">
          <Video size={32} className="oc-icon" />
        </div>
        <h2 className="oc-title">Online Video Consultation</h2>
        <p className="oc-desc">
          Soon you'll be able to consult with our doctors from the comfort of your home.
        </p>
      </div>
    </section>
  );
};

export default OnlineConsultation;
""",
    "OnlineConsultation.css": """.online-consultation-section {
  padding: var(--space-8) var(--space-4);
  background-color: var(--color-bg);
}

.online-consultation-card {
  position: relative;
  background: linear-gradient(135deg, rgba(30, 61, 89, 0.05), rgba(255, 107, 107, 0.05));
  border: 1px solid rgba(30, 61, 89, 0.1);
  border-radius: var(--radius-lg);
  padding: var(--space-8) var(--space-6);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  overflow: hidden;
}

.coming-soon-badge {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  background-color: #f59e0b;
  color: white;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: bold;
}

.oc-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: rgba(30, 61, 89, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.oc-icon {
  color: var(--color-primary);
}

.oc-title {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-primary);
}

.oc-desc {
  margin: 0;
  color: var(--color-text-secondary);
  max-width: 400px;
}
""",
    "FAQ.tsx": """import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './FAQ.css';

const faqData = [
  { q: "How do I book an appointment?", a: "Select your preferred clinic, choose a date, enter your details, and confirm. You'll receive a token number." },
  { q: "Do I need to create an account?", a: "No. Simply provide your name and mobile number to book. No account or login required." },
  { q: "What are the consultation fees?", a: "Fees vary by clinic and are displayed during booking. Payment can be made online or at the clinic." },
  { q: "Can I cancel or reschedule?", a: "Please contact the clinic directly to cancel or reschedule your appointment." },
  { q: "What should I bring to my appointment?", a: "Please bring any previous medical reports, prescriptions, and a valid ID. Arrive 10 minutes before your scheduled time." },
  { q: "Is online consultation available?", a: "Online video consultation is coming soon. Stay tuned for updates." }
];

const FAQ: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggleFAQ = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="faq-section">
      <h2 className="section-title">Frequently Asked Questions</h2>
      <div className="faq-list">
        {faqData.map((item, idx) => (
          <div key={idx} className={`faq-item ${openIdx === idx ? 'open' : ''}`}>
            <button 
              className="faq-question" 
              onClick={() => toggleFAQ(idx)}
              aria-expanded={openIdx === idx}
            >
              <span>{item.q}</span>
              <ChevronDown className="faq-icon" size={20} />
            </button>
            <div className="faq-answer-wrapper">
              <div className="faq-answer">
                {item.a}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FAQ;
""",
    "FAQ.css": """.faq-section {
  padding: var(--space-12) var(--space-4);
  background-color: var(--color-white);
  max-width: 800px;
  margin: 0 auto;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-8);
}

.faq-item {
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.faq-question {
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: var(--space-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-primary);
  cursor: pointer;
  min-height: 48px;
}

.faq-icon {
  color: var(--color-text-secondary);
  transition: transform 0.3s ease;
}

.faq-item.open .faq-icon {
  transform: rotate(180deg);
}

.faq-answer-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease;
}

.faq-item.open .faq-answer-wrapper {
  grid-template-rows: 1fr;
}

.faq-answer {
  overflow: hidden;
  padding: 0 var(--space-4);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.faq-item.open .faq-answer {
  padding-bottom: var(--space-4);
}
""",
    "ContactSection.tsx": """import React from 'react';
import { Clinic } from '../../types/database';
import { MapPin, Phone, Clock } from 'lucide-react';
import Card from '../common/Card';
import './ContactSection.css';

interface ContactSectionProps {
  clinics: Clinic[];
}

const ContactSection: React.FC<ContactSectionProps> = ({ clinics }) => {
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
            
            {clinic.phone_number && (
              <div className="contact-detail">
                <Phone size={20} className="contact-icon" />
                <a href={`tel:${clinic.phone_number}`} className="contact-link">
                  {clinic.phone_number}
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
""",
    "ContactSection.css": """.contact-section {
  padding: var(--space-12) var(--space-4);
  background-color: var(--color-bg-alt);
}

.contact-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  margin-top: var(--space-8);
}

.contact-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
}

.contact-clinic-name {
  margin: 0 0 var(--space-2) 0;
  font-size: 1.25rem;
  color: var(--color-primary);
}

.contact-detail {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.contact-icon {
  color: var(--color-medical-blue);
  flex-shrink: 0;
  margin-top: 2px;
}

.contact-text, .contact-link {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.contact-link {
  text-decoration: none;
  min-height: 24px;
  display: inline-block;
}

.contact-link:hover {
  text-decoration: underline;
  color: var(--color-accent);
}

.map-btn {
  margin-top: var(--space-2);
  display: inline-block;
  text-align: center;
  padding: var(--space-2) var(--space-4);
  background-color: transparent;
  color: var(--color-accent);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  min-height: 48px;
  line-height: 32px;
}

.map-btn:hover {
  background-color: rgba(255, 107, 107, 0.05);
}

@media (min-width: 768px) {
  .contact-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}
"""
}

for filename, content in files.items():
    filepath = os.path.join(components_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created {filename}")
