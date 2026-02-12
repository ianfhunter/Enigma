import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import DifficultySelector from '../../components/DifficultySelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import SeedDisplay from '../../components/SeedDisplay';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import { generateRandomSeed, parseSeedFromUrl, setSeedInUrl } from '../../enigma-sdk/seeding';
import {
  formatEquation,
  generateSetSquarePuzzle,
  isSolved,
} from './SetSquare.utils';
import styles from './SetSquare.module.css';

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function SetSquare() {
  const { t } = useTranslation();
  const [difficulty, setDifficulty] = useState('medium');
  const [seed, setSeed] = useState(() => parseSeedFromUrl() || generateRandomSeed());
  const [puzzle, setPuzzle] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [showErrors, setShowErrors] = useState(false);

  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const { recordWin, recordGiveUp } = useGameStats('set-square');

  const generatePuzzle = useCallback((customSeed = null, customDifficulty = difficulty) => {
    const activeSeed = customSeed ?? generateRandomSeed();
    const generated = generateSetSquarePuzzle(activeSeed, customDifficulty);
    if (!generated) return;

    setSeed(activeSeed);
    setSeedInUrl(activeSeed);
    setPuzzle(generated);
    setGrid(generated.puzzleGrid.map(row => [...row]));
    setSelectedCell(null);
    setShowErrors(false);
    resetGameState();
  }, [difficulty, resetGameState]);

  useEffect(() => {
    generatePuzzle(seed, difficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  useEffect(() => {
    if (!puzzle || !isPlaying) return;
    if (isSolved(grid, puzzle.solutionGrid)) {
      checkWin(true);
      recordWin();
    }
  }, [grid, puzzle, isPlaying, checkWin, recordWin]);

  const handleCellClick = (row, col) => {
    if (!puzzle || !isPlaying) return;
    if (puzzle.puzzleGrid[row][col] !== 0) return;
    setSelectedCell({ row, col });
  };

  const updateCell = useCallback((value) => {
    if (!selectedCell || !isPlaying || !puzzle) return;
    const { row, col } = selectedCell;
    if (puzzle.puzzleGrid[row][col] !== 0) return;

    setGrid(prev => {
      const next = prev.map(r => [...r]);
      next[row][col] = value;
      return next;
    });
  }, [isPlaying, puzzle, selectedCell]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!selectedCell || !isPlaying) return;

      if (event.key >= '1' && event.key <= '9') updateCell(Number(event.key));
      if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') updateCell(0);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedCell, isPlaying, updateCell]);

  const usedDigits = useMemo(() => new Set(grid.flat().filter(v => v !== 0)), [grid]);

  const handleReset = () => {
    if (!puzzle) return;
    setGrid(puzzle.puzzleGrid.map(row => [...row]));
    setSelectedCell(null);
    setShowErrors(false);
    resetGameState();
  };

  const handleGiveUp = () => {
    if (!puzzle || !isPlaying) return;
    setGrid(puzzle.solutionGrid.map(row => [...row]));
    giveUp();
    recordGiveUp();
  };

  if (!puzzle) return null;

  const errors = new Set();
  if (showErrors) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (grid[r][c] !== 0 && grid[r][c] !== puzzle.solutionGrid[r][c]) errors.add(`${r},${c}`);
      }
    }
  }

  return (
    <div className={styles.container}>
      <GameHeader
        title={t('games.setSquare.title', { defaultValue: 'Set Square' })}
        instructions={t('games.setSquare.instructions', {
          defaultValue: 'Place the digits 1 to 9 once each so every row and column equation is true. Evaluate each equation strictly left-to-right.',
        })}
      />
      <DifficultySelector difficulties={['easy', 'medium', 'hard']} selectedDifficulty={difficulty} onDifficultyChange={setDifficulty} />
      <SeedDisplay
        seed={seed}
        onSeedChange={(newSeed) => generatePuzzle(typeof newSeed === 'string' ? Number.parseInt(newSeed, 10) || generateRandomSeed() : newSeed, difficulty)}
        onNewSeed={() => generatePuzzle(null, difficulty)}
        showNewButton
      />

      <div className={styles.boardWrap}>
        <div className={styles.grid}>
          {grid.map((row, rowIndex) => row.map((cell, colIndex) => {
            const isGiven = puzzle.puzzleGrid[rowIndex][colIndex] !== 0;
            const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
            const hasError = errors.has(`${rowIndex},${colIndex}`);

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={`${styles.cell} ${isGiven ? styles.given : ''} ${isSelected ? styles.selected : ''} ${hasError ? styles.error : ''}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              >
                {cell || ''}
              </button>
            );
          }))}
        </div>

        <div className={styles.equations}>
          <h3>{t('games.setSquare.rowEquations', { defaultValue: 'Row equations' })}</h3>
          {puzzle.rowEquations.map((equation, idx) => <p key={`r-${idx}`}>{formatEquation(equation, 'R', idx)}</p>)}
          <h3>{t('games.setSquare.columnEquations', { defaultValue: 'Column equations' })}</h3>
          {puzzle.colEquations.map((equation, idx) => <p key={`c-${idx}`}>{formatEquation(equation, 'C', idx)}</p>)}
        </div>
      </div>

      <div className={styles.numberPad}>
        {DIGITS.map(digit => (
          <button key={digit} className={styles.numberButton} onClick={() => updateCell(digit)} disabled={usedDigits.has(digit)}>{digit}</button>
        ))}
        <button className={styles.numberButton} onClick={() => updateCell(0)}>⌫</button>
      </div>

      {gameState === 'won' && <GameResult state="won" title={t('games.setSquare.solvedTitle', { defaultValue: 'Solved!' })} message={t('games.setSquare.solvedMessage', { defaultValue: 'All equations are satisfied.' })} />}
      {gameState === 'lost' && <GameResult state="lost" title={t('games.setSquare.gaveUpTitle', { defaultValue: 'Answer revealed' })} message={t('games.setSquare.gaveUpMessage', { defaultValue: 'Try another seed for a fresh puzzle.' })} />}

      <div className={styles.controls}>
        <label>
          <input type="checkbox" checked={showErrors} onChange={(event) => setShowErrors(event.target.checked)} />
          {t('games.setSquare.showErrors', { defaultValue: 'Show errors' })}
        </label>
      </div>

      <div className={styles.buttons}>
        <button onClick={handleReset} className={styles.controlButton}>{t('common.reset', { defaultValue: 'Reset' })}</button>
        <GiveUpButton onGiveUp={handleGiveUp} disabled={!isPlaying} />
        <button onClick={() => generatePuzzle(null, difficulty)} className={styles.controlButton}>{t('common.newPuzzle', { defaultValue: 'New Puzzle' })}</button>
      </div>
    </div>
  );
}
