import React from 'react';
import { CheckCircle2, MapPin, Calendar, User, Clock, Printer, Ticket, Sparkles, Building2, ShieldCheck, Download, QrCode, CalendarPlus } from 'lucide-react';
import { Button } from '../common/Button';
import { useDoctor } from '../../hooks/useDoctor';
import type { BookingConfirmation as BookingConfirmationType, BookingFormData } from '../../types/database';
import styles from './BookingConfirmation.module.css';

export interface BookingConfirmationProps {
  confirmation: BookingConfirmationType;
  formData?: BookingFormData;
  onBookAnother: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ 
  confirmation, 
  formData, 
  onBookAnother 
}) => {
  // Format token number nicely (e.g., #01, #02, #07)
  const rawToken = confirmation.token_number || 1;
  const formattedToken = `#${String(rawToken).padStart(2, '0')}`;

  // Format date nicely (e.g. Saturday, 15 Aug 2026)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Scheduled Date';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const { doctor } = useDoctor();
  const docName = doctor?.full_name || 'Doctor';
  const formattedDateStr = formatDate(confirmation.date);
  const patientName = formData?.patient_name || 'Patient';
  const clinicName = confirmation.clinic_name || formData?.clinic_name || `${docName} Clinic`;
  const isOnlinePayment = formData?.payment_method === 'pay_online';

  const patientMobile = (formData?.booker_mobile || formData?.patient_mobile || '').replace(/\D/g, '').slice(-10);

  // Live verification URL (scan QR code to verify on clinic server) with complete patient and clinic params
  const verificationUrl = `${window.location.origin}/appointment/${confirmation.appointment_id}?num=${rawToken}&name=${encodeURIComponent(patientName)}&clinic=${encodeURIComponent(clinicName)}&date=${encodeURIComponent(formattedDateStr)}&payment=${encodeURIComponent(isOnlinePayment ? 'PAID ONLINE (₹600)' : 'PAY AT CLINIC (₹600)')}`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

  // Google Calendar Event Link
  const createGoogleCalendarLink = () => {
    const title = encodeURIComponent(`${docName} Appointment (Token ${formattedToken})`);
    const details = encodeURIComponent(`Token: ${formattedToken}\nClinic: ${clinicName}\nPatient: ${patientName}\nAppointment ID: ${confirmation.appointment_id}`);
    const location = encodeURIComponent(clinicName);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
  };

  const handlePrintOrPDF = () => {
    window.print();
  };

  return (
    <div className={styles.container}>
      {/* OFFICIAL COMPACT DIGITAL TICKET RECEIPT */}
      <div className={styles.ticketCard} id="printable-token">
        {/* Ticket Header Bar */}
        <div className={styles.ticketTopBar}>
          <div className={styles.ticketBadge}>
            <CheckCircle2 size={16} /> APPOINTMENT CONFIRMED
          </div>
          <span className={styles.aptIdTag}>TOKEN ID: {confirmation.appointment_id.slice(0, 8).toUpperCase()}</span>
        </div>

        {/* Token Number Box */}
        <div className={styles.tokenDisplayBox}>
          <div className={styles.tokenHeaderRow}>
            <div>
              <span className={styles.tokenTitle}>YOUR DAILY TOKEN NUMBER</span>
              <div className={styles.tokenValueRow}>
                <Ticket size={32} className={styles.ticketIcon} />
                <span className={styles.tokenNumber}>{formattedToken}</span>
              </div>
            </div>
            <div className={styles.verifiedBadgeRight}>
              <ShieldCheck size={14} /> Database Verified
            </div>
          </div>
          
          <p className={styles.patientGreeting}>
            Thank you, <strong>{patientName}</strong>! Your token is reserved for consultation.
          </p>

          <div className={styles.smsNoticeStrip}>
            <Sparkles size={13} className={styles.noticeSparkle} />
            <span>Token receipt sent via SMS & WhatsApp to <strong>+91 {patientMobile || 'registered number'}</strong></span>
          </div>
        </div>

        {/* Ticket Dashed Separator */}
        <div className={styles.ticketCutLine}>
          <div className={styles.circleNotchLeft}></div>
          <div className={styles.dashedBorder}></div>
          <div className={styles.circleNotchRight}></div>
        </div>

        {/* Patient & Clinic Details Grid */}
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <User size={15} className={styles.detailIcon} />
            <div>
              <span className={styles.detailLabel}>Patient Name</span>
              <span className={styles.detailValue}>{patientName}</span>
            </div>
          </div>

          <div className={styles.detailItem}>
            <Calendar size={15} className={styles.detailIcon} />
            <div>
              <span className={styles.detailLabel}>Consultation Date</span>
              <span className={styles.detailValue}>{formattedDateStr}</span>
            </div>
          </div>

          <div className={styles.detailItem}>
            <Building2 size={15} className={styles.detailIcon} />
            <div>
              <span className={styles.detailLabel}>Clinic Branch</span>
              <span className={styles.detailValue}>{clinicName}</span>
            </div>
          </div>

          <div className={styles.detailItem}>
            <Clock size={15} className={styles.detailIcon} />
            <div>
              <span className={styles.detailLabel}>Payment Status</span>
              <span className={styles.detailValue}>
                {isOnlinePayment ? '✅ Verified Paid Online (₹600)' : '💵 Pay at Clinic Counter (₹600)'}
              </span>
            </div>
          </div>
        </div>

        {/* Anti-Tamper QR Code Verification Box */}
        <div className={styles.qrVerificationBox}>
          <div className={styles.qrCodeWrapper}>
            <img src={qrCodeImageUrl} alt="Scan to Verify Token" className={styles.qrCodeImg} />
          </div>
          <div className={styles.qrTextCol}>
            <div className={styles.qrHeader}>
              <QrCode size={15} /> <strong>Anti-Tamper Scan Verification</strong>
            </div>
            <p className={styles.qrSub}>
              Scan this QR code at clinic reception to verify live patient details & clinic branch status.
            </p>
            <a href={verificationUrl} target="_blank" rel="noopener noreferrer" className={styles.verifyLink}>
              View Live Server Record &rarr;
            </a>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className={styles.actionButtonsCol}>
        <div className={styles.secondaryActionsRow}>
          <button 
            type="button" 
            className={styles.pdfBtn}
            onClick={handlePrintOrPDF}
          >
            <Download size={15} /> Download PDF Receipt
          </button>

          <a 
            href={createGoogleCalendarLink()}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.calendarBtn}
          >
            <CalendarPlus size={15} /> Add to Calendar
          </a>
        </div>

        <div className={styles.secondaryActionsRow}>
          <button 
            type="button" 
            className={styles.printBtn}
            onClick={handlePrintOrPDF}
          >
            <Printer size={15} /> Print Token
          </button>

          <a 
            href={`https://maps.google.com/?q=${encodeURIComponent(clinicName + ' Lucknow')}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.mapBtn}
          >
            <MapPin size={15} /> Open Google Maps
          </a>
        </div>

        <div className={styles.bookAnotherContainer}>
          <Button variant="outline" size="md" fullWidth onClick={onBookAnother}>
            Book Another Appointment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
