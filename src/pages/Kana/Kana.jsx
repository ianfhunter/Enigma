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
const CELL = 48;
const PAD = 24;

function edgeKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export default function Kana() {
  const { t } = useTranslation();
  const [size, setSize] = useState(6);
  const [seed, setSeed] = useState(() => stringToSeed(`kana-${getTodayDateString()}`));
  const [puzzle, setPuzzle] = useState(null);
  const [playerEdges, setPlayerEdges] = useState(new Set());
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const { recordWin, recordGiveUp } = useGameStats('kana');

  const initGame = useCallback(() => {
    const random = createSeededRandom(seed + size * 1009);
    setPuzzle(generateKanaPuzzle(size, random));
    setPlayerEdges(new Set());
    resetGameState();
  }, [seed, size, resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const shownEdges = gameState === 'gave_up' && puzzle ? puzzle.solutionEdges : playerEdges;

  useEffect(() => {
    if (!puzzle || !isPlaying) return;
    if (checkKanaConstraints(puzzle, playerEdges)) {
      checkWin();
      recordWin();
    }
  }, [puzzle, playerEdges, isPlaying, checkWin, recordWin]);

  const clueMap = useMemo(() => {
    if (!puzzle) return new Map();
    return new Map(puzzle.clues.map((c) => [`${c.r},${c.c}`, c.symbol]));
  }, [puzzle]);

  const toggleEdge = (a, b) => {
    if (!isPlaying) return;
    const key = edgeKey(a, b);
    setPlayerEdges((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allSegments = useMemo(() => {
    if (!puzzle) return [];
    const segments = [];
    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.size; c++) {
        const a = `${r},${c}`;
        if (c + 1 < puzzle.size) {
          const b = `${r},${c + 1}`;
          segments.push({ a, b, x1: PAD + c * CELL, y1: PAD + r * CELL, x2: PAD + (c + 1) * CELL, y2: PAD + r * CELL });
        }
        if (r + 1 < puzzle.size) {
          const b = `${r + 1},${c}`;
          segments.push({ a, b, x1: PAD + c * CELL, y1: PAD + r * CELL, x2: PAD + c * CELL, y2: PAD + (r + 1) * CELL });
        }
      }
    }
    return segments;
  }, [puzzle]);

  const reveal = () => {
    if (!puzzle) return;
    setPlayerEdges(new Set(puzzle.solutionEdges));
    giveUp();
    recordGiveUp();
  };

  const boardSize = puzzle ? PAD * 2 + (puzzle.size - 1) * CELL : 0;

  return (
    <div className={styles.container}>
      <GameHeader title={t('games.kana')}>
        <SizeSelector options={SIZES} value={size} onChange={setSize} />
        <button type="button" onClick={() => setSeed((s) => s + 1)} className={styles.newGameBtn}>{t('common.newGame')}</button>
        <GiveUpButton onGiveUp={reveal} disabled={!isPlaying || !puzzle} />
        <SeedDisplay seed={seed} gameId="kana" compact />
      </GameHeader>

      <p className={styles.rules}>{t('kana.rules')}</p>

      {puzzle && (
        <svg className={styles.board} width={boardSize} height={boardSize} viewBox={`0 0 ${boardSize} ${boardSize}`}>
          {Array.from({ length: puzzle.size + 1 }, (_, i) => i).map((_, i) => (
            <g key={`grid-${i}`}>
              <line x1={PAD / 2} y1={PAD / 2 + i * CELL} x2={boardSize - PAD / 2} y2={PAD / 2 + i * CELL} className={styles.gridLine} />
              <line x1={PAD / 2 + i * CELL} y1={PAD / 2} x2={PAD / 2 + i * CELL} y2={boardSize - PAD / 2} className={styles.gridLine} />
            </g>
          ))}

          {allSegments.map((segment) => {
            const key = edgeKey(segment.a, segment.b);
            const active = shownEdges.has(key);
            return (
              <g key={key}>
                {active && <line x1={segment.x1} y1={segment.y1} x2={segment.x2} y2={segment.y2} className={styles.activeEdge} />}
                <line
                  x1={segment.x1}
                  y1={segment.y1}
                  x2={segment.x2}
                  y2={segment.y2}
                  className={styles.hitEdge}
                  onClick={() => toggleEdge(segment.a, segment.b)}
                />
              </g>
            );
          })}

          {Array.from({ length: puzzle.size * puzzle.size }, (_, idx) => {
            const r = Math.floor(idx / puzzle.size);
            const c = idx % puzzle.size;
            const key = `${r},${c}`;
            const symbol = clueMap.get(key);
            const x = PAD + c * CELL;
            const y = PAD + r * CELL;
            return (
              <g key={key}>
                <circle cx={x} cy={y} r="4" className={styles.node} />
                {symbol && <text x={x} y={y + 7} className={styles.clue}>{symbol}</text>}
              </g>
            );
          })}
        </svg>
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
