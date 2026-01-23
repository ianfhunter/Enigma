/**
 * Copyright (C) 2024 Ian Hunter
 *
 * This file is part of Enigma and is licensed under GPL-3.0.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * This component uses data derived from:
 * - MsFit wordlist (GPL-3.0) from https://github.com/nzfeng/crossword-dataset
 *   Copyright (c) Nicole Feng
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getGameGradient } from '../../data/gameRegistry';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useKeyboardInput } from '../../hooks/useKeyboardInput';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import GameHeader from '../../components/GameHeader';
import WordWithDefinition from '../../components/WordWithDefinition/WordWithDefinition';
import {
  parseCluesData,
  generateCrossword,
  isPuzzleComplete,
  getEmptyCells,
} from '../../data/crosswordUtils';
import styles from './Crossword.module.css';

// Import crossword clues (MsFit wordlist + WordNet definitions)
import cluesData from '@datasets/crossword_clues.json';

// Parse clues on module load
const CLUES_DATA = parseCluesData(cluesData);

// Fun loading phrases
const LOADING_PHRASES = [
  "Scheming...",
  "Concocting Dastardly Plans...",
  "Thinking...",
  "Churning...",
  "Consulting the Oracle...",
  "Summoning Words...",
  "Weaving Letters...",
  "Plotting Intersections...",
  "Arranging the Universe...",
  "Channeling Crossword Spirits...",
];

// Export helpers for testing
export { CLUES_DATA };

export const shouldUseNativeKeyboard = (matchMediaFn = typeof window !== 'undefined' ? window.matchMedia : null) => {
  if (!matchMediaFn) return false;
  try {
    const prefersSmallScreen = matchMediaFn('(max-width: 768px)')?.matches;
    const prefersCoarsePointer = matchMediaFn('(pointer: coarse)')?.matches;
    return Boolean(prefersSmallScreen || prefersCoarsePointer);
  } catch {
    return false;
  }
};

export const getLastTypedLetter = (value = '') => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const lastChar = trimmed.slice(-1);
  if (/^[a-zA-Z]$/.test(lastChar)) {
    return lastChar.toUpperCase();
  }
  return null;
};

export default function Crossword() {
  const { t } = useTranslation();
  const [difficulty, setDifficulty] = useState('medium');
  const [puzzle, setPuzzle] = useState(null);
  const [userGrid, setUserGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [direction, setDirection] = useState('across'); // 'across' or 'down'
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const [missedWords, setMissedWords] = useState([]);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [_puzzleSeed, setPuzzleSeed] = useState(() => Date.now());
  const gridRef = useRef(null);
  const nativeInputRef = useRef(null);
  const useNativeKeyboard = useMemo(() => shouldUseNativeKeyboard(), []);
  const [nativeInputValue, setNativeInputValue] = useState('');

  const { stats, updateStats, recordWin, recordGiveUp, winRate, updateBestTime } = useGameStats('crossword', {
    trackBestTime: true,
    trackBestScore: false,
    defaultStats: { avgTime: 0, totalTime: 0 },
  });


  // Generate puzzle
  const generatePuzzle = useCallback((diff, seed) => {
    const newPuzzle = generateCrossword(CLUES_DATA, {
      gridSize: 20,
      targetWords: diff === 'easy' ? 10 : diff === 'hard' ? 18 : 14,
      seed: seed,
      difficulty: diff,
    });

    return newPuzzle;
  }, []);

  // Initialize game
  const initGame = useCallback((diff = difficulty) => {
    setDifficulty(diff);
    resetGameState();
    setShowErrors(false);
    setMissedWords([]);

    // Generate a new seed for new puzzles
    const newSeed = Date.now() + Math.floor(Math.random() * 1000000);
    setPuzzleSeed(newSeed);

    const newPuzzle = generatePuzzle(diff, newSeed);
    setPuzzle(newPuzzle);

    // Initialize empty user grid
    const emptyGrid = newPuzzle.grid.map(row =>
      row.map(cell => cell === null ? null : '')
    );
    setUserGrid(emptyGrid);
    setSelectedCell(null);
    setDirection('across');
    setTimer(0);
    setIsTimerRunning(true);
  }, [difficulty, generatePuzzle]);

  useEffect(() => {
    initGame();
  }, []);

  // Timer
  useEffect(() => {
    let interval;
    if (isTimerRunning && gameState === 'playing') {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, gameState]);


  // Keep hidden input focused when using native keyboard on mobile
  useEffect(() => {
    if (useNativeKeyboard && isPlaying && nativeInputRef.current && selectedCell) {
      nativeInputRef.current.focus({ preventScroll: true });
    }
  }, [useNativeKeyboard, isPlaying, selectedCell]);

  // Check for win
  useEffect(() => {
    if (puzzle && userGrid.length > 0 && isPlaying) {
      if (isPuzzleComplete(puzzle, userGrid)) {
        checkWin(true);
        setIsTimerRunning(false);

        updateBestTime(timer);
        updateStats(prev => ({
          ...prev,
          totalTime: (prev.totalTime || 0) + timer,
          avgTime: Math.round(((prev.totalTime || 0) + timer) / ((stats.won || 0) + 1)),
        }));
        recordWin();
      }
    }
  }, [userGrid, puzzle, isPlaying, checkWin, timer, updateStats, updateBestTime, recordWin, stats.won]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get the current word being worked on
  const getCurrentWord = useCallback(() => {
    if (!selectedCell || !puzzle) return null;

    const { row, col } = selectedCell;
    const clueList = direction === 'across' ? puzzle.across : puzzle.down;

    for (const clue of clueList) {
      const startRow = clue.row;
      const startCol = clue.col;
      const endRow = direction === 'across' ? startRow : startRow + clue.answer.length - 1;
      const endCol = direction === 'across' ? startCol + clue.answer.length - 1 : startCol;

      if (direction === 'across') {
        if (row === startRow && col >= startCol && col <= endCol) {
          return clue;
        }
      } else {
        if (col === startCol && row >= startRow && row <= endRow) {
          return clue;
        }
      }
    }
    return null;
  }, [selectedCell, puzzle, direction]);

  // Get cells for current word
  const getWordCells = useCallback((clue, dir) => {
    if (!clue) return [];
    const cells = [];
    for (let i = 0; i < clue.answer.length; i++) {
      cells.push({
        row: dir === 'across' ? clue.row : clue.row + i,
        col: dir === 'across' ? clue.col + i : clue.col,
      });
    }
    return cells;
  }, []);

  const currentWord = getCurrentWord();
  const currentWordCells = useMemo(() => {
    return currentWord ? getWordCells(currentWord, direction) : [];
  }, [currentWord, direction, getWordCells]);

  // Handle cell click
  const handleCellClick = useCallback((row, col) => {
    if (!puzzle || puzzle.grid[row][col] === null) return;

    if (selectedCell?.row === row && selectedCell?.col === col) {
      // Toggle direction
      setDirection(d => d === 'across' ? 'down' : 'across');
    } else {
      setSelectedCell({ row, col });
    }
  }, [puzzle, selectedCell]);

  // Handle clue click
  const handleClueClick = useCallback((clue, dir) => {
    setDirection(dir);
    setSelectedCell({ row: clue.row, col: clue.col });
  }, []);

  // Move to next cell
  const moveToNextCell = useCallback(() => {
    if (!selectedCell || !puzzle || !puzzle.grid || !puzzle.size) return;

    let { row, col } = selectedCell;

    if (direction === 'across') {
      col++;
      while (col < puzzle.size.cols && puzzle.grid[row]?.[col] === null) {
        col++;
      }
      if (col < puzzle.size.cols && puzzle.grid[row]?.[col] !== null) {
        setSelectedCell({ row, col });
      }
    } else {
      row++;
      while (row < puzzle.size.rows && puzzle.grid[row]?.[col] === null) {
        row++;
      }
      if (row < puzzle.size.rows && puzzle.grid[row]?.[col] !== null) {
        setSelectedCell({ row, col });
      }
    }
  }, [selectedCell, puzzle, direction]);

  // Move to previous cell
  const moveToPrevCell = useCallback(() => {
    if (!selectedCell || !puzzle || !puzzle.grid) return;

    let { row, col } = selectedCell;

    if (direction === 'across') {
      col--;
      while (col >= 0 && puzzle.grid[row]?.[col] === null) {
        col--;
      }
      if (col >= 0 && puzzle.grid[row]?.[col] !== null) {
        setSelectedCell({ row, col });
      }
    } else {
      row--;
      while (row >= 0 && puzzle.grid[row]?.[col] === null) {
        row--;
      }
      if (row >= 0 && puzzle.grid[row]?.[col] !== null) {
        setSelectedCell({ row, col });
      }
    }
  }, [selectedCell, puzzle, direction]);

  // Handle letter input
  const handleLetter = useCallback((letter) => {
    if (!selectedCell || gameState !== 'playing' || !puzzle || !puzzle.grid) return;

    const { row, col } = selectedCell;
    if (!puzzle.grid[row] || puzzle.grid[row][col] === null) return;

    setUserGrid(prev => {
      if (!prev || !prev[row]) return prev;
      const newGrid = prev.map(r => [...r]);
      newGrid[row][col] = letter;
      return newGrid;
    });

    moveToNextCell();
  }, [selectedCell, puzzle, gameState, moveToNextCell]);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (!selectedCell || gameState !== 'playing' || !userGrid) return;

    const { row, col } = selectedCell;

    if (userGrid[row]?.[col]) {
      // Clear current cell
      setUserGrid(prev => {
        if (!prev || !prev[row]) return prev;
        const newGrid = prev.map(r => [...r]);
        newGrid[row][col] = '';
        return newGrid;
      });
    } else {
      // Move to previous cell and clear
      moveToPrevCell();
    }
  }, [selectedCell, userGrid, gameState, moveToPrevCell]);

  // Handle arrow keys
  const handleArrow = useCallback((dir) => {
    if (!selectedCell || !puzzle || !puzzle.grid) return;

    let { row, col } = selectedCell;

    switch (dir) {
      case 'up':
        row--;
        while (row >= 0 && puzzle.grid[row]?.[col] === null) row--;
        if (row >= 0 && puzzle.grid[row]?.[col] !== null) {
          setSelectedCell({ row, col });
          if (direction === 'across') setDirection('down');
        }
        break;
      case 'down':
        row++;
        while (row < puzzle.size.rows && puzzle.grid[row]?.[col] === null) row++;
        if (row < puzzle.size.rows && puzzle.grid[row]?.[col] !== null) {
          setSelectedCell({ row, col });
          if (direction === 'across') setDirection('down');
        }
        break;
      case 'left':
        col--;
        while (col >= 0 && puzzle.grid[row]?.[col] === null) col--;
        if (col >= 0 && puzzle.grid[row]?.[col] !== null) {
          setSelectedCell({ row, col });
          if (direction === 'down') setDirection('across');
        }
        break;
      case 'right':
        col++;
        while (col < puzzle.size.cols && puzzle.grid[row]?.[col] === null) col++;
        if (col < puzzle.size.cols && puzzle.grid[row]?.[col] !== null) {
          setSelectedCell({ row, col });
          if (direction === 'down') setDirection('across');
        }
        break;
    }
  }, [selectedCell, puzzle, direction]);

  // Keyboard input
  useKeyboardInput({
    onLetter: handleLetter,
    onBackspace: handleBackspace,
    onArrow: handleArrow,
    enabled: gameState === 'playing',
  });

  const handleNativeKeyDown = useCallback((e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
    } else if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      const directionFromKey = e.key.replace('Arrow', '').toLowerCase();
      handleArrow(directionFromKey);
    }
  }, [handleBackspace, handleArrow]);

  const handleNativeInputChange = useCallback((e) => {
    const letter = getLastTypedLetter(e.target.value);
    if (letter) {
      handleLetter(letter);
    }
    setNativeInputValue('');
  }, [handleLetter]);

  // Reveal random letter
  const revealRandomLetter = useCallback(() => {
    if (gameState !== 'playing' || !puzzle || !puzzle.grid) return;

    const emptyCells = getEmptyCells(puzzle, userGrid);
    if (!emptyCells || emptyCells.length === 0) return;

    // Pick a random empty cell
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    if (!randomCell || randomCell.answer === undefined) return;

    setUserGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      if (newGrid[randomCell.row] && randomCell.col < newGrid[randomCell.row].length) {
        newGrid[randomCell.row][randomCell.col] = randomCell.answer;
      }
      return newGrid;
    });

    // Select the revealed cell
    setSelectedCell({ row: randomCell.row, col: randomCell.col });
  }, [puzzle, userGrid, gameState]);

  // Reveal word
  const revealWord = useCallback(() => {
    if (!currentWord || gameState !== 'playing' || !puzzle || !puzzle.grid) return;
    if (!currentWordCells || currentWordCells.length === 0) return;

    setUserGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      currentWordCells.forEach(({ row, col }) => {
        if (newGrid[row] && col < newGrid[row].length && puzzle.grid[row] && puzzle.grid[row][col] !== null) {
          newGrid[row][col] = puzzle.grid[row][col];
        }
      });
      return newGrid;
    });
  }, [currentWord, currentWordCells, puzzle, gameState]);

  // Check cell correctness
  const isCellCorrect = useCallback((row, col) => {
    if (!puzzle || !userGrid[row]) return true;
    if (puzzle.grid[row][col] === null) return true;
    if (!userGrid[row][col]) return true;
    return userGrid[row][col].toUpperCase() === puzzle.grid[row][col];
  }, [puzzle, userGrid]);

  // Give up and show solution
  const handleGiveUp = useCallback(() => {
    if (gameState !== 'playing' || !puzzle) return;

    // Find missed words
    const missed = [];
    const allClues = [...(puzzle.across || []), ...(puzzle.down || [])];

    for (const clue of allClues) {
      const dir = puzzle.across.includes(clue) ? 'across' : 'down';
      const dr = dir === 'down' ? 1 : 0;
      const dc = dir === 'across' ? 1 : 0;

      let wordCorrect = true;
      for (let i = 0; i < clue.answer.length; i++) {
        const r = clue.row + dr * i;
        const c = clue.col + dc * i;
        if (!userGrid[r]?.[c] || userGrid[r][c].toUpperCase() !== clue.answer[i]) {
          wordCorrect = false;
          break;
        }
      }

      if (!wordCorrect) {
        missed.push({
          number: clue.number,
          direction: dir,
          answer: clue.answer,
          clue: clue.clue,
        });
      }
    }

    setMissedWords(missed);
    giveUp();
    setIsTimerRunning(false);

    // Fill in the solution
    setUserGrid(prev => {
      if (!puzzle.grid) return prev;
      return puzzle.grid.map(row => row.map(cell => cell));
    });

    // Update stats
    recordGiveUp();
  }, [gameState, puzzle, userGrid, giveUp, recordGiveUp]);

  // Random loading phrase
  const loadingPhrase = useMemo(() =>
    LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)],
  []);

  if (!puzzle) {
    return (
      <div className={styles.container}>
        <GameHeader
          title="Crossword"
          instructions={loadingPhrase}
          gradient={getGameGradient('crossword')}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <GameHeader
        title="Crossword"
        instructions="Fill in the grid using the clues. Click a cell or clue to start!"
        gradient={getGameGradient('crossword')}
      />

      <div className={styles.controls}>
        <div className={styles.difficultySelector}>
          {['easy', 'medium', 'hard'].map(d => (
            <button
              key={d}
              className={`${styles.diffBtn} ${difficulty === d ? styles.active : ''}`}
              onClick={() => initGame(d)}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.topBar}>
          <div className={styles.timer}>
            <span className={styles.timerIcon}>⏱️</span>
            <span className={styles.timerValue}>{formatTime(timer)}</span>
          </div>

          <button
            className={styles.newPuzzleBtn}
            onClick={() => initGame(difficulty)}
          >
            🔄 New Puzzle
          </button>
        </div>

        <div className={styles.mainContent}>
          <div className={styles.gridSection}>
            <div
              className={styles.grid}
              ref={gridRef}
              style={{
                gridTemplateColumns: `repeat(${puzzle.size.cols}, 1fr)`,
                gridTemplateRows: `repeat(${puzzle.size.rows}, 1fr)`,
              }}
            >
              {puzzle.grid.map((row, r) =>
                row.map((cell, c) => {
                  const cellKey = `${r},${c}`;
                  const cellNumber = puzzle.cellNumbers[cellKey];
                  const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                  const isInWord = currentWordCells.some(wc => wc.row === r && wc.col === c);
                  const isBlack = cell === null;
                  const userLetter = userGrid[r]?.[c] || '';
                  const isError = showErrors && !isCellCorrect(r, c);

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`
                        ${styles.cell}
                        ${isBlack ? styles.black : ''}
                        ${isSelected ? styles.selected : ''}
                        ${isInWord && !isSelected ? styles.highlighted : ''}
                        ${isError ? styles.error : ''}
                      `}
                      onClick={() => handleCellClick(r, c)}
                    >
                      {cellNumber && (
                        <span className={styles.cellNumber}>{cellNumber}</span>
                      )}
                      {!isBlack && (
                        <span className={styles.cellLetter}>{userLetter}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {gameState === 'won' && (
              <div className={styles.winBanner}>
                <div className={styles.winTitle}>🎉 Congratulations!</div>
                <div className={styles.winSubtitle}>Completed in {formatTime(timer)}</div>
                <button
                  className={styles.playAgainBtn}
                  onClick={() => initGame(difficulty)}
                >
                  New Puzzle
                </button>
              </div>
            )}

            {gameState === 'gaveUp' && (
              <div className={styles.gaveUpBanner}>
                <div className={styles.gaveUpTitle}>{t('gameStatus.puzzleRevealed')}</div>
                <div className={styles.gaveUpSubtitle}>
                  Time: {formatTime(timer)} • Missed {missedWords.length} word{missedWords.length !== 1 ? 's' : ''}
                </div>
                {missedWords.length > 0 && (
                  <div className={styles.missedWords}>
                    <div className={styles.missedWordsTitle}>Words you missed:</div>
                    <div className={styles.missedWordsList}>
                      {missedWords.map((word, idx) => (
                        <div key={idx} className={styles.missedWord}>
                          <span className={styles.missedWordNumber}>
                            {word.number} {word.direction.charAt(0).toUpperCase()}
                          </span>
                          <WordWithDefinition word={word.answer} className={styles.missedWordAnswer} />
                          <span className={styles.missedWordClue}>{word.clue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  className={styles.playAgainBtn}
                  onClick={() => initGame(difficulty)}
                >
                  New Puzzle
                </button>
              </div>
            )}

            <div className={styles.toolButtons}>
              <button
                className={styles.toolBtn}
                onClick={revealRandomLetter}
                disabled={gameState !== 'playing'}
              >
                Reveal Random Letter
              </button>
              <button
                className={styles.toolBtn}
                onClick={revealWord}
                disabled={gameState !== 'playing' || !currentWord}
              >
                Reveal Word
              </button>
              <button
                className={`${styles.toolBtn} ${showErrors ? styles.active : ''}`}
                onClick={() => setShowErrors(!showErrors)}
                disabled={gameState !== 'playing'}
              >
                {showErrors ? 'Hide Errors' : 'Show Errors'}
              </button>
              <button
                className={`${styles.toolBtn} ${styles.giveUpBtn}`}
                onClick={handleGiveUp}
                disabled={gameState !== 'playing'}
              >
                Give Up
              </button>
            </div>
          </div>

          <div className={styles.cluesSection}>
            <div className={styles.clueColumn}>
              <h3 className={styles.clueHeader}>{t('common.across')}</h3>
              <div className={styles.clueList}>
                {puzzle.across.map(clue => {
                  const isActive = currentWord?.number === clue.number && direction === 'across';
                  return (
                    <div
                      key={`across-${clue.number}`}
                      className={`${styles.clue} ${isActive ? styles.activeClue : ''}`}
                      onClick={() => handleClueClick(clue, 'across')}
                    >
                      <span className={styles.clueNumber}>{clue.number}.</span>
                      <span className={styles.clueText}>{clue.clue}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.clueColumn}>
              <h3 className={styles.clueHeader}>{t('common.down')}</h3>
              <div className={styles.clueList}>
                {puzzle.down.map(clue => {
                  const isActive = currentWord?.number === clue.number && direction === 'down';
                  return (
                    <div
                      key={`down-${clue.number}`}
                      className={`${styles.clue} ${isActive ? styles.activeClue : ''}`}
                      onClick={() => handleClueClick(clue, 'down')}
                    >
                      <span className={styles.clueNumber}>{clue.number}.</span>
                      <span className={styles.clueText}>{clue.clue}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.currentClue}>
          {currentWord && (
            <>
              <span className={styles.currentClueDirection}>
                {currentWord.number} {direction.toUpperCase()}
              </span>
              <span className={styles.currentClueText}>{currentWord.clue}</span>
            </>
          )}
        </div>

        {useNativeKeyboard ? (
          <div className={styles.nativeInputWrapper} aria-hidden="true">
            <input
              ref={nativeInputRef}
              className={styles.nativeHiddenInput}
              type="text"
              value={nativeInputValue}
              onChange={handleNativeInputChange}
              onKeyDown={handleNativeKeyDown}
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
        ) : (
          <div className={styles.mobileKeyboard}>
            <div className={styles.keyboardRow}>
              {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map(key => (
                <button
                  key={key}
                  className={styles.keyboardKey}
                  onClick={() => handleLetter(key)}
                  disabled={gameState !== 'playing'}
                >
                  {key}
                </button>
              ))}
            </div>
            <div className={styles.keyboardRow}>
              {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map(key => (
                <button
                  key={key}
                  className={styles.keyboardKey}
                  onClick={() => handleLetter(key)}
                  disabled={gameState !== 'playing'}
                >
                  {key}
                </button>
              ))}
            </div>
            <div className={styles.keyboardRow}>
              {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map(key => (
                <button
                  key={key}
                  className={styles.keyboardKey}
                  onClick={() => handleLetter(key)}
                  disabled={gameState !== 'playing'}
                >
                  {key}
                </button>
              ))}
              <button
                className={`${styles.keyboardKey} ${styles.backspaceKey}`}
                onClick={handleBackspace}
                disabled={gameState !== 'playing'}
              >
                ⌫
              </button>
            </div>
          </div>
        )}

        <div className={styles.statsPanel}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.played}</span>
            <span className={styles.statLabel}>{t('common.played')}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.won}</span>
            <span className={styles.statLabel}>{t('gameStatus.won')}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {stats.bestTime ? formatTime(stats.bestTime) : '-'}
            </span>
            <span className={styles.statLabel}>{t('common.best')}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {(stats.avgTime || 0) ? formatTime(stats.avgTime) : '-'}
            </span>
            <span className={styles.statLabel}>{t('common.avg')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
