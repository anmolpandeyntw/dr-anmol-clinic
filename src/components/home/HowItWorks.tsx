import React from 'react';
import { Building2, Calendar, UserCheck, Ticket, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';
import type { Doctor } from '../../types/database';
import './HowItWorks.css';

interface HowItWorksProps {
  doctor?: Doctor | null;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ doctor }) => {
  const doctorName = doctor?.full_name || 'Dr. Anmol Pandey';

  const steps = [
    {
      number: '01',
      title: 'Choose Clinic',
      desc: 'Select your preferred clinic location in Lucknow (Gomti Nagar / Alambagh).',
      icon: <Building2 size={22} />,
      badge: 'Step 1',
      themeClass: 'step-theme--blue'
    },
    {
      number: '02',
      title: 'Pick Available Date',
      desc: 'Check live schedule and select your convenient consultation date.',
      icon: <Calendar size={22} />,
      badge: 'Step 2',
      themeClass: 'step-theme--teal'
    },
    {
      number: '03',
      title: 'Patient Details',
      desc: 'Fill in basic details (Name, 10-digit Mobile Number & Age).',
      icon: <UserCheck size={22} />,
      badge: 'Step 3',
      themeClass: 'step-theme--indigo'
    },
    {
      number: '04',
      title: 'Get Instant Token',
      desc: 'Receive your official token number instantly on screen and WhatsApp.',
      icon: <Ticket size={22} />,
      badge: 'Step 4',
      themeClass: 'step-theme--emerald'
    },
  ];

  return (
    <section className="how-it-works-section">
      <div className="container">
        
        {/* Clean Header */}
        <div className="how-header">
          <span className="how-eyebrow">QUICK 4-STEP PROCESS</span>
          <h2 className="section-title">How Appointment Booking Works</h2>
          <p className="section-subtitle">
            Secure your OPD consultation token in under 60 seconds — zero registration required.
          </p>
        </div>

        {/* 4 Step Cards Grid */}
        <div className="steps-cards-grid">
          {steps.map((step, idx) => (
            <div key={step.number} className={`interactive-step-card ${step.themeClass}`}>
              <div className="step-card-top">
                <div className="step-icon-box">
                  {step.icon}
                </div>
                <span className="step-num-watermark">{step.number}</span>
              </div>

              <div className="step-card-content">
                <span className="step-mini-tag">{step.badge}</span>
                <h3 className="step-card-title">{step.title}</h3>
                <p className="step-card-desc">{step.desc}</p>
              </div>

              {idx < steps.length - 1 && (
                <div className="step-arrow-connector">
                  <ArrowRight size={16} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="how-it-works-cta-box">
          <div className="cta-text-side">
            <h3>Ready to Consult {doctorName}?</h3>
            <p>Select your clinic location and secure your consultation token today</p>
          </div>
          <Button href="/book" variant="primary" size="lg" icon={<Ticket size={18} />}>
            Book Token Now
          </Button>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
