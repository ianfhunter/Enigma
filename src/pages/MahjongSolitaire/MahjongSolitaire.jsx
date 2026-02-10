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

const TILE_WIDTH = 56;
const TILE_HEIGHT = 74;
const TILE_GAP = 58;
const LAYER_OFFSET = 8;
const MAX_GENERATION_ATTEMPTS = 700;

const keyFor = (x, y, z) => `${x},${y},${z}`;

function parseLayerRows(rows, z) {
  const layout = [];
  rows.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === 'X') {
        layout.push({ x, y, z, key: keyFor(x, y, z) });
      }
    });
  });
  return layout;
}

const SHAPE_DEFINITIONS = {
  classic: {
    nameKey: 'mahjongSolitaire.shapes.classic',
    layers: [
      [
        'XXXXXXXXXXXX',
        'XXXXXXXXXXXX',
        'XXXXXXXXXXXX',
        'XXXXXXXXXXXX',
        'XXXXXXXXXXXX',
        'XXXXXXXXXXXX',
        'XXXXXXXXXXXX',
        'XXXXXXXXXXXX',
      ],
      [
        '............',
        '............',
        '...XXXXXX...',
        '...XXXXXX...',
        '...XXXXXX...',
        '...XXXXXX...',
        '............',
        '............',
      ],
      [
        '............',
        '............',
        '............',
        '.....XX.....',
        '.....XX.....',
        '............',
        '............',
        '............',
      ],
    ],
  },
  turtle: {
    nameKey: 'mahjongSolitaire.shapes.turtle',
    layers: [
      [
        '....XXXX....',
        '..XXXXXXXX..',
        '.XXXXXXXXXX.',
        'XXXXXXXXXXXX',
        'XXXXXXXXXXXX',
        '.XXXXXXXXXX.',
        '..XXXXXXXX..',
        '....XXXX....',
      ],
      [
        '............',
        '....XXXX....',
        '...XXXXXX...',
        '..XXXXXXXX..',
        '..XXXXXXXX..',
        '...XXXXXX...',
        '....XXXX....',
        '............',
      ],
      [
        '............',
        '............',
        '.....XX.....',
        '....XXXX....',
        '....XXXX....',
        '.....XX.....',
        '............',
        '............',
      ],
    ],
  },
  spider: {
    nameKey: 'mahjongSolitaire.shapes.spider',
    layers: [
      [
        'XX..XXXX..XX',
        'XXX.XXXX.XXX',
        '.XXXXXXXXXX.',
        '..XXXXXXXX..',
        '..XXXXXXXX..',
        '.XXXXXXXXXX.',
        'XXX.XXXX.XXX',
        'XX..XXXX..XX',
      ],
      [
        '............',
        '....XXXX....',
        '...XXXXXX...',
        '..XXXXXXXX..',
        '..XXXXXXXX..',
        '...XXXXXX...',
        '....XXXX....',
        '............',
      ],
    ],
  },
  pyramid: {
    nameKey: 'mahjongSolitaire.shapes.pyramid',
    layers: [
      [
        '.....XX.....',
        '....XXXX....',
        '...XXXXXX...',
        '..XXXXXXXX..',
        '.XXXXXXXXXX.',
        'XXXXXXXXXXXX',
        'XXXXXXXXXXXX',
        'XXXXXXXXXXXX',
      ],
      [
        '............',
        '.....XX.....',
        '....XXXX....',
        '...XXXXXX...',
        '..XXXXXXXX..',
        '.XXXXXXXXXX.',
        '.XXXXXXXXXX.',
        '............',
      ],
    ],
  },
  tiger: {
    nameKey: 'mahjongSolitaire.shapes.tiger',
    layers: [
      [
        'XXXXXXXXXXXX',
        'X..X.XX.X..X',
        'XXXXXXXXXXXX',
        'X.XX....XX.X',
        'XXXXXXXXXXXX',
        'XX..XXXX..XX',
        'XXXXXXXXXXXX',
        '.XX......XX.',
      ],
      [
        '............',
        '..XXXXXXXX..',
        '...XXXXXX...',
        '....XXXX....',
        '....XXXX....',
        '...XXXXXX...',
        '..XXXXXXXX..',
        '............',
      ],
    ],
  },
  rooster: {
    nameKey: 'mahjongSolitaire.shapes.rooster',
    layers: [
      [
        '..XXXX......',
        '.XXXXXX.....',
        'XXXXXXXX....',
        '.XXXXXXXX...',
        '..XXXXXXXX..',
        '...XXXXXXXX.',
        '....XXXXXXXX',
        '.....XXXXXX.',
      ],
      [
        '............',
        '..XXXX......',
        '..XXXXXX....',
        '...XXXXXX...',
        '....XXXXXX..',
        '.....XXXX...',
        '......XX....',
        '............',
      ],
    ],
  },
  hourglass: {
    nameKey: 'mahjongSolitaire.shapes.hourglass',
    layers: [
      [
        'XXXXXXXXXXXX',
        '.XXXXXXXXXX.',
        '..XXXXXXXX..',
        '...XXXXXX...',
        '...XXXXXX...',
        '..XXXXXXXX..',
        '.XXXXXXXXXX.',
        'XXXXXXXXXXXX',
      ],
      [
        '............',
        '...XXXXXX...',
        '....XXXX....',
        '.....XX.....',
        '.....XX.....',
        '....XXXX....',
        '...XXXXXX...',
        '............',
      ],
    ],
  },
  butterfly: {
    nameKey: 'mahjongSolitaire.shapes.butterfly',
    layers: [
      [
        'XX..XXXX..XX',
        'XXX.XXXX.XXX',
        'XXXXXXXXXXXX',
        '.XXXXXXXXXX.',
        '.XXXXXXXXXX.',
        'XXXXXXXXXXXX',
        'XXX.XXXX.XXX',
        'XX..XXXX..XX',
      ],
      [
        '............',
        '..XX....XX..',
        '...XX..XX...',
        '....XXXX....',
        '....XXXX....',
        '...XX..XX...',
        '..XX....XX..',
        '............',
      ],
    ],
  },
};

