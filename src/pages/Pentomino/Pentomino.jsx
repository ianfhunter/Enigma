/**
 * Pentomino Game Component
 * 
 * A classic polyomino puzzle where players fill an 8×8 board (with a 2×2 hole)
 * using all 12 pentomino pieces. Each pentomino is made of 5 connected squares.
 * 
 * Dataset: Uses 16,146 pre-computed solutions from MIT-licensed mlepage/pentomino-solver
 * Source: https://github.com/mlepage/pentomino-solver
 * License: MIT
 * 
 * Gameplay:
 * - Drag pentomino pieces from the tray onto the board
 * - Rotate/flip pieces before placing
 * - Pieces snap to grid cells
 * - Goal: Fill the board with all 12 pieces
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createSeededRandom, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import SeedDisplay from '../../components/SeedDisplay/SeedDisplay';
import { PENTOMINO_SHAPES, rotateShape, flipShape, normalizeShape } from './pentominoShapes';
import styles from './Pentomino.module.css';

// Map piece numbers (1-12) from dataset to pentomino shapes
// This is a standard mapping - the dataset uses numbers but we map to actual shapes
const PIECE_NUMBER_TO_SHAPE = PENTOMINO_SHAPES.map((pent, idx) => ({
  number: idx + 1,
  ...pent
}));

// Load puzzles from dataset
let puzzleDataset = null;
async function loadPuzzleDataset() {
  if (puzzleDataset) return puzzleDataset;
  try {
    const response = await fetch('/datasets/pentominoPuzzles.json');
    puzzleDataset = await response.json();
    return puzzleDataset;
  } catch (e) {
    console.error('Failed to load Pentomino puzzles:', e);
    return null;
  }
}

// Transform a grid by rotation and/or reflection
function transformGrid(grid, transformType) {
  const size = grid.length;
  const newGrid = Array(size).fill(null).map(() => Array(size).fill(0));
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let newR, newC;
      switch (transformType) {
        case 1: // 90° rotation
          newR = c;
          newC = size - 1 - r;
          break;
        case 2: // 180° rotation
          newR = size - 1 - r;
          newC = size - 1 - c;
          break;
        case 3: // 270° rotation
          newR = size - 1 - c;
          newC = r;
          break;
        case 4: // Horizontal flip
          newR = r;
          newC = size - 1 - c;
          break;
        case 5: // Vertical flip
          newR = size - 1 - r;
          newC = c;
          break;
        case 6: // Flip + 90° rotation
          newR = size - 1 - c;
          newC = size - 1 - r;
          break;
        case 7: // Flip + 270° rotation
          newR = c;
          newC = r;
          break;
        default: // No transformation
          newR = r;
          newC = c;
      }
      newGrid[newR][newC] = grid[r][c];
    }
  }
  return newGrid;
}

// Select a puzzle based on seed and apply random transformation
function selectPuzzle(puzzles, seed) {
  if (!puzzles || puzzles.length === 0) return undefined;
  
  const random = createSeededRandom(seed);
  const puzzle = puzzles[Math.floor(random() * puzzles.length)];
  
  // Apply random transformation (0-7) to vary hole position
  const transformType = Math.floor(random() * 8);
  const transformedGrid = transformGrid(puzzle.grid, transformType);
  
  return {
    ...puzzle,
    grid: transformedGrid,
    transformType: transformType
  };
}

// Extract placed pieces from grid
function extractPlacedPieces(grid) {
  const pieces = new Map(); // pieceNumber -> Set of cell positions
  
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const pieceNum = grid[r][c];
      if (pieceNum > 0 && pieceNum <= 12) {
        if (!pieces.has(pieceNum)) {
          pieces.set(pieceNum, new Set());
        }
        pieces.get(pieceNum).add(`${r},${c}`);
      }
    }
  }
  
  return pieces;
}

// Check if a shape can be placed at a position
function canPlaceShape(shape, boardR, boardC, board, placedPieces) {
  const gridSize = board.length;
  
  for (const [relR, relC] of shape) {
    const r = boardR + relR;
    const c = boardC + relC;
    
    // Check bounds
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) {
      return false;
    }
    
    // Check if cell is a hole
    if (board[r][c] === 0) {
      return false;
    }
    
    // Check if cell is already occupied
    if (placedPieces.has(`${r},${c}`)) {
      return false;
    }
  }
  
  return true;
}

// Place a shape on the board
function placeShape(shape, pieceNum, boardR, boardC, board) {
  const newBoard = board.map(row => [...row]);
  
  for (const [relR, relC] of shape) {
    const r = boardR + relR;
    const c = boardC + relC;
    newBoard[r][c] = pieceNum;
  }
  
  return newBoard;
}

// Check if puzzle is solved
function checkSolved(playerBoard, solutionBoard) {
  if (!solutionBoard || !playerBoard) return false;
  if (solutionBoard.length !== playerBoard.length) return false;
  
  for (let r = 0; r < solutionBoard.length; r++) {
    if (solutionBoard[r].length !== playerBoard[r].length) return false;
    for (let c = 0; c < solutionBoard[r].length; c++) {
      const playerVal = playerBoard[r][c];
      const solutionVal = solutionBoard[r][c];
      
      if (playerVal === 0 && solutionVal === 0) continue; // Both hole - OK
      if (playerVal === 0 && solutionVal !== 0) return false;
      if (playerVal !== 0 && solutionVal === 0) return false;
      if (playerVal !== solutionVal) return false;
    }
  }
  return true;
}

// Export helpers for testing
export {
  PIECE_NUMBER_TO_SHAPE,
  loadPuzzleDataset,
  selectPuzzle,
  transformGrid,
  extractPlacedPieces,
  canPlaceShape,
  placeShape,
  checkSolved,
};

export default function Pentomino() {
  const [puzzleData, setPuzzleData] = useState(null);
  const [playerBoard, setPlayerBoard] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [showSolution, setShowSolution] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seed, setSeed] = useState(null);
  const [giveUp, setGiveUp] = useState(false);
  
  // Drag state
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedOrientation, setDraggedOrientation] = useState(0); // 0-7: rotations/flips
  const [hoverCell, setHoverCell] = useState(null); // {r, c} where piece would be placed
  
  const datasetRef = useRef(null);
  const boardRef = useRef(null);
  const cellSize = 35;
  const gridSize = 8;

  // Load dataset on mount
  useEffect(() => {
    loadPuzzleDataset().then(data => {
      if (data && data.puzzles) {
        datasetRef.current = data.puzzles;
        setLoading(false);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const initGame = useCallback((customSeed = null, forceNew = false) => {
    const puzzles = datasetRef.current;
    if (!puzzles || puzzles.length === 0) return;

    const today = getTodayDateString();
    let gameSeed;
    if (customSeed !== null) {
      gameSeed = typeof customSeed === 'string' ? stringToSeed(customSeed) : customSeed;
    } else if (forceNew) {
      gameSeed = stringToSeed(`pentomino-${today}-${Date.now()}`);
    } else {
      gameSeed = stringToSeed(`pentomino-${today}`);
    }
    
    setSeed(gameSeed);
    
    const puzzle = selectPuzzle(puzzles, gameSeed);
    if (!puzzle) return;

    setPuzzleData(puzzle);
    
    // Initialize player board - start with empty (null) cells except hole (0)
    const initialBoard = puzzle.grid.map(row => 
      row.map(val => val === 0 ? 0 : null)
    );
    setPlayerBoard(initialBoard);
    setGameState('playing');
    setShowSolution(false);
    setGiveUp(false);
    setDraggedPiece(null);
    setHoverCell(null);
    setPieceOrientations({});
  }, []);

  // Init game when dataset loads
  useEffect(() => {
    if (!loading && datasetRef.current) {
      initGame();
    }
  }, [loading, initGame]);

  // Check win condition
  useEffect(() => {
    if (!puzzleData || gameState !== 'playing') return;
    if (checkSolved(playerBoard, puzzleData.grid)) {
      setGameState('won');
    }
  }, [playerBoard, puzzleData, gameState]);

  // Get placed pieces for collision detection
  const placedPieces = useRef(new Set());
  useEffect(() => {
    const placed = new Set();
    for (let r = 0; r < playerBoard.length; r++) {
      for (let c = 0; c < playerBoard[r].length; c++) {
        if (playerBoard[r][c] !== null && playerBoard[r][c] !== 0) {
          placed.add(`${r},${c}`);
        }
      }
    }
    placedPieces.current = placed;
  }, [playerBoard]);

  // Handle piece drag start
  const handlePieceMouseDown = (e, pieceNum) => {
    if (gameState !== 'playing' || isPiecePlaced(pieceNum)) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Use the orientation from the tray
    const orientation = pieceOrientations[pieceNum] || 0;
    setDraggedPiece(pieceNum);
    setDraggedOrientation(orientation);
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    setDragOffset({ x: clientX, y: clientY });
  };

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e) => {
    if (draggedPiece === null || !boardRef.current) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const rect = boardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Convert to grid coordinates (account for padding)
    const c = Math.floor((x - 2) / (cellSize + 2));
    const r = Math.floor((y - 2) / (cellSize + 2));
    
    if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
      setHoverCell({ r, c });
    } else {
      setHoverCell(null);
    }
  }, [draggedPiece, cellSize, gridSize]);

  // Handle mouse up - place piece
  const handleMouseUp = useCallback(() => {
    if (draggedPiece === null) return;
    
    if (hoverCell && puzzleData) {
      const pieceInfo = PIECE_NUMBER_TO_SHAPE[draggedPiece - 1];
      let shape = [...pieceInfo.shape];
      
      // Apply orientation transformations
      // 0-3: rotations, 4-7: flip then rotations
      if (draggedOrientation >= 4) {
        shape = flipShape(shape);
        for (let i = 0; i < draggedOrientation - 4; i++) {
          shape = rotateShape(shape);
        }
      } else {
        for (let i = 0; i < draggedOrientation; i++) {
          shape = rotateShape(shape);
        }
      }
      
      const normalizedShape = normalizeShape(shape);
      
      // Check if placement is valid
      if (canPlaceShape(normalizedShape, hoverCell.r, hoverCell.c, puzzleData.grid, placedPieces.current)) {
        // Remove any existing placement of this piece first
        let newBoard = playerBoard.map(row => 
          row.map(val => val === draggedPiece ? null : val)
        );
        
        // Place the piece
        newBoard = placeShape(normalizedShape, draggedPiece, hoverCell.r, hoverCell.c, newBoard);
        setPlayerBoard(newBoard);
      }
    }
    
    setDraggedPiece(null);
    setHoverCell(null);
    setDraggedOrientation(0);
  }, [draggedPiece, hoverCell, puzzleData, playerBoard, draggedOrientation]);

  // Global mouse event handlers
  useEffect(() => {
    if (draggedPiece === null) return;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [draggedPiece, handleMouseMove, handleMouseUp]);

  // Rotate piece in tray (before dragging)
  const [pieceOrientations, setPieceOrientations] = useState({});
  
  const handleRotatePiece = (e, pieceNum) => {
    e.stopPropagation();
    e.preventDefault();
    setPieceOrientations(prev => ({
      ...prev,
      [pieceNum]: ((prev[pieceNum] || 0) + 1) % 8
    }));
  };
  
  // Get current orientation for a piece
  const getPieceOrientation = (pieceNum) => {
    if (draggedPiece === pieceNum) {
      return draggedOrientation;
    }
    return pieceOrientations[pieceNum] || 0;
  };

  // Remove piece from board
  const handleRemovePiece = (pieceNum) => {
    const newBoard = playerBoard.map(row => 
      row.map(val => val === pieceNum ? null : val)
    );
    setPlayerBoard(newBoard);
  };

  const handleGiveUp = () => {
    setGiveUp(true);
    setShowSolution(true);
    setGameState('lost');
  };

  const handleNewPuzzle = () => {
    initGame(null, true);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading pentomino puzzles...</div>
      </div>
    );
  }

  if (!puzzleData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Failed to load puzzle data.</div>
      </div>
    );
  }

  // Get current shape for a piece with given orientation
  const getCurrentShape = (pieceNum, orientation) => {
    const pieceInfo = PIECE_NUMBER_TO_SHAPE[pieceNum - 1];
    let shape = [...pieceInfo.shape];
    
    // Apply orientation transformations
    // 0-3: rotations, 4-7: flip then rotations
    if (orientation >= 4) {
      shape = flipShape(shape);
      for (let i = 0; i < orientation - 4; i++) {
        shape = rotateShape(shape);
      }
    } else {
      for (let i = 0; i < orientation; i++) {
        shape = rotateShape(shape);
      }
    }
    return normalizeShape(shape);
  };

  // Check if piece is placed
  const isPiecePlaced = (pieceNum) => {
    for (let r = 0; r < playerBoard.length; r++) {
      for (let c = 0; c < playerBoard[r].length; c++) {
        if (playerBoard[r][c] === pieceNum) return true;
      }
    }
    return false;
  };

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>← Back to Home</Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Pentomino</h1>
        <p className={styles.instructions}>
          Drag pentomino pieces from the tray onto the board. Each pentomino is a 5-square piece.
          The 2×2 hole cells are marked in dark gray. Click the rotate button on a piece to change its orientation.
        </p>
      </div>

      {seed !== null && <SeedDisplay seed={seed} />}

      <div className={styles.gameArea}>
        {/* Pieces tray */}
        <div className={styles.piecesTray}>
          <h3 className={styles.trayTitle}>Pieces</h3>
          <div className={styles.piecesGrid}>
            {PIECE_NUMBER_TO_SHAPE.map((pieceInfo, idx) => {
              const pieceNum = idx + 1;
              const placed = isPiecePlaced(pieceNum);
              const orientation = getPieceOrientation(pieceNum);
              const shape = getCurrentShape(pieceNum, orientation);
              
              // Find bounding box for grid sizing
              let maxR = 0, maxC = 0;
              for (const [r, c] of shape) {
                maxR = Math.max(maxR, r);
                maxC = Math.max(maxC, c);
              }
              
              return (
                <div
                  key={pieceNum}
                  className={`${styles.pieceTrayItem} ${placed ? styles.piecePlaced : ''} ${draggedPiece === pieceNum ? styles.pieceDragging : ''}`}
                >
                  <div
                    className={styles.piecePreview}
                    style={{ 
                      opacity: placed ? 0.4 : 1,
                      gridTemplateColumns: `repeat(${maxC + 1}, 12px)`,
                      gridTemplateRows: `repeat(${maxR + 1}, 12px)`,
                    }}
                    onMouseDown={(e) => !placed && handlePieceMouseDown(e, pieceNum)}
                    onTouchStart={(e) => !placed && handlePieceMouseDown(e, pieceNum)}
                  >
                    {shape.map(([r, c], i) => (
                      <div
                        key={i}
                        className={styles.pieceSquare}
                        style={{
                          gridRow: r + 1,
                          gridColumn: c + 1,
                          backgroundColor: pieceInfo.color,
                        }}
                      />
                    ))}
                  </div>
                  <div className={styles.pieceLabel}>{pieceInfo.name}</div>
                  {!placed && (
                    <button
                      className={styles.rotateBtn}
                      onClick={(e) => handleRotatePiece(e, pieceNum)}
                      title="Rotate/flip piece"
                    >
                      ↻
                    </button>
                  )}
                  {placed && (
                    <button
                      className={styles.removeBtn}
                      onClick={() => handleRemovePiece(pieceNum)}
                      title="Remove piece"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Game board */}
        <div className={styles.boardWrapper}>
          <div 
            ref={boardRef}
            className={styles.board}
            style={{ 
              gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
              width: `${gridSize * cellSize}px`,
              height: `${gridSize * cellSize}px`
            }}
          >
            {puzzleData.grid.map((row, r) =>
              row.map((solutionVal, c) => {
                const playerVal = playerBoard[r]?.[c];
                const isHole = solutionVal === 0;
                const showAnswer = showSolution || giveUp;
                const playerPieceInfo = playerVal ? PIECE_NUMBER_TO_SHAPE[playerVal - 1] : null;
                const solutionPieceInfo = showAnswer && solutionVal > 0 ? PIECE_NUMBER_TO_SHAPE[solutionVal - 1] : null;
                
                // Check if this cell is in hover preview
                let isHoverPreview = false;
                if (hoverCell && draggedPiece) {
                  const shape = getCurrentShape(draggedPiece, draggedOrientation);
                  isHoverPreview = shape.some(([relR, relC]) => 
                    hoverCell.r + relR === r && hoverCell.c + relC === c
                  );
                }
                
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`${styles.cell} ${
                      isHole ? styles.hole : ''
                    } ${
                      isHoverPreview ? styles.cellHover : ''
                    }`}
                    style={{
                      backgroundColor: isHole 
                        ? '#0f172a' 
                        : showAnswer && solutionVal > 0
                          ? solutionPieceInfo.color
                          : playerVal && playerPieceInfo
                            ? playerPieceInfo.color
                            : '#1f2937'
                    }}
                  >
                    {!isHole && (showAnswer || playerVal) && (
                      <span className={styles.pieceLabel}>
                        {showAnswer ? solutionPieceInfo.name : playerPieceInfo.name}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Ghost preview of dragged piece */}
          {draggedPiece && hoverCell && (
            <div 
              className={styles.ghostPreview}
              style={{
                left: `${hoverCell.c * (cellSize + 2) + 2}px`,
                top: `${hoverCell.r * (cellSize + 2) + 2}px`,
              }}
            >
              {getCurrentShape(draggedPiece, draggedOrientation).map(([r, c], i) => {
                const pieceInfo = PIECE_NUMBER_TO_SHAPE[draggedPiece - 1];
                const canPlace = canPlaceShape(
                  getCurrentShape(draggedPiece, draggedOrientation),
                  hoverCell.r,
                  hoverCell.c,
                  puzzleData.grid,
                  placedPieces.current
                );
                return (
                  <div
                    key={i}
                    className={styles.ghostSquare}
                    style={{
                      left: `${c * (cellSize + 2)}px`,
                      top: `${r * (cellSize + 2)}px`,
                      backgroundColor: pieceInfo.color,
                      opacity: canPlace ? 0.6 : 0.3,
                      borderColor: canPlace ? 'rgba(139, 92, 246, 0.8)' : 'rgba(239, 68, 68, 0.8)',
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.buttonGroup}>
          <button 
            className={styles.btn} 
            onClick={handleNewPuzzle}
            disabled={loading}
          >
            New Puzzle
          </button>
          <button 
            className={styles.btn} 
            onClick={() => setShowSolution(!showSolution)}
            disabled={gameState === 'won'}
          >
            {showSolution ? 'Hide' : 'Show'} Solution
          </button>
          <button 
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={handleGiveUp}
            disabled={gameState === 'won' || giveUp}
          >
            Give Up
          </button>
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            🎉 Congratulations! You solved the pentomino puzzle!
          </div>
        )}

        {giveUp && (
          <div className={styles.giveUpMessage}>
            Here's the solution. Try another puzzle!
          </div>
        )}
      </div>
    </div>
  );
}