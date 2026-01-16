/**
 * CommunityGame - Dynamic loader for community pack games
 *
 * Community packs are installed from GitHub and their React components
 * are dynamically imported via the generated registry. This page:
 *
 * 1. Looks up the game in the registry (which includes community packs)
 * 2. Dynamically loads the component using React.lazy
 * 3. Renders the component with proper error handling
 */

import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { communityPacks, getPackageById, getGameBySlug } from '../../packs/registry';
import { renderIcon } from '../../utils/renderIcon';
import styles from './CommunityGame.module.css';

export default function CommunityGame() {
  const { packId, gameSlug } = useParams();
  const [loadError, setLoadError] = useState(null);

  // Find the pack and game from the registry
  const { pack, game } = useMemo(() => {
    const foundPack = communityPacks.find(p => p.id === packId);
    const foundGame = foundPack?.allGames?.find(g => g.slug === gameSlug) ||
                      foundPack?.getGameBySlug?.(gameSlug);
    return { pack: foundPack, game: foundGame };
  }, [packId, gameSlug]);

  // Dynamically import the game component
  const GameComponent = useMemo(() => {
    if (!game?.component) return null;

    // The component field is a function that returns a dynamic import
    // e.g., () => import('./games/DailyNumber')
    try {
      return lazy(() =>
        game.component().catch(err => {
          console.error('Failed to load game component:', err);
          setLoadError(err);
          // Return a fallback module
          return { default: () => <GameLoadError error={err} /> };
        })
      );
    } catch (err) {
      console.error('Failed to create lazy component:', err);
      setLoadError(err);
      return null;
    }
  }, [game]);

  // Not found state
  if (!pack || !game) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>🔍</span>
          <h2>Game Not Found</h2>
          <p>
            The community game "{gameSlug}" from pack "{packId}" could not be found.
          </p>
          <p className={styles.hint}>
            Make sure the pack is installed and the frontend has been regenerated.
          </p>
          <Link to="/" className={styles.backLink}>
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // No component defined
  if (!GameComponent) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <Link to="/" className={styles.backButton}>
            ← Back
          </Link>
          <div className={styles.gameInfo}>
            <span className={styles.gameIcon}>
              {renderIcon(game.icon || game.emojiIcon, styles.svgIcon, '🎮')}
            </span>
            <div>
              <h1 className={styles.title}>{game.title}</h1>
              <p className={styles.packName}>
                {renderIcon(pack.icon, styles.packSvgIcon, '📦')} {pack.name}
                <span className={styles.version}>v{pack.version}</span>
              </p>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.notice}>
            <span className={styles.noticeIcon}>⚠️</span>
            <h2>Component Not Available</h2>
            <p>
              This game doesn't have a frontend component defined.
              {loadError && (
                <span className={styles.errorDetail}>
                  <br />Error: {loadError.message}
                </span>
              )}
            </p>
            <div className={styles.apiInfo}>
              <p>If this game has a backend API, it's available at:</p>
              <code>/api/packs/{packId}/</code>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading {game.title}...</p>
          </div>
        </div>
      }
    >
      <GameComponent />
    </Suspense>
  );
}

/**
 * Error component shown when game component fails to load
 */
function GameLoadError({ error }) {
  return (
    <div className={styles.container}>
      <div className={styles.error}>
        <span className={styles.errorIcon}>❌</span>
        <h2>Failed to Load Game</h2>
        <p>
          The game component could not be loaded. This might happen if:
        </p>
        <ul className={styles.errorList}>
          <li>The pack was recently installed and Vite needs a refresh</li>
          <li>The game component has a syntax error</li>
          <li>Required dependencies are missing</li>
        </ul>
        {error && (
          <details className={styles.errorDetails}>
            <summary>Technical Details</summary>
            <pre>{error.message}</pre>
          </details>
        )}
        <Link to="/" className={styles.backLink}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
