import React, { useState, useEffect } from 'react';
import { Banknote, CreditCard, CheckCircle2, QrCode, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import styles from './PaymentMethodSelect.module.css';

interface PaymentMethodSelectProps {
  selectedMethod: string;
  onSelect: (method: 'pay_at_clinic' | 'pay_online') => void;
  onContinue: () => void;
}

export const PaymentMethodSelect: React.FC<PaymentMethodSelectProps> = ({ 
  selectedMethod, onSelect, onContinue 
}) => {
  const [siteSettings, setSiteSettings] = useState({
    upi_id: '7317286787@upi',
    payment_qr_url: '/images/payment_qr.jpg',
    account_holder_name: 'Dr. Anmol Pandey'
  });

  useEffect(() => {
    const saved = localStorage.getItem('saved_site_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSiteSettings(prev => ({
          ...prev,
          upi_id: parsed.upi_id || prev.upi_id,
          payment_qr_url: parsed.payment_qr_url || prev.payment_qr_url,
          account_holder_name: parsed.account_holder_name || prev.account_holder_name
        }));
      } catch {}
    }

    if (isSupabaseConfigured) {
      supabase.from('site_settings').select('upi_id, payment_qr_url, account_holder_name').limit(1).then(({ data }) => {
        if (data && data.length > 0) {
          setSiteSettings(prev => ({
            ...prev,
            upi_id: data[0].upi_id || prev.upi_id,
            payment_qr_url: data[0].payment_qr_url || prev.payment_qr_url,
            account_holder_name: data[0].account_holder_name || prev.account_holder_name
          }));
        }
      });
    }
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Payment Method</h2>
      
      <div className={styles.methodsList}>
        <Card 
          className={`${styles.methodCard} ${selectedMethod === 'pay_at_clinic' ? styles.selected : ''}`}
          onClick={() => onSelect('pay_at_clinic')}
        >
          <div className={styles.methodContent}>
            <div className={styles.iconWrapper}>
              <Banknote size={24} className={selectedMethod === 'pay_at_clinic' ? styles.iconSelected : styles.icon} />
            </div>
            <div className={styles.methodInfo}>
              <h3 className={styles.methodTitle}>Pay at Clinic</h3>
              <p className={styles.methodDesc}>Pay cash or card at the clinic reception upon arrival</p>
            </div>
          </div>
          <div className={styles.radioCircle}>
            {selectedMethod === 'pay_at_clinic' && <CheckCircle2 size={20} />}
          </div>
        </Card>
        
        <Card 
          className={`${styles.methodCard} ${selectedMethod === 'pay_online' ? styles.selected : ''}`}
          onClick={() => onSelect('pay_online')}
        >
          <div className={styles.methodContent}>
            <div className={styles.iconWrapper}>
              <CreditCard size={24} className={selectedMethod === 'pay_online' ? styles.iconSelected : styles.icon} />
            </div>
            <div className={styles.methodInfo}>
              <h3 className={styles.methodTitle}>Pay Online / UPI</h3>
              <p className={styles.methodDesc}>Scan QR code or pay via official UPI ID</p>
            </div>
          </div>
          <div className={styles.radioCircle}>
            {selectedMethod === 'pay_online' && <CheckCircle2 size={20} />}
          </div>
        </Card>
      </div>

      {/* Dynamic UPI & QR Code Panel */}
      {selectedMethod === 'pay_online' && (
        <div className={styles.onlinePaymentPanel}>
          <div className={styles.panelHeader}>
            <QrCode size={20} />
            <div>
              <span className={styles.payeeLabel}>Official Payee Name:</span>
              <h4 className={styles.payeeName}>{siteSettings.account_holder_name}</h4>
            </div>
          </div>

          <div className={styles.qrRow}>
            <div className={styles.qrImageBox}>
              <img src={siteSettings.payment_qr_url} alt="Official Payment QR" />
            </div>

            <div className={styles.upiDetailsBox}>
              <span className={styles.upiLabel}>Official Clinic UPI ID:</span>
              <div className={styles.upiIdBadge}>{siteSettings.upi_id}</div>
              <p className={styles.verificationNote}>
                <ShieldCheck size={14} /> Verification: Your token will be generated as Pending and verified at clinic reception or via official webhook.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className={styles.footer}>
        <Button 
          variant="primary" 
          onClick={onContinue} 
          disabled={!selectedMethod}
          fullWidth
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
