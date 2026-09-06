import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Button } from './Button';
import { Phone, Ticket } from 'lucide-react';
import styles from './Header.module.css';

export interface HeaderProps {
  doctorName?: string;
}

export const Header: React.FC<HeaderProps> = ({ doctorName }) => {
  const name = doctorName || 'Dr. Anmol Pandey';

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.brand}>
          <div className={styles.brandBadge}>
            <img src="/images/clinic_logo.jpg" alt="Clinic Logo" className={styles.brandLogoImg} />
          </div>
          <div>
            <span className={styles.brandName}>{name}</span>
            <span className={styles.brandSub}>Senior Consultant Nephrologist</span>
          </div>
        </Link>

        <nav className={styles.nav}>
          <NavLink
            to="/"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
            end
          >
            Home
          </NavLink>
          <NavLink
            to="/doctor"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            About Doctor
          </NavLink>
          <NavLink
            to="/clinics"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            Clinics Directory
          </NavLink>
          <NavLink
            to="/gallery"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            Honors & Media
          </NavLink>
        </nav>

        <div className={styles.actions}>
          <a href="tel:7317286787" className={styles.helplineLink}>
            <Phone size={14} /> 7317286787
          </a>

          <Button href="/book" variant="primary" size="md" icon={<Ticket size={16} />}>
            Book Token
          </Button>
        </div>
      </div>
    </header>
  );
};
