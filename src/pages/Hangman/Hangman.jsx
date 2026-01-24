import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getRandomHangmanWord } from '../../data/wordUtils';
import { getGameGradient } from '../../data/gameRegistry';
import { useGameStats } from '../../hooks/useGameStats';
import { useKeyboardInput } from '../../hooks/useKeyboardInput';
import { useGameState } from '../../hooks/useGameState';
import GameHeader from '../../components/GameHeader';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import StatsPanel from '../../components/StatsPanel';
import WordWithDefinition from '../../components/WordWithDefinition/WordWithDefinition';
import styles from './Hangman.module.css';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_WRONG = 6;

export default function Hangman() {
  const { t } = useTranslation();
  const [word, setWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState(new Set());
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const { gameState, checkWin: checkWinState, giveUp, lose, reset: resetGameState, isPlaying } = useGameState();
  const { stats, recordWin, recordLoss, recordGiveUp, winRate } = useGameStats('hangman', {
    trackBestTime: false,
    trackBestScore: false,
    trackStreak: false,
  });

  const initGame = useCallback(() => {
    setWord(getRandomHangmanWord(5, 8));
    setGuessedLetters(new Set());
    setWrongGuesses(0);
    resetGameState();
  }, [resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const checkWin = useCallback((letters, targetWord) => {
    return targetWord.split('').every(letter => letters.has(letter));
  }, []);

  const guessLetter = useCallback((letter) => {
    if (!isPlaying || guessedLetters.has(letter)) return;

    const newGuessed = new Set(guessedLetters).add(letter);
    setGuessedLetters(newGuessed);

    if (!word.includes(letter)) {
      const newWrong = wrongGuesses + 1;
      setWrongGuesses(newWrong);

      if (newWrong >= MAX_WRONG) {
        lose();
        recordLoss();
      }
    } else if (checkWin(newGuessed, word)) {
      checkWinState(true);
      recordWin();
    }
  }, [isPlaying, guessedLetters, word, wrongGuesses, checkWin, checkWinState, lose, recordWin, recordLoss]);

  const handleGiveUp = () => {
    if (!isPlaying || !word) return;
    giveUp();
    recordGiveUp();
  };

  const useHint = () => {
    if (!isPlaying || wrongGuesses >= MAX_WRONG - 1) return;

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
    const showAll = gameState === 'lost' || gameState === 'gaveUp';
    return word.split('').map((letter, i) => (
      <span key={i} className={styles.letterSlot}>
        {guessedLetters.has(letter) || showAll ? (
          <span className={showAll && !guessedLetters.has(letter) ? styles.revealed : ''}>
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
            <GameResult
              state={gameState === 'won' ? 'won' : gameState === 'gaveUp' ? 'gaveup' : 'lost'}
              title={gameState === 'won' ? '🎉 You got it!' : undefined}
              message={gameState !== 'won' && <span>The word was <WordWithDefinition word={word} className={styles.wordDef} /></span>}
              actions={[{ label: 'Play Again', onClick: initGame, primary: true }]}
            />
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
          <div className={styles.actionButtons}>
            <button
              className={styles.hintBtn}
              onClick={useHint}
              disabled={wrongGuesses >= MAX_WRONG - 1}
            >
              💡 Hint (costs 1 guess)
            </button>
            <GiveUpButton
              onGiveUp={handleGiveUp}
              disabled={gameState !== 'playing'}
            />
          </div>
        )}

        <StatsPanel
          stats={[
            { label: 'Played', value: stats.played },
            { label: 'Won', value: stats.won },
            { label: 'Win Rate', value: `${winRate}%` },
          ]}
          className={styles.statsPanel}
        />
      </div>
    </div>
  );
}
