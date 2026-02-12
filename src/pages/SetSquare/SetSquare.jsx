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
import { buildDilatedRows, buildColumnOperatorRows, buildColumnFooter, generateSetSquarePuzzle, isSolved } from './SetSquare.utils';
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

  const displayRows = buildDilatedRows(grid, puzzle.rowEquations);
  const columnOperatorRows = buildColumnOperatorRows(puzzle.colEquations);
  const footerCells = buildColumnFooter(puzzle.colEquations);

  return (
    <div className={styles.container}>
      <GameHeader
        title={t('games.setSquare.title', { defaultValue: 'Set Square' })}
        instructions={t('games.setSquare.instructions', {
          defaultValue: 'Each row is shown as NUM OP NUM OP NUM = result. Fill the number cells with digits 1–9 once each. Column math is evaluated top-to-bottom and left-to-right.',
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
        <div className={styles.expressionBoard}>
          {displayRows.map((row, rowIndex) => (
            <div key={`group-${rowIndex}`}>
              <div className={styles.expressionRow}>
                {row.cells.map((cell, colIndex) => {
                  if (cell.kind === 'number') {
                    const isGiven = puzzle.puzzleGrid[cell.row][cell.col] !== 0;
                    const isSelected = selectedCell?.row === cell.row && selectedCell?.col === cell.col;
                    const hasError = errors.has(`${cell.row},${cell.col}`);
                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        className={`${styles.numberCell} ${isGiven ? styles.given : ''} ${isSelected ? styles.selected : ''} ${hasError ? styles.error : ''}`}
                        onClick={() => handleCellClick(cell.row, cell.col)}
                      >
                        {cell.value || ''}
                      </button>
                    );
                  }

                  return <div key={`${rowIndex}-${colIndex}`} className={styles.operatorCell}>{cell.value}</div>;
                })}

                <div className={styles.equalsCell}>= {row.target}</div>
              </div>

              {rowIndex < 2 && (
                <div className={styles.columnOperatorRow}>
                  {columnOperatorRows[rowIndex].map((cell, colIndex) => (
                    <div
                      key={`col-op-${rowIndex}-${colIndex}`}
                      className={cell.kind === 'colOp' ? styles.columnOperatorCell : styles.columnSpacerCell}
                    >
                      {cell.value}
                    </div>
                  ))}
                  <div className={styles.columnSpacerCell}></div>
                </div>
              )}
            </div>
          ))}

          <div className={styles.footerRow}>
            <div className={styles.columnTarget}>= {footerCells[0].value}</div>
            <div className={styles.columnSpacerCell}></div>
            <div className={styles.columnTarget}>= {footerCells[1].value}</div>
            <div className={styles.columnSpacerCell}></div>
            <div className={styles.columnTarget}>= {footerCells[2].value}</div>
            <div className={styles.columnSpacerCell}></div>
          </div>
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
