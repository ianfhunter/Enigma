import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Stage, Layer, Line, Path, Transformer } from 'react-konva';
import styles from './Tangram.module.css';
import { KILOGRAM_PUZZLES } from '@datasets/kilogramPuzzles';

// Canonical tangram pieces with mathematically correct proportions
// Based on a tangram cut from a square where small triangle leg = 50 pixels
//
// CORRECT PROPORTIONS:
// - Large triangles: legs = 100 (2×50), area = 5000 each
// - Medium triangle: legs = 70.71 (√2×50), area = 2500
// - Small triangles: legs = 50, area = 1250 each
// - Square: side = 50, area = 2500
// - Parallelogram: sides 50 and 70.71, area = 2500
// TOTAL AREA = 20000 → fits in square of side ~141.4
//
// Points are flat arrays for Konva: [x1, y1, x2, y2, ...]
// center is the centroid for proper rotation
const SQRT2 = Math.sqrt(2); // ≈ 1.414
const UNIT = 50; // base unit = small triangle leg

const PIECES = [
  // Large triangles - legs = 2 units (100px), area = 5000
  { id: 'large-tri-1', name: 'Large Triangle 1', color: '#ef4444',
    points: [0, 0, UNIT * 2, 0, 0, UNIT * 2],
    center: [UNIT * 2 / 3, UNIT * 2 / 3] },
  { id: 'large-tri-2', name: 'Large Triangle 2', color: '#f97316',
    points: [0, 0, UNIT * 2, 0, 0, UNIT * 2],
    center: [UNIT * 2 / 3, UNIT * 2 / 3] },
  // Medium triangle - legs = √2 units (70.71px), area = 2500
  { id: 'medium-tri', name: 'Medium Triangle', color: '#eab308',
    points: [0, 0, UNIT * SQRT2, 0, 0, UNIT * SQRT2],
    center: [UNIT * SQRT2 / 3, UNIT * SQRT2 / 3] },
  // Small triangles - legs = 1 unit (50px), area = 1250
  { id: 'small-tri-1', name: 'Small Triangle 1', color: '#22c55e',
    points: [0, 0, UNIT, 0, 0, UNIT],
    center: [UNIT / 3, UNIT / 3] },
  { id: 'small-tri-2', name: 'Small Triangle 2', color: '#06b6d4',
    points: [0, 0, UNIT, 0, 0, UNIT],
    center: [UNIT / 3, UNIT / 3] },
  // Square - side = 1 unit (50px), area = 2500
  { id: 'square', name: 'Square', color: '#8b5cf6',
    points: [0, 0, UNIT, 0, UNIT, UNIT, 0, UNIT],
    center: [UNIT / 2, UNIT / 2] },
  // Parallelogram - sides of 1 unit and √2 units, 45° angles, area = 2500
  // Vertices: bottom-left origin, long edge (70.71) horizontal, short edge (50) at 45°
  { id: 'parallelogram', name: 'Parallelogram', color: '#ec4899',
    points: [
      0, 0,                                    // bottom-left
      UNIT * SQRT2, 0,                         // bottom-right (70.71, 0)
      UNIT * SQRT2 + UNIT / SQRT2, UNIT / SQRT2, // top-right (106.07, 35.36)
      UNIT / SQRT2, UNIT / SQRT2               // top-left (35.36, 35.36)
    ],
    center: [(UNIT * SQRT2 + UNIT / SQRT2) / 2, UNIT / SQRT2 / 2] },
];

