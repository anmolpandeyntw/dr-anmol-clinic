import React from 'react';
import type { Specialization } from '../../types/database';
import { Activity, Stethoscope, ShieldCheck } from 'lucide-react';
import './SpecializationsGrid.css';

interface SpecializationsGridProps {
  specializations: Specialization[];
}

export const SpecializationsGrid: React.FC<SpecializationsGridProps> = ({ specializations }) => {
  if (!specializations || specializations.length === 0) return null;

  return (
    <section className="specializations-section">
      <div className="container">
        <div className="specializations-header">
          <span className="section-badge">
            <Stethoscope size={14} /> Clinical Expertise
          </span>
          <h2 className="section-title">Nephrology Specializations</h2>
          <p className="section-subtitle">
            Comprehensive kidney care, transplant medicine, and advanced dialysis therapies
          </p>
        </div>

        <div className="specializations-grid">
          {specializations.map((spec) => (
            <div key={spec.id} className="specialization-card">
              <div className="spec-icon-wrapper">
                <Activity size={22} className="spec-icon" />
              </div>
              <div className="spec-content">
                <h3 className="spec-name">{spec.name}</h3>
                {spec.description ? (
                  <p className="spec-desc">{spec.description}</p>
                ) : (
                  <span className="spec-tag">
                    <ShieldCheck size={12} /> Specialized Care
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpecializationsGrid;
