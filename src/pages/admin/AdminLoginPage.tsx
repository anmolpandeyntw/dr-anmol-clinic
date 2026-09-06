import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ShieldCheck, Lock, Mail, User, AlertCircle, CheckCircle2, UserPlus, LogIn, KeyRound, X, ShieldAlert } from 'lucide-react';
import './AdminLoginPage.css';

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

export default function AdminLoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const { signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin/dashboard';

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
    setSuccessMsg(null);

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

    if (mode === 'register') {
      const { error } = await signUp(email, password, fullName || 'Dr. Anmol Pandey');
      if (error) {
        setAuthError(error);
      } else {
        setSuccessMsg('🎉 Admin account created successfully! Redirecting to Dashboard...');
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1000);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        const nextCount = failedLoginAttempts + 1;
        setFailedLoginAttempts(nextCount);
        localStorage.setItem('admin_login_failed_count', nextCount.toString());

        if (nextCount >= MAX_LOGIN_ATTEMPTS) {
          const lockTime = Date.now() + LOGIN_LOCKOUT_MS;
          setLoginLockoutUntil(lockTime);
          localStorage.setItem('admin_login_lockout_until', lockTime.toString());
          setAuthError(`⛔ Security Lockout Triggered (${nextCount}/${MAX_LOGIN_ATTEMPTS} Failed Attempts): Sign-in locked for 15 minutes for security protection.`);
        } else {
          const remaining = MAX_LOGIN_ATTEMPTS - nextCount;
          setAuthError(`Authorization failed: ${error} (${nextCount}/${MAX_LOGIN_ATTEMPTS} attempts used — ${remaining} remaining before 15-min lockout).`);
        }
      } else {
        setFailedLoginAttempts(0);
        setLoginLockoutUntil(null);
        localStorage.removeItem('admin_login_failed_count');
        localStorage.removeItem('admin_login_lockout_until');
        navigate(from, { replace: true });
      }
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
        redirectTo: window.location.origin + '/admin/login'
      });

      if (error) {
        setResetMsg({ type: 'error', text: error.message });
      } else {
        setResetMsg({
          type: 'success',
          text: '✉️ Password recovery link sent! Check your email inbox to reset your password.'
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
            <h1>Dr. Anmol Pandey</h1>
            <p>Doctor & Admin Management Portal</p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="admin-mode-tabs">
            <button
              type="button"
              className={`mode-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setAuthError(null); setSuccessMsg(null); }}
            >
              <LogIn size={15} /> Admin Sign In
            </button>
            <button
              type="button"
              className={`mode-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setAuthError(null); setSuccessMsg(null); }}
            >
              <UserPlus size={15} /> Create Admin Account
            </button>
          </div>

          {authError && (
            <div className={`admin-login-error ${currentLoginLockout.isLocked ? 'admin-login-error--locked' : ''}`}>
              {currentLoginLockout.isLocked ? <ShieldAlert size={18} /> : <AlertCircle size={18} />}
              <span>{authError}</span>
            </div>
          )}

          {successMsg && (
            <div className="admin-login-success">
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-login-form">
            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <div className="input-icon-wrapper">
                  <User size={18} className="input-icon" />
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Dr. Anmol Pandey"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="anmolpandeyntw@gmail.com"
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
                {mode === 'login' && (
                  <button
                    type="button"
                    className="forgot-link"
                    onClick={() => { setShowForgotModal(true); setResetEmail(email); }}
                  >
                    Forgot Password?
                  </button>
                )}
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
                : (mode === 'register' ? 'Create Admin Account & Log In' : 'Sign In to Dashboard')}
            </Button>
          </form>

          <div className="admin-login-demo-notice">
            <p><strong>Admin Sign-In:</strong> Use your registered doctor credentials to sign in into Supabase Auth.</p>
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
                    placeholder="anmolpandeyntw@gmail.com"
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
