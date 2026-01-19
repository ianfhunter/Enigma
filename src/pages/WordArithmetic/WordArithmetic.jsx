import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import styles from './WordArithmetic.module.css';
import {
  generatePuzzle,
  evaluateWord,
  checkSolution,
  getErrors
} from './logic';

export default function WordArithmetic() {
  const [puzzleData, setPuzzleData] = useState(null);
  const [letterMap, setLetterMap] = useState({});
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);

  const initGame = useCallback(() => {
    const data = generatePuzzle();
    setPuzzleData(data);
    setLetterMap({});
    setSelectedLetter(null);
    setGameState('playing');
    setErrors(new Set());
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    const newErrors = showErrors ? getErrors(puzzleData, letterMap) : new Set();
    setErrors(newErrors);

    if (checkSolution(puzzleData, letterMap)) {
      setGameState('won');
    }
  }, [letterMap, puzzleData, showErrors]);

  // Keyboard input handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;

      // Handle digit keys 0-9
      if (e.key >= '0' && e.key <= '9') {
        const digit = parseInt(e.key, 10);
        const isUsed = Object.values(letterMap).includes(digit);
        if (selectedLetter && !isUsed) {
          setLetterMap(prev => ({
            ...prev,
            [selectedLetter]: digit
          }));
        }
      }

      // Handle backspace/delete to clear
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedLetter && letterMap[selectedLetter] !== undefined) {
          setLetterMap(prev => {
            const newMap = { ...prev };
            delete newMap[selectedLetter];
            return newMap;
          });
        }
      }

      // Handle letter keys to select letters
      if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
        const letter = e.key.toUpperCase();
        const allLetters = new Set([...puzzleData.words.join(''), ...puzzleData.result]);
        if (allLetters.has(letter)) {
          setSelectedLetter(letter);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, selectedLetter, letterMap, puzzleData]);

  const handleLetterClick = (letter) => {
    if (gameState !== 'playing') return;
    setSelectedLetter(letter);
  };

  const handleDigitInput = (digit) => {
    if (!selectedLetter || gameState !== 'playing') return;

    setLetterMap(prev => ({
      ...prev,
      [selectedLetter]: digit
    }));
  };

  const handleClear = () => {
    if (!selectedLetter) return;
    setLetterMap(prev => {
      const newMap = { ...prev };
      delete newMap[selectedLetter];
      return newMap;
    });
  };

  const handleGiveUp = () => {
    if (!puzzleData || gameState !== 'playing') return;
    setLetterMap({ ...puzzleData.solution });
    setGameState('gaveUp');
  };

  if (!puzzleData) return null;

  const allLetters = [...new Set([...puzzleData.words.join(''), ...puzzleData.result])].sort();

  return (
    <div className={styles.container}>
      <GameHeader
        title="Word Arithmetic"
        instructions="Assign a unique digit (0-9) to each letter so the equation is correct. Leading letters cannot be zero."
      />

      <div className={styles.gameArea}>
        <div className={styles.equation}>
          <div className={styles.operands}>
            {puzzleData.words.map((word, i) => (
              <div key={i} className={styles.wordRow}>
                {i > 0 && <span className={styles.operator}>+</span>}
                <div className={styles.word}>
                  {word.split('').map((char, j) => (
                    <span
                      key={j}
                      className={`
                        ${styles.letter}
                        ${selectedLetter === char ? styles.selected : ''}
                        ${errors.has(char) ? styles.error : ''}
                      `}
                      onClick={() => handleLetterClick(char)}
                    >
                      <span className={styles.letterChar}>{char}</span>
                      <span className={styles.letterDigit}>
                        {letterMap[char] !== undefined ? letterMap[char] : '?'}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.line}></div>

          <div className={styles.resultRow}>
            <span className={styles.operator}>=</span>
            <div className={styles.word}>
              {puzzleData.result.split('').map((char, j) => (
                <span
                  key={j}
                  className={`
                    ${styles.letter}
                    ${selectedLetter === char ? styles.selected : ''}
                    ${errors.has(char) ? styles.error : ''}
                  `}
                  onClick={() => handleLetterClick(char)}
                >
                  <span className={styles.letterChar}>{char}</span>
                  <span className={styles.letterDigit}>
                    {letterMap[char] !== undefined ? letterMap[char] : '?'}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.letterBank}>
          <h3>Letters</h3>
          <div className={styles.letters}>
            {allLetters.map(letter => (
              <button
                key={letter}
                className={`
                  ${styles.letterBtn}
                  ${selectedLetter === letter ? styles.selected : ''}
                  ${letterMap[letter] !== undefined ? styles.assigned : ''}
                  ${errors.has(letter) ? styles.error : ''}
                `}
                onClick={() => handleLetterClick(letter)}
              >
                <span>{letter}</span>
                <span className={styles.assignedDigit}>
                  {letterMap[letter] !== undefined ? letterMap[letter] : '-'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.digitPad}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => {
            const isUsed = Object.values(letterMap).includes(digit);
            return (
              <button
                key={digit}
                className={`${styles.digitBtn} ${isUsed ? styles.used : ''}`}
                onClick={() => handleDigitInput(digit)}
                disabled={isUsed}
              >
                {digit}
              </button>
            );
          })}
          <button className={styles.digitBtn} onClick={handleClear}>✕</button>
        </div>

        {gameState === 'won' && (
          <GameResult
            status="won"
            title="🧮 Correct!"
            message="You cracked the code!"
            revealedAnswer={`${puzzleData.words.map((word, i) => `${i > 0 ? ' + ' : ''}${evaluateWord(word, letterMap)}`).join('')} = ${evaluateWord(puzzleData.result, letterMap)}`}
            onNewGame={initGame}
            newGameLabel="New Puzzle"
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            status="gaveUp"
            title="Solution Revealed"
            onNewGame={initGame}
            newGameLabel="New Puzzle"
          />
        )}

        <div className={styles.controls}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showErrors}
              onChange={(e) => setShowErrors(e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            Show errors
          </label>
        </div>

        <div className={styles.buttons}>
          <button className={styles.resetBtn} onClick={() => {
            setLetterMap({});
            setGameState('playing');
          }}>
            Reset
          </button>
          <GiveUpButton
            onGiveUp={handleGiveUp}
            disabled={gameState !== 'playing'}
          />
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
