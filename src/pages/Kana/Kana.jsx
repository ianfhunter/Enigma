import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import SeedDisplay from '../../components/SeedDisplay';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import { createSeededRandom, stringToSeed, getTodayDateString } from '../../data/wordUtils';
import { generateKanaPuzzle, checkKanaConstraints } from './kanaLogic';
import styles from './Kana.module.css';

const SIZES = [6, 8, 10];

export default function Kana() {
  const { t } = useTranslation();
  const [size, setSize] = useState(6);
  const [seed, setSeed] = useState(() => stringToSeed(`kana-${getTodayDateString()}`));
  const [puzzle, setPuzzle] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const { recordWin, recordGiveUp } = useGameStats('kana');

  const initGame = useCallback(() => {
    const random = createSeededRandom(seed + size * 1009);
    const next = generateKanaPuzzle(size, random);
    setPuzzle(next);
    setSelected(new Set());
    resetGameState();
  }, [seed, size, resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzle || !isPlaying) return;
    if (checkKanaConstraints(puzzle, selected)) {
      checkWin();
      recordWin();
    }
  }, [selected, puzzle, isPlaying, checkWin, recordWin]);

  const onCellClick = (r, c) => {
    if (!isPlaying) return;
    const key = `${r},${c}`;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const showSolution = () => {
    if (!puzzle) return;
    setSelected(new Set(puzzle.solutionSet));
    giveUp();
    recordGiveUp();
  };

  const solvedSet = gameState === 'gave_up' && puzzle ? puzzle.solutionSet : selected;

  const links = useMemo(() => {
    if (!puzzle) return new Set();
    const set = solvedSet;
    const edges = new Set();
    for (const key of set) {
      const [r, c] = key.split(',').map(Number);
      const right = `${r},${c + 1}`;
      const down = `${r + 1},${c}`;
      if (set.has(right)) edges.add(`${key}|${right}`);
      if (set.has(down)) edges.add(`${key}|${down}`);
    }
    return edges;
  }, [puzzle, solvedSet]);

  return (
    <div className={styles.container}>
      <GameHeader title={t('games.kana')}>
        <SizeSelector options={SIZES} value={size} onChange={setSize} />
        <button type="button" onClick={() => setSeed((s) => s + 1)} className={styles.newGameBtn}>
          {t('common.newGame')}
        </button>
        <GiveUpButton onGiveUp={showSolution} disabled={!isPlaying || !puzzle} />
        <SeedDisplay seed={seed} gameId="kana" compact />
      </GameHeader>

      <p className={styles.rules}>{t('kana.rules')}</p>

      {puzzle && (
        <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${puzzle.size}, 42px)` }}>
          {Array.from({ length: puzzle.size * puzzle.size }, (_, idx) => {
            const r = Math.floor(idx / puzzle.size);
            const c = idx % puzzle.size;
            const key = `${r},${c}`;
            const clue = puzzle.clues.find((item) => item.r === r && item.c === c);
            const active = solvedSet.has(key);
            const rightEdge = links.has(`${key}|${r},${c + 1}`);
            const leftEdge = links.has(`${r},${c - 1}|${key}`);
            const downEdge = links.has(`${key}|${r + 1},${c}`);
            const upEdge = links.has(`${r - 1},${c}|${key}`);

            return (
              <button
                key={key}
                type="button"
                className={`${styles.cell} ${active ? styles.active : ''} ${clue ? styles.clue : ''}`}
                onClick={() => onCellClick(r, c)}
              >
                {(upEdge || downEdge || leftEdge || rightEdge) && (
                  <span className={styles.centerDot}>
                    {upEdge && <span className={`${styles.link} ${styles.up}`} />}
                    {downEdge && <span className={`${styles.link} ${styles.down}`} />}
                    {leftEdge && <span className={`${styles.link} ${styles.left}`} />}
                    {rightEdge && <span className={`${styles.link} ${styles.right}`} />}
                  </span>
                )}
                <span className={styles.symbol}>{clue?.symbol || ''}</span>
              </button>
            );
          })}
        </div>
      )}

      <GameResult
        state={gameState}
        winMessage={t('kana.won')}
        loseMessage={t('gameStatus.gaveUp')}
        onNewGame={initGame}
      />
    </div>
  );
}
