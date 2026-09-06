import React from 'react';
import styles from './BookingProgress.module.css';

interface BookingProgressProps {
  currentStep: number; // Internal step 1 to 7
  totalSteps?: number;
}

const displaySteps = [
  'Clinic & Date',
  'Patient Details',
  'Payment & Review',
  'Token Confirmed'
];

export const BookingProgress: React.FC<BookingProgressProps> = ({ currentStep }) => {
  // Map internal 7 steps to 4 display steps
  let mappedStep = 1;
  if (currentStep >= 1 && currentStep <= 3) mappedStep = 1;
  else if (currentStep === 4) mappedStep = 2;
  else if (currentStep === 5 || currentStep === 6) mappedStep = 3;
  else if (currentStep === 7) mappedStep = 4;

  const percentage = Math.round((mappedStep / 4) * 100);

  return (
    <div className={styles.container}>
      <div className={styles.mobileProgress}>
        <div className={styles.progressBarBg}>
          <div className={styles.progressBarFill} style={{ width: `${percentage}%` }}></div>
        </div>
        <div className={styles.currentStepLabel}>
          Step {mappedStep} of 4: {displaySteps[mappedStep - 1]}
        </div>
      </div>
      
      <div className={styles.desktopProgress}>
        {displaySteps.map((stepLabel, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < mappedStep;
          const isCurrent = stepNumber === mappedStep;
          
          return (
            <div 
              key={stepLabel} 
              className={`${styles.stepItem} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''}`}
            >
              <div className={styles.stepCircle}>
                {isCompleted ? '✓' : stepNumber}
              </div>
              <span className={styles.stepName}>{stepLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
