import { useState, useEffect, useCallback } from 'react';
import { getRandomHangmanWord } from '../../data/wordUtils';
import { getGameGradient } from '../../data/gameRegistry';
import { flagWord, getWordFeedback, unflagWord, FeedbackType } from '../../data/wordFeedback';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useKeyboardInput } from '../../hooks/useKeyboardInput';
import GameHeader from '../../components/GameHeader';
import styles from './Hangman.module.css';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_WRONG = 6;

export default function Hangman() {
  const [word, setWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState(new Set());
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'lost'
  const [wordFeedback, setWordFeedback] = useState(null);
  const [stats, setStats] = usePersistedState('hangman-stats', { played: 0, won: 0 });

  const initGame = useCallback(() => {
    setWord(getRandomHangmanWord(5, 8));
    setGuessedLetters(new Set());
    setWrongGuesses(0);
    setGameState('playing');
    setWordFeedback(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Update feedback state when game ends
  useEffect(() => {
    if (word && (gameState === 'won' || gameState === 'lost')) {
      setWordFeedback(getWordFeedback(word));
    }
  }, [gameState, word]);

  const handleFlagWord = (type) => {
    if (!word) return;
    flagWord(word, type);
    setWordFeedback(getWordFeedback(word));
  };

  const handleUnflagWord = () => {
    if (!word) return;
    unflagWord(word);
    setWordFeedback(null);
  };

  const checkWin = useCallback((letters, targetWord) => {
    return targetWord.split('').every(letter => letters.has(letter));
  }, []);

  const guessLetter = useCallback((letter) => {
    if (gameState !== 'playing' || guessedLetters.has(letter)) return;

    const newGuessed = new Set(guessedLetters).add(letter);
    setGuessedLetters(newGuessed);

    if (!word.includes(letter)) {
      const newWrong = wrongGuesses + 1;
      setWrongGuesses(newWrong);

      if (newWrong >= MAX_WRONG) {
        setGameState('lost');
        setStats(prev => ({ ...prev, played: prev.played + 1 }));
      }
    } else if (checkWin(newGuessed, word)) {
      setGameState('won');
      setStats(prev => ({ played: prev.played + 1, won: prev.won + 1 }));
    }
  }, [gameState, guessedLetters, word, wrongGuesses, checkWin, setStats]);

  const useHint = () => {
    if (gameState !== 'playing' || wrongGuesses >= MAX_WRONG - 1) return;

    // Find unguessed letters in the word
    const unguessed = word.split('').filter(l => !guessedLetters.has(l));
    if (unguessed.length === 0) return;

    // Reveal a random unguessed letter (costs one wrong guess)
    const hint = unguessed[Math.floor(Math.random() * unguessed.length)];
    guessLetter(hint);
    setWrongGuesses(prev => prev + 1);
  };

  // Use the keyboard input hook
  useKeyboardInput({
    onLetter: (letter) => guessLetter(letter),
    enabled: gameState === 'playing',
  });

  const renderWord = () => {
    return word.split('').map((letter, i) => (
      <span key={i} className={styles.letterSlot}>
        {guessedLetters.has(letter) || gameState === 'lost' ? (
          <span className={gameState === 'lost' && !guessedLetters.has(letter) ? styles.revealed : ''}>
            {letter}
          </span>
        ) : (
          <span className={styles.blank}>_</span>
        )}
      </span>
    ));
  };

  const renderHangman = () => {
    const parts = [
      // Head
      <circle key="head" cx="150" cy="70" r="20" className={styles.bodyPart} />,
      // Body
      <line key="body" x1="150" y1="90" x2="150" y2="150" className={styles.bodyPart} />,
      // Left arm
      <line key="leftArm" x1="150" y1="110" x2="120" y2="140" className={styles.bodyPart} />,
      // Right arm
      <line key="rightArm" x1="150" y1="110" x2="180" y2="140" className={styles.bodyPart} />,
      // Left leg
      <line key="leftLeg" x1="150" y1="150" x2="120" y2="190" className={styles.bodyPart} />,
      // Right leg
      <line key="rightLeg" x1="150" y1="150" x2="180" y2="190" className={styles.bodyPart} />,
    ];

    return (
      <svg viewBox="0 0 200 220" className={styles.hangmanSvg}>
        {/* Gallows */}
        <line x1="20" y1="210" x2="100" y2="210" className={styles.gallows} />
        <line x1="60" y1="210" x2="60" y2="20" className={styles.gallows} />
        <line x1="60" y1="20" x2="150" y2="20" className={styles.gallows} />
        <line x1="150" y1="20" x2="150" y2="50" className={styles.gallows} />

        {/* Body parts based on wrong guesses */}
        {parts.slice(0, wrongGuesses)}
      </svg>
    );
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Hangman"
        instructions={`Guess the word one letter at a time. You have ${MAX_WRONG} chances!`}
        gradient={getGameGradient('hangman')}
      />

      <div className={styles.gameArea}>
        <div className={styles.hangmanArea}>
          {renderHangman()}
          <div className={styles.wrongCount}>
            Wrong: {wrongGuesses} / {MAX_WRONG}
          </div>
        </div>

        <div className={styles.wordArea}>
          <div className={styles.word}>{renderWord()}</div>

          {gameState !== 'playing' && (
            <div className={styles.result}>
              {gameState === 'won' ? (
                <div className={styles.winMessage}>🎉 You got it!</div>
              ) : (
                <div className={styles.loseMessage}>
                  The word was <strong>{word}</strong>
                </div>
              )}

              <div className={styles.feedbackSection}>
                <div className={styles.feedbackLabel}>Was this word too obscure?</div>
                <div className={styles.feedbackButtons}>
                  {wordFeedback ? (
                    <button
                      className={`${styles.feedbackBtn} ${styles.flagged}`}
                      onClick={handleUnflagWord}
                    >
                      ✓ Marked as {wordFeedback.type === FeedbackType.ARCHAIC ? 'Archaic' : 'Obscure'}
                    </button>
                  ) : (
                    <>
                      <button
                        className={`${styles.feedbackBtn} ${styles.archaicBtn}`}
                        onClick={() => handleFlagWord(FeedbackType.ARCHAIC)}
                      >
                        📜 Archaic
                      </button>
                      <button
                        className={`${styles.feedbackBtn} ${styles.obscureBtn}`}
                        onClick={() => handleFlagWord(FeedbackType.OBSCURE)}
                      >
                        🤔 Too Obscure
                      </button>
                    </>
                  )}
                </div>
              </div>

              <button className={styles.playAgainBtn} onClick={initGame}>
                Play Again
              </button>
            </div>
          )}
        </div>

        <div className={styles.keyboard}>
          {ALPHABET.map((letter) => {
            const isGuessed = guessedLetters.has(letter);
            const isCorrect = isGuessed && word.includes(letter);
            const isWrong = isGuessed && !word.includes(letter);

            return (
              <button
                key={letter}
                className={`${styles.key} ${isCorrect ? styles.correct : ''} ${isWrong ? styles.wrong : ''}`}
                onClick={() => guessLetter(letter)}
                disabled={isGuessed || gameState !== 'playing'}
              >
                {letter}
              </button>
            );
          })}
        </div>

        {gameState === 'playing' && (
          <button
            className={styles.hintBtn}
            onClick={useHint}
            disabled={wrongGuesses >= MAX_WRONG - 1}
          >
            💡 Hint (costs 1 guess)
          </button>
        )}

        <div className={styles.statsPanel}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.played}</span>
            <span className={styles.statLabel}>Played</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.won}</span>
            <span className={styles.statLabel}>Won</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0}%
            </span>
            <span className={styles.statLabel}>Win Rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
