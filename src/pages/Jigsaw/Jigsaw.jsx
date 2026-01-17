import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createSeededRandom, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import SeedDisplay from '../../components/SeedDisplay';
import sampleImage from '../../assets/sample_image.png';
import styles from './Jigsaw.module.css';

// Audio context for sound effects
let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

// Play a satisfying snap/click sound when piece locks in place
function playSnapSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Create oscillator for the main "click" tone
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Pleasant high-pitched click
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
    osc.type = 'sine';

    // Quick attack, fast decay for a snappy sound
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.start(now);
    osc.stop(now + 0.1);

    // Add a subtle "thud" undertone for satisfaction
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();

    thud.connect(thudGain);
    thudGain.connect(ctx.destination);

    thud.frequency.setValueAtTime(150, now);
    thud.frequency.exponentialRampToValueAtTime(80, now + 0.06);
    thud.type = 'sine';

    thudGain.gain.setValueAtTime(0, now);
    thudGain.gain.linearRampToValueAtTime(0.2, now + 0.01);
    thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    thud.start(now);
    thud.stop(now + 0.08);
  } catch {
    // Audio not supported, fail silently
  }
}

const DIFFICULTY = {
  'Easy (3×2)': { cols: 3, rows: 2 },
  'Medium (4×3)': { cols: 4, rows: 3 },
  'Hard (5×4)': { cols: 5, rows: 4 },
};

// Generate the jigsaw piece path with tabs and blanks
function generatePiecePath(col, row, cols, rows, pieceWidth, pieceHeight, edges, tabSize) {
  const x = 0;
  const y = 0;
  const w = pieceWidth;
  const h = pieceHeight;
  const t = tabSize;

  // edges: { top, right, bottom, left } - 0 = flat, 1 = tab out, -1 = blank in
  const { top, right, bottom, left } = edges;

  let path = `M ${x} ${y}`;

  // Top edge
  if (top === 0) {
    path += ` L ${x + w} ${y}`;
  } else {
    const dir = top;
    path += ` L ${x + w * 0.35} ${y}`;
    path += ` C ${x + w * 0.35} ${y - dir * t * 0.2}, ${x + w * 0.25} ${y - dir * t * 0.8}, ${x + w * 0.5} ${y - dir * t}`;
    path += ` C ${x + w * 0.75} ${y - dir * t * 0.8}, ${x + w * 0.65} ${y - dir * t * 0.2}, ${x + w * 0.65} ${y}`;
    path += ` L ${x + w} ${y}`;
  }

  // Right edge
  if (right === 0) {
    path += ` L ${x + w} ${y + h}`;
  } else {
    const dir = right;
    path += ` L ${x + w} ${y + h * 0.35}`;
    path += ` C ${x + w + dir * t * 0.2} ${y + h * 0.35}, ${x + w + dir * t * 0.8} ${y + h * 0.25}, ${x + w + dir * t} ${y + h * 0.5}`;
    path += ` C ${x + w + dir * t * 0.8} ${y + h * 0.75}, ${x + w + dir * t * 0.2} ${y + h * 0.65}, ${x + w} ${y + h * 0.65}`;
    path += ` L ${x + w} ${y + h}`;
  }

  // Bottom edge (reversed direction)
  if (bottom === 0) {
    path += ` L ${x} ${y + h}`;
  } else {
    const dir = bottom;
    path += ` L ${x + w * 0.65} ${y + h}`;
    path += ` C ${x + w * 0.65} ${y + h + dir * t * 0.2}, ${x + w * 0.75} ${y + h + dir * t * 0.8}, ${x + w * 0.5} ${y + h + dir * t}`;
    path += ` C ${x + w * 0.25} ${y + h + dir * t * 0.8}, ${x + w * 0.35} ${y + h + dir * t * 0.2}, ${x + w * 0.35} ${y + h}`;
    path += ` L ${x} ${y + h}`;
  }

  // Left edge (reversed direction)
  if (left === 0) {
    path += ` L ${x} ${y}`;
  } else {
    const dir = left;
    path += ` L ${x} ${y + h * 0.65}`;
    path += ` C ${x - dir * t * 0.2} ${y + h * 0.65}, ${x - dir * t * 0.8} ${y + h * 0.75}, ${x - dir * t} ${y + h * 0.5}`;
    path += ` C ${x - dir * t * 0.8} ${y + h * 0.25}, ${x - dir * t * 0.2} ${y + h * 0.35}, ${x} ${y + h * 0.35}`;
    path += ` L ${x} ${y}`;
  }

  path += ' Z';
  return path;
}

