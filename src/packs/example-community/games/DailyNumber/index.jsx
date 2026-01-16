/**
 * Daily Number - Example Community Game
 *
 * Demonstrates how community pack games can use backend APIs.
 * Guess the secret number between 1-100!
 */

import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../../../components/GameHeader';
import styles from './DailyNumber.module.css';

const API_BASE = '/api/packs/example-community';

export default function DailyNumber() {
  const [challenge, setChallenge] = useState(null);
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch today's challenge
  useEffect(() => {
    fetch(`${API_BASE}/daily-challenge`)
      .then(res => res.json())
      .then(data => {
        setChallenge(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load challenge. Is the backend running?');
        setLoading(false);
      });

    // Fetch leaderboard
    fetch(`${API_BASE}/leaderboard`)
      .then(res => res.json())
      .then(data => setLeaderboard(data.leaderboard || []))
      .catch(() => {});

    // Fetch user stats
    fetch(`${API_BASE}/my-stats`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setMyStats(data))
      .catch(() => {});
  }, []);

  // Make a guess
  const handleGuess = useCallback(async () => {
    const numGuess = parseInt(guess, 10);
    if (isNaN(numGuess) || numGuess < 1 || numGuess > 100) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guess: numGuess, date: challenge?.date })
      });

      const data = await res.json();

      setAttempts(prev => [...prev, { guess: numGuess, result: data.result }]);
      setGuess('');

      if (data.result === 'correct') {
        setWon(true);
        setGameOver(true);

        // Submit score
        fetch(`${API_BASE}/submit-score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attempts: attempts.length + 1,
            won: true,
            date: challenge?.date
          })
        }).catch(() => {});
      }
    } catch (err) {
      setError('Failed to submit guess');
    }
  }, [guess, challenge, attempts]);

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleGuess();
    }
  };

  // Give up
  const handleGiveUp = () => {
    setGameOver(true);
    setWon(false);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <GameHeader title="Daily Number" icon="🔢" />
        <div className={styles.loading}>Loading challenge...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <GameHeader title="Daily Number" icon="🔢" />
        <div className={styles.error}>
          <p>{error}</p>
          <p className={styles.hint}>
            This game requires the backend plugin system. Make sure the Enigma backend is running.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <GameHeader title="Daily Number" icon="🔢" />

      <div className={styles.game}>
        <div className={styles.challengeInfo}>
          <h2>🎯 Daily Challenge</h2>
          <p className={styles.date}>{challenge?.date}</p>
          <p className={styles.hint}>{challenge?.hint}</p>
        </div>

        {!gameOver ? (
          <div className={styles.guessArea}>
            <div className={styles.inputGroup}>
              <input
                type="number"
                min="1"
                max="100"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your guess (1-100)"
                className={styles.input}
                autoFocus
              />
              <button onClick={handleGuess} className={styles.guessButton}>
                Guess
              </button>
            </div>

            <button onClick={handleGiveUp} className={styles.giveUpButton}>
              Give Up
            </button>
          </div>
        ) : (
          <div className={styles.result}>
            {won ? (
              <>
                <h3 className={styles.winMessage}>🎉 Correct!</h3>
                <p>You got it in {attempts.length} {attempts.length === 1 ? 'attempt' : 'attempts'}!</p>
              </>
            ) : (
              <>
                <h3 className={styles.loseMessage}>Better luck tomorrow!</h3>
              </>
            )}
          </div>
        )}

        {attempts.length > 0 && (
          <div className={styles.attempts}>
            <h3>Your Attempts</h3>
            <div className={styles.attemptList}>
              {attempts.map((a, i) => (
                <div
                  key={i}
                  className={`${styles.attempt} ${styles[a.result]}`}
                >
                  <span className={styles.attemptNumber}>{a.guess}</span>
                  <span className={styles.attemptResult}>
                    {a.result === 'correct' ? '✅' : a.result === 'higher' ? '⬆️ Higher' : '⬇️ Lower'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.sidebar}>
          {leaderboard.length > 0 && (
            <div className={styles.leaderboard}>
              <h3>🏆 Today's Leaderboard</h3>
              <ol className={styles.leaderboardList}>
                {leaderboard.map((entry, i) => (
                  <li key={i}>
                    <span className={styles.rank}>#{entry.rank}</span>
                    <span className={styles.username}>{entry.username}</span>
                    <span className={styles.score}>{entry.attempts} guesses</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {myStats && (
            <div className={styles.stats}>
              <h3>📊 Your Stats</h3>
              <div className={styles.statGrid}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{myStats.totalGames}</span>
                  <span className={styles.statLabel}>Games</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{myStats.wins}</span>
                  <span className={styles.statLabel}>Wins</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{myStats.avgAttempts || '-'}</span>
                  <span className={styles.statLabel}>Avg Guesses</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
