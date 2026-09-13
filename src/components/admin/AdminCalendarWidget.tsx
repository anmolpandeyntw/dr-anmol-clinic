import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Building2, Users, X, Filter } from 'lucide-react';
import type { Clinic } from '../../types/database';
import type { AppointmentRow } from './AppointmentsTable';
import './AdminCalendarWidget.css';

interface AdminCalendarWidgetProps {
  rawAppointments: AppointmentRow[];
  clinics: Clinic[];
  selectedDateFilter: string;
  onSelectDate: (dateStr: string) => void;
  onClose?: () => void;
}

export const AdminCalendarWidget: React.FC<AdminCalendarWidgetProps> = ({
  rawAppointments,
  clinics,
  selectedDateFilter,
  onSelectDate,
  onClose
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter out hospital attachments - keep private clinics only
  const privateClinics = useMemo(() => {
    return clinics.filter(c => c.is_private_clinic !== false);
  }, [clinics]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  // First day of month & total days
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Compute date-wise total booking count map across ALL clinics
  const dateTotalsMap = useMemo(() => {
    const map: Record<string, number> = {};
    rawAppointments.forEach(apt => {
      if (apt.schedule_date) {
        map[apt.schedule_date] = (map[apt.schedule_date] || 0) + 1;
      }
    });
    return map;
  }, [rawAppointments]);

  // Compute breakdown for clicked date
  const selectedDateBreakdown = useMemo(() => {
    if (!selectedCalendarDate) return null;

    const dateApts = rawAppointments.filter(apt => apt.schedule_date === selectedCalendarDate);
    const breakdown: { clinicName: string; count: number }[] = [];

    privateClinics.forEach(clinic => {
      const targetNameLow = clinic.name.toLowerCase().trim();
      const count = dateApts.filter(apt => {
        if (apt.clinic_id === clinic.id) return true;
        if (apt.clinic_name) {
          const aptNameLow = apt.clinic_name.toLowerCase().trim();
          return aptNameLow === targetNameLow || aptNameLow.includes(targetNameLow) || targetNameLow.includes(aptNameLow);
        }
        return false;
      }).length;

      breakdown.push({
        clinicName: clinic.name,
        count
      });
    });

    const totalForDate = dateApts.length;

    return {
      dateStr: selectedCalendarDate,
      totalForDate,
      breakdown
    };
  }, [selectedCalendarDate, rawAppointments, privateClinics]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar grid array
  const calendarCells = useMemo(() => {
    const cells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];
    
    // Empty padding cells for previous month
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ dateStr: '', dayNum: 0, isCurrentMonth: false });
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;
      cells.push({ dateStr, dayNum: d, isCurrentMonth: true });
    }

    return cells;
  }, [year, month, firstDayOfWeek, daysInMonth]);

  const formatDateDisplay = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="admin-calendar-widget-card">
      <div className="calendar-card-header">
        <div className="calendar-header-title">
          <Calendar size={18} className="calendar-icon" />
          <span>Monthly Booking Calendar Overview</span>
        </div>
        
        {onClose && (
          <button type="button" className="calendar-close-btn" onClick={onClose} title="Close Calendar">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Month Navigation Row */}
      <div className="calendar-month-nav">
        <button type="button" className="nav-arrow-btn" onClick={handlePrevMonth}>
          <ChevronLeft size={18} />
        </button>
        <span className="month-name-heading">{monthName}</span>
        <button type="button" className="nav-arrow-btn" onClick={handleNextMonth}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday Labels Header */}
      <div className="calendar-weekdays-grid">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Day Cells Grid */}
      <div className="calendar-days-grid">
        {calendarCells.map((cell, idx) => {
          if (!cell.isCurrentMonth) {
            return <div key={idx} className="day-cell day-cell--empty" />;
          }

          const count = dateTotalsMap[cell.dateStr] || 0;
          const isToday = cell.dateStr === todayStr;
          const isSelectedFilter = selectedDateFilter === cell.dateStr;
          const isSelectedCalendar = selectedCalendarDate === cell.dateStr;

          let cellClass = 'day-cell';
          if (isToday) cellClass += ' day-cell--today';
          if (isSelectedFilter) cellClass += ' day-cell--filter-active';
          if (isSelectedCalendar) cellClass += ' day-cell--selected';

          return (
            <div
              key={cell.dateStr}
              className={cellClass}
              onClick={() => setSelectedCalendarDate(cell.dateStr)}
            >
              <span className="day-number">{cell.dayNum}</span>
              {count > 0 ? (
                <span className="day-count-badge" title={`${count} patients booked`}>
                  {count}
                </span>
              ) : (
                <span className="day-count-zero">-</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Small Popup Modal Card for Selected Date Clinic Breakdown */}
      {selectedDateBreakdown && (
        <div className="date-breakdown-card">
          <div className="breakdown-header">
            <div>
              <h4 className="breakdown-title">
                📅 {formatDateDisplay(selectedDateBreakdown.dateStr)}
              </h4>
              <span className="breakdown-total-badge">
                <Users size={12} /> Total: {selectedDateBreakdown.totalForDate} Patients
              </span>
            </div>
            <button
              type="button"
              className="breakdown-close"
              onClick={() => setSelectedCalendarDate(null)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="breakdown-list">
            {selectedDateBreakdown.breakdown.map((item, i) => (
              <div key={i} className="breakdown-row">
                <span className="breakdown-clinic-name">
                  <Building2 size={14} className="clinic-icon" /> {item.clinicName}
                </span>
                <span className={`breakdown-count-pill ${item.count > 0 ? 'active' : ''}`}>
                  {item.count} Patients
                </span>
              </div>
            ))}
          </div>

          <div className="breakdown-footer">
            <button
              type="button"
              className="filter-this-date-btn"
              onClick={() => {
                onSelectDate(selectedDateBreakdown.dateStr);
                setSelectedCalendarDate(null);
                if (onClose) onClose();
              }}
            >
              <Filter size={14} /> Filter List for {selectedDateBreakdown.dateStr}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalendarWidget;