export const SHAPE_KEYS = Object.keys(SHAPE_DEFINITIONS);

function createLayoutFromLayers(layerRows) {
  const layout = layerRows.flatMap((rows, z) => parseLayerRows(rows, z));
  if (layout.length % 2 !== 0) {
    throw new Error('Mahjong layout must contain an even number of tiles.');
  }
  return layout;
}

function buildLayoutInfo(layout) {
  const indexByKey = new Map(layout.map((pos, index) => [pos.key, index]));
  const aboveByIndex = layout.map(pos =>
    layout
      .map((candidate, candidateIndex) => ({ candidate, candidateIndex }))
      .filter(({ candidate }) => candidate.x === pos.x && candidate.y === pos.y && candidate.z > pos.z)
      .map(({ candidateIndex }) => candidateIndex)
  );

  const sideNeighbors = layout.map(pos => ({
    left: indexByKey.get(keyFor(pos.x - 1, pos.y, pos.z)) ?? null,
    right: indexByKey.get(keyFor(pos.x + 1, pos.y, pos.z)) ?? null,
  }));

  return { layout, aboveByIndex, sideNeighbors };
}

export const SHAPES = Object.fromEntries(
  Object.entries(SHAPE_DEFINITIONS).map(([key, definition]) => {
    const layout = createLayoutFromLayers(definition.layers);
    return [
      key,
      {
        ...definition,
        ...buildLayoutInfo(layout),
      },
    ];
  })
);

export const CLASSIC_SHAPE_KEY = 'classic';

export function isPositionFree(shape, index, occupied) {
  if (!occupied[index]) return false;
  const above = shape.aboveByIndex[index];
  if (above.some(aboveIndex => occupied[aboveIndex])) return false;
  const { left, right } = shape.sideNeighbors[index];
  const leftBlocked = left !== null && occupied[left];
  const rightBlocked = right !== null && occupied[right];
  return !(leftBlocked && rightBlocked);
}

