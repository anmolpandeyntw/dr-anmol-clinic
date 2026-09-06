import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Building2, CalendarPlus, BookOpen, Image as ImageIcon } from 'lucide-react';
import styles from './MobileNav.module.css';

export interface MobileNavProps {
  phone?: string;
}

export const MobileNav: React.FC<MobileNavProps> = () => {
  return (
    <nav className={styles.mobileNav}>
      <div className={styles.container}>
        <NavLink
          to="/"
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
          end
        >
          {({ isActive }) => (
            <>
              <Home className={`${styles.icon} ${isActive ? styles.iconActive : ''}`} />
              <span className={styles.label}>Home</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/clinics"
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
        >
          {({ isActive }) => (
            <>
              <Building2 className={`${styles.icon} ${isActive ? styles.iconActive : ''}`} />
              <span className={styles.label}>Clinics</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/book"
          className={({ isActive }) => `${styles.tab} ${styles.tabHighlight} ${isActive ? styles.active : ''}`}
        >
          {({ isActive }) => (
            <>
              <CalendarPlus className={`${styles.icon} ${styles.iconHighlight} ${isActive ? styles.iconActive : ''}`} />
              <span className={styles.label}>Book</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/research"
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
        >
          {({ isActive }) => (
            <>
              <BookOpen className={`${styles.icon} ${isActive ? styles.iconActive : ''}`} />
              <span className={styles.label}>Research</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/gallery"
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
        >
          {({ isActive }) => (
            <>
              <ImageIcon className={`${styles.icon} ${isActive ? styles.iconActive : ''}`} />
              <span className={styles.label}>Honors</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
};