function createPieces(cols, rows, pieceWidth, pieceHeight, random) {
  const pieces = [];
  const tabSize = Math.min(pieceWidth, pieceHeight) * 0.22;

  // Generate edge patterns (which pieces have tabs vs blanks)
  // Horizontal edges (between rows)
  const horizontalEdges = [];
  for (let row = 0; row < rows - 1; row++) {
    horizontalEdges[row] = [];
    for (let col = 0; col < cols; col++) {
      horizontalEdges[row][col] = random() > 0.5 ? 1 : -1;
    }
  }

  // Vertical edges (between columns)
  const verticalEdges = [];
  for (let row = 0; row < rows; row++) {
    verticalEdges[row] = [];
    for (let col = 0; col < cols - 1; col++) {
      verticalEdges[row][col] = random() > 0.5 ? 1 : -1;
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const edges = {
        top: row === 0 ? 0 : -horizontalEdges[row - 1][col],
        right: col === cols - 1 ? 0 : verticalEdges[row][col],
        bottom: row === rows - 1 ? 0 : horizontalEdges[row][col],
        left: col === 0 ? 0 : -verticalEdges[row][col - 1],
      };

      const path = generatePiecePath(col, row, cols, rows, pieceWidth, pieceHeight, edges, tabSize);

      pieces.push({
        id: row * cols + col,
        col,
        row,
        correctX: col * pieceWidth,
        correctY: row * pieceHeight,
        currentX: 0,
        currentY: 0,
        path,
        edges,
        tabSize,
        isPlaced: false,
      });
    }
  }

  return pieces;
}

function shufflePieces(pieces, boardWidth, boardHeight, pieceWidth, pieceHeight, random) {
  const margin = 20;
  const scatterWidth = boardWidth + 200;
  const scatterHeight = boardHeight + 150;

  return pieces.map(piece => ({
    ...piece,
    currentX: margin + random() * (scatterWidth - pieceWidth - margin * 2),
    currentY: margin + random() * (scatterHeight - pieceHeight - margin * 2),
    isPlaced: false,
    groupId: piece.id, // Each piece starts in its own group
  }));
}