export function isTileFree(shape, index, tiles) {
  const occupied = tiles.map(tile => tile !== null);
  return isPositionFree(shape, index, occupied);
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

export function generateSolvablePuzzle(shape, random) {
  const totalTiles = shape.layout.length;
  const occupied = new Array(totalTiles).fill(true);
  const removalSequence = [];

  let attempt = 0;
  while (attempt < MAX_GENERATION_ATTEMPTS) {
    occupied.fill(true);
    removalSequence.length = 0;

    while (removalSequence.length * 2 < totalTiles) {
      const freeIndices = [];
      for (let i = 0; i < totalTiles; i += 1) {
        if (isPositionFree(shape, i, occupied)) {
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
    throw new Error(`Failed to generate a solvable Mahjong Solitaire layout for shape "${shape.nameKey}".`);
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

function getBoardMetrics(shape) {
  const maxX = Math.max(...shape.layout.map(pos => pos.x));
  const maxY = Math.max(...shape.layout.map(pos => pos.y));
  const maxLayer = Math.max(...shape.layout.map(pos => pos.z));
  const width = (maxX + 1) * TILE_GAP + maxLayer * LAYER_OFFSET + TILE_WIDTH;
  const height = (maxY + 1) * TILE_GAP + maxLayer * LAYER_OFFSET + TILE_HEIGHT;
  const offset = maxLayer * LAYER_OFFSET + 8;
  return {
    boardWidth: width + offset * 2,
    boardHeight: height + offset * 2,
    baseOffset: offset,
    maxZ: maxLayer,
  };
}

function MahjongSolitaire() {
  const { t } = useTranslation();
  const gameKey = 'mahjong-solitaire';
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const { stats, recordGamePlayed } = useGameStats(gameKey);

  const [seed, setSeed] = useState(getTodayDateString());
  const [resetCounter, setResetCounter] = useState(0);
  const [activeShapeKey, setActiveShapeKey] = useState(CLASSIC_SHAPE_KEY);
  const [nextShapeKey, setNextShapeKey] = useState(CLASSIC_SHAPE_KEY);
  const [tiles, setTiles] = useState([]);
  const [solutionSequence, setSolutionSequence] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [autoSolveIndex, setAutoSolveIndex] = useState(null);

  const activeShape = SHAPES[activeShapeKey];
  const shapeName = t(activeShape.nameKey);

  const { boardWidth, boardHeight, baseOffset, maxZ } = useMemo(
    () => getBoardMetrics(activeShape),
    [activeShape]
  );

  useEffect(() => {
    const random = createSeededRandom(stringToSeed(`${seed}-${activeShapeKey}`));
    const { tiles: newTiles, solutionSequence: newSolution } = generateSolvablePuzzle(activeShape, random);
    setTiles(newTiles);
    setSolutionSequence(newSolution);
    setSelectedIndex(null);
    setAutoSolveIndex(null);
    resetGameState();
  }, [seed, resetCounter, activeShape, activeShapeKey, resetGameState]);

  useEffect(() => {
    if (!isPlaying) return;
    const remaining = tiles.some(tile => tile !== null);
    if (!remaining) {
      checkWin(true);
      recordGamePlayed(true);
    }
  }, [tiles, checkWin, recordGamePlayed, isPlaying]);

  useEffect(() => {
    if (autoSolveIndex === null || !solutionSequence.length) return;
    if (autoSolveIndex >= solutionSequence.length) return;

    const timer = setTimeout(() => {
      setTiles(prev => {
        const next = [...prev];
        const [firstIndex, secondIndex] = solutionSequence[autoSolveIndex];
        next[firstIndex] = null;
        next[secondIndex] = null;
        return next;
      });
      setAutoSolveIndex(index => index + 1);
    }, 100);

    return () => clearTimeout(timer);
  }, [autoSolveIndex, solutionSequence]);

  const freeIndices = useMemo(() => {
    const free = new Set();
    tiles.forEach((tile, index) => {
      if (tile && isTileFree(activeShape, index, tiles)) {
        free.add(index);
      }
    });
    return free;
  }, [activeShape, tiles]);

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
      setTiles(prev => {
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
    setActiveShapeKey(nextShapeKey);
    setSeed(stringToSeed(`${getTodayDateString()}-${Date.now()}`));
  }, [nextShapeKey]);

  const handleReset = useCallback(() => {
    setResetCounter(counter => counter + 1);
  }, []);

  const handleGiveUp = useCallback(() => {
    if (!isPlaying) return;
    giveUp();
    recordGamePlayed(false);
    setSelectedIndex(null);
    setAutoSolveIndex(0);
  }, [giveUp, isPlaying, recordGamePlayed]);

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
        <SeedDisplay seed={seed} onSeedChange={setSeed} />
        <div className={styles.stats}>
          <span>{t('mahjongSolitaire.tilesRemaining', 'Tiles remaining')}: {tileCount}</span>
          <span>{t('mahjongSolitaire.layers', 'Layers')}: {maxZ + 1}</span>
          <span>{t('mahjongSolitaire.currentShape', 'Shape')}: {shapeName}</span>
        </div>
      </div>

      <div className={styles.shapeRow}>
        <label htmlFor="mahjong-shape-select" className={styles.shapeLabel}>
          {t('mahjongSolitaire.nextGameShape', 'Shape for next game')}
        </label>
        <select
          id="mahjong-shape-select"
          className={styles.shapeSelect}
          value={nextShapeKey}
          onChange={event => setNextShapeKey(event.target.value)}
        >
          {SHAPE_KEYS.map(shapeKey => (
            <option key={shapeKey} value={shapeKey}>{t(SHAPES[shapeKey].nameKey)}</option>
          ))}
        </select>
      </div>

      <div
        className={styles.board}
        style={{
          width: `${boardWidth}px`,
          height: `${boardHeight}px`,
        }}
      >
        {activeShape.layout.map((pos, index) => {
          const tile = tiles[index];
          if (!tile) return null;
          const isFree = freeIndices.has(index);
          const isSelected = selectedIndex === index;
          const left = pos.x * TILE_GAP + pos.z * LAYER_OFFSET + baseOffset;
          const top = pos.y * TILE_GAP - pos.z * LAYER_OFFSET + baseOffset;
          return (
            <button
              key={pos.key}
              type="button"
              className={`${styles.tileButton} ${isFree ? styles.free : ''} ${isSelected ? styles.selected : ''}`}
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
        <GiveUpButton onGiveUp={handleGiveUp} disabled={!isPlaying} />
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
