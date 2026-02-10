/**
 * Mahjong Solitaire - Classic tile-matching with stacked layouts.
 *
 * Generated with reverse construction:
 * 1) Start from a full layout, repeatedly remove free pairs to build a removal sequence.
 * 2) Reverse that sequence and place matching pairs to guarantee solvability.
 */

import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay/SeedDisplay';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import MahjongTile from '../../components/MahjongTile';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import { createSeededRandom, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import styles from './MahjongSolitaire.module.css';

const TILE_TYPES = [
  { type: 'bamboo', value: 1 },
  { type: 'bamboo', value: 2 },
  { type: 'bamboo', value: 3 },
  { type: 'bamboo', value: 4 },
  { type: 'bamboo', value: 5 },
  { type: 'bamboo', value: 6 },
  { type: 'bamboo', value: 7 },
  { type: 'bamboo', value: 8 },
  { type: 'bamboo', value: 9 },
  { type: 'character', value: 1 },
  { type: 'character', value: 2 },
  { type: 'character', value: 3 },
  { type: 'character', value: 4 },
  { type: 'character', value: 5 },
  { type: 'character', value: 6 },
  { type: 'character', value: 7 },
  { type: 'character', value: 8 },
  { type: 'character', value: 9 },
  { type: 'dot', value: 1 },
  { type: 'dot', value: 2 },
  { type: 'dot', value: 3 },
  { type: 'dot', value: 4 },
  { type: 'dot', value: 5 },
  { type: 'dot', value: 6 },
  { type: 'dot', value: 7 },
  { type: 'dot', value: 8 },
  { type: 'dot', value: 9 },
  { type: 'wind', value: 'east' },
  { type: 'wind', value: 'south' },
  { type: 'wind', value: 'west' },
  { type: 'wind', value: 'north' },
  { type: 'dragon', value: 'red' },
  { type: 'dragon', value: 'green' },
  { type: 'dragon', value: 'white' },
];

const LAYOUT_LAYERS = [
  { z: 0, xStart: 0, xEnd: 11, yStart: 0, yEnd: 7 },
  { z: 1, xStart: 3, xEnd: 8, yStart: 2, yEnd: 5 },
  { z: 2, xStart: 5, xEnd: 6, yStart: 3, yEnd: 4 },
];

const TILE_WIDTH = 56;
const TILE_HEIGHT = 74;
const TILE_GAP = 58;
const LAYER_OFFSET = 8;

const keyFor = (x, y, z) => `${x},${y},${z}`;

export function createLayout() {
  const layout = [];
  for (const layer of LAYOUT_LAYERS) {
    for (let y = layer.yStart; y <= layer.yEnd; y += 1) {
      for (let x = layer.xStart; x <= layer.xEnd; x += 1) {
        layout.push({ x, y, z: layer.z, key: keyFor(x, y, layer.z) });
      }
    }
  }
  return layout;
}

export const LAYOUT = createLayout();

const INDEX_BY_KEY = new Map(LAYOUT.map((pos, index) => [pos.key, index]));
const ABOVE_BY_INDEX = LAYOUT.map((pos, index) =>
  LAYOUT
    .map((candidate, candidateIndex) => ({ candidate, candidateIndex }))
    .filter(({ candidate }) => candidate.x === pos.x && candidate.y === pos.y && candidate.z > pos.z)
    .map(({ candidateIndex }) => candidateIndex)
);
const SIDE_NEIGHBORS = LAYOUT.map((pos) => ({
  left: INDEX_BY_KEY.get(keyFor(pos.x - 1, pos.y, pos.z)) ?? null,
  right: INDEX_BY_KEY.get(keyFor(pos.x + 1, pos.y, pos.z)) ?? null,
}));

export function isPositionFree(index, occupied) {
  if (!occupied[index]) return false;
  const above = ABOVE_BY_INDEX[index];
  if (above.some(aboveIndex => occupied[aboveIndex])) return false;
  const { left, right } = SIDE_NEIGHBORS[index];
  const leftBlocked = left !== null && occupied[left];
  const rightBlocked = right !== null && occupied[right];
  return !(leftBlocked && rightBlocked);
}

export function isTileFree(index, tiles) {
  const occupied = tiles.map(tile => tile !== null);
  return isPositionFree(index, occupied);
}

function shuffleInPlace(items, random) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

function buildTileTypes(pairCount, random) {
  const types = [];
  for (let i = 0; i < pairCount; i += 1) {
    types.push({ ...TILE_TYPES[i % TILE_TYPES.length] });
  }
  shuffleInPlace(types, random);
  return types;
}