// Predefined puzzles with target silhouettes
const PUZZLES = [
  {
    id: 'debug-shapes',
    name: '🔧 Shape Reference',
    difficulty: 'Debug',
    // Shows each piece separately with correct canonical sizes
    // Large tri: 100×100, Medium tri: 70.71×70.71, Small tri: 50×50
    // Square: 50×50, Parallelogram: 106.07×35.36
    silhouette: `
      M 10 5 L 110 5 L 10 105 Z
      M 120 5 L 220 5 L 120 105 Z
      M 10 115 L 80.71 115 L 10 185.71 Z
      M 90 115 L 140 115 L 90 165 Z
      M 150 115 L 200 115 L 150 165 Z
      M 90 175 L 140 175 L 140 225 L 90 225 Z
      M 150 175 L 220.71 175 L 256.07 210.36 L 185.36 210.36 Z
    `,
    hint: 'Reference layout showing each piece at its canonical size',
  },
  {
    id: 'square',
    name: 'Square',
    difficulty: 'Easy',
    // Square with side ≈ 141.4 (√20000), centered in the play area
    silhouette: 'M 50 10 L 191.4 10 L 191.4 151.4 L 50 151.4 Z',
    hints: [
      'The two large triangles together fill exactly half the square — they go along the main diagonal.',
      'Place the RED large triangle with its right angle in the TOP-LEFT corner of the square. Its hypotenuse will run diagonally.',
      'Place the ORANGE large triangle with its right angle in the BOTTOM-RIGHT corner. Its hypotenuse should meet the red triangle\'s hypotenuse.',
      'Now you have two triangular gaps remaining: one in the top-right, one in the bottom-left.',
      'The MEDIUM triangle (yellow) fills the BOTTOM-LEFT gap. Rotate it so its right angle points into that corner.',
      'For the TOP-RIGHT gap: the SQUARE (purple) goes in rotated 45° as a diamond, touching the corner.',
      'The PARALLELOGRAM (pink) goes next to the square — you may need to FLIP it (press F) to make it fit!',
      'Finally, the two SMALL triangles (green & cyan) fill the last remaining spaces beside the square and parallelogram.',
    ],
  },
  {
    id: 'triangle',
    name: 'Triangle',
    difficulty: 'Easy',
    // Right isoceles triangle with area = 20000, legs = √40000 ≈ 200
    silhouette: 'M 20 200 L 220 200 L 20 0 Z',
    hint: 'Large triangles go along the two legs',
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    difficulty: 'Easy',
    // Rectangle 200×100 = area 20000
    silhouette: 'M 20 60 L 220 60 L 220 160 L 20 160 Z',
    hint: 'Large triangles point inward from the short edges',
  },
  {
    id: 'parallelogram',
    name: 'Parallelogram',
    difficulty: 'Medium',
    // Parallelogram with base 200, height 100, area = 20000
    silhouette: 'M 50 50 L 250 50 L 200 150 L 0 150 Z',
    hint: 'Fill the slanted shape from left to right',
  },
  {
    id: 'trapezoid',
    name: 'Trapezoid',
    difficulty: 'Medium',
    // Trapezoid: parallel sides 100 and 200, height ~133, area ≈ 20000
    silhouette: 'M 70 20 L 170 20 L 220 153 L 20 153 Z',
    hint: 'Large triangles form the slanted sides',
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    difficulty: 'Medium',
    // Irregular hexagon scaled to area ≈ 20000
    silhouette: 'M 60 20 L 180 20 L 230 110 L 180 200 L 60 200 L 10 110 Z',
    hint: 'Large triangles fit in the pointed ends',
  },
  {
    id: 'arrow',
    name: 'Arrow',
    difficulty: 'Hard',
    // Arrow shape scaled to area ≈ 20000
    silhouette: 'M 120 0 L 220 100 L 170 100 L 170 220 L 70 220 L 70 100 L 20 100 Z',
    hint: 'Large triangles form the arrowhead',
  },
  {
    id: 'fish',
    name: 'Fish',
    difficulty: 'Hard',
    // Fish shape scaled to area ≈ 20000
    silhouette: 'M 10 120 L 80 50 L 150 50 L 200 0 L 200 80 L 250 120 L 200 160 L 200 240 L 150 190 L 80 190 Z',
    hint: 'Large triangles form the tail fin',
  },
];

// Grid snapping threshold and rotation increment
const SNAP_GRID = 5;
const ROTATION_SNAP = 45;

// Canvas dimensions
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 600;

