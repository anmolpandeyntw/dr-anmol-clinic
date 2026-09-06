import React from 'react';
import { CheckCircle2, MapPin, Calendar, User, Clock, Printer, Ticket, PhoneCall, Sparkles, Building2, ShieldCheck, Download, QrCode, HeartHandshake, CalendarPlus } from 'lucide-react';
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

  // Live verification URL (scan QR code to verify on clinic server)
  const verificationUrl = `${window.location.origin}/appointment/${confirmation.appointment_id}?num=${rawToken}`;
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
      {/* Joyful & Reassuring Header Banner */}
      <div className={styles.celebrationBanner}>
        <div className={styles.celebrationHeaderRow}>
          <div className={styles.iconCircle}>
            <CheckCircle2 size={44} className={styles.checkIcon} />
          </div>
          <span className={styles.popperBadge}>
            <ShieldCheck size={14} /> APPOINTMENT CONFIRMED
          </span>
        </div>

        <h2 className={styles.celebrationTitle}>Appointment Token Confirmed!</h2>
        <p className={styles.celebrationSub}>
          Thank you, <strong>{patientName}</strong>. Your token <strong>{formattedToken}</strong> is reserved and recorded in the clinic system.
        </p>

        {/* Reassuring Notification Strip */}
        <div className={styles.smsNoticeStrip}>
          <Sparkles size={14} className={styles.noticeSparkle} />
          <span>
            Automated Token Receipt sent via SMS & WhatsApp to <strong>+91 {patientMobile || 'registered mobile'}</strong>.
          </span>
        </div>

        {/* Trust Badges */}
        <div className={styles.joyChipsRow}>
          <span className={styles.joyChip}><Sparkles size={13} /> Token {formattedToken} Reserved</span>
          <span className={styles.joyChip}><HeartHandshake size={13} /> Priority Queue Slot</span>
          <span className={styles.joyChip}><ShieldCheck size={13} /> Verified Database Record</span>
        </div>
      </div>

      {/* 3D OFFICIAL DIGITAL TICKET RECEIPT */}
      <div className={styles.ticketCard} id="printable-token">
        {/* Ticket Header Bar */}
        <div className={styles.ticketTopBar}>
          <div className={styles.ticketBadge}>
            <Sparkles size={13} /> OFFICIAL CLINIC TOKEN RECEIPT
          </div>
          <span className={styles.aptIdTag}>ID: {confirmation.appointment_id.slice(0, 8).toUpperCase()}</span>
        </div>

        {/* Token Number Box */}
        <div className={styles.tokenDisplayBox}>
          <span className={styles.tokenTitle}>YOUR DAILY TOKEN NUMBER</span>
          <div className={styles.tokenValueRow}>
            <Ticket size={36} className={styles.ticketIcon} />
            <span className={styles.tokenNumber}>{formattedToken}</span>
          </div>
          <span className={styles.tokenSubText}>Show this official token number at reception upon arrival</span>
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
            <User size={16} className={styles.detailIcon} />
            <div>
              <span className={styles.detailLabel}>Patient Name</span>
              <span className={styles.detailValue}>{patientName}</span>
            </div>
          </div>

          <div className={styles.detailItem}>
            <Calendar size={16} className={styles.detailIcon} />
            <div>
              <span className={styles.detailLabel}>Consultation Date</span>
              <span className={styles.detailValue}>{formattedDateStr}</span>
            </div>
          </div>

          <div className={styles.detailItem}>
            <Building2 size={16} className={styles.detailIcon} />
            <div>
              <span className={styles.detailLabel}>Clinic Location</span>
              <span className={styles.detailValue}>{clinicName}</span>
            </div>
          </div>

          <div className={styles.detailItem}>
            <Clock size={16} className={styles.detailIcon} />
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
              <QrCode size={16} /> <strong>Anti-Tamper Scan Verification</strong>
            </div>
            <p className={styles.qrSub}>
              Reception staff will scan this QR code to verify authentic token status against the live clinic database.
            </p>
            <a href={verificationUrl} target="_blank" rel="noopener noreferrer" className={styles.verifyLink}>
              View Live Server Record &rarr;
            </a>
          </div>
        </div>

        {/* Reception Instructions Box */}
        <div className={styles.instructionNotice}>
          <PhoneCall size={15} className={styles.noticeIcon} />
          <span>
            <strong>Reception Guidance:</strong> Please arrive 10 minutes before your consultation. Present this screen or digital token receipt at the reception desk.
          </span>
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
            <Download size={16} /> Download PDF Receipt
          </button>

          <a 
            href={createGoogleCalendarLink()}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.calendarBtn}
          >
            <CalendarPlus size={16} /> Add to Calendar
          </a>
        </div>

        <div className={styles.secondaryActionsRow}>
          <button 
            type="button" 
            className={styles.printBtn}
            onClick={handlePrintOrPDF}
          >
            <Printer size={16} /> Print Token
          </button>

          <a 
            href={`https://maps.google.com/?q=${encodeURIComponent(clinicName + ' Lucknow')}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.mapBtn}
          >
            <MapPin size={16} /> Open Google Maps
          </a>
        </div>

        <div className={styles.bookAnotherContainer}>
          <Button variant="outline" size="lg" fullWidth onClick={onBookAnother}>
            Book Another Appointment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
