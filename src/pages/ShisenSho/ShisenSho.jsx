/**
 * Shisen-Sho - Japanese Tile Matching Puzzle
 *
 * Rules:
 * - Match pairs of identical tiles by connecting them with a path
 * - The path can have at most 2 turns (90-degree bends)
 * - The path cannot pass through other tiles (but can go around the board edges)
 * - Clear all tiles to win
 */

import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay/SeedDisplay';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import MahjongTile from '../../components/MahjongTile';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import { createSeededRandom, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import styles from './ShisenSho.module.css';

// Traditional Mahjong tile types
const TILE_TYPES = [
  // Bamboo (Suo/索子) 1-9
  { type: 'bamboo', value: 1 },
  { type: 'bamboo', value: 2 },
  { type: 'bamboo', value: 3 },
  { type: 'bamboo', value: 4 },
  { type: 'bamboo', value: 5 },
  { type: 'bamboo', value: 6 },
  { type: 'bamboo', value: 7 },
  { type: 'bamboo', value: 8 },
  { type: 'bamboo', value: 9 },
  // Characters (Wan/萬子) 1-9
  { type: 'character', value: 1 },
  { type: 'character', value: 2 },
  { type: 'character', value: 3 },
  { type: 'character', value: 4 },
  { type: 'character', value: 5 },
  { type: 'character', value: 6 },
  { type: 'character', value: 7 },
  { type: 'character', value: 8 },
  { type: 'character', value: 9 },
  // Dots (Tong/筒子) 1-9
  { type: 'dot', value: 1 },
  { type: 'dot', value: 2 },
  { type: 'dot', value: 3 },
  { type: 'dot', value: 4 },
  { type: 'dot', value: 5 },
  { type: 'dot', value: 6 },
  { type: 'dot', value: 7 },
  { type: 'dot', value: 8 },
  { type: 'dot', value: 9 },
  // Winds (Feng/風牌)
  { type: 'wind', value: 'east' },
  { type: 'wind', value: 'south' },
  { type: 'wind', value: 'west' },
  { type: 'wind', value: 'north' },
  // Dragons (Sanyuan/三元牌)
  { type: 'dragon', value: 'red' },
  { type: 'dragon', value: 'green' },
  { type: 'dragon', value: 'white' },
];

const ROWS = 8;
const COLS = 16;

// Generate a solvable puzzle
function generatePuzzle(random) {
  const tileCount = Math.floor((ROWS * COLS) / 2);
  const tiles = [];

  // Create pairs of tiles
  for (let i = 0; i < tileCount; i++) {
    const tileType = TILE_TYPES[i % TILE_TYPES.length];
    tiles.push({ ...tileType, id: i * 2 });
    tiles.push({ ...tileType, id: i * 2 + 1 });
  }

  // Shuffle
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  // Place on grid
  const grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
  let idx = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (idx < tiles.length) {
        grid[r][c] = tiles[idx++];
      }
    }
  }

  return grid;
}

// Check if two tiles match
function tilesMatch(tile1, tile2) {
  if (!tile1 || !tile2) return false;
  if (tile1.id === tile2.id) return false;
  return tile1.type === tile2.type && tile1.value === tile2.value;
}

