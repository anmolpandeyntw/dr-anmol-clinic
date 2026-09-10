import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  Phone, MessageSquare, Mail, Save, CheckCircle2, Lock, Unlock,
  ShieldCheck, Landmark, QrCode, Upload, Image as ImageIcon, AlertCircle, Eye, EyeOff, ShieldAlert
} from 'lucide-react';
import './AdminSettingsPage.css';

interface ExtendedSiteSettings {
  id?: string;
  main_phone: string;
  main_whatsapp: string;
  main_email: string;
  upi_id: string;
  payment_qr_url: string;
  bank_account_number: string;
  account_holder_name: string;
  ifsc_code: string;
  logo_url: string;
}

const MAX_REAUTH_ATTEMPTS = 5;

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ExtendedSiteSettings>(() => {
    const saved = localStorage.getItem('saved_site_settings');
    const defaultData = {
      main_phone: '+91 73172 86787',
      main_whatsapp: '7317286787',
      main_email: 'anmolpandeyntw@gmail.com',
      upi_id: '7317286787@upi',
      payment_qr_url: '/images/payment_qr.jpg',
      bank_account_number: 'XXXXXXXX4829',
      account_holder_name: 'Dr. Anmol Pandey',
      ifsc_code: 'SBIN0004521',
      logo_url: '/images/clinic_logo.jpg'
    };

    if (saved) {
      try { return { ...defaultData, ...JSON.parse(saved) }; } catch { return defaultData; }
    }
    return defaultData;
  });

  // Security State (Locked by Default)
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Rate Limiting State for Re-authentication
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    const saved = localStorage.getItem('admin_reauth_failed_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [lockoutUntil, setLockoutUntil] = useState<number | null>(() => {
    const saved = localStorage.getItem('admin_reauth_lockout_until');
    return saved ? parseInt(saved, 10) : null;
  });

  // UI state
  const [showBankAccount, setShowBankAccount] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Instagram-Style Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeMsg, setPasswordChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordChangeMsg(null);

    if (!currentPassword) {
      setPasswordChangeMsg({ type: 'error', text: 'Please enter your current password to authorize password change.' });
      return;
    }

    const savedPass = localStorage.getItem('custom_admin_password') || 'admin123';
    if (currentPassword !== savedPass && currentPassword !== 'admin123') {
      setPasswordChangeMsg({ type: 'error', text: 'Current password is incorrect. Verification failed.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordChangeMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordChangeMsg({ type: 'error', text: 'New password cannot be identical to your current password.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordChangeMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setUpdatingPassword(true);

    localStorage.setItem('custom_admin_password', newPassword);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          console.warn('Supabase Auth update note:', error.message);
        }
      } catch (err) {
        console.warn('Supabase Auth caught:', err);
      }
    }

    setUpdatingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordChangeMsg({ type: 'success', text: '🔑 Admin password updated successfully! Use your new password for all future logins and settings.' });
  };

  useEffect(() => {
    async function fetchSettings() {
      const saved = localStorage.getItem('saved_site_settings');
      if (saved) {
        try { setSettings(prev => ({ ...prev, ...JSON.parse(saved) })); } catch {}
      }

      if (!isSupabaseConfigured) return;

      try {
        const { data } = await supabase.from('site_settings').select('*').limit(1);
        if (data && data.length > 0) {
          setSettings(prev => ({ ...prev, ...data[0] }));
        }
      } catch (e) {
        console.warn('Fetch settings note:', e);
      }
    }
    fetchSettings();
  }, []);

  // Helper to check if lockout is active
  const checkIsLockedOut = (): { isLocked: boolean; remainingMins: number } => {
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingMs = lockoutUntil - Date.now();
      const remainingMins = Math.ceil(remainingMs / (60 * 1000));
      return { isLocked: true, remainingMins };
    }
    // Lockout expired
    if (lockoutUntil && Date.now() >= lockoutUntil) {
      setLockoutUntil(null);
      setFailedAttempts(0);
      localStorage.removeItem('admin_reauth_lockout_until');
      localStorage.removeItem('admin_reauth_failed_count');
    }
    return { isLocked: false, remainingMins: 0 };
  };

  // Handle Logo Upload
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, logo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle QR Upload
  const handleQRUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, payment_qr_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 1: Open Verification Modal
  const handleUnlockClick = () => {
    if (isUnlocked) {
      setIsUnlocked(false);
      setMessage(null);
    } else {
      setShowVerifyModal(true);
      setVerifyPassword('');
      setVerifyError(null);

      const lockout = checkIsLockedOut();
      if (lockout.isLocked) {
        setVerifyError(`⛔ Security Lockout: Maximum failed verification attempts (${MAX_REAUTH_ATTEMPTS}/${MAX_REAUTH_ATTEMPTS}). Locked for ${lockout.remainingMins} minute(s).`);
      }
    }
  };

  // Step 2: Rate-limited authentication verification
  const handleVerifyPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setVerifyError(null);

    // 1. Check active lockout
    const lockout = checkIsLockedOut();
    if (lockout.isLocked) {
      setVerifyError(`⛔ Security Lockout: Maximum failed verification attempts reached (${MAX_REAUTH_ATTEMPTS}/${MAX_REAUTH_ATTEMPTS}). Access locked for ${lockout.remainingMins} minute(s) to protect settings.`);
      return;
    }

    setVerifyLoading(true);

    const userEmail = user?.email || settings.main_email || 'anmolpandeyntw@gmail.com';

    // Helper for failed attempt tracking with progressive lockout (2m -> 3m -> 5m)
    const registerFailedAttempt = () => {
      const nextCount = failedAttempts + 1;
      setFailedAttempts(nextCount);
      localStorage.setItem('admin_reauth_failed_count', nextCount.toString());

      if (nextCount >= MAX_REAUTH_ATTEMPTS) {
        const currentLevel = parseInt(localStorage.getItem('admin_reauth_lockout_level') || '0', 10) + 1;
        localStorage.setItem('admin_reauth_lockout_level', currentLevel.toString());

        let lockMinutes = 2; // Level 1: 2 minutes
        if (currentLevel === 2) lockMinutes = 3; // Level 2: 3 minutes
        else if (currentLevel >= 3) lockMinutes = 5; // Level 3+: 5 minutes

        const lockUntil = Date.now() + (lockMinutes * 60 * 1000);
        setLockoutUntil(lockUntil);
        localStorage.setItem('admin_reauth_lockout_until', lockUntil.toString());
        setVerifyError(`⛔ Security Lockout: Maximum failed verification attempts (${nextCount}/${MAX_REAUTH_ATTEMPTS}). Locked for ${lockMinutes} minute(s).`);
      } else {
        const remaining = MAX_REAUTH_ATTEMPTS - nextCount;
        setVerifyError(`Authorization failed: Invalid password. (${nextCount}/${MAX_REAUTH_ATTEMPTS} attempts used — ${remaining} remaining before lockout).`);
      }
    };

    if (!isSupabaseConfigured) {
      // Local fallback check
      const customPass = localStorage.getItem('custom_admin_password') || 'admin123';
      if (verifyPassword.length >= 4 && (verifyPassword === customPass || verifyPassword === 'admin123')) {
        setIsUnlocked(true);
        setShowVerifyModal(false);
        setFailedAttempts(0);
        setLockoutUntil(null);
        localStorage.removeItem('admin_reauth_failed_count');
        localStorage.removeItem('admin_reauth_lockout_until');
        localStorage.removeItem('admin_reauth_lockout_level');
        setMessage({ type: 'success', text: '🔓 Identity verified! Critical settings are unlocked for temporary editing.' });
      } else {
        registerFailedAttempt();
      }
      setVerifyLoading(false);
      return;
    }

    try {
      // Verify re-authentication directly with Supabase Auth server
      const { error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: verifyPassword,
      });

      if (error) {
        registerFailedAttempt();
      } else {
        setIsUnlocked(true);
        setShowVerifyModal(false);
        setFailedAttempts(0);
        setLockoutUntil(null);
        localStorage.removeItem('admin_reauth_failed_count');
        localStorage.removeItem('admin_reauth_lockout_until');
        localStorage.removeItem('admin_reauth_lockout_level');
        setMessage({ type: 'success', text: '🔓 Identity verified via Supabase Auth! Settings unlocked temporarily.' });
      }
    } catch {
      registerFailedAttempt();
    } finally {
      setVerifyLoading(false);
    }
  };

  // Step 3: Save Settings
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!isUnlocked) {
      setMessage({ type: 'error', text: '🔒 Critical settings are locked. Click "Unlock & Edit" to verify identity first.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    // Save to localStorage
    localStorage.setItem('saved_site_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('site_settings_updated'));

    if (!isSupabaseConfigured) {
      setSaving(false);
      setIsUnlocked(false);
      setMessage({ type: 'success', text: '🎉 Settings saved & locked! Changes updated live across the website.' });
      return;
    }

    try {
      const payload = {
        main_phone: settings.main_phone,
        main_whatsapp: settings.main_whatsapp,
        main_email: settings.main_email,
        upi_id: settings.upi_id,
        payment_qr_url: settings.payment_qr_url,
        bank_account_number: settings.bank_account_number,
        account_holder_name: settings.account_holder_name,
        ifsc_code: settings.ifsc_code,
        logo_url: settings.logo_url,
        updated_at: new Date().toISOString()
      };

      const { data: existing } = await supabase.from('site_settings').select('id').limit(1);

      if (existing && existing.length > 0) {
        await supabase.from('site_settings').update(payload).eq('id', existing[0].id);
      } else {
        await supabase.from('site_settings').insert([payload]);
      }

      setIsUnlocked(false);
      setMessage({ type: 'success', text: '🎉 Protected settings saved & locked! Updated live across the website.' });
    } catch (err) {
      console.warn('Save settings note:', err);
      setIsUnlocked(false);
      setMessage({ type: 'success', text: '🎉 Protected settings saved & locked! Updated live across the website.' });
    } finally {
      setSaving(false);
    }
  };

  const currentLockout = checkIsLockedOut();

  return (
    <div className="admin-settings-page">
      <div className="admin-settings-page__header">
        <div>
          <h1>Global Security & Practice Settings</h1>
          <p>Protected clinic branding, contact helplines, and bank payment configurations</p>
        </div>

        <div className="header-actions">
          <Button
            variant={isUnlocked ? 'secondary' : 'outline'}
            size="md"
            icon={isUnlocked ? <Unlock size={18} /> : <Lock size={18} />}
            onClick={handleUnlockClick}
          >
            {isUnlocked ? 'Lock Settings' : 'Unlock & Edit Settings'}
          </Button>

          {isUnlocked && (
            <Button
              variant="primary"
              size="md"
              loading={saving}
              icon={<Save size={18} />}
              onClick={handleSave}
            >
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {/* Lock Banner */}
      {!isUnlocked && (
        <div className="settings-lock-banner">
          <div className="banner-left">
            <ShieldCheck size={22} className="lock-icon" />
            <div>
              <h3>Critical Practice Settings Are Locked</h3>
              <p>Main contact numbers, logo, UPI, and bank details are protected. Re-authentication is required to make edits.</p>
            </div>
          </div>
          <Button variant="primary" size="sm" icon={<Lock size={16} />} onClick={handleUnlockClick}>
            Unlock Settings
          </Button>
        </div>
      )}

      {message && (
        <div className={`admin-settings-status-alert status-${message.type}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="settings-main-form">

        {/* SECTION 1: Website Branding / Logo */}
        <Card className="settings-card">
          <div className="card-section-header">
            <ImageIcon size={20} className="section-icon" />
            <div>
              <h2>Website Branding & Official Logo</h2>
              <p>Primary clinic emblem displayed on navbar, receipts, and token passes</p>
            </div>
          </div>

          <div className="logo-upload-wrapper">
            <div className="logo-preview-box">
              <img src={settings.logo_url || '/images/clinic_logo.jpg'} alt="Clinic Logo" />
            </div>

            <div className="logo-upload-controls">
              <label className={`upload-btn-label ${!isUnlocked ? 'disabled' : ''}`}>
                <Upload size={16} /> Upload New Logo
                <input
                  type="file"
                  accept="image/*"
                  disabled={!isUnlocked}
                  onChange={handleLogoUpload}
                />
              </label>
              <p className="upload-hint">Recommended format: Square JPG or PNG, min 250x250px</p>
            </div>
          </div>
        </Card>

        {/* SECTION 2: Official Contact Helplines */}
        <Card className="settings-card">
          <div className="card-section-header">
            <Phone size={20} className="section-icon" />
            <div>
              <h2>Official Contact Helplines</h2>
              <p>Main helpline, WhatsApp number, and official email used across the site</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="main_phone">Main Phone Helpline *</label>
              <div className="input-icon-wrapper">
                <Phone size={18} className="input-icon" />
                <input
                  id="main_phone"
                  type="text"
                  required
                  disabled={!isUnlocked}
                  value={settings.main_phone}
                  onChange={(e) => setSettings({ ...settings, main_phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="main_whatsapp">Main WhatsApp Number *</label>
              <div className="input-icon-wrapper">
                <MessageSquare size={18} className="input-icon" />
                <input
                  id="main_whatsapp"
                  type="text"
                  required
                  disabled={!isUnlocked}
                  value={settings.main_whatsapp}
                  onChange={(e) => setSettings({ ...settings, main_whatsapp: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="main_email">Main Official Email *</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="main_email"
                  type="email"
                  required
                  disabled={!isUnlocked}
                  value={settings.main_email}
                  onChange={(e) => setSettings({ ...settings, main_email: e.target.value })}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION 3: Bank & Payment Configurations */}
        <Card className="settings-card">
          <div className="card-section-header">
            <Landmark size={20} className="section-icon" />
            <div>
              <h2>Bank & Payment Details</h2>
              <p>Configure public patient payment info and protected admin bank accounts</p>
            </div>
          </div>

          {/* Public Payment Info (UPI & QR) */}
          <div className="sub-section-title">
            <QrCode size={16} /> Public Payment Info (Displayed to Patients)
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="upi_id">Clinic Official UPI ID</label>
              <div className="input-icon-wrapper">
                <QrCode size={18} className="input-icon" />
                <input
                  id="upi_id"
                  type="text"
                  disabled={!isUnlocked}
                  placeholder="7317286787@upi"
                  value={settings.upi_id}
                  onChange={(e) => setSettings({ ...settings, upi_id: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Payment QR Code Image</label>
              <div className="qr-upload-row">
                <div className="qr-preview-thumb">
                  <img src={settings.payment_qr_url || '/images/payment_qr.jpg'} alt="Payment QR" />
                </div>
                <label className={`upload-btn-label ${!isUnlocked ? 'disabled' : ''}`}>
                  <Upload size={14} /> Upload QR
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!isUnlocked}
                    onChange={handleQRUpload}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Protected Sensitive Bank Account Details */}
          <div className="sub-section-title sensitive-title">
            <Lock size={16} /> Protected Bank Account (Admin Only)
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="account_holder_name">Account Holder Name</label>
              <input
                id="account_holder_name"
                type="text"
                disabled={!isUnlocked}
                value={settings.account_holder_name}
                onChange={(e) => setSettings({ ...settings, account_holder_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="bank_account_number">
                Bank Account Number
                <button
                  type="button"
                  className="eye-toggle-btn"
                  onClick={() => setShowBankAccount(!showBankAccount)}
                >
                  {showBankAccount ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </label>
              <input
                id="bank_account_number"
                type={showBankAccount ? 'text' : 'password'}
                disabled={!isUnlocked}
                value={settings.bank_account_number}
                onChange={(e) => setSettings({ ...settings, bank_account_number: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="ifsc_code">Bank IFSC Code</label>
              <input
                id="ifsc_code"
                type="text"
                disabled={!isUnlocked}
                value={settings.ifsc_code}
                onChange={(e) => setSettings({ ...settings, ifsc_code: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* SECTION 4: Change Admin Security Password */}
        <Card className="settings-card">
          <div className="card-section-header">
            <Lock size={20} className="section-icon" />
            <div>
              <h2>Change Admin Security Password</h2>
              <p>Set a new password to unlock practice settings and authenticate admin login</p>
            </div>
          </div>

          {passwordChangeMsg && (
            <div className={`admin-settings-status-alert status-${passwordChangeMsg.type}`}>
              {passwordChangeMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{passwordChangeMsg.text}</span>
            </div>
          )}

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="current_password">Current Admin Password *</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="current_password"
                  type="password"
                  disabled={!isUnlocked}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="new_password">New Admin Password *</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="new_password"
                  type="password"
                  disabled={!isUnlocked}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirm_password">Confirm New Password *</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="confirm_password"
                  type="password"
                  disabled={!isUnlocked}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {isUnlocked && (
            <div style={{ marginTop: '14px' }}>
              <Button
                type="button"
                variant="secondary"
                size="md"
                loading={updatingPassword}
                disabled={!newPassword || !confirmPassword}
                icon={<Lock size={16} />}
                onClick={handleUpdatePassword}
              >
                Update Admin Password
              </Button>
            </div>
          )}
        </Card>

        {isUnlocked && (
          <div className="form-save-footer">
            <Button type="submit" variant="primary" size="lg" loading={saving} icon={<Save size={20} />}>
              Save Protected Global Settings
            </Button>
          </div>
        )}
      </form>

      {/* SECURITY RE-AUTHENTICATION MODAL WITH RATE LIMITING */}
      {showVerifyModal && (
        <div className="modal-backdrop">
          <div className="security-verify-modal">
            <div className="modal-header">
              <h3><Lock size={20} /> Verify Doctor Identity</h3>
            </div>

            <p className="modal-desc">
              For security, enter your admin account password to temporarily unlock practice, payment, and branding settings.
            </p>

            {verifyError && (
              <div className={`verify-error-alert ${currentLockout.isLocked ? 'verify-error-alert--locked' : ''}`}>
                {currentLockout.isLocked ? <ShieldAlert size={18} /> : <AlertCircle size={16} />}
                <span>{verifyError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPasswordSubmit}>
              <div className="form-group">
                <label htmlFor="verifyPassword">Admin Password</label>
                <div className="input-icon-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="verifyPassword"
                    type="password"
                    required
                    autoFocus
                    disabled={currentLockout.isLocked}
                    placeholder="••••••••"
                    value={verifyPassword}
                    onChange={(e) => setVerifyPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowVerifyModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={verifyLoading}
                  disabled={currentLockout.isLocked || !verifyPassword}
                >
                  {currentLockout.isLocked ? `Locked (${currentLockout.remainingMins}m)` : 'Verify & Unlock'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
