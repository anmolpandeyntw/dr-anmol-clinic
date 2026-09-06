import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Clock, Info, ShieldAlert } from 'lucide-react';
import type { Schedule, BlockedDate } from '../../types/database';
import { Button } from '../common/Button';
import styles from './DatePicker.module.css';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DatePickerProps {
  clinicId?: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  schedules: Schedule[];
  blockedDates: BlockedDate[];
  onContinue?: () => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ 
  clinicId, selectedDate, onSelectDate, schedules, blockedDates, onContinue 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Allow advance booking up to 90 days (3 full months)
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 90);

  const prevMonth = () => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (prev >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(prev);
    }
  };

  const nextMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (next <= new Date(maxDate.getFullYear(), maxDate.getMonth() + 3, 1)) {
      setCurrentMonth(next);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Helper to check blocked date status & reason
  const getBlockedInfo = (dateStr: string) => {
    return blockedDates.find(b => 
      b.date === dateStr && (
        !b.clinic_id || 
        b.clinic_id === 'ALL' || 
        b.clinic_id === clinicId ||
        b.clinic_id?.toLowerCase() === clinicId?.toLowerCase()
      )
    );
  };

  // Helper to check schedule for day of week
  const getScheduleForDay = (dayNum: number) => {
    return schedules.find(s => s.day_of_week === dayNum && s.is_active);
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyDay}></div>);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateString = [
        year,
        String(month + 1).padStart(2, '0'),
        String(i).padStart(2, '0')
      ].join('-');
      
      const dayOfWeekNumber = date.getDay();
      
      const isPast = date < today;
      const isFuture = date > maxDate;
      const blockedObj = getBlockedInfo(dateString);
      const isBlocked = Boolean(blockedObj);
      const scheduleObj = getScheduleForDay(dayOfWeekNumber);
      
      // Every day (Sun-Sat) is open by default unless explicitly blocked or deactivated
      const hasSchedule = scheduleObj ? scheduleObj.is_active : true;
      const isSelected = dateString === selectedDate;
      const isToday = date.getTime() === today.getTime();
      
      let dayClass = styles.day;
      if (isPast || isFuture || !hasSchedule) dayClass += ` ${styles.disabled}`;
      if (isPast || isFuture) dayClass += ` ${styles.past}`;
      if (isBlocked) dayClass += ` ${styles.blocked}`;
      if (isSelected) dayClass += ` ${styles.selected}`;
      if (isToday) dayClass += ` ${styles.today}`;

      days.push(
        <div 
          key={dateString} 
          className={dayClass}
          onClick={() => {
            if (!isPast && !isFuture) {
              onSelectDate(dateString);
            }
          }}
          title={
            isBlocked ? `Doctor on Leave: ${blockedObj?.reason || 'Leave'}` :
            isPast ? 'Past date' : `Available OPD Day`
          }
        >
          <span>{i}</span>
          {isBlocked && <span className={styles.blockedDot} title="Doctor Leave"></span>}
        </div>
      );
    }
    
    return days;
  };

  const monthYearString = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Currently selected date details
  const selectedDateObj = selectedDate ? new Date(selectedDate) : null;
  const selectedDateStr = selectedDate;
  const selectedBlockedObj = selectedDateStr ? getBlockedInfo(selectedDateStr) : null;
  const selectedDayOfWeek = selectedDateObj ? selectedDateObj.getDay() : -1;
  const selectedScheduleObj = selectedDateObj ? getScheduleForDay(selectedDayOfWeek) : null;
  const isSelectedDayActive = selectedScheduleObj ? selectedScheduleObj.is_active : true;

  return (
    <div className={styles.container}>
      <div className={styles.headerTitleRow}>
        <CalendarIcon size={20} className={styles.titleIcon} />
        <h2 className={styles.title}>Pick a Date for Consultation</h2>
      </div>
      
      <div className={styles.calendar}>
        <div className={styles.header}>
          <button className={styles.navButton} onClick={prevMonth} type="button">
            <ChevronLeft size={22} />
          </button>
          <div className={styles.monthYear}>{monthYearString}</div>
          <button className={styles.navButton} onClick={nextMonth} type="button">
            <ChevronRight size={22} />
          </button>
        </div>
        
        <div className={styles.grid}>
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className={styles.dayOfWeek}>{day}</div>
          ))}
          {renderCalendar()}
        </div>

        {/* Legend */}
        <div className={styles.legendRow}>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotAvailable}`}></span> Available
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotBlocked}`}></span> Doctor Leave / Off
          </span>
        </div>
      </div>

      {/* Selected Date Status & Doctor Availability Card */}
      {selectedDate && selectedDateObj && (
        <div className={styles.availabilityDetailCard}>
          <div className={styles.detailHeaderRow}>
            <div className={styles.detailDateText}>
              {selectedDateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>

            {selectedBlockedObj ? (
              <span className={`${styles.statusPill} ${styles.statusPillBlocked}`}>
                <ShieldAlert size={14} /> Doctor on Leave
              </span>
            ) : (
              <span className={`${styles.statusPill} ${styles.statusPillAvailable}`}>
                <CheckCircle2 size={14} /> Doctor Available
              </span>
            )}
          </div>

          <div className={styles.detailBody}>
            {selectedBlockedObj ? (
              <div className={styles.leaveNotice}>
                <Info size={16} className={styles.noticeIcon} />
                <span>
                  <strong>Doctor Absence / Holiday:</strong> {selectedBlockedObj.reason || 'Doctor is on scheduled leave/vacation on this date.'}
                  <br />
                  <small style={{ display: 'block', marginTop: '4px', color: '#B91C1C' }}>
                    * Online token booking is closed for this date. Please select an available blue date to proceed.
                  </small>
                </span>
              </div>
            ) : (
              <div className={styles.scheduleNotice}>
                <Clock size={16} className={styles.noticeIcon} />
                <span>
                  <strong>OPD Consultation Day:</strong> Doctor is available for consultations.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className={styles.footer}>
        <Button 
          variant="primary" 
          onClick={onContinue} 
          disabled={!selectedDate || Boolean(selectedBlockedObj) || !isSelectedDayActive}
          fullWidth
          size="lg"
        >
          {selectedBlockedObj 
            ? `⛔ Doctor Unavailable on ${selectedDateObj?.getDate()} ${selectedDateObj?.toLocaleString('default', { month: 'short' })}` 
            : 'Confirm Date & Proceed'}
        </Button>
      </div>
    </div>
  );
};

export default DatePicker;