// Check if path exists between two positions
function findPath(grid, r1, c1, r2, c2) {
  const rows = grid.length;
  const cols = grid[0].length;

  // BFS with turn count tracking
  const queue = [[r1, c1, 0, -1]]; // [row, col, turns, lastDir]
  const visited = new Set([`${r1},${c1},0,-1`]);

  while (queue.length > 0) {
    const [r, c, turns, lastDir] = queue.shift();

    if (r === r2 && c === c2) return true;
    if (turns > 2) continue;

    // Try all four directions
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    for (let dir = 0; dir < 4; dir++) {
      const [dr, dc] = directions[dir];
      let nr = r + dr;
      let nc = c + dc;

      // Continue in this direction while valid
      while (nr >= -1 && nr <= rows && nc >= -1 && nc <= cols) {
        // Check if we can be here
        const outOfBounds = nr < 0 || nr >= rows || nc < 0 || nc >= cols;
        const hasTile = !outOfBounds && grid[nr][nc] !== null && !(nr === r2 && nc === c2);

        if (hasTile) break;

        const newTurns = turns + (lastDir !== -1 && lastDir !== dir ? 1 : 0);
        if (newTurns <= 2) {
          const key = `${nr},${nc},${newTurns},${dir}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push([nr, nc, newTurns, dir]);
          }
        }

        nr += dr;
        nc += dc;
      }
    }
  }

  return false;
}

function ShisenSho() {
  const { t } = useTranslation();
  const gameKey = 'shisen-sho';
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const { stats, recordGamePlayed } = useGameStats(gameKey);

  const [seed, setSeed] = useState(getTodayDateString());
  const [grid, setGrid] = useState(null);
  const [selected, setSelected] = useState(null);
  const [hintTiles, setHintTiles] = useState(null);

  // Initialize puzzle
  useEffect(() => {
    const random = createSeededRandom(stringToSeed(seed));
    const newGrid = generatePuzzle(random);
    setGrid(newGrid);
    setSelected(null);
    setHintTiles(null);
    resetGameState();
  }, [seed, resetGameState]);

  // Check for win
  useEffect(() => {
    if (!grid || !isPlaying) return;
    const hasRemainingTiles = grid.some(row => row.some(cell => cell !== null));
    if (!hasRemainingTiles) {
      checkWin(true);
      recordGamePlayed(true);
    }
  }, [grid, isPlaying, checkWin, recordGamePlayed]);

  const handleCellClick = useCallback((row, col) => {
    if (!isPlaying || !grid) return;

    const tile = grid[row][col];
    if (!tile) return;

    // Clear hint when user makes a move
    setHintTiles(null);

    if (!selected) {
      setSelected({ row, col, tile });
    } else {
      if (selected.row === row && selected.col === col) {
        setSelected(null);
      } else if (tilesMatch(selected.tile, tile)) {
        if (findPath(grid, selected.row, selected.col, row, col)) {
          const newGrid = grid.map(r => [...r]);
          newGrid[selected.row][selected.col] = null;
          newGrid[row][col] = null;
          setGrid(newGrid);
          setSelected(null);
        }
      } else {
        setSelected({ row, col, tile });
      }
    }
  }, [grid, selected, isPlaying]);

  const handleNewGame = useCallback(() => {
    setSeed(getTodayDateString() + Math.random());
  }, []);

  const handleGiveUp = useCallback(() => {
    if (!isPlaying) return;
    giveUp();
    recordGamePlayed(false);
  }, [isPlaying, giveUp, recordGamePlayed]);

  const handleHint = useCallback(() => {
    if (!isPlaying || !grid) return;

    // Find any two matching tiles that can be connected
    for (let r1 = 0; r1 < ROWS; r1++) {
      for (let c1 = 0; c1 < COLS; c1++) {
        const tile1 = grid[r1][c1];
        if (!tile1) continue;

        for (let r2 = 0; r2 < ROWS; r2++) {
          for (let c2 = 0; c2 < COLS; c2++) {
            if (r1 === r2 && c1 === c2) continue;
            const tile2 = grid[r2][c2];
            if (!tile2) continue;

            if (tilesMatch(tile1, tile2) && findPath(grid, r1, c1, r2, c2)) {
              setHintTiles([{ row: r1, col: c1 }, { row: r2, col: c2 }]);
              // Clear hint after 5 seconds
              setTimeout(() => setHintTiles(null), 5000);
              return;
            }
          }
        }
      }
    }
  }, [grid, isPlaying]);

  if (!grid) return <div>Loading...</div>;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Shisen-Sho"
        emoji="🀄"
      />

      <div className={styles.controls}>
        <SeedDisplay seed={seed} />
        <button onClick={handleHint} disabled={!isPlaying} className={styles.hintButton}>
          💡 {t('common.hint', 'Hint')}
        </button>
        <GiveUpButton
          onGiveUp={handleGiveUp}
          disabled={!isPlaying}
        />
        <button onClick={handleNewGame} className={styles.newGameButton}>
          {t('common.newGame', 'New Game')}
        </button>
      </div>

      <div className={styles.board}>
        {grid.map((row, r) => (
          <div key={r} className={styles.row}>
            {row.map((tile, c) => {
              const isSelected = selected && selected.row === r && selected.col === c;
              const isHint = hintTiles && hintTiles.some(h => h.row === r && h.col === c);

              const className = `${styles.cell} ${!tile ? styles.empty : ''} ${
                isSelected ? styles.selected : ''
              } ${isHint ? styles.hint : ''}`;

              return (
                <div
                  key={c}
                  className={className}
                  onClick={() => handleCellClick(r, c)}
                >
                  {tile && <MahjongTile type={tile.type} value={tile.value} />}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {gameState === 'won' && (
        <GameResult
          success={true}
          message={t('shisensho.win', 'Puzzle completed!')}
        />
      )}

      {gameState === 'lost' && (
        <GameResult
          success={false}
          message={t('shisensho.giveup', 'Better luck next time!')}
        />
      )}
    </div>
  );
}

export default ShisenSho;
