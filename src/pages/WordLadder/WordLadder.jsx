import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { isValidWord, generateWordLadderPuzzle, differsByOneLetter } from '../../data/wordUtils';
import WordWithDefinition from '../../components/WordWithDefinition/WordWithDefinition';
import styles from './WordLadder.module.css';

// Word ladder puzzles use 4-letter words; keep length centralized
const WORD_LENGTH = 4;

// Export helpers for testing
export { generateWordLadderPuzzle, differsByOneLetter, WORD_LENGTH };

export default function WordLadder() {
  const { t } = useTranslation();
  const [puzzle, setPuzzle] = useState(null);
  const [userSteps, setUserSteps] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [gameWon, setGameWon] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const inputRef = useRef(null);

  const initializePuzzle = useCallback(() => {
    const newPuzzle = generateWordLadderPuzzle(WORD_LENGTH, 3, 5);
    if (newPuzzle) {
      setPuzzle(newPuzzle);
      setUserSteps([]);
      setCurrentInput('');
      setMessage({ text: '', type: '' });
      setGameWon(false);
      setShowSolution(false);
      setMoveCount(0);
    }
  }, []);

  useEffect(() => {
    initializePuzzle();
  }, [initializePuzzle]);

  useEffect(() => {
    if (inputRef.current && !gameWon) {
      inputRef.current.focus();
    }
  }, [userSteps, gameWon]);

  const getCurrentWord = () => {
    if (userSteps.length === 0) return puzzle?.startWord;
    return userSteps[userSteps.length - 1];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!puzzle || gameWon) return;

    const word = currentInput.toUpperCase().trim();
    const current = getCurrentWord();

    if (word.length !== puzzle.startWord.length) {
      setMessage({ text: `Word must be ${puzzle.startWord.length} letters`, type: 'error' });
      return;
    }

    if (!isValidWord(word)) {
      setMessage({ text: 'Not a valid word', type: 'error' });
      return;
    }

    if (!differsByOneLetter(current, word)) {
      setMessage({ text: 'Must change exactly one letter', type: 'error' });
      return;
    }

    if (word === current) {
      setMessage({ text: "That's the same word!", type: 'error' });
      return;
    }

    // Check if going backwards
    if (userSteps.includes(word) || word === puzzle.startWord) {
      setMessage({ text: "You've already used that word!", type: 'error' });
      return;
    }

    setUserSteps(prev => [...prev, word]);
    setMoveCount(prev => prev + 1);
    setCurrentInput('');
    setMessage({ text: '', type: '' });

    // Check win condition
    if (word === puzzle.endWord) {
      setGameWon(true);
      const optimalSteps = puzzle.solution.length - 1;
      const userStepsCount = userSteps.length + 1;

      if (userStepsCount === optimalSteps) {
        setMessage({ text: '🎉 Perfect! You found the optimal path!', type: 'success' });
      } else if (userStepsCount <= optimalSteps + 2) {
        setMessage({ text: '✨ Excellent work!', type: 'success' });
      } else {
        setMessage({ text: '✓ You made it!', type: 'success' });
      }
    } else {
      // Check if the current word can reach the end word in one step
      const currentWord = word;
      const canReachEnd = differsByOneLetter(currentWord, puzzle.endWord) && isValidWord(puzzle.endWord);

      if (canReachEnd) {
        // User has reached the step before the final word - they've solved it!
        setGameWon(true);
        const optimalSteps = puzzle.solution.length - 1;
        const userStepsCount = userSteps.length + 1;

        if (userStepsCount === optimalSteps) {
          setMessage({ text: '🎉 Perfect! You found the optimal path!', type: 'success' });
        } else if (userStepsCount <= optimalSteps + 2) {
          setMessage({ text: '✨ Excellent work!', type: 'success' });
        } else {
          setMessage({ text: '✓ You made it!', type: 'success' });
        }
      }
    }
  };

  const undoStep = () => {
    if (userSteps.length > 0) {
      setUserSteps(prev => prev.slice(0, -1));
      setMessage({ text: '', type: '' });
      setGameWon(false);
    }
  };

  const resetPuzzle = () => {
    setUserSteps([]);
    setCurrentInput('');
    setMessage({ text: '', type: '' });
    setGameWon(false);
    setMoveCount(0);
  };

  if (!puzzle) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('common.generatingPuzzle')}</div>
      </div>
    );
  }

  const allSteps = [puzzle.startWord, ...userSteps];
  const optimalSteps = puzzle.solution.length - 1;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Word Ladder"
        instructions={`Transform ${puzzle.startWord} into ${puzzle.endWord} by changing one letter at a time. Each step must be a valid word.`}
      />

      <div className={styles.gameArea}>
        <div className={styles.ladderSection}>
          <div className={styles.ladder}>
            {/* Start word */}
            <div className={`${styles.rung} ${styles.startRung}`}>
              <div className={styles.rungLabel}>{t('common.start')}</div>
              <div className={styles.word}>
                {puzzle.startWord.split('').map((letter, i) => (
                  <span key={i} className={styles.letter}>{letter}</span>
                ))}
              </div>
            </div>

            {/* Connector */}
            <div className={styles.connector}>
              <div className={styles.connectorLine} />
            </div>

            {/* User steps */}
            {userSteps.map((word, stepIndex) => (
              <div key={stepIndex}>
                <div className={`${styles.rung} ${word === puzzle.endWord ? styles.endRung : styles.stepRung}`}>
                  <div className={styles.rungLabel}>Step {stepIndex + 1}</div>
                  <div className={styles.word}>
                    {word.split('').map((letter, i) => {
                      const prevWord = stepIndex === 0 ? puzzle.startWord : userSteps[stepIndex - 1];
                      const isChanged = letter !== prevWord[i];
                      return (
                        <span
                          key={i}
                          className={`${styles.letter} ${isChanged ? styles.changedLetter : ''}`}
                        >
                          {letter}
                        </span>
                      );
                    })}
                  </div>
                </div>
                {stepIndex < userSteps.length - 1 && (
                  <div className={styles.connector}>
                    <div className={styles.connectorLine} />
                  </div>
                )}
              </div>
            ))}

            {/* Input area (if not won) */}
            {!gameWon && (
              <>
                <div className={styles.connector}>
                  <div className={`${styles.connectorLine} ${styles.dashed}`} />
                </div>
                <div className={`${styles.rung} ${styles.inputRung}`}>
                  <div className={styles.rungLabel}>{t('common.next')}</div>
                  <form onSubmit={handleSubmit} className={styles.inputForm}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value.toUpperCase())}
                      maxLength={puzzle.startWord.length}
                      placeholder={t('common.typeWord')}
                      className={styles.input}
                      autoComplete="off"
                      spellCheck="false"
                    />
                  </form>
                </div>
                <div className={styles.connector}>
                  <div className={`${styles.connectorLine} ${styles.dashed}`} />
                </div>
              </>
            )}

            {/* End word (target) */}
            <div className={`${styles.rung} ${gameWon ? styles.endRung : styles.targetRung}`}>
              <div className={styles.rungLabel}>{gameWon ? t('common.complete') : t('common.goal')}</div>
              <div className={styles.word}>
                {puzzle.endWord.split('').map((letter, i) => (
                  <span key={i} className={styles.letter}>{letter}</span>
                ))}
              </div>
            </div>
          </div>

          {message.text && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}

          <div className={styles.controls}>
            <button
              className={styles.btn}
              onClick={undoStep}
              disabled={userSteps.length === 0}
            >
              Undo
            </button>
            <button className={styles.btn} onClick={resetPuzzle}>
              Reset
            </button>
            <button
              className={`${styles.btn} ${styles.submitBtn}`}
              onClick={handleSubmit}
              disabled={gameWon}
            >
              Submit
            </button>
          </div>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.statsPanel}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>{t('common.yourSteps')}</span>
              <span className={styles.statValue}>{userSteps.length}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>{t('common.optimal')}</span>
              <span className={styles.statValue}>{optimalSteps}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Moves</span>
              <span className={styles.statValue}>{moveCount}</span>
            </div>
          </div>

          <div className={styles.tips}>
            <h3>{t('common.howToPlay')}</h3>
            <ul>
              <li>{t('wordLadder.rule1')}</li>
              <li>{t('wordLadder.rule2')}</li>
              <li>{t('wordLadder.rule3')}</li>
              <li>{t('wordLadder.rule4')}</li>
            </ul>
          </div>

          <div className={styles.actions}>
            <GiveUpButton
              onGiveUp={() => setShowSolution(true)}
              disabled={showSolution || gameWon}
              buttonText={t('common.showSolution')}
            />
            <button className={styles.newGameBtn} onClick={initializePuzzle}>
              New Puzzle
            </button>
          </div>

          {showSolution && (
            <div className={styles.solutionPanel}>
              <h4>Solution ({optimalSteps} steps)</h4>
              <div className={styles.solutionPath}>
                {puzzle.solution.map((word, i) => (
                  <span key={i} className={styles.solutionWord}>
                    <WordWithDefinition word={word} />
                    {i < puzzle.solution.length - 1 && (
                      <span className={styles.arrow}>→</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