// Check if two pieces are adjacent in the puzzle
function areAdjacent(piece1, piece2, _cols) {
  const rowDiff = Math.abs(piece1.row - piece2.row);
  const colDiff = Math.abs(piece1.col - piece2.col);

  // Adjacent means exactly one step apart (horizontally or vertically, not diagonal)
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

// Get the expected relative position between two adjacent pieces
function getExpectedRelativePosition(piece1, piece2, pieceWidth, pieceHeight) {
  return {
    x: (piece2.col - piece1.col) * pieceWidth,
    y: (piece2.row - piece1.row) * pieceHeight,
  };
}

// Export pure helpers for testing
export { DIFFICULTY, createPieces, shufflePieces, areAdjacent, getExpectedRelativePosition };

export default function Jigsaw() {
  const [difficulty, setDifficulty] = useState('Easy (3×2)');
  const [pieces, setPieces] = useState([]);
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [gameState, setGameState] = useState('playing');
  const [showPreview, setShowPreview] = useState(false);
  const [placedCount, setPlacedCount] = useState(0);
  const [seed, setSeed] = useState(null);

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  const { cols, rows } = DIFFICULTY[difficulty];
  const pieceWidth = 100;
  const pieceHeight = 100;
  const boardWidth = cols * pieceWidth;
  const boardHeight = rows * pieceHeight;
  const snapThreshold = 25;

  const initGame = useCallback((newDifficulty = difficulty) => {
    const { cols: newCols, rows: newRows } = DIFFICULTY[newDifficulty];
    const today = getTodayDateString();
    const gameSeed = stringToSeed(`jigsaw-${today}-${newCols}x${newRows}`);
    const random = createSeededRandom(gameSeed);

    const newPieces = createPieces(newCols, newRows, pieceWidth, pieceHeight, random);
    const shuffled = shufflePieces(newPieces, newCols * pieceWidth, newRows * pieceHeight, pieceWidth, pieceHeight, random);

    setSeed(gameSeed);
    setPieces(shuffled);
    setDifficulty(newDifficulty);
    setGameState('playing');
    setPlacedCount(0);
    setShowPreview(false);
  }, [difficulty]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      initGame();
    };
    img.src = sampleImage;
  }, []);

  useEffect(() => {
    const placed = pieces.filter(p => p.isPlaced).length;
    setPlacedCount(placed);
    if (pieces.length > 0 && placed === pieces.length) {
      setGameState('won');
    }
  }, [pieces]);

  const handleMouseDown = (e, piece) => {
    if (gameState === 'won' || piece.isPlaced) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setDragOffset({
      x: clientX - rect.left - piece.currentX,
      y: clientY - rect.top - piece.currentY,
    });
    setDraggedPiece(piece.id);

    // Bring all pieces in the same group to front
    setPieces(prev => {
      const groupId = piece.groupId;
      const groupPieces = prev.filter(p => p.groupId === groupId);
      const otherPieces = prev.filter(p => p.groupId !== groupId);
      return [...otherPieces, ...groupPieces];
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (draggedPiece === null) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const newX = clientX - rect.left - dragOffset.x;
    const newY = clientY - rect.top - dragOffset.y;

    setPieces(prev => {
      const draggedPieceData = prev.find(p => p.id === draggedPiece);
      if (!draggedPieceData) return prev;

      const deltaX = newX - draggedPieceData.currentX;
      const deltaY = newY - draggedPieceData.currentY;
      const groupId = draggedPieceData.groupId;

      // Move all pieces in the same group
      return prev.map(p =>
        p.groupId === groupId
          ? { ...p, currentX: p.currentX + deltaX, currentY: p.currentY + deltaY }
          : p
      );
    });
  }, [draggedPiece, dragOffset]);

  const handleMouseUp = useCallback(() => {
    if (draggedPiece === null) return;

    let didSnap = false;
    const { cols: currentCols } = DIFFICULTY[difficulty];

    setPieces(prev => {
      let newPieces = [...prev];
      const draggedPieceData = newPieces.find(p => p.id === draggedPiece);
      if (!draggedPieceData) return prev;

      const draggedGroupId = draggedPieceData.groupId;
      const draggedGroup = newPieces.filter(p => p.groupId === draggedGroupId);
      const otherPieces = newPieces.filter(p => p.groupId !== draggedGroupId);

      // Check for piece-to-piece snapping
      // For each piece in the dragged group, check if it can snap to an adjacent piece not in the group
      let snappedToPlaced = false;
      for (const draggedP of draggedGroup) {
        for (const otherP of otherPieces) {
          if (areAdjacent(draggedP, otherP, currentCols)) {
            // Calculate where the dragged piece should be relative to the other piece
            const expectedRel = getExpectedRelativePosition(otherP, draggedP, pieceWidth, pieceHeight);
            const expectedX = otherP.currentX + expectedRel.x;
            const expectedY = otherP.currentY + expectedRel.y;

            const dx = Math.abs(draggedP.currentX - expectedX);
            const dy = Math.abs(draggedP.currentY - expectedY);

            if (dx < snapThreshold && dy < snapThreshold) {
              // Snap the groups together!
              didSnap = true;
              snappedToPlaced = otherP.isPlaced;

              // Calculate offset to align the dragged group with the other piece
              const offsetX = expectedX - draggedP.currentX;
              const offsetY = expectedY - draggedP.currentY;

              // Move all pieces in dragged group and merge into the other group
              const otherGroupId = otherP.groupId;
              newPieces = newPieces.map(p => {
                if (p.groupId === draggedGroupId) {
                  return {
                    ...p,
                    currentX: p.currentX + offsetX,
                    currentY: p.currentY + offsetY,
                    groupId: otherGroupId, // Merge into the other group
                    isPlaced: snappedToPlaced ? true : p.isPlaced, // If snapping to placed piece, become placed too
                  };
                }
                return p;
              });

              break;
            }
          }
        }
        if (didSnap) break;
      }

      // After potential piece-to-piece snap, check for board snapping
      // Skip if we already snapped to a placed piece (already on board)
      if (!snappedToPlaced) {
        // Get the current group (might have changed after merge)
        const currentGroupId = newPieces.find(p => p.id === draggedPiece)?.groupId;
        const currentGroup = newPieces.filter(p => p.groupId === currentGroupId);

        // Check if any piece in the group can snap to the board
        for (const piece of currentGroup) {
          if (piece.isPlaced) continue;

          const boardOffsetX = 100;
          const boardOffsetY = 50;
          const extraSpace = piece.tabSize * 2;
          const targetX = boardOffsetX + piece.correctX - extraSpace / 2;
          const targetY = boardOffsetY + piece.correctY - extraSpace / 2;

          const dx = Math.abs(piece.currentX - targetX);
          const dy = Math.abs(piece.currentY - targetY);

          if (dx < snapThreshold && dy < snapThreshold) {
            didSnap = true;

            // Calculate offset to snap this piece to the board
            const offsetX = targetX - piece.currentX;
            const offsetY = targetY - piece.currentY;

            // Move and place all pieces in the group
            newPieces = newPieces.map(p => {
              if (p.groupId === currentGroupId) {
                return {
                  ...p,
                  currentX: p.currentX + offsetX,
                  currentY: p.currentY + offsetY,
                  isPlaced: true,
                };
              }
              return p;
            });
            break;
          }
        }
      }

      return newPieces;
    });

    if (didSnap) {
      playSnapSound();
    }

    setDraggedPiece(null);
  }, [draggedPiece, snapThreshold, difficulty, pieceWidth, pieceHeight]);

  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();
    const handleGlobalTouchMove = (e) => {
      e.preventDefault();
      handleMouseMove(e);
    };

    if (draggedPiece !== null) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      window.addEventListener('touchend', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [draggedPiece, handleMouseMove, handleMouseUp]);

  const renderPiece = (piece) => {
    const { cols: currentCols, rows: currentRows } = DIFFICULTY[difficulty];
    const clipId = `piece-${piece.id}`;
    const extraSpace = piece.tabSize * 2;

    return (
      <g
        key={piece.id}
        transform={`translate(${piece.currentX}, ${piece.currentY})`}
        onMouseDown={(e) => handleMouseDown(e, piece)}
        onTouchStart={(e) => handleMouseDown(e, piece)}
        className={`${styles.piece} ${piece.isPlaced ? styles.placed : ''} ${draggedPiece === piece.id ? styles.dragging : ''}`}
        style={{ cursor: piece.isPlaced ? 'default' : 'grab' }}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={piece.path} transform={`translate(${extraSpace / 2}, ${extraSpace / 2})`} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <image
            href={sampleImage}
            x={-piece.col * pieceWidth + extraSpace / 2}
            y={-piece.row * pieceHeight + extraSpace / 2}
            width={currentCols * pieceWidth}
            height={currentRows * pieceHeight}
            preserveAspectRatio="xMidYMid slice"
          />
        </g>
        <path
          d={piece.path}
          transform={`translate(${extraSpace / 2}, ${extraSpace / 2})`}
          fill="none"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="1.5"
        />
      </g>
    );
  };

  if (!imageLoaded) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading puzzle...</div>
      </div>
    );
  }

  const { cols: currentCols, rows: currentRows } = DIFFICULTY[difficulty];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Jigsaw</h1>
        <p className={styles.instructions}>
          Drag pieces to the board. They'll snap into place when close enough!
        </p>
      </div>

      {seed !== null && (
        <SeedDisplay
          seed={seed}
          variant="compact"
          showNewButton={false}
          showShare={false}
        />
      )}

      <div className={styles.controls}>
        <div className={styles.difficultySelector}>
          {Object.keys(DIFFICULTY).map((label) => (
            <button
              key={label}
              className={`${styles.difficultyBtn} ${difficulty === label ? styles.active : ''}`}
              onClick={() => {
                setDifficulty(label);
                initGame(label);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Placed</span>
            <span className={styles.statValue}>{placedCount} / {pieces.length}</span>
          </div>
          <button
            className={styles.previewBtn}
            onMouseDown={() => setShowPreview(true)}
            onMouseUp={() => setShowPreview(false)}
            onMouseLeave={() => setShowPreview(false)}
            onTouchStart={() => setShowPreview(true)}
            onTouchEnd={() => setShowPreview(false)}
          >
            👁️ Preview
          </button>
        </div>
      </div>

      <div className={styles.gameArea} ref={containerRef}>
        {showPreview && (
          <div className={styles.previewOverlay}>
            <img src={sampleImage} alt="Solution preview" style={{ width: boardWidth, height: boardHeight }} />
          </div>
        )}

        <svg
          className={styles.puzzleBoard}
          width={boardWidth + 300}
          height={boardHeight + 250}
          viewBox={`0 0 ${boardWidth + 300} ${boardHeight + 250}`}
        >
          {/* Board outline */}
          <rect
            x={100}
            y={50}
            width={boardWidth}
            height={boardHeight}
            fill="rgba(255,255,255,0.05)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
            strokeDasharray="8 4"
            rx="4"
          />

          {/* Grid lines hint */}
          {Array.from({ length: currentCols - 1 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={100 + (i + 1) * pieceWidth}
              y1={50}
              x2={100 + (i + 1) * pieceWidth}
              y2={50 + boardHeight}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: currentRows - 1 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={100}
              y1={50 + (i + 1) * pieceHeight}
              x2={100 + boardWidth}
              y2={50 + (i + 1) * pieceHeight}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          ))}

          {/* Render pieces - placed pieces first (underneath), unplaced pieces on top */}
          {[...pieces].sort((a, b) => {
            // Placed pieces should be rendered first (lower z-order)
            if (a.isPlaced && !b.isPlaced) return -1;
            if (!a.isPlaced && b.isPlaced) return 1;
            return 0;
          }).map(renderPiece)}
        </svg>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            🧩 Puzzle Complete! Well done!
          </div>
        )}
      </div>

      <button className={styles.newGameBtn} onClick={() => initGame(difficulty)}>
        Shuffle Pieces
      </button>
    </div>
  );
}
