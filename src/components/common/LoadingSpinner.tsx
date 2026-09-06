import React from 'react';
import styles from './LoadingSpinner.module.css';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'var(--color-medical-blue, #0056b3)',
  className = '',
}) => {
  return (
    <div
      className={`${styles.spinner} ${styles[`size-${size}`]} ${className}`}
      style={{ borderTopColor: color, borderLeftColor: color }}
      role="status"
      aria-label="Loading"
    />
  );
};

export const FullPageLoader: React.FC<LoadingSpinnerProps> = (props) => {
  return (
    <div className={styles.fullPage}>
      <LoadingSpinner {...props} />
    </div>
  );
};