export function generateSolvablePuzzle(random) {
  const totalTiles = LAYOUT.length;
  const occupied = new Array(totalTiles).fill(true);
  const removalSequence = [];

  let attempt = 0;
  while (attempt < 200) {
    occupied.fill(true);
    removalSequence.length = 0;

    while (removalSequence.length * 2 < totalTiles) {
      const freeIndices = [];
      for (let i = 0; i < totalTiles; i += 1) {
        if (isPositionFree(i, occupied)) {
          freeIndices.push(i);
        }
      }

      if (freeIndices.length < 2) {
        break;
      }

      const firstIndex = freeIndices.splice(Math.floor(random() * freeIndices.length), 1)[0];
      const secondIndex = freeIndices[Math.floor(random() * freeIndices.length)];
      removalSequence.push([firstIndex, secondIndex]);
      occupied[firstIndex] = false;
      occupied[secondIndex] = false;
    }

    if (removalSequence.length * 2 === totalTiles) {
      break;
    }

    attempt += 1;
  }

  if (removalSequence.length * 2 !== totalTiles) {
    throw new Error('Failed to generate a solvable Mahjong Solitaire layout.');
  }

  const tiles = new Array(totalTiles).fill(null);
  const tileTypes = buildTileTypes(removalSequence.length, random);
  const reversedSequence = [...removalSequence].reverse();

  reversedSequence.forEach((pair, index) => {
    const tileType = tileTypes[index];
    const tileKey = `${tileType.type}-${tileType.value}`;
    const [firstIndex, secondIndex] = pair;
    tiles[firstIndex] = { id: index * 2, tileKey, ...tileType };
    tiles[secondIndex] = { id: index * 2 + 1, tileKey, ...tileType };
  });

  return { tiles, solutionSequence: removalSequence };
}

