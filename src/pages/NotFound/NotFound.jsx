import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import styles from './NotFound.module.css';

const puzzlePieces = ['🧩', '🎮', '🎲', '🎯', '🃏', '♟️', '🎰', '🎪'];

function NotFound() {
  const [floatingPieces, setFloatingPieces] = useState([]);

  useEffect(() => {
    // Generate random floating puzzle pieces
    const pieces = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      emoji: puzzlePieces[Math.floor(Math.random() * puzzlePieces.length)],
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 6,
      size: 1.5 + Math.random() * 1.5,
    }));
    setFloatingPieces(pieces);
  }, []);

  return (
    <div className={styles.container}>
      {/* Floating background pieces */}
      <div className={styles.floatingPieces}>
        {floatingPieces.map((piece) => (
          <span
            key={piece.id}
            className={styles.floatingPiece}
            style={{
              left: `${piece.left}%`,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              fontSize: `${piece.size}rem`,
            }}
          >
            {piece.emoji}
          </span>
        ))}
      </div>

      <div className={styles.content}>
        <div className={styles.glitchContainer}>
          <h1 className={styles.errorCode} data-text="404">404</h1>
        </div>

        <div className={styles.message}>
          <h2 className={styles.title}>Oops! Level Not Found</h2>
          <p className={styles.subtitle}>
            Looks like this puzzle piece doesn't exist in our collection.
            <br />
            Maybe it rolled under the couch?
          </p>
        </div>

        <div className={styles.actions}>
          <Link to="/" className={styles.homeButton}>
            <span className={styles.buttonIcon}>🏠</span>
            Return to Games
          </Link>
        </div>

        <div className={styles.hint}>
          <span className={styles.hintIcon}>💡</span>
          <span>Pro tip: Try checking the URL or pick a game from the home page!</span>
        </div>
      </div>
    </div>
  );
}

export default NotFound;

