import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './WordArithmetic.module.css';

// Classic cryptarithmetic puzzles with solutions
const PUZZLES = [
  { words: ['SEND', 'MORE'], result: 'MONEY', solution: { S: 9, E: 5, N: 6, D: 7, M: 1, O: 0, R: 8, Y: 2 } },
  { words: ['EAT', 'THAT'], result: 'APPLE', solution: { E: 8, A: 1, T: 9, H: 0, P: 2, L: 3 } },
  { words: ['TO', 'GO'], result: 'OUT', solution: { T: 2, O: 1, G: 8, U: 9 } },
  { words: ['NO', 'GUN'], result: 'HUNT', solution: { N: 2, O: 5, G: 1, U: 4, H: 3, T: 7 } },
  { words: ['AB', 'BC'], result: 'CCC', solution: { A: 1, B: 9, C: 8 } },
  { words: ['ONE', 'ONE'], result: 'TWO', solution: { O: 2, N: 8, E: 4, T: 5, W: 6 } },
  { words: ['CROSS', 'ROADS'], result: 'DANGER', solution: { C: 9, R: 6, O: 2, S: 3, A: 5, D: 1, N: 8, G: 7, E: 4 } },
];

function generatePuzzle() {
  const puzzle = PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
  return { ...puzzle };
}

function evaluateWord(word, letterMap) {
  let value = 0;
  for (const char of word) {
    if (letterMap[char] === undefined) return null;
    value = value * 10 + letterMap[char];
  }
  return value;
}

function checkSolution(puzzle, letterMap) {
  // Check all letters are assigned
  const allLetters = new Set([...puzzle.words.join(''), ...puzzle.result]);
  for (const letter of allLetters) {
    if (letterMap[letter] === undefined) return false;
  }
  
  // Check no leading zeros
  for (const word of [...puzzle.words, puzzle.result]) {
    if (letterMap[word[0]] === 0) return false;
  }
  
  // Check values are unique
  const usedDigits = new Set(Object.values(letterMap));
  if (usedDigits.size !== Object.keys(letterMap).length) return false;
  
  // Check equation
  let sum = 0;
  for (const word of puzzle.words) {
    const val = evaluateWord(word, letterMap);
    if (val === null) return false;
    sum += val;
  }
  
  const resultVal = evaluateWord(puzzle.result, letterMap);
  return sum === resultVal;
}

function getErrors(puzzle, letterMap) {
  const errors = new Set();
  
  // Check for duplicate digit assignments
  const digitToLetters = {};
  for (const [letter, digit] of Object.entries(letterMap)) {
    if (digit === undefined) continue;
    if (!digitToLetters[digit]) digitToLetters[digit] = [];
    digitToLetters[digit].push(letter);
    if (digitToLetters[digit].length > 1) {
      for (const l of digitToLetters[digit]) {
        errors.add(l);
      }
    }
  }
  
  // Check for leading zeros
  for (const word of [...puzzle.words, puzzle.result]) {
    if (letterMap[word[0]] === 0) {
      errors.add(word[0]);
    }
  }
  
  return errors;
}

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

  if (!puzzleData) return null;

  const allLetters = [...new Set([...puzzleData.words.join(''), ...puzzleData.result])].sort();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Word Arithmetic</h1>
        <p className={styles.instructions}>
          Assign a unique digit (0-9) to each letter so the equation is correct.
          Leading letters cannot be zero.
        </p>
      </div>

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
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🧮</div>
            <h3>Correct!</h3>
            <p>You cracked the code!</p>
            <div className={styles.solution}>
              {puzzleData.words.map((word, i) => (
                <span key={i}>
                  {i > 0 && ' + '}
                  {evaluateWord(word, letterMap)}
                </span>
              ))}
              {' = '}
              {evaluateWord(puzzleData.result, letterMap)}
            </div>
          </div>
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
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
