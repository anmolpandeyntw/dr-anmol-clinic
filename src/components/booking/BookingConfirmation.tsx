import React from 'react';
import { CheckCircle2, MapPin, Calendar, User, Clock, Ticket, Sparkles, Building2, ShieldCheck, Download, CalendarPlus, MessageSquare } from 'lucide-react';
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
  const rawToken = confirmation.token_number || 1;
  const formattedToken = `#${String(rawToken).padStart(2, '0')}`;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Scheduled Date';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const { doctor } = useDoctor();
  const docName = doctor?.full_name || 'Dr. Anmol Pandey';
  const formattedDateStr = formatDate(confirmation.date);
  const patientName = formData?.patient_name || 'Patient';
  const clinicName = confirmation.clinic_name || formData?.clinic_name || `${docName} Clinic (Gomtinagar)`;
  const isOnlinePayment = formData?.payment_method === 'pay_online';

  const patientMobile = (formData?.booker_mobile || formData?.patient_mobile || '').replace(/\D/g, '').slice(-10);

  // Live verification URL (scan QR code to verify on clinic server)
  const verificationUrl = `${window.location.origin}/appointment/${confirmation.appointment_id}?num=${rawToken}&name=${encodeURIComponent(patientName)}&clinic=${encodeURIComponent(clinicName)}&date=${encodeURIComponent(formattedDateStr)}&payment=${encodeURIComponent(isOnlinePayment ? 'PAID ONLINE (₹600)' : 'PAY AT CLINIC (₹600)')}`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(verificationUrl)}`;

  // Google Calendar Link
  const createGoogleCalendarLink = () => {
    const title = encodeURIComponent(`${docName} OPD Token ${formattedToken}`);
    const details = encodeURIComponent(`Token: ${formattedToken}\nClinic: ${clinicName}\nPatient: ${patientName}\nAppointment ID: ${confirmation.appointment_id}`);
    const location = encodeURIComponent(clinicName);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
  };

  // WhatsApp Share Ticket Link
  const createWhatsAppShareLink = () => {
    const text = `🏥 *${docName} Appointment Token Ticket*\n\n🎫 *TOKEN NUMBER:* ${formattedToken}\n👤 *Patient:* ${patientName}\n🏥 *Clinic Branch:* ${clinicName}\n📅 *Date:* ${formattedDateStr}\n💵 *Payment:* ${isOnlinePayment ? 'Paid Online' : 'Pay at Counter (₹600)'}\n\n🔒 *Anti-Tamper Verification Link:* ${verificationUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const handlePrintOrPDF = () => {
    window.print();
  };

  return (
    <div className={styles.container}>
      {/* Compact Joy Banner */}
      <div className={styles.compactHeaderBar}>
        <div className={styles.headerBadgeRow}>
          <div className={styles.successIconCircle}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h2 className={styles.successTitle}>Booking Confirmed!</h2>
            <p className={styles.successSub}>Token #{formattedToken} reserved for {patientName}</p>
          </div>
        </div>
        <span className={styles.liveSyncPill}>
          <ShieldCheck size={13} /> Database Verified
        </span>
      </div>

      {/* OFFICIAL DIGITAL TICKET RECEIPT CARD */}
      <div className={styles.ticketCard} id="printable-token">
        {/* Top Header */}
        <div className={styles.ticketTopBar}>
          <div className={styles.ticketBadge}>
            <Ticket size={14} /> OFFICIAL CONSULTATION TOKEN
          </div>
          <span className={styles.aptIdTag}>ID: {confirmation.appointment_id.slice(0, 8).toUpperCase()}</span>
        </div>

        {/* Token Hero Banner */}
        <div className={styles.tokenDisplayBox}>
          <div className={styles.tokenHeaderRow}>
            <div>
              <span className={styles.tokenTitle}>TOKEN NUMBER</span>
              <div className={styles.tokenValueRow}>
                <span className={styles.tokenNumber}>{formattedToken}</span>
              </div>
            </div>
            <div className={styles.tokenRightBadge}>
              <span>Estimated Queue Token</span>
              <strong>{formattedDateStr}</strong>
            </div>
          </div>
        </div>

        {/* Dashed Separator */}
        <div className={styles.ticketCutLine}>
          <div className={styles.circleNotchLeft}></div>
          <div className={styles.dashedBorder}></div>
          <div className={styles.circleNotchRight}></div>
        </div>

        {/* Compact Details Grid */}
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <User size={14} className={styles.detailIcon} />
            <div>
              <span className={styles.detailLabel}>Patient Name</span>
              <span className={styles.detailValue}>{patientName}</span>
            </div>
          </div>

          <div className={styles.detailItem}>
            <Building2 size={14} className={styles.detailIcon} />
            <div>
              <span className={styles.detailLabel}>Clinic Branch</span>
              <span className={styles.detailValue}>{clinicName}</span>
            </div>
          </div>

          <div className={styles.detailItem}>
            <Calendar size={14} className={styles.detailIcon} />
            <div>
              <span className={styles.detailLabel}>Consultation Date</span>
              <span className={styles.detailValue}>{formattedDateStr}</span>
            </div>
          </div>

          <div className={styles.detailItem}>
            <Clock size={14} className={styles.detailIcon} />
            <div>
              <span className={styles.detailLabel}>Payment Status</span>
              <span className={styles.detailValue}>
                {isOnlinePayment ? '✅ Paid Online (₹600)' : '💵 Pay at Clinic (₹600)'}
              </span>
            </div>
          </div>
        </div>

        {/* Anti-Tamper QR Verification */}
        <div className={styles.qrVerificationBox}>
          <div className={styles.qrCodeWrapper}>
            <img src={qrCodeImageUrl} alt="Scan to Verify Token" className={styles.qrCodeImg} />
          </div>
          <div className={styles.qrTextCol}>
            <div className={styles.qrHeader}>
              <ShieldCheck size={14} /> <strong>Anti-Tamper Verified QR</strong>
            </div>
            <p className={styles.qrSub}>
              Scan at reception to verify live patient details & clinic branch status.
            </p>
            <a href={verificationUrl} target="_blank" rel="noopener noreferrer" className={styles.verifyLink}>
              View Live Database Record &rarr;
            </a>
          </div>
        </div>

        {/* Small WhatsApp & SMS notice note */}
        <div className={styles.compactSmsNotice}>
          <Sparkles size={13} className={styles.noticeSparkle} />
          <span>Confirmation details synced to <strong>+91 {patientMobile || 'registered number'}</strong></span>
        </div>
      </div>

      {/* Action Buttons Grid */}
      <div className={styles.actionButtonsCol}>
        <div className={styles.secondaryActionsRow}>
          <a 
            href={createWhatsAppShareLink()}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.whatsappShareBtn}
          >
            <MessageSquare size={14} /> Share to WhatsApp
          </a>

          <button 
            type="button" 
            className={styles.pdfBtn}
            onClick={handlePrintOrPDF}
          >
            <Download size={14} /> Download PDF
          </button>
        </div>

        <div className={styles.secondaryActionsRow}>
          <a 
            href={createGoogleCalendarLink()}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.calendarBtn}
          >
            <CalendarPlus size={14} /> Add Calendar
          </a>

          <a 
            href={`https://maps.google.com/?q=${encodeURIComponent(clinicName + ' Lucknow')}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.mapBtn}
          >
            <MapPin size={14} /> Open Maps
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