// Single tangram piece component with Konva
function TangramPiece({ piece, isSelected, onSelect, onChange, onDragStart, bounds }) {
  const shapeRef = useRef();
  const trRef = useRef();

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // Snap position to grid
  const snapToGrid = (val) => Math.round(val / SNAP_GRID) * SNAP_GRID;

  // Constrain dragging to play area bounds
  const dragBoundFunc = (pos) => {
    const margin = 20; // Allow some margin outside
    return {
      x: Math.max(-margin, Math.min(pos.x, bounds.width + margin)),
      y: Math.max(-margin, Math.min(pos.y, bounds.height + margin)),
    };
  };

  // Handle drag end - snap to grid
  const handleDragEnd = (e) => {
    const node = e.target;
    onChange({
      ...piece,
      x: snapToGrid(node.x()),
      y: snapToGrid(node.y()),
    });
  };

  // Handle transform end - snap rotation
  const handleTransformEnd = () => {
    const node = shapeRef.current;
    const rawRotation = node.rotation();
    const snappedRotation = Math.round(rawRotation / ROTATION_SNAP) * ROTATION_SNAP;

    onChange({
      ...piece,
      x: snapToGrid(node.x()),
      y: snapToGrid(node.y()),
      rotation: ((snappedRotation % 360) + 360) % 360,
    });

    // Reset the node's rotation to the snapped value
    node.rotation(snappedRotation);
  };

  // Use the centroid for proper rotation around piece center
  const centerX = piece.center[0];
  const centerY = piece.center[1];

  return (
    <>
      <Line
        ref={shapeRef}
        id={piece.id}
        points={piece.points}
        closed
        fill={piece.color}
        stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.3)'}
        strokeWidth={isSelected ? 2 : 1}
        x={piece.x}
        y={piece.y}
        rotation={piece.rotation || 0}
        scaleX={piece.flipped ? -1 : 1}
        scaleY={1}
        offsetX={centerX}
        offsetY={centerY}
        draggable
        dragBoundFunc={dragBoundFunc}
        onClick={() => onSelect(piece.id)}
        onTap={() => onSelect(piece.id)}
        onDragStart={() => onDragStart(piece.id)}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        shadowColor={isSelected ? '#fb923c' : 'transparent'}
        shadowBlur={isSelected ? 15 : 0}
        shadowOpacity={0.6}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          resizeEnabled={false}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          rotationSnapTolerance={22}
          borderStroke="#fb923c"
          borderStrokeWidth={2}
          anchorStroke="#fb923c"
          anchorFill="#1a1a2e"
          anchorSize={12}
          anchorCornerRadius={6}
          enabledAnchors={[]}
          padding={5}
        />
      )}
    </>
  );
}

// Combine classic puzzles with KiloGram dataset
const CLASSIC_PUZZLES = PUZZLES;

