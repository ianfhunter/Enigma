import { useState, useEffect, useCallback } from 'react';
import {
  isValidWord,
  getRandomWordGuessWord,
  checkWordGuessGuess,
  validateStrictWordGuess,
} from '../../data/wordUtils';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useKeyboardInput } from '../../hooks/useKeyboardInput';
import GameHeader from '../../components/GameHeader';
import styles from './WordGuess.module.css';

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

export default function WordGuess() {
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'lost', 'gaveup'
  const [message, setMessage] = useState('');
  const [letterStates, setLetterStates] = useState({});
  const [shakeRow, setShakeRow] = useState(false);
  const [revealRow, setRevealRow] = useState(-1);
  const [strictMode, setStrictMode] = usePersistedState('wordguess-strict', false);
  const [stats, setStats] = usePersistedState('wordguess-stats', {
    played: 0,
    won: 0,
    streak: 0,
    maxStreak: 0,
  });

  const initGame = useCallback(() => {
    setTargetWord(getRandomWordGuessWord());
    setGuesses([]);
    setCurrentGuess('');
    setGameState('playing');
    setLetterStates({});
    setMessage('');
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleGiveUp = useCallback(() => {
    setGameState('gaveup');
    setStats(prev => ({
      ...prev,
      played: prev.played + 1,
      streak: 0,
    }));
  }, [setStats]);

  const updateLetterStates = (guess, feedback) => {
    const newStates = { ...letterStates };
    guess.split('').forEach((letter, i) => {
      const current = newStates[letter];
      const newState = feedback[i];
      // Only upgrade state: absent < present < correct
      if (!current ||
          (current === 'absent' && newState !== 'absent') ||
          (current === 'present' && newState === 'correct')) {
        newStates[letter] = newState;
      }
    });
    setLetterStates(newStates);
  };

  const submitGuess = useCallback(() => {
    if (currentGuess.length !== WORD_LENGTH) {
      setMessage('Not enough letters');
      setShakeRow(true);
      setTimeout(() => setShakeRow(false), 500);
      return;
    }

    if (strictMode) {
      const violation = validateStrictWordGuess(currentGuess, guesses, WORD_LENGTH);
      if (violation) {
        const violationMessage = violation.type === 'position'
          ? `Strict mode: ${violation.letter} must be in position ${violation.index + 1}`
          : `Strict mode: Use ${violation.letters.join(', ')}`;
        setMessage(violationMessage);
        setShakeRow(true);
        setTimeout(() => setShakeRow(false), 500);
        return;
      }
    }

    if (!isValidWord(currentGuess)) {
      setMessage('Not in word list');
      setShakeRow(true);
      setTimeout(() => setShakeRow(false), 500);
      return;
    }

    const feedback = checkWordGuessGuess(currentGuess, targetWord);
    const newGuess = { word: currentGuess, feedback };
    const newGuesses = [...guesses, newGuess];

    setGuesses(newGuesses);
    setRevealRow(guesses.length);
    updateLetterStates(currentGuess, feedback);
    setCurrentGuess('');
    setMessage('');

    // Check win/lose after animation
    setTimeout(() => {
      setRevealRow(-1);
      if (currentGuess.toUpperCase() === targetWord) {
        setGameState('won');
        setStats(prev => ({
          played: prev.played + 1,
          won: prev.won + 1,
          streak: prev.streak + 1,
          maxStreak: Math.max(prev.maxStreak, prev.streak + 1),
        }));
      } else if (newGuesses.length >= MAX_GUESSES) {
        setGameState('lost');
        setStats(prev => ({
          ...prev,
          played: prev.played + 1,
          streak: 0,
        }));
      }
    }, WORD_LENGTH * 300 + 100);
  }, [currentGuess, targetWord, guesses, setStats, letterStates, strictMode]);

  const handleKeyPress = useCallback((key) => {
    if (gameState !== 'playing') return;

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === '⌫' || key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
      setMessage('');
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
      setCurrentGuess(prev => prev + key);
      setMessage('');
    }
  }, [gameState, currentGuess, submitGuess]);

  // Use the keyboard input hook
  useKeyboardInput({
    onLetter: (letter) => handleKeyPress(letter),
    onEnter: () => handleKeyPress('ENTER'),
    onBackspace: () => handleKeyPress('BACKSPACE'),
    enabled: gameState === 'playing',
  });

  const getKeyClass = (key) => {
    const state = letterStates[key];
    if (state === 'correct') return styles.correct;
    if (state === 'present') return styles.present;
    if (state === 'absent') return styles.absent;
    return '';
  };

  const renderGrid = () => {
    const rows = [];
    for (let i = 0; i < MAX_GUESSES; i++) {
      const guess = guesses[i];
      const isCurrentRow = i === guesses.length && gameState === 'playing';
      const isRevealing = i === revealRow;
      const shouldShake = isCurrentRow && shakeRow;

      const cells = [];
      for (let j = 0; j < WORD_LENGTH; j++) {
        let letter = '';
        let cellClass = styles.cell;

        if (guess) {
          letter = guess.word[j];
          const state = guess.feedback[j];
          cellClass += ` ${styles[state]}`;
          if (isRevealing) {
            cellClass += ` ${styles.revealing}`;
          }
        } else if (isCurrentRow && j < currentGuess.length) {
          letter = currentGuess[j];
          cellClass += ` ${styles.filled}`;
        }

        cells.push(
          <div
            key={j}
            className={cellClass}
            style={isRevealing ? { animationDelay: `${j * 300}ms` } : undefined}
          >
            {letter}
          </div>
        );
      }

      rows.push(
        <div key={i} className={`${styles.row} ${shouldShake ? styles.shake : ''}`}>
          {cells}
        </div>
      );
    }
    return rows;
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="WordGuess"
        instructions="Guess the 5-letter word in 6 tries. Colors show how close you are! Toggle Strict Mode to reuse revealed letters."
      />

      <div className={styles.controls}>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={strictMode}
            onChange={(e) => setStrictMode(e.target.checked)}
          />
          <div className={styles.toggleText}>
            <span className={styles.toggleLabel}>Strict Mode</span>
            <span className={styles.toggleHint}>Reuse yellow/green letters; greens stay put.</span>
          </div>
        </label>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.grid}>
          {renderGrid()}
        </div>

        {message && (
          <div className={styles.message}>{message}</div>
        )}

        {gameState === 'playing' && guesses.length > 0 && (
          <button className={styles.giveUpBtn} onClick={handleGiveUp}>
            Give Up
          </button>
        )}

        {gameState !== 'playing' && (
          <div className={styles.result}>
            {gameState === 'won' ? (
              <div className={styles.winMessage}>
                🎉 {guesses.length === 1 ? 'Genius!' : guesses.length <= 3 ? 'Impressive!' : 'Well done!'}
              </div>
            ) : (
              <div className={styles.loseMessage}>
                The word was <strong>{targetWord}</strong>
              </div>
            )}
            <button className={styles.playAgainBtn} onClick={initGame}>
              Play Again
            </button>
          </div>
        )}

        <div className={styles.keyboard}>
          {KEYBOARD_ROWS.map((row, i) => (
            <div key={i} className={styles.keyboardRow}>
              {row.map((key) => (
                <button
                  key={key}
                  className={`${styles.key} ${getKeyClass(key)} ${key.length > 1 ? styles.wideKey : ''}`}
                  onClick={() => handleKeyPress(key)}
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className={styles.statsPanel}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.played}</span>
            <span className={styles.statLabel}>Played</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0}%
            </span>
            <span className={styles.statLabel}>Win %</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.streak}</span>
            <span className={styles.statLabel}>Streak</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.maxStreak}</span>
            <span className={styles.statLabel}>Max</span>
          </div>
        </div>
      </div>
    </div>
  );
}
