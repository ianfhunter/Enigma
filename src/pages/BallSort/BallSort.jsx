import { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SeedDisplay, { useSeed } from '../../components/SeedDisplay/SeedDisplay';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import {
  DIFFICULTY_CONFIG,
  generateBallSortPuzzle,
  canMove,
  moveBalls,
  isSolved,
} from './BallSortLogic';
import styles from './BallSort.module.css';

const BALL_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#84cc16', '#10b981', '#06b6d4', '#a855f7', '#fb7185',
];

const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];

export default function BallSort() {
  const { t } = useTranslation();
  const { seed, setSeed, newSeed } = useSeed('ball-sort', () => Math.floor(Math.random() * 1000000));
  const [difficulty, setDifficulty] = useState('medium');
  const [puzzle, setPuzzle] = useState(() => generateBallSortPuzzle(seed, 'medium'));
  const [bins, setBins] = useState(() => puzzle.bins);
  const [selectedBin, setSelectedBin] = useState(null);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    const next = generateBallSortPuzzle(seed, difficulty);
    setPuzzle(next);
    setBins(next.bins);
    setSelectedBin(null);
    setGaveUp(false);
  }, [seed, difficulty]);

  const solved = useMemo(() => isSolved(bins), [bins]);

  const resetBoard = useCallback(() => {
    setBins(puzzle.bins.map((bin) => [...bin]));
    setSelectedBin(null);
    setGaveUp(false);
  }, [puzzle.bins]);

  const handleNewPuzzle = useCallback(() => {
    newSeed();
  }, [newSeed]);

  const handleBinClick = useCallback((index) => {
    if (gaveUp || solved) return;

    if (selectedBin === null) {
      if (bins[index].length > 0) {
        setSelectedBin(index);
      }
      return;
    }

    if (selectedBin === index) {
      setSelectedBin(null);
      return;
    }

    if (canMove(bins, selectedBin, index)) {
      setBins((prev) => moveBalls(prev, selectedBin, index));
      setSelectedBin(null);
      return;
    }

    if (bins[index].length > 0) {
      setSelectedBin(index);
    } else {
      setSelectedBin(null);
    }
  }, [bins, selectedBin, gaveUp, solved]);

  const handleGiveUp = useCallback(() => {
    setBins(puzzle.solution.map((bin) => [...bin]));
    setSelectedBin(null);
    setGaveUp(true);
  }, [puzzle.solution]);

  const moveHint = selectedBin === null
    ? t('ballSort.pickSource', { defaultValue: 'Select a bin to pour from.' })
    : t('ballSort.pickTarget', { defaultValue: 'Now select a destination bin.' });

  return (
    <div className={styles.container}>
      <GameHeader
        title={t('ballSort.title', { defaultValue: 'Ball Sort' })}
        instructions={t('ballSort.instructions', { defaultValue: 'Sort all balls so each non-empty bin contains exactly one color.' })}
      />

      <div className={styles.toolbar}>
        <label className={styles.label}>
          {t('common.difficulty', { defaultValue: 'Difficulty' })}
          <select
            className={styles.select}
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
          >
            {DIFFICULTY_ORDER.map((option) => (
              <option key={option} value={option}>
                {t(`common.${option}`, { defaultValue: option.charAt(0).toUpperCase() + option.slice(1) })}
              </option>
            ))}
          </select>
        </label>

        <button className={styles.button} onClick={handleNewPuzzle}>
          {t('common.newPuzzle', { defaultValue: 'New Puzzle' })}
        </button>
        <button className={styles.button} onClick={resetBoard}>
          {t('common.reset', { defaultValue: 'Reset' })}
        </button>

        <GiveUpButton
          onGiveUp={handleGiveUp}
          disabled={gaveUp || solved}
        />
      </div>

      <SeedDisplay
        seed={seed}
        onSeedChange={setSeed}
        onNewSeed={handleNewPuzzle}
        showNewButton
        variant="compact"
      />

      <p className={styles.meta}>
        {t('ballSort.binStats', {
          defaultValue: 'Full bins: {{fullBins}} • Empty bins: {{emptyBins}} • Capacity: {{capacity}}',
          fullBins: puzzle.fullBins,
          emptyBins: DIFFICULTY_CONFIG[difficulty].emptyBins,
          capacity: puzzle.capacity,
        })}
      </p>

      {!solved && !gaveUp && <p className={styles.hint}>{moveHint}</p>}

      {(solved || gaveUp) && (
        <GameResult
          state={solved && !gaveUp ? 'won' : 'gaveup'}
          title={solved && !gaveUp
            ? t('gameStatus.solved', { defaultValue: 'Solved!' })
            : t('common.solutionShown', { defaultValue: 'Solution shown' })}
          variant="inline"
        />
      )}

      <div className={styles.grid}>
        {bins.map((bin, binIndex) => {
          const isSelected = selectedBin === binIndex;
          const canReceive = selectedBin !== null && canMove(bins, selectedBin, binIndex);

          return (
            <button
              key={binIndex}
              className={`${styles.bin} ${isSelected ? styles.selected : ''} ${canReceive ? styles.validTarget : ''}`}
              onClick={() => handleBinClick(binIndex)}
              aria-label={t('ballSort.binLabel', { defaultValue: 'Bin {{number}}', number: binIndex + 1 })}
            >
              {Array.from({ length: puzzle.capacity }).map((_, slotIndex) => {
                const ball = bin[slotIndex];
                const empty = ball === undefined;
                return (
                  <div
                    key={slotIndex}
                    className={`${styles.slot} ${empty ? styles.emptySlot : ''}`}
                  >
                    {!empty && (
                      <span
                        className={styles.ball}
                        style={{ backgroundColor: BALL_COLORS[ball % BALL_COLORS.length] }}
                      />
                    )}
                  </div>
                );
              })}
            </button>
          );
        })}
      </div>
    </div>
  );
}
