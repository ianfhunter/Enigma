import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import SeedDisplay, { useSeed } from '../../components/SeedDisplay/SeedDisplay';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import { createSeededRandom, seededShuffleArray } from '../../utils/generatorUtils';
import styles from './Tetravex.module.css';

// Grid sizes
const GRID_SIZES = {
  '2×2': 2,
  '3×3': 3,
  '4×4': 4,
  '5×5': 5,
};

// Colors for numbers 0-9
const NUMBER_COLORS = [
  '#ef4444', // 0 - red
  '#f97316', // 1 - orange
  '#eab308', // 2 - yellow
  '#22c55e', // 3 - green
  '#14b8a6', // 4 - teal
  '#06b6d4', // 5 - cyan
  '#3b82f6', // 6 - blue
  '#8b5cf6', // 7 - violet
  '#d946ef', // 8 - fuchsia
  '#ec4899', // 9 - pink
];

/**
 * Generate a solved Tetravex puzzle
 * Each tile has 4 numbers (top, right, bottom, left)
 * Adjacent tiles must have matching numbers on touching edges
 */
function generateSolvedPuzzle(size, random) {
  // Create a grid of tiles
  const tiles = [];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const tile = {
        id: row * size + col,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      };

      // Top edge: match with tile above, or random
      if (row > 0) {
        tile.top = tiles[(row - 1) * size + col].bottom;
      } else {
        tile.top = Math.floor(random() * 10);
      }

      // Left edge: match with tile to the left, or random
      if (col > 0) {
        tile.left = tiles[row * size + col - 1].right;
      } else {
        tile.left = Math.floor(random() * 10);
      }

      // Right edge: random (will be matched by next tile)
      tile.right = Math.floor(random() * 10);

      // Bottom edge: random (will be matched by tile below)
      tile.bottom = Math.floor(random() * 10);

      tiles.push(tile);
    }
  }

  return tiles;
}

/**
 * Check if a placement is valid (adjacent edges match)
 */
function isValidPlacement(board, size, row, col, tile) {
  // Check top neighbor
  if (row > 0) {
    const above = board[(row - 1) * size + col];
    if (above && above.bottom !== tile.top) return false;
  }

  // Check bottom neighbor
  if (row < size - 1) {
    const below = board[(row + 1) * size + col];
    if (below && below.top !== tile.bottom) return false;
  }

  // Check left neighbor
  if (col > 0) {
    const left = board[row * size + col - 1];
    if (left && left.right !== tile.left) return false;
  }

  // Check right neighbor
  if (col < size - 1) {
    const right = board[row * size + col + 1];
    if (right && right.left !== tile.right) return false;
  }

  return true;
}

/**
 * Check if the puzzle is solved (all tiles placed correctly)
 */
function isSolved(board, size) {
  // Check all cells have tiles
  if (board.some(cell => cell === null)) return false;

  // Check all adjacent edges match
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const tile = board[row * size + col];
      if (!tile) return false;

      // Check right neighbor
      if (col < size - 1) {
        const right = board[row * size + col + 1];
        if (!right || tile.right !== right.left) return false;
      }

      // Check bottom neighbor
      if (row < size - 1) {
        const below = board[(row + 1) * size + col];
        if (!below || tile.bottom !== below.top) return false;
      }
    }
  }

  return true;
}

/**
 * Tile component
 */
function Tile({ tile, onClick, isSelected, isDragging, isOnBoard, draggable, onDragStart, onDragEnd }) {
  if (!tile) return null;

  const handleDragStart = (e) => {
    if (onDragStart) {
      // Set drag data
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify(tile));
      onDragStart(e);
    }
  };

  const handleDragEnd = (e) => {
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  return (
    <div
      className={`${styles.tile} ${isSelected ? styles.selected : ''} ${isDragging ? styles.dragging : ''} ${isOnBoard ? styles.onBoard : ''}`}
      onClick={onClick}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <svg viewBox="0 0 100 100" className={styles.tileSvg}>
        {/* Background */}
        <rect x="2" y="2" width="96" height="96" rx="4" fill="#1e1e2e" stroke="#4a4a6a" strokeWidth="2"/>

        {/* Diagonal lines to create 4 triangular sections */}
        <line x1="2" y1="2" x2="98" y2="98" stroke="#3a3a4e" strokeWidth="1"/>
        <line x1="98" y1="2" x2="2" y2="98" stroke="#3a3a4e" strokeWidth="1"/>

        {/* Top triangle */}
        <polygon points="50,50 2,2 98,2" fill={NUMBER_COLORS[tile.top]} opacity="0.3"/>
        <text x="50" y="25" textAnchor="middle" fill={NUMBER_COLORS[tile.top]} fontSize="20" fontWeight="bold">
          {tile.top}
        </text>

        {/* Right triangle */}
        <polygon points="50,50 98,2 98,98" fill={NUMBER_COLORS[tile.right]} opacity="0.3"/>
        <text x="78" y="55" textAnchor="middle" fill={NUMBER_COLORS[tile.right]} fontSize="20" fontWeight="bold">
          {tile.right}
        </text>

        {/* Bottom triangle */}
        <polygon points="50,50 98,98 2,98" fill={NUMBER_COLORS[tile.bottom]} opacity="0.3"/>
        <text x="50" y="85" textAnchor="middle" fill={NUMBER_COLORS[tile.bottom]} fontSize="20" fontWeight="bold">
          {tile.bottom}
        </text>

        {/* Left triangle */}
        <polygon points="50,50 2,98 2,2" fill={NUMBER_COLORS[tile.left]} opacity="0.3"/>
        <text x="22" y="55" textAnchor="middle" fill={NUMBER_COLORS[tile.left]} fontSize="20" fontWeight="bold">
          {tile.left}
        </text>
      </svg>
    </div>
  );
}

