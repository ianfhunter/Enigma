/**
 * CommunityGame - Wrapper for community pack games
 *
 * Community packs are installed from GitHub and their frontend components
 * cannot be bundled at build time. This page provides:
 *
 * 1. Game metadata display
 * 2. Dynamic loading of game frontend from backend
 * 3. Backend API integration
 */

import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useCommunityPacks } from '../../hooks/useCommunityPacks';
import styles from './CommunityGame.module.css';

export default function CommunityGame() {
  const { packId, gameSlug } = useParams();
  const { communityPacks, loading: packsLoading } = useCommunityPacks();
  const [gameState, setGameState] = useState('loading');
  const [error, setError] = useState(null);

  // Find the pack and game
  const { pack, game } = useMemo(() => {
    const foundPack = communityPacks.find(p => p.id === packId);
    const foundGame = foundPack?.allGames?.find(g => g.slug === gameSlug);
    return { pack: foundPack, game: foundGame };
  }, [communityPacks, packId, gameSlug]);

  // Check if backend API is available for this pack
  useEffect(() => {
    if (packsLoading) return;

    if (!pack || !game) {
      setGameState('not-found');
      return;
    }

    // Check if the pack's backend API is available
    const apiBase = `/api/packs/${packId}`;

    fetch(`${apiBase}/health`)
      .then(res => {
        if (res.ok) {
          setGameState('ready');
        } else {
          setGameState('no-backend');
        }
      })
      .catch(() => {
        setGameState('no-backend');
      });
  }, [pack, game, packId, packsLoading]);

  if (packsLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  if (gameState === 'not-found' || !pack || !game) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>🔍</span>
          <h2>Game Not Found</h2>
          <p>
            The community game "{gameSlug}" from pack "{packId}" could not be found.
          </p>
          <Link to="/" className={styles.backLink}>
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/" className={styles.backButton}>
          ← Back
        </Link>
        <div className={styles.gameInfo}>
          <span className={styles.gameIcon}>{game.icon || game.emojiIcon || '🎮'}</span>
          <div>
            <h1 className={styles.title}>{game.title}</h1>
            <p className={styles.packName}>
              {pack.icon} {pack.name}
              <span className={styles.version}>v{pack.installedVersion}</span>
            </p>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {gameState === 'loading' && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Checking game backend...</p>
          </div>
        )}

        {gameState === 'no-backend' && (
          <div className={styles.notice}>
            <span className={styles.noticeIcon}>⚠️</span>
            <h2>Backend Not Available</h2>
            <p>
              This game requires a backend plugin that isn't currently running.
              Make sure the pack is properly installed and the backend has been restarted.
            </p>
            <div className={styles.apiInfo}>
              <p>Expected API endpoint:</p>
              <code>/api/packs/{packId}/</code>
            </div>
          </div>
        )}

        {gameState === 'ready' && (
          <CommunityGameInterface
            packId={packId}
            game={game}
            pack={pack}
          />
        )}
      </main>
    </div>
  );
}

/**
 * CommunityGameInterface - Renders the actual game interface
 *
 * For now, this provides a generic interface that works with any
 * community pack backend. In the future, this could be extended
 * to load custom game UIs from the backend.
 */
function CommunityGameInterface({ packId, game, pack }) {
  const [iframeUrl, setIframeUrl] = useState(null);

  // Check if there's a game-specific HTML page served by the backend
  useEffect(() => {
    const checkForGamePage = async () => {
      try {
        const res = await fetch(`/api/packs/${packId}/game/${game.slug}/index.html`, {
          method: 'HEAD',
        });
        if (res.ok) {
          setIframeUrl(`/api/packs/${packId}/game/${game.slug}/index.html`);
        }
      } catch {
        // No custom game page available
      }
    };

    checkForGamePage();
  }, [packId, game.slug]);

  // If there's a custom game page, show it in an iframe
  if (iframeUrl) {
    return (
      <div className={styles.iframeContainer}>
        <iframe
          src={iframeUrl}
          title={game.title}
          className={styles.gameIframe}
          allow="fullscreen"
        />
      </div>
    );
  }

  // Otherwise, show a generic interface with API info
  return (
    <div className={styles.gameContent}>
      <div className={styles.gameCard}>
        <div
          className={styles.gameCardHeader}
          style={{
            background: game.gradient || `linear-gradient(135deg, ${game.colors?.primary || '#8b5cf6'} 0%, ${game.colors?.secondary || '#7c3aed'} 100%)`,
          }}
        >
          <span className={styles.gameCardIcon}>{game.icon || game.emojiIcon || '🎮'}</span>
        </div>
        <div className={styles.gameCardBody}>
          <h2>{game.title}</h2>
          <p className={styles.description}>{game.description}</p>

          <div className={styles.apiSection}>
            <h3>🔌 API Available</h3>
            <p>This game's backend is running. The game uses the following API:</p>
            <code className={styles.apiEndpoint}>/api/packs/{packId}/</code>

            {pack.hasBackend && (
              <div className={styles.backendNote}>
                <p>
                  <strong>Note:</strong> Community pack frontend components are currently being loaded.
                  If you see this message, the game UI may need to be served differently.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

