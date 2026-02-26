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
import { generateKanaPuzzle, checkKanaConstraints, KANA_SYMBOLS } from './kanaLogic';
import styles from './Kana.module.css';

const SIZES = [6, 8, 10];
const CELL = 48;
const PAD = 24;

function edgeKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function parseRule(signature) {
  const [orientation, d1, d2] = signature.split(':');
  return { orientation, d1: Number(d1), d2: Number(d2) };
}

export default function Kana() {
  const { t } = useTranslation();
  const [size, setSize] = useState(6);
  const [seed, setSeed] = useState(() => stringToSeed(`kana-${getTodayDateString()}`));
  const [puzzle, setPuzzle] = useState(null);
  const [playerEdges, setPlayerEdges] = useState(new Set());
  const [showHint, setShowHint] = useState(false);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const { recordWin, recordGiveUp } = useGameStats('kana');

  const initGame = useCallback(() => {
    const random = createSeededRandom(seed + size * 1009);
    setPuzzle(generateKanaPuzzle(size, random));
    setPlayerEdges(new Set());
    setShowHint(false);
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

  const hintLines = useMemo(() => {
    if (!puzzle) return [];
    return KANA_SYMBOLS
      .filter((symbol) => puzzle.symbolRules[symbol])
      .map((symbol) => {
        const { orientation, d1, d2 } = parseRule(puzzle.symbolRules[symbol]);
        const orientationText = orientation === 'horizontal' ? t('kana.horizontal') : t('kana.vertical');
        return t('kana.hintLine', { symbol, orientation: orientationText, d1, d2 });
      });
  }, [puzzle, t]);

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
          segments.push({ a, b, x1: PAD + CELL / 2 + c * CELL, y1: PAD + CELL / 2 + r * CELL, x2: PAD + CELL / 2 + (c + 1) * CELL, y2: PAD + CELL / 2 + r * CELL });
        }
        if (r + 1 < puzzle.size) {
          const b = `${r + 1},${c}`;
          segments.push({ a, b, x1: PAD + CELL / 2 + c * CELL, y1: PAD + CELL / 2 + r * CELL, x2: PAD + CELL / 2 + c * CELL, y2: PAD + CELL / 2 + (r + 1) * CELL });
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

  const boardWidth = puzzle ? PAD * 2 + puzzle.size * CELL : 0;
  const boardHeight = puzzle ? PAD * 2 + puzzle.size * CELL : 0;

  return (
    <div className={styles.container}>
      <GameHeader title={t('games.kana')}>
        <SizeSelector options={SIZES} value={size} onChange={setSize} />
        <button type="button" onClick={() => setSeed((s) => s + 1)} className={styles.newGameBtn}>{t('common.newGame')}</button>
        <button type="button" onClick={() => setShowHint((v) => !v)} className={styles.hintBtn}>{t('kana.hintButton')}</button>
        <GiveUpButton onGiveUp={reveal} disabled={!isPlaying || !puzzle} />
        <SeedDisplay seed={seed} gameId="kana" compact />
      </GameHeader>

      <details className={styles.rulesPanel}>
        <summary className={styles.rulesSummary}>{t('kana.rulesTitle')}</summary>
        <p className={styles.rules}>{t('kana.rules')}</p>
      </details>

      {showHint && (
        <div className={styles.hintBox}>
          <strong>{t('kana.hintTitle')}</strong>
          <p className={styles.hintExplain}>{t('kana.hintExplain')}</p>
          {hintLines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      )}

      {puzzle && (
        <svg className={styles.board} width={boardWidth} height={boardHeight} viewBox={`0 0 ${boardWidth} ${boardHeight}`}>
          {Array.from({ length: puzzle.size + 1 }, (_, i) => i).map((_, i) => (
            <g key={`grid-${i}`}>
              <line x1={PAD} y1={PAD + i * CELL} x2={PAD + puzzle.size * CELL} y2={PAD + i * CELL} className={styles.gridLine} />
              <line x1={PAD + i * CELL} y1={PAD} x2={PAD + i * CELL} y2={PAD + puzzle.size * CELL} className={styles.gridLine} />
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
            const x = PAD + CELL / 2 + c * CELL;
            const y = PAD + CELL / 2 + r * CELL;
            return (
              <g key={key}>
                <circle cx={x} cy={y} r="4" className={styles.node} />
                {symbol && <text x={x} y={y} className={styles.clue}>{symbol}</text>}
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