/**
 * Board cell component
 */
function BoardCell({ tile, onClick, isValidDrop, isDragOver, row, col, onDragOver, onDragLeave, onDrop, onTileDragStart, onTileDragEnd, draggable }) {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (onDragOver) onDragOver(e);
  };

  const handleDragLeave = (e) => {
    if (onDragLeave) onDragLeave(e);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (onDrop) onDrop(e);
  };

  return (
    <div
      className={`${styles.cell} ${isValidDrop ? styles.validDrop : ''} ${isDragOver ? styles.dragOver : ''}`}
      onClick={onClick}
      data-row={row}
      data-col={col}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {tile ? (
        <Tile
          tile={tile}
          isOnBoard
          draggable={draggable}
          onDragStart={onTileDragStart}
          onDragEnd={onTileDragEnd}
        />
      ) : (
        <div className={styles.emptyCell} />
      )}
    </div>
  );
}

// Export helpers for testing
export { generateSolvedPuzzle, isValidPlacement, isSolved, NUMBER_COLORS };

export default function Tetravex() {
  const { t } = useTranslation();
  const [sizeKey, setSizeKey] = useState('3×3');
  const { seed, setSeed, newSeed } = useSeed('tetravex', () => Math.floor(Math.random() * 1000000));

  const [solution, setSolution] = useState([]);
  const [board, setBoard] = useState([]);
  const [tray, setTray] = useState([]);
  const [selectedTile, setSelectedTile] = useState(null); // { source: 'tray'|'board', index: number }
  const [draggedTile, setDraggedTile] = useState(null); // { source: 'tray'|'board', index: number }
  const [dragOverTarget, setDragOverTarget] = useState(null); // { type: 'board'|'tray', index: number }

  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();

  const size = GRID_SIZES[sizeKey];

  // Initialize puzzle
  const initGame = useCallback((newSeedValue) => {
    const seedToUse = newSeedValue !== undefined ? newSeedValue : seed;
    const random = createSeededRandom(seedToUse);

    // Generate solution
    const solvedTiles = generateSolvedPuzzle(size, random);
    setSolution(solvedTiles);

    // Shuffle tiles for the tray
    const shuffledTiles = seededShuffleArray([...solvedTiles], random);
    setTray(shuffledTiles);

    // Empty board
    setBoard(Array(size * size).fill(null));
    setSelectedTile(null);
    resetGameState();
  }, [size, seed, resetGameState]);

  useEffect(() => {
    initGame();
  }, [seed, size]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check win condition
  useEffect(() => {
    if (!isPlaying || board.length === 0) return;
    checkWin(isSolved(board, size));
  }, [board, size, isPlaying, checkWin]);

  const handleTrayTileClick = (index) => {
    if (!isPlaying) return;

    if (selectedTile?.source === 'tray' && selectedTile.index === index) {
      // Deselect
      setSelectedTile(null);
    } else {
      setSelectedTile({ source: 'tray', index });
    }
  };

  const handleBoardCellClick = (boardIndex) => {
    if (!isPlaying) return;

    const row = Math.floor(boardIndex / size);
    const col = boardIndex % size;

    if (selectedTile) {
      if (selectedTile.source === 'tray') {
        // Place from tray to board
        const tile = tray[selectedTile.index];
        if (tile && (board[boardIndex] === null || true)) {
          // If cell has a tile, swap it back to tray
          const existingTile = board[boardIndex];

          const newBoard = [...board];
          newBoard[boardIndex] = tile;
          setBoard(newBoard);

          const newTray = [...tray];
          if (existingTile) {
            newTray[selectedTile.index] = existingTile;
          } else {
            newTray[selectedTile.index] = null;
          }
          setTray(newTray);
          setSelectedTile(null);
        }
      } else if (selectedTile.source === 'board') {
        // Move within board or swap
        const fromIndex = selectedTile.index;
        if (fromIndex !== boardIndex) {
          const newBoard = [...board];
          const temp = newBoard[boardIndex];
          newBoard[boardIndex] = newBoard[fromIndex];
          newBoard[fromIndex] = temp;
          setBoard(newBoard);
        }
        setSelectedTile(null);
      }
    } else if (board[boardIndex]) {
      // Select tile from board
      setSelectedTile({ source: 'board', index: boardIndex });
    }
  };

  const handleBoardTileClick = (boardIndex) => {
    if (!isPlaying) return;

    if (selectedTile?.source === 'board' && selectedTile.index === boardIndex) {
      // Deselect
      setSelectedTile(null);
    } else if (selectedTile) {
      // Handle placement/swap
      handleBoardCellClick(boardIndex);
    } else {
      // Select this tile
      setSelectedTile({ source: 'board', index: boardIndex });
    }
  };

  const handleReturnToTray = () => {
    if (!isPlaying || !selectedTile) return;

    if (selectedTile.source === 'board') {
      const tile = board[selectedTile.index];
      if (tile) {
        // Find empty spot in tray
        const emptyIndex = tray.findIndex(t => t === null);
        if (emptyIndex !== -1) {
          const newTray = [...tray];
          newTray[emptyIndex] = tile;
          setTray(newTray);

          const newBoard = [...board];
          newBoard[selectedTile.index] = null;
          setBoard(newBoard);
        }
      }
    }
    setSelectedTile(null);
  };

  // Drag handlers
  const handleDragStart = (source, index) => {
    if (!isPlaying) return;
    setDraggedTile({ source, index });
    setSelectedTile(null);
  };

  const handleDragEnd = () => {
    setDraggedTile(null);
    setDragOverTarget(null);
  };

  const handleDragOverBoard = (boardIndex) => {
    if (!draggedTile) return;
    setDragOverTarget({ type: 'board', index: boardIndex });
  };

  const handleDragLeaveBoard = () => {
    setDragOverTarget(null);
  };

  const handleDropOnBoard = (boardIndex) => {
    if (!isPlaying || !draggedTile) return;

    const { source, index: fromIndex } = draggedTile;

    if (source === 'tray') {
      // Drop from tray to board
      const tile = tray[fromIndex];
      if (tile) {
        const existingTile = board[boardIndex];

        const newBoard = [...board];
        newBoard[boardIndex] = tile;
        setBoard(newBoard);

        const newTray = [...tray];
        newTray[fromIndex] = existingTile; // Swap or set to null
        setTray(newTray);
      }
    } else if (source === 'board') {
      // Move within board
      if (fromIndex !== boardIndex) {
        const newBoard = [...board];
        const temp = newBoard[boardIndex];
        newBoard[boardIndex] = newBoard[fromIndex];
        newBoard[fromIndex] = temp;
        setBoard(newBoard);
      }
    }

    setDraggedTile(null);
    setDragOverTarget(null);
  };

  const handleDragOverTray = (trayIndex) => {
    if (!draggedTile) return;
    setDragOverTarget({ type: 'tray', index: trayIndex });
  };

  const handleDragLeaveTray = () => {
    setDragOverTarget(null);
  };

  const handleDropOnTray = (trayIndex) => {
    if (!isPlaying || !draggedTile) return;

    const { source, index: fromIndex } = draggedTile;

    if (source === 'board') {
      // Return tile from board to tray
      const tile = board[fromIndex];
      if (tile) {
        const existingTrayTile = tray[trayIndex];

        const newTray = [...tray];
        newTray[trayIndex] = tile;
        setTray(newTray);

        const newBoard = [...board];
        newBoard[fromIndex] = existingTrayTile; // Swap or set to null
        setBoard(newBoard);
      }
    } else if (source === 'tray') {
      // Swap within tray
      if (fromIndex !== trayIndex) {
        const newTray = [...tray];
        const temp = newTray[trayIndex];
        newTray[trayIndex] = newTray[fromIndex];
        newTray[fromIndex] = temp;
        setTray(newTray);
      }
    }

    setDraggedTile(null);
    setDragOverTarget(null);
  };

  const handleNewGame = () => {
    const nextSeed = newSeed();
    initGame(nextSeed);
  };

  const handleGiveUp = () => {
    if (!isPlaying) return;
    setBoard([...solution]);
    setTray(Array(size * size).fill(null));
    giveUp();
  };

  const handleSeedChange = (newSeedValue) => {
    setSeed(newSeedValue);
  };

  const handleReset = () => {
    initGame(seed);
  };

  const tilesPlaced = board.filter(t => t !== null).length;
  const totalTiles = size * size;

  return (
    <div className={styles.container}>
      <GameHeader
        title={t('tetravex.title', 'Tetravex')}
        instructions={t('tetravex.instructions', 'Place all tiles on the grid so that adjacent edges have matching numbers. Drag tiles or click to select and place.')}
      />

      <div className={styles.controls}>
        <SizeSelector
          options={Object.keys(GRID_SIZES)}
          value={sizeKey}
          onChange={setSizeKey}
        />
        <SeedDisplay
          seed={seed}
          onSeedChange={handleSeedChange}
          onNewSeed={handleNewGame}
          showNewButton
        />
      </div>

      <div className={styles.stats}>
        <span className={styles.stat}>
          {t('tetravex.placed', 'Placed')}: {tilesPlaced} / {totalTiles}
        </span>
      </div>

      <div className={styles.gameArea}>
        {/* Board */}
        <div className={styles.boardSection}>
          <h3 className={styles.sectionTitle}>{t('tetravex.board', 'Board')}</h3>
          <div
            className={styles.board}
            style={{
              gridTemplateColumns: `repeat(${size}, 1fr)`,
              gridTemplateRows: `repeat(${size}, 1fr)`,
            }}
          >
            {board.map((tile, index) => (
              <BoardCell
                key={index}
                tile={tile}
                row={Math.floor(index / size)}
                col={index % size}
                onClick={() => tile ? handleBoardTileClick(index) : handleBoardCellClick(index)}
                isValidDrop={selectedTile !== null && !tile}
                isDragOver={dragOverTarget?.type === 'board' && dragOverTarget?.index === index}
                onDragOver={() => handleDragOverBoard(index)}
                onDragLeave={handleDragLeaveBoard}
                onDrop={() => handleDropOnBoard(index)}
                draggable={isPlaying && tile !== null}
                onTileDragStart={() => handleDragStart('board', index)}
                onTileDragEnd={handleDragEnd}
              />
            ))}
          </div>
        </div>

        {/* Tray */}
        <div className={styles.traySection}>
          <h3 className={styles.sectionTitle}>{t('tetravex.tray', 'Tiles')}</h3>
          <div className={styles.tray}>
            {tray.map((tile, index) => (
              <div
                key={index}
                className={`${styles.traySlot} ${!tile ? styles.empty : ''} ${dragOverTarget?.type === 'tray' && dragOverTarget?.index === index ? styles.dragOver : ''}`}
                onClick={() => tile && handleTrayTileClick(index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  handleDragOverTray(index);
                }}
                onDragLeave={handleDragLeaveTray}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnTray(index);
                }}
              >
                {tile && (
                  <Tile
                    tile={tile}
                    isSelected={selectedTile?.source === 'tray' && selectedTile.index === index}
                    isDragging={draggedTile?.source === 'tray' && draggedTile?.index === index}
                    onClick={() => handleTrayTileClick(index)}
                    draggable={isPlaying}
                    onDragStart={() => handleDragStart('tray', index)}
                    onDragEnd={handleDragEnd}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title={t('tetravex.won', 'Puzzle Solved!')}
            message={t('tetravex.wonMessage', 'All tiles placed correctly!')}
            actions={[{ label: t('common.newGame'), onClick: handleNewGame, primary: true }]}
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title={t('tetravex.gaveUp', 'Solution Revealed')}
            message={t('tetravex.gaveUpMessage', 'Study the pattern and try another puzzle!')}
            actions={[{ label: t('common.newGame'), onClick: handleNewGame, primary: true }]}
          />
        )}
      </div>

      <div className={styles.buttons}>
        {selectedTile?.source === 'board' && (
          <button className={styles.returnBtn} onClick={handleReturnToTray}>
            {t('tetravex.returnToTray', 'Return to Tray')}
          </button>
        )}
        <button className={styles.resetBtn} onClick={handleReset}>
          {t('common.clear', 'Reset')}
        </button>
        <GiveUpButton
          onGiveUp={handleGiveUp}
          disabled={!isPlaying}
        />
        <button className={styles.newGameBtn} onClick={handleNewGame}>
          {t('common.newGame')}
        </button>
      </div>
    </div>
  );
}