function MahjongSolitaire() {
  const { t } = useTranslation();
  const gameKey = 'mahjong-solitaire';
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const { stats, recordWin, recordGiveUp } = useGameStats(gameKey);

  const [gameId, setGameId] = useState(0);
  const [seed, setSeed] = useState(() => stringToSeed(`${getTodayDateString()}-${Date.now()}`));
  const [tiles, setTiles] = useState([]);
  const [solutionSequence, setSolutionSequence] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [autoSolveIndex, setAutoSolveIndex] = useState(null);
  const [hintIndices, setHintIndices] = useState(null);

  const { boardWidth, boardHeight, baseOffset, maxZ } = useMemo(() => {
    const maxX = Math.max(...LAYOUT.map(pos => pos.x));
    const maxY = Math.max(...LAYOUT.map(pos => pos.y));
    const maxLayer = Math.max(...LAYOUT.map(pos => pos.z));
    const width = (maxX + 1) * TILE_GAP + maxLayer * LAYER_OFFSET + TILE_WIDTH;
    const height = (maxY + 1) * TILE_GAP + maxLayer * LAYER_OFFSET + TILE_HEIGHT;
    const offset = maxLayer * LAYER_OFFSET + 8;
    return { boardWidth: width + offset * 2, boardHeight: height + offset * 2, baseOffset: offset, maxZ: maxLayer };
  }, []);

  // Reset everything when gameId changes
  useEffect(() => {
    setTiles([]);
    setSolutionSequence([]);
    setSelectedIndex(null);
    setAutoSolveIndex(null);
    setHintIndices(null);
    resetGameState();

    // Generate new puzzle with unique seed
    const newSeed = stringToSeed(`${getTodayDateString()}-${gameId}-${Date.now()}`);
    const random = createSeededRandom(newSeed);
    const { tiles: newTiles, solutionSequence: newSolution } = generateSolvablePuzzle(random);
    setTiles(newTiles);
    setSolutionSequence(newSolution);
  }, [gameId, resetGameState]);

  useEffect(() => {
    if (!isPlaying) return;
    // Only check for win when tiles have been initialized (not empty initial state)
    const hasTiles = tiles.length > 0;
    if (!hasTiles) return;
    const remaining = tiles.some(tile => tile !== null);
    if (!remaining) {
      checkWin(true);
      recordWin({});
    }
  }, [tiles, checkWin, recordWin, isPlaying]);

  useEffect(() => {
    if (autoSolveIndex === null || !solutionSequence.length) return;
    if (autoSolveIndex >= solutionSequence.length) return;

    const timer = setTimeout(() => {
      setTiles((prev) => {
        const next = [...prev];
        const [firstIndex, secondIndex] = solutionSequence[autoSolveIndex];
        next[firstIndex] = null;
        next[secondIndex] = null;
        return next;
      });
      setAutoSolveIndex(index => index + 1);
    }, 120);

    return () => clearTimeout(timer);
  }, [autoSolveIndex, solutionSequence]);

  const freeIndices = useMemo(() => {
    const free = new Set();
    tiles.forEach((tile, index) => {
      if (tile && isTileFree(index, tiles)) {
        free.add(index);
      }
    });
    return free;
  }, [tiles]);

  const tileCount = useMemo(() => tiles.filter(Boolean).length, [tiles]);

  const handleTileClick = useCallback((index) => {
    if (!isPlaying || !tiles[index]) return;
    if (!freeIndices.has(index)) return;

    if (selectedIndex === null) {
      setSelectedIndex(index);
      return;
    }

    if (selectedIndex === index) {
      setSelectedIndex(null);
      return;
    }

    const selectedTile = tiles[selectedIndex];
    const currentTile = tiles[index];
    if (!selectedTile || !currentTile) {
      setSelectedIndex(null);
      return;
    }

    if (selectedTile.tileKey === currentTile.tileKey) {
      setTiles((prev) => {
        const next = [...prev];
        next[selectedIndex] = null;
        next[index] = null;
        return next;
      });
      setSelectedIndex(null);
      return;
    }

    setSelectedIndex(index);
  }, [freeIndices, isPlaying, selectedIndex, tiles]);

  const handleNewGame = useCallback(() => {
    // Increment gameId to force complete reset
    setGameId(id => id + 1);
  }, []);

  const handleReset = useCallback(() => {
    // Reset to same game to replay the same puzzle
    setGameId(id => id);
  }, []);

  const handleGiveUp = useCallback(() => {
    if (!isPlaying) return;
    giveUp();
    recordGiveUp({});
    setAutoSolveIndex(0);
  }, [giveUp, isPlaying, recordGiveUp]);

  // Clear hint when player makes a move
  useEffect(() => {
    if (selectedIndex !== null) {
      setHintIndices(null);
    }
  }, [selectedIndex]);

  const handleHint = useCallback(() => {
    if (!isPlaying || freeIndices.size < 2) return;

    const freeArray = Array.from(freeIndices);
    const tileGroups = {};

    // Group free tiles by their tileKey
    freeArray.forEach(index => {
      const tile = tiles[index];
      if (tile) {
        if (!tileGroups[tile.tileKey]) {
          tileGroups[tile.tileKey] = [];
        }
        tileGroups[tile.tileKey].push(index);
      }
    });

    // Find a pair with matching tiles
    for (const tileKey in tileGroups) {
      if (tileGroups[tileKey].length >= 2) {
        const [first, second] = tileGroups[tileKey];
        setHintIndices([first, second]);
        // Clear hint after 3 seconds
        setTimeout(() => setHintIndices(null), 3000);
        return;
      }
    }
  }, [freeIndices, isPlaying, tiles]);

  const normalizedState = gameState === 'gaveUp' ? 'gaveup' : gameState;

  return (
    <div className={styles.container}>
      <GameHeader
        title={t('mahjongSolitaire.title', 'Mahjong Solitaire')}
        emoji="🀄"
        instructions={t(
          'mahjongSolitaire.instructions',
          'Match pairs of identical tiles. A tile is free if nothing is on top and at least one side is open.'
        )}
      />

      <div className={styles.metaRow}>
        <SeedDisplay key={gameId} seed={seed} onSeedChange={setSeed} />
        <div className={styles.stats}>
          <span>{t('mahjongSolitaire.tilesRemaining', 'Tiles remaining')}: {tileCount}</span>
          <span>{t('mahjongSolitaire.layers', 'Layers')}: {maxZ + 1}</span>
        </div>
      </div>

      <div
        key={gameId}
        className={styles.board}
        style={{
          width: `${boardWidth}px`,
          height: `${boardHeight}px`,
        }}
      >
        {LAYOUT.map((pos, index) => {
          const tile = tiles[index];
          if (!tile) return null;
          const isFree = freeIndices.has(index);
          const isHint = hintIndices && hintIndices.includes(index);
          const isSelected = selectedIndex === index;
          const left = pos.x * TILE_GAP + pos.z * LAYER_OFFSET + baseOffset;
          const top = pos.y * TILE_GAP - pos.z * LAYER_OFFSET + baseOffset;
          return (
            <button
              key={pos.key}
              type="button"
              className={`${styles.tileButton} ${isFree ? styles.free : ''} ${isSelected ? styles.selected : ''} ${isHint ? styles.hint : ''}`}
              data-z={pos.z}
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${TILE_WIDTH}px`,
                height: `${TILE_HEIGHT}px`,
                zIndex: pos.z * 100 + pos.y,
              }}
              onClick={() => handleTileClick(index)}
              aria-label={t('mahjongSolitaire.tileAria', 'Mahjong tile')}
            >
              <MahjongTile type={tile.type} value={tile.value} />
            </button>
          );
        })}
      </div>

      <div className={styles.controls}>
        <button className={styles.resetButton} onClick={handleReset} type="button">
          {t('common.reset', 'Reset')}
        </button>
        <button onClick={handleHint} disabled={!isPlaying || freeIndices.size < 2} className={styles.hintButton} type="button">
          💡 {t('common.hint', 'Hint')}
        </button>
        <button className={styles.newGameButton} onClick={handleNewGame} type="button">
          {t('common.newGame', 'New Game')}
        </button>
      </div>

      <GameResult
        state={normalizedState}
        message={
          normalizedState === 'won'
            ? t('mahjongSolitaire.winMessage', 'Board cleared!')
            : t('mahjongSolitaire.giveUpMessage', 'Solution revealed.')
        }
        stats={normalizedState === 'won' ? stats : []}
      />
    </div>
  );
}

export default MahjongSolitaire;
