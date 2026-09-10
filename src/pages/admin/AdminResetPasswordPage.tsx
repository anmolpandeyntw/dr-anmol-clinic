import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import './AdminResetPasswordPage.css';

export default function AdminResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if recovery access token is present in URL hash or session
    const hash = window.location.hash;
    const isRecovery = hash.includes('type=recovery') || hash.includes('access_token=');

    if (isSupabaseConfigured && isRecovery) {
      supabase.auth.onAuthStateChange(async (event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setMessage({ type: 'success', text: '🔑 Recovery token verified! Enter your new admin password below.' });
        }
      });
    }
  }, []);

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match. Please verify.' });
      return;
    }

    setSaving(true);

    // Save locally for unified login and settings unlock
    localStorage.setItem('custom_admin_password', newPassword);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          setMessage({ type: 'error', text: error.message });
          setSaving(false);
          return;
        }
      } catch (err) {
        console.warn('Password update error:', err);
      }
    }

    setSaving(false);
    setMessage({
      type: 'success',
      text: '🎉 Password reset successful! Redirecting to Admin Dashboard...'
    });

    setTimeout(() => {
      navigate('/admin/dashboard', { replace: true });
    }, 1500);
  };

  return (
    <div className="admin-reset-page">
      <div className="admin-reset-card-wrapper">
        <Card className="admin-reset-card">
          <div className="admin-reset-brand">
            <div className="admin-reset-logo">
              <KeyRound size={36} />
            </div>
            <h1>Create New Admin Password</h1>
            <p>Set your new password to regain access to your admin dashboard</p>
          </div>

          {message && (
            <div className={`reset-status-alert status-${message.type}`}>
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="admin-reset-form">
            <div className="form-group">
              <label htmlFor="newPassword">New Password *</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="newPassword"
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password *</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={saving}
              disabled={!newPassword || !confirmPassword}
              icon={<ShieldCheck size={18} />}
            >
              Save New Password & Log In
            </Button>
          </form>

          <div className="admin-reset-footer">
            <p>Protected by 256-bit SSL encryption & Supabase Auth Security.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