export default function Tangram() {
  const [puzzleSource, setPuzzleSource] = useState('classic'); // 'classic' or 'kilogram'
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [pieces, setPieces] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [completed, setCompleted] = useState(new Set());
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const stageRef = useRef();
  const containerRef = useRef();
  const [stageSize, setStageSize] = useState({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });

  // Get puzzles based on selected source
  const activePuzzles = useMemo(() => {
    return puzzleSource === 'classic' ? CLASSIC_PUZZLES : KILOGRAM_PUZZLES;
  }, [puzzleSource]);

  // Reset to first puzzle when changing source
  const handleSourceChange = (newSource) => {
    setPuzzleSource(newSource);
    setCurrentPuzzle(0);
  };

  // Initialize pieces with positions in the lower part of game area
  const initPieces = useCallback(() => {
    // Position pieces in a tray below the puzzle area
    // Large pieces on top row, smaller pieces below
    const positions = [
      { x: 30, y: 300 },   // large-tri-1
      { x: 140, y: 300 },  // large-tri-2
      { x: 250, y: 320 },  // medium-tri
      { x: 30, y: 420 },   // small-tri-1
      { x: 100, y: 420 },  // small-tri-2
      { x: 170, y: 420 },  // square
      { x: 230, y: 450 },  // parallelogram (wider, so offset)
    ];
    const initialPieces = PIECES.map((piece, index) => ({
      ...piece,
      x: positions[index].x,
      y: positions[index].y,
      rotation: 0,
      flipped: false,
    }));
    setPieces(initialPieces);
    setSelectedId(null);
    setShowHint(false);
    setHintLevel(0);
  }, []);

  useEffect(() => {
    initPieces();
  }, [currentPuzzle, initPieces]);

  // Responsive stage sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const scale = Math.min(1, containerWidth / CANVAS_WIDTH);
        setStageSize({
          width: CANVAS_WIDTH * scale,
          height: CANVAS_HEIGHT * scale,
          scale,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle piece changes
  const handlePieceChange = (updatedPiece) => {
    setPieces(prev => prev.map(p =>
      p.id === updatedPiece.id ? updatedPiece : p
    ));
  };

  // Move selected piece to top of z-order
  const handleDragStart = (pieceId) => {
    setSelectedId(pieceId);
    setPieces(prev => {
      const idx = prev.findIndex(p => p.id === pieceId);
      if (idx === -1) return prev;
      const newPieces = [...prev];
      const [removed] = newPieces.splice(idx, 1);
      newPieces.push(removed);
      return newPieces;
    });
  };

  // Rotate piece programmatically
  const rotatePiece = (pieceId, direction) => {
    setPieces(prev => prev.map(p =>
      p.id === pieceId
        ? { ...p, rotation: ((p.rotation || 0) + direction * ROTATION_SNAP + 360) % 360 }
        : p
    ));
  };

  // Flip piece
  const flipPiece = (pieceId) => {
    setPieces(prev => prev.map(p =>
      p.id === pieceId ? { ...p, flipped: !p.flipped } : p
    ));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedId) return;

      switch (e.key.toLowerCase()) {
        case 'q':
        case 'arrowleft':
          e.preventDefault();
          rotatePiece(selectedId, -1);
          break;
        case 'e':
        case 'arrowright':
          e.preventDefault();
          rotatePiece(selectedId, 1);
          break;
        case 'f':
        case 'arrowup':
        case 'arrowdown':
          e.preventDefault();
          flipPiece(selectedId);
          break;
        case 'escape':
          setSelectedId(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  // Click on empty stage to deselect
  const handleStageClick = (e) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
    }
  };

  const markComplete = () => {
    setCompleted(prev => new Set([...prev, activePuzzles[currentPuzzle].id]));
  };

  const nextPuzzle = () => {
    if (currentPuzzle < activePuzzles.length - 1) {
      setCurrentPuzzle(currentPuzzle + 1);
    }
  };

  const prevPuzzle = () => {
    if (currentPuzzle > 0) {
      setCurrentPuzzle(currentPuzzle - 1);
    }
  };

  const puzzle = activePuzzles[currentPuzzle];
  const isCompleted = completed.has(puzzle.id);

  // Get hints array (support both old single hint and new hints array format)
  const hints = puzzle.hints || [puzzle.hint];
  const currentHint = hints[hintLevel] || hints[hints.length - 1];
  const hasMoreHints = hintLevel < hints.length - 1;

  // Handle hint button click - show hint or advance to next
  const handleHintClick = () => {
    if (!showHint) {
      setShowHint(true);
    } else if (hasMoreHints) {
      setHintLevel(prev => prev + 1);
    } else {
      setShowHint(false);
      setHintLevel(0);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Tangram</h1>
        <p className={styles.instructions}>
          Drag pieces to match the silhouette. Click to select, drag rotation handle or use keys.
        </p>
      </div>

      {/* Puzzle source selector */}
      <div className={styles.sourceSelector}>
        <button
          className={`${styles.sourceBtn} ${puzzleSource === 'classic' ? styles.active : ''}`}
          onClick={() => handleSourceChange('classic')}
        >
          Classic ({CLASSIC_PUZZLES.length})
        </button>
        <button
          className={`${styles.sourceBtn} ${puzzleSource === 'kilogram' ? styles.active : ''}`}
          onClick={() => handleSourceChange('kilogram')}
        >
          KiloGram ({KILOGRAM_PUZZLES.length})
        </button>
      </div>

      <div className={styles.puzzleNav}>
        <button
          className={styles.navBtn}
          onClick={prevPuzzle}
          disabled={currentPuzzle === 0}
        >
          ← Prev
        </button>
        <div className={styles.puzzleInfo}>
          <span className={styles.puzzleCount}>{currentPuzzle + 1}/{activePuzzles.length}</span>
          <span className={styles.puzzleName}>{puzzle.name}</span>
          <span className={`${styles.difficulty} ${styles[puzzle.difficulty.toLowerCase()]}`}>
            {puzzle.difficulty}
          </span>
          {isCompleted && <span className={styles.completedBadge}>✓</span>}
        </div>
        <button
          className={styles.navBtn}
          onClick={nextPuzzle}
          disabled={currentPuzzle === activePuzzles.length - 1}
        >
          Next →
        </button>
      </div>

      <div className={styles.gameArea} ref={containerRef}>
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          scaleX={stageSize.scale || 1}
          scaleY={stageSize.scale || 1}
          onClick={handleStageClick}
          onTap={handleStageClick}
          style={{
            margin: '0 auto',
            display: 'block',
            touchAction: 'none',
          }}
        >
          {/* Silhouette layer (non-interactive) */}
          <Layer listening={false}>
            <Path
              data={puzzle.silhouette}
              fill="rgba(255,255,255,0.08)"
              // Only show outline stroke for classic puzzles (single outline)
              // KiloGram puzzles have multiple polygons, so stroke would show internal lines
              stroke={puzzle.source === 'KiloGram' ? undefined : 'rgba(251,146,60,0.4)'}
              strokeWidth={puzzle.source === 'KiloGram' ? 0 : 2}
              dash={puzzle.source === 'KiloGram' ? undefined : [4, 2]}
              x={40}
              y={10}
            />
          </Layer>

          {/* Pieces layer */}
          <Layer>
            {pieces.map((piece) => (
              <TangramPiece
                key={piece.id}
                piece={piece}
                isSelected={selectedId === piece.id}
                onSelect={setSelectedId}
                onChange={handlePieceChange}
                onDragStart={handleDragStart}
                bounds={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
              />
            ))}
          </Layer>
        </Stage>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Selected piece:</span>
          <button
            className={styles.controlBtn}
            onClick={() => selectedId && rotatePiece(selectedId, -1)}
            disabled={!selectedId}
            title="Rotate left (Q or ←)"
          >
            ↺ Left [Q]
          </button>
          <button
            className={styles.controlBtn}
            onClick={() => selectedId && rotatePiece(selectedId, 1)}
            disabled={!selectedId}
            title="Rotate right (E or →)"
          >
            ↻ Right [E]
          </button>
          <button
            className={styles.controlBtn}
            onClick={() => selectedId && flipPiece(selectedId)}
            disabled={!selectedId}
            title="Flip piece (F or ↑/↓)"
          >
            ⇆ Flip [F]
          </button>
        </div>

        <div className={styles.actionGroup}>
          <button
            className={styles.hintBtn}
            onClick={handleHintClick}
          >
            💡 {!showHint ? 'Show Hint' : hasMoreHints ? 'Next Hint' : 'Hide Hints'}
          </button>
          <button className={styles.resetBtn} onClick={initPieces}>
            🔄 Reset
          </button>
          <button
            className={`${styles.doneBtn} ${isCompleted ? styles.completed : ''}`}
            onClick={markComplete}
          >
            {isCompleted ? '✓ Completed' : '✓ Mark Done'}
          </button>
        </div>
      </div>

      {showHint && (
        <div className={styles.hintBox}>
          <div className={styles.hintHeader}>
            <span className={styles.hintIcon}>💡</span>
            {hints.length > 1 && (
              <span className={styles.hintProgress}>
                Hint {hintLevel + 1} of {hints.length}
              </span>
            )}
          </div>
          <p className={styles.hintText}>{currentHint}</p>
          {hasMoreHints && (
            <p className={styles.hintMore}>Click "Next Hint" for more help...</p>
          )}
        </div>
      )}

      <div className={styles.progressBar}>
        {activePuzzles.map((p, i) => (
          <div
            key={p.id}
            className={`${styles.progressDot} ${completed.has(p.id) ? styles.done : ''} ${i === currentPuzzle ? styles.current : ''}`}
            onClick={() => setCurrentPuzzle(i)}
            title={p.name}
          />
        ))}
      </div>
    </div>
  );
}
