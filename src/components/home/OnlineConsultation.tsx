import React from 'react';
import { Video } from 'lucide-react';
import type { Doctor } from '../../types/database';
import './OnlineConsultation.css';

interface OnlineConsultationProps {
  doctor?: Doctor | null;
}

export const OnlineConsultation: React.FC<OnlineConsultationProps> = ({ doctor }) => {
  const doctorName = doctor?.full_name || 'Dr. Anmol Pandey';

  return (
    <section className="online-consultation-section">
      <div className="teaser-card">
        <div className="teaser-badge">Coming Soon</div>
        <div className="teaser-icon">
          <Video size={36} />
        </div>
        <h3 className="teaser-title">Online Video Consultation</h3>
        <p className="teaser-text">
          Soon you'll be able to consult with {doctorName} from the comfort of your home.
        </p>
      </div>
    </section>
  );
};

export default OnlineConsultation;
