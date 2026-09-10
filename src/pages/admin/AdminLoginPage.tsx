import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ShieldCheck, Lock, Mail, AlertCircle, CheckCircle2, KeyRound, X, ShieldAlert, Clock } from 'lucide-react';
import './AdminLoginPage.css';

const MAX_LOGIN_ATTEMPTS = 5;

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [inactivityMsg, setInactivityMsg] = useState<string | null>(null);

  // Rate Limiting State for Sign-In
  const [failedLoginAttempts, setFailedLoginAttempts] = useState<number>(() => {
    const saved = localStorage.getItem('admin_login_failed_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [loginLockoutUntil, setLoginLockoutUntil] = useState<number | null>(() => {
    const saved = localStorage.getItem('admin_login_lockout_until');
    return saved ? parseInt(saved, 10) : null;
  });

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { signIn, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin/dashboard';

  // Check 5-minute inactivity auto-logout notice
  useEffect(() => {
    const expiredReason = sessionStorage.getItem('session_expired_reason');
    if (expiredReason === 'inactivity') {
      setInactivityMsg('⏰ Session Expired: You were automatically logged out after 5 minutes of inactivity for security.');
      sessionStorage.removeItem('session_expired_reason');
    }
  }, []);

  // Helper to check active login lockout
  const checkLoginLockout = (): { isLocked: boolean; remainingMins: number } => {
    if (loginLockoutUntil && Date.now() < loginLockoutUntil) {
      const remainingMs = loginLockoutUntil - Date.now();
      const remainingMins = Math.ceil(remainingMs / (60 * 1000));
      return { isLocked: true, remainingMins };
    }
    if (loginLockoutUntil && Date.now() >= loginLockoutUntil) {
      setLoginLockoutUntil(null);
      setFailedLoginAttempts(0);
      localStorage.removeItem('admin_login_lockout_until');
      localStorage.removeItem('admin_login_failed_count');
    }
    return { isLocked: false, remainingMins: 0 };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setInactivityMsg(null);

    // Check active lockout
    const lockout = checkLoginLockout();
    if (lockout.isLocked) {
      setAuthError(`⛔ Security Lockout: Maximum failed login attempts (${MAX_LOGIN_ATTEMPTS}/${MAX_LOGIN_ATTEMPTS}). Sign-in locked for ${lockout.remainingMins} minute(s) to protect admin account.`);
      return;
    }

    if (!email || !password) {
      setAuthError('Please enter email and password.');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    const { error } = await signIn(email, password);
    if (error) {
      const nextCount = failedLoginAttempts + 1;
      setFailedLoginAttempts(nextCount);
      localStorage.setItem('admin_login_failed_count', nextCount.toString());

      if (nextCount >= MAX_LOGIN_ATTEMPTS) {
        const currentLevel = parseInt(localStorage.getItem('admin_login_lockout_level') || '0', 10) + 1;
        localStorage.setItem('admin_login_lockout_level', currentLevel.toString());

        let lockMinutes = 2; // Level 1: 2 minutes
        if (currentLevel === 2) lockMinutes = 3; // Level 2: 3 minutes
        else if (currentLevel >= 3) lockMinutes = 5; // Level 3+: 5 minutes

        const lockTime = Date.now() + (lockMinutes * 60 * 1000);
        setLoginLockoutUntil(lockTime);
        localStorage.setItem('admin_login_lockout_until', lockTime.toString());
        setAuthError(`⛔ Security Lockout: Maximum failed login attempts (${nextCount}/${MAX_LOGIN_ATTEMPTS}). Sign-in locked for ${lockMinutes} minute(s).`);
      } else {
        const remaining = MAX_LOGIN_ATTEMPTS - nextCount;
        setAuthError(`Authorization failed: ${error} (${nextCount}/${MAX_LOGIN_ATTEMPTS} attempts used — ${remaining} remaining before lockout).`);
      }
    } else {
      setFailedLoginAttempts(0);
      setLoginLockoutUntil(null);
      localStorage.removeItem('admin_login_failed_count');
      localStorage.removeItem('admin_login_lockout_until');
      localStorage.removeItem('admin_login_lockout_level');
      navigate(from, { replace: true });
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setResetMsg(null);
    if (!resetEmail) {
      setResetMsg({ type: 'error', text: 'Please enter your registered email address.' });
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + '/admin/reset-password'
      });

      if (error) {
        setResetMsg({ type: 'error', text: error.message });
      } else {
        setResetMsg({
          type: 'success',
          text: '✉️ Password recovery link sent to your email! Click the link in your inbox to reset your password.'
        });
      }
    } catch (err) {
      setResetMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error sending password reset email'
      });
    } finally {
      setResetLoading(false);
    }
  };

  const currentLoginLockout = checkLoginLockout();

  return (
    <div className="admin-login-page">
      <div className="admin-login-card-wrapper">
        <Card className="admin-login-card">
          <div className="admin-login-brand">
            <div className="admin-login-logo">
              <ShieldCheck size={36} />
            </div>
            <h1>Doctor & Practice Portal</h1>
            <p>Authorized Admin Sign-In Only</p>
          </div>

          {inactivityMsg && (
            <div className="admin-login-warning">
              <Clock size={18} />
              <span>{inactivityMsg}</span>
            </div>
          )}

          {authError && (
            <div className={`admin-login-error ${currentLoginLockout.isLocked ? 'admin-login-error--locked' : ''}`}>
              {currentLoginLockout.isLocked ? <ShieldAlert size={18} /> : <AlertCircle size={18} />}
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="form-group">
              <label htmlFor="email">Admin Email Address</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="admin@clinic.com"
                  value={email}
                  disabled={currentLoginLockout.isLocked}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-with-forgot">
                <label htmlFor="password">Password</label>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => { setShowForgotModal(true); setResetEmail(email); }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  disabled={currentLoginLockout.isLocked}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={currentLoginLockout.isLocked}
            >
              {currentLoginLockout.isLocked
                ? `Locked (${currentLoginLockout.remainingMins}m remaining)`
                : 'Sign In to Dashboard'}
            </Button>
          </form>

          <div className="admin-login-demo-notice">
            <p><strong>Security Notice:</strong> Sessions automatically expire after 5 minutes of inactivity. Access is restricted to pre-authorized clinic admins.</p>
          </div>
        </Card>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-backdrop">
          <div className="forgot-password-modal">
            <div className="modal-header">
              <h3><KeyRound size={20} /> Account Recovery</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowForgotModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <p className="modal-desc">
              Enter your verified admin email address below. We will send you a secure password reset link powered by Supabase Auth.
            </p>

            {resetMsg && (
              <div className={`reset-status-alert status-${resetMsg.type}`}>
                {resetMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{resetMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label htmlFor="resetEmail">Admin Registered Email</label>
                <div className="input-icon-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    id="resetEmail"
                    type="email"
                    required
                    placeholder="admin@clinic.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForgotModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={resetLoading}
                >
                  Send Recovery Link
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
