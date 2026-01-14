import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthModal.module.css';

export default function AuthModal({ isOpen, onClose, canClose = false }) {
  const { login, register, error, clearError } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);

  // Reset form when mode changes
  useEffect(() => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setLocalError('');
    clearError();
  }, [mode, clearError]);

  // Close on escape if allowed
  useEffect(() => {
    if (!canClose) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, canClose]);

  const handleBackdropClick = (e) => {
    if (canClose && e.target === modalRef.current) {
      onClose?.();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    // Validation
    if (!username.trim()) {
      setLocalError('Username is required');
      return;
    }

    if (!password) {
      setLocalError('Password is required');
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password, displayName.trim() || undefined);
      }
      onClose?.();
    } catch (err) {
      setLocalError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const displayError = localError || error;

  return (
    <div
      ref={modalRef}
      className={styles.backdrop}
      onClick={handleBackdropClick}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.titleIcon}>🔐</span>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          {canClose && (
            <button className={styles.closeButton} onClick={onClose} aria-label="Close">
              ×
            </button>
          )}
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === 'login' ? styles.active : ''}`}
            onClick={() => setMode('login')}
            type="button"
          >
            Log In
          </button>
          <button
            className={`${styles.tab} ${mode === 'register' ? styles.active : ''}`}
            onClick={() => setMode('register')}
            type="button"
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {displayError && (
            <div className={styles.error}>
              <span className={styles.errorIcon}>⚠️</span>
              {displayError}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="username" className={styles.label}>Username</label>
            <input
              id="username"
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              disabled={loading}
              maxLength={32}
            />
          </div>

          {mode === 'register' && (
            <div className={styles.field}>
              <label htmlFor="displayName" className={styles.label}>
                Display Name <span className={styles.optional}>(optional)</span>
              </label>
              <input
                id="displayName"
                type="text"
                className={styles.input}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How others will see you"
                disabled={loading}
                maxLength={64}
              />
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={loading}
            />
          </div>

          {mode === 'register' && (
            <div className={styles.field}>
              <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner}>⏳</span>
            ) : mode === 'login' ? (
              'Log In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {mode === 'register' && (
          <p className={styles.hint}>
            The first account created will have admin privileges.
          </p>
        )}
      </div>
    </div>
  );
}
