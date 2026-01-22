import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthModal.module.css';

export default function AuthModal({ isOpen, onClose, canClose = false }) {
  const { t } = useTranslation();
  const { login, register, error, clearError } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);

  // Reset form when mode changes
  useEffect(() => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setLocalError('');
    setIsRateLimited(false);
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
    setIsRateLimited(false);
    clearError();

    // Validation
    if (!username.trim()) {
      setLocalError(t('auth.usernameRequired'));
      return;
    }

    if (!password) {
      setLocalError(t('auth.passwordRequired'));
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setLocalError(t('auth.passwordsDoNotMatch'));
        return;
      }
      if (password.length < 6) {
        setLocalError(t('auth.passwordTooShort'));
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
      if (err.isRateLimit) {
        setIsRateLimited(true);
      }
      setLocalError(err.message || t('auth.anErrorOccurred'));
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
            {mode === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}
          </h2>
          {canClose && (
            <button className={styles.closeButton} onClick={onClose} aria-label={t('common.close')}>
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
            {t('auth.login')}
          </button>
          <button
            className={`${styles.tab} ${mode === 'register' ? styles.active : ''}`}
            onClick={() => setMode('register')}
            type="button"
          >
            {t('auth.register')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {displayError && (
            <div className={`${styles.error} ${isRateLimited ? styles.rateLimitError : ''}`}>
              <span className={styles.errorIcon}>{isRateLimited ? '🛑' : '⚠️'}</span>
              <div className={styles.errorContent}>
                {displayError}
                {isRateLimited && (
                  <span className={styles.rateLimitHint}>{t('auth.pleaseWait')}</span>
                )}
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="username" className={styles.label}>{t('auth.username')}</label>
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
                {t('auth.displayName')} <span className={styles.optional}>({t('auth.displayNameOptional')})</span>
              </label>
              <input
                id="displayName"
                type="text"
                className={styles.input}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('auth.displayNamePlaceholder')}
                disabled={loading}
                maxLength={64}
              />
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>{t('auth.password')}</label>
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
              <label htmlFor="confirmPassword" className={styles.label}>{t('auth.confirmPassword')}</label>
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
              t('auth.login')
            ) : (
              t('auth.createAccount')
            )}
          </button>
        </form>

        {mode === 'register' && (
          <p className={styles.hint}>
            {t('auth.firstAccountAdmin')}
          </p>
        )}
      </div>
    </div>
  );
}
