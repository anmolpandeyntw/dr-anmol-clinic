import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Phone, Mail, MapPin, Award } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import styles from './Footer.module.css';

export interface FooterProps {
  doctorName?: string;
}

export const Footer: React.FC<FooterProps> = ({ doctorName }) => {
  const name = doctorName || 'Dr. Anmol Pandey';
  const year = new Date().getFullYear();

  const [contactData, setContactData] = useState({
    main_phone: '7317286787',
    main_email: 'contact@dranmolpandey.com'
  });

  const loadFooterSettings = () => {
    const saved = localStorage.getItem('saved_site_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setContactData(prev => ({
          ...prev,
          main_phone: parsed.main_phone || prev.main_phone,
          main_email: parsed.main_email || prev.main_email
        }));
      } catch {}
    }

    if (isSupabaseConfigured) {
      supabase.from('site_settings').select('main_phone, main_email').limit(1).then(({ data }) => {
        if (data && data.length > 0) {
          setContactData(prev => ({
            ...prev,
            main_phone: data[0].main_phone || prev.main_phone,
            main_email: data[0].main_email || prev.main_email
          }));
        }
      });
    }
  };

  useEffect(() => {
    loadFooterSettings();

    const handleUpdate = () => {
      loadFooterSettings();
    };

    window.addEventListener('site_settings_updated', handleUpdate);
    return () => window.removeEventListener('site_settings_updated', handleUpdate);
  }, []);

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Column 1: Doctor Overview */}
          <div className={styles.col}>
            <div className={styles.brandTitle}>
              <ShieldCheck size={22} className={styles.brandIcon} />
              <h3>{name}</h3>
            </div>
            <p className={styles.subtitle}>Senior Consultant – Nephrology & Renal Transplant Medicine</p>
            <p className={styles.tagline}>
              Providing compassionate, evidence-based kidney care, hemodialysis, and transplant medicine with 13+ years of clinical excellence in Lucknow.
            </p>
            <div className={styles.mciSeal}>
              <Award size={16} /> MCI & UP Medical Council Registered (Reg. UP-68421)
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div className={styles.col}>
            <h4 className={styles.heading}>Quick Navigation</h4>
            <nav className={styles.nav}>
              <Link to="/" className={styles.link}>Home Page</Link>
              <Link to="/doctor" className={styles.link}>About Doctor & Research</Link>
              <Link to="/clinics" className={styles.link}>Clinics Directory</Link>
              <Link to="/gallery" className={styles.link}>Honors & Media</Link>
              <Link to="/book" className={styles.link}>Book Appointment Token</Link>
            </nav>
          </div>

          {/* Column 3: Contact */}
          <div className={styles.col}>
            <h4 className={styles.heading}>Clinic Helpline & Location</h4>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <Phone size={16} className={styles.contactIcon} />
                <div className={styles.contactContent}>
                  <span className={styles.contactLabel}>Helpline: </span>
                  <a href={`tel:${contactData.main_phone}`} className={styles.contactValue}>
                    {contactData.main_phone}
                  </a>
                </div>
              </div>

              <div className={styles.contactItem}>
                <Mail size={16} className={styles.contactIcon} />
                <div className={styles.contactContent}>
                  <span className={styles.contactLabel}>Email: </span>
                  <a href={`mailto:${contactData.main_email}`} className={styles.contactValue}>
                    {contactData.main_email}
                  </a>
                </div>
              </div>

              <div className={styles.contactItem}>
                <MapPin size={16} className={styles.contactIcon} />
                <div className={styles.contactContent}>
                  <span className={styles.contactLabel}>Primary OPD: </span>
                  <span className={styles.contactValueText}>
                    Vibhuti Khand, Gomtinagar, Lucknow
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 4: Realistic Award & Accreditation Logos */}
          <div className={styles.col}>
            <h4 className={styles.heading}>Honors & Accreditations</h4>
            <div className={styles.awardsBadgeContainer}>
              <div className={`${styles.awardBadgeCard} ${styles.badgeGold}`}>
                <div className={styles.badgeImgWrapper}>
                  <img src="/images/gold_medal_badge.jpg" alt="DNB Nephrology Gold Medal" className={styles.badgeImg} />
                </div>
                <div>
                  <span className={styles.badgeTag}>GOLD MEDALIST</span>
                  <span className={styles.badgeTitle}>DNB Nephrology & Transplant</span>
                </div>
              </div>

              <div className={`${styles.awardBadgeCard} ${styles.badgeBlue}`}>
                <div className={styles.badgeImgWrapper}>
                  <img src="/images/isn_award_badge.jpg" alt="ISN Research Honor" className={styles.badgeImg} />
                </div>
                <div>
                  <span className={styles.badgeTag}>ISN RESEARCH HONOR</span>
                  <span className={styles.badgeTitle}>Indian Society of Nephrology</span>
                </div>
              </div>

              <div className={`${styles.awardBadgeCard} ${styles.badgeGreen}`}>
                <div className={styles.badgeImgWrapper}>
                  <img src="/images/nabh_accredited_badge.jpg" alt="NABH Certified" className={styles.badgeImg} />
                </div>
                <div>
                  <span className={styles.badgeTag}>NABH STANDARDS</span>
                  <span className={styles.badgeTitle}>Quality Certified OPD Care</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            &copy; {year} {name}. All rights reserved. Registered Medical Practice.
          </p>
          <p className={styles.disclaimer}>
            Medical Disclaimer: Information on this portal is provided for informational and booking purposes only. It is not a substitute for in-person emergency medical care. In case of emergency, visit your nearest hospital casualty desk.
          </p>
        </div>
      </div>
    </footer>
  );
};
