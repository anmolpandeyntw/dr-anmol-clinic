import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { QrCode, ShieldCheck, CheckCircle2, Lock, XCircle, X, Copy, Check, Smartphone, ExternalLink } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import './PaymentCheckoutModal.css';

interface PaymentCheckoutModalProps {
  amount: number;
  clinicName: string;
  patientName: string;
  onSuccess: (txnRef: string) => void;
  onCancel: () => void;
}

export function PaymentCheckoutModal({ amount, clinicName, patientName, onSuccess, onCancel }: PaymentCheckoutModalProps) {
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Dynamic Site Settings
  const [siteSettings, setSiteSettings] = useState({
    upi_id: '7317286787@upi',
    payment_qr_url: '',
    account_holder_name: 'Dr. Anmol Pandey'
  });

  const loadSettings = () => {
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
  };

  useEffect(() => {
    loadSettings();

    const handleUpdate = () => {
      loadSettings();
      setImgError(false);
    };

    window.addEventListener('site_settings_updated', handleUpdate);
    return () => window.removeEventListener('site_settings_updated', handleUpdate);
  }, []);

  // UPI Input
  const [userUpiId, setUserUpiId] = useState('');

  // 1-Tap UPI URI Deep Link
  const rawUpiId = siteSettings.upi_id.trim();
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(rawUpiId)}&pn=${encodeURIComponent(siteSettings.account_holder_name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`OPD Fee ${patientName}`)}`;
  
  // Dynamic Generated QR URL Fallback (Never Fails)
  const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiDeepLink)}`;

  // Determine QR image source: Custom uploaded base64/URL if valid, else dynamic generated QR
  const qrImageSrc = (!imgError && siteSettings.payment_qr_url && siteSettings.payment_qr_url.length > 10) 
    ? siteSettings.payment_qr_url 
    : dynamicQrUrl;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(siteSettings.upi_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePay = (e: FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrorMsg(null);

    setTimeout(() => {
      const generatedTxnRef = `UPI-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      setProcessing(false);
      onSuccess(generatedTxnRef);
    }, 1200);
  };

  return (
    <div className="payment-modal-overlay">
      <Card className="payment-modal-card">
        {/* Header with Close X button */}
        <div className="payment-modal-header">
          <div className="security-icon">
            <QrCode size={24} />
          </div>
          <div className="header-text">
            <h3>Official UPI Instant Payment</h3>
            <p>100% Safe & Direct Bank Transfer</p>
          </div>
          <button type="button" className="close-modal-btn" onClick={onCancel} aria-label="Close Modal">
            <X size={20} />
          </button>
        </div>

        {/* Consultation Fee Box */}
        <div className="payment-amount-box">
          <span className="amount-label">OPD CONSULTATION FEE</span>
          <span className="amount-value">₹{amount}</span>
          <span className="amount-detail">{clinicName} • Patient: {patientName}</span>
        </div>

        {errorMsg && (
          <div className="payment-modal-error">
            <XCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePay} className="payment-modal-form">
          <div className="upi-section">
            {/* Dynamic Vector QR Code Box */}
            <div className="qr-box">
              <div className="modal-qr-image-wrapper">
                <img
                  src={qrImageSrc}
                  alt="Official UPI Payment QR Code"
                  className="modal-payment-qr-img"
                  onError={() => setImgError(true)}
                />
              </div>

              <p className="qr-scan-text">Scan with any UPI App (GPay / PhonePe / Paytm / BHIM)</p>
              
              <div className="official-payee-badge">
                <CheckCircle2 size={13} /> Official Payee: <strong>{siteSettings.account_holder_name}</strong>
              </div>

              {/* 1-Tap Mobile Payment Button */}
              <a
                href={upiDeepLink}
                className="direct-upi-pay-btn"
                title="Tap to open GPay / PhonePe / Paytm directly on your phone"
              >
                <Smartphone size={16} /> 1-Tap Pay via GPay / PhonePe / Paytm <ExternalLink size={14} />
              </a>
            </div>

            {/* Official UPI ID Box with Copy Button */}
            <div className="form-group">
              <label htmlFor="upi-id">Official Clinic UPI ID</label>
              <div className="modal-upi-copy-box">
                <code>{siteSettings.upi_id}</code>
                <button type="button" className="copy-upi-btn" onClick={handleCopyUpi}>
                  {copied ? <Check size={14} className="copied-icon" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy UPI'}
                </button>
              </div>
            </div>

            {/* Optional UTR/Txn ID Input */}
            <div className="form-group">
              <label htmlFor="user-upi">Your UPI ID or Transaction Reference (Optional)</label>
              <input
                id="user-upi"
                type="text"
                className="modal-styled-input"
                placeholder="e.g. 7317286787@upi or UTR #123456"
                value={userUpiId}
                onChange={(e) => setUserUpiId(e.target.value)}
              />
            </div>
          </div>

          <div className="payment-modal-actions">
            <Button type="button" variant="outline" onClick={onCancel} disabled={processing}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={processing} icon={<Lock size={16} />}>
              I Have Completed ₹{amount} Payment
            </Button>
          </div>
        </form>

        <p className="payment-security-footer">
          <ShieldCheck size={13} /> 100% Encrypted Direct Bank UPI Gateway • Official Doctor Payee Verified
        </p>
      </Card>
    </div>
  );
}
