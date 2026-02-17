import { Trans, useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCustomPacks } from '../../hooks/useCustomPacks';
import styles from './IframeGame.module.css';
import { buildIframeGameDebugText } from '../../utils/gamePageDebugInfo';

/**
 * IframeGame - Renders an external game inside a sandboxed iframe
 * Used for external pack games that users add via URL
 */
export default function IframeGame() {
  const { t } = useTranslation();
  const { packId, gameId } = useParams();
  const navigate = useNavigate();
  const { getPackById, getGameFromPack, removeGameFromPack } = useCustomPacks();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [loadErrorDebugText, setLoadErrorDebugText] = useState('');

  const pack = getPackById(packId);
  const game = getGameFromPack(packId, gameId);

  // Handle "Open Externally" default behavior
  useEffect(() => {
    if (game?.openExternal && game?.url) {
      setRedirecting(true);
      // Small delay to show the redirecting message
      const timer = setTimeout(() => {
        window.open(game.url, '_blank', 'noopener,noreferrer');
        navigate(-1); // Go back after opening
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [game, navigate]);

  const handleDelete = () => {
    removeGameFromPack(packId, gameId);
    navigate('/');
  };

  if (!pack || !game) {
    return (
      <div className={styles.error}>
        <div className={styles.errorContent}>
          <span className={styles.errorIcon}>🔍</span>
          <h2>Game not found</h2>
          <p>{t('common.gameRemovedOrInvalid')}</p>
          <Link to="/" className={styles.homeLink}>
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Show redirecting message for external games
  if (redirecting) {
    return (
      <div className={styles.redirecting}>
        <div className={styles.redirectContent}>
          <span className={styles.redirectIcon}>{game.icon}</span>
          <h2>Opening {game.title}</h2>
          <p>{t('common.redirectingExternal')}</p>
          <div className={styles.spinner} />
          <Link to="/" className={styles.cancelRedirect}>
            Cancel and go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/" className={styles.backLink}>
            ← Back
          </Link>
          <div className={styles.gameInfo}>
            <span className={styles.gameIcon}>{game.icon}</span>
            <div>
              <h1 className={styles.gameTitle}>{game.title}</h1>
              <span className={styles.packName}>from {pack.name}</span>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <a
            href={game.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.externalLink}
            title="Open in new tab"
          >
            ↗️ Open External
          </a>
          <button
            className={styles.deleteButton}
            onClick={() => setShowDeleteConfirm(true)}
            title="Remove game"
          >
            🗑️
          </button>
        </div>
      </header>

      <div className={styles.iframeContainer}>
        {isLoading && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>{t('common.loadingGame')}</p>
          </div>
        )}

        {hasError && (
          <div className={styles.loadError}>
            <span className={styles.errorIcon}>⚠️</span>
            <h3><Trans i18nKey="common.failedToLoadGame" components={{ link: <a href="https://github.com/ianfhunter/Enigma/issues" target="_blank" rel="noopener noreferrer" /> }} /></h3>
            <p>{t('common.gameBlockedOrInvalid')}</p>
            <p>{t('common.errorDebugHint')}</p>
            <textarea
              className={styles.errorDebugText}
              aria-label={t('common.errorDebugInfo')}
              readOnly
              value={loadErrorDebugText}
              rows={10}
            />
            <a
              href={game.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.tryExternalLink}
            >
              Try opening in a new tab →
            </a>
          </div>
        )}

        <iframe
          src={game.url}
          title={game.title}
          className={`${styles.iframe} ${isLoading ? styles.hidden : ''}`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
            setLoadErrorDebugText(buildIframeGameDebugText({
              packId,
              gameId,
              gameUrl: game.url,
              timestamp: Date.now(),
            }));
          }}
        />
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Remove Game?</h3>
            <p>
              Are you sure you want to remove <strong>{game.title}</strong> from {pack.name}?
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className={styles.confirmDeleteButton}
                onClick={handleDelete}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
