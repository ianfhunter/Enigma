import { useState, useEffect } from 'react';
import { detectSystemWarnings, dismissWarning, WARNING_TYPES } from '../utils/systemWarnings';
import styles from './DismissibleAlert.module.css';

const DismissibleAlert = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [warning, setWarning] = useState(null);

  useEffect(() => {
    const checkForWarnings = async () => {
      try {
        // Check for Git LFS warning specifically
        const warnings = await detectSystemWarnings([WARNING_TYPES.GIT_LFS]);

        if (warnings.length > 0) {
          const gitLfsWarning = warnings[0];
          setWarning(gitLfsWarning);
          setIsVisible(true);
        }
      } catch (error) {
        console.log('Failed to check for system warnings:', error);
      }
    };

    checkForWarnings();
  }, []);

  const handleDismiss = () => {
    if (warning) {
      dismissWarning(warning.id);
    }
    setIsVisible(false);
  };

  if (!isVisible || !warning) {
    return null;
  }

  return (
    <div className={styles.alertContainer}>
      <div className={styles.alert}>
        <div className={styles.alertIcon}>{warning.icon}</div>
        <div className={styles.alertContent}>
          <div className={styles.alertTitle}>{warning.title}</div>
          <div className={styles.alertMessage}>
            {warning.message}
            {warning.action && (
              <>
                {' '}Please run <code>{warning.action}</code> to resolve this issue.
              </>
            )}
          </div>
        </div>
        <button
          className={styles.dismissButton}
          onClick={handleDismiss}
          title="Dismiss this warning"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default DismissibleAlert;
