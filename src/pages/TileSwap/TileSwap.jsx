import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createSeededRandom, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import styles from './TileSwap.module.css';

const GRID_SIZES = {
  '3×3': 3,
  '4×4': 4,
  '5×5': 5,
};

// Generate a procedural abstract pattern using canvas
function generatePatternImage(size, seed, cellSize) {
  const random = createSeededRandom(seed);
  const canvas = document.createElement('canvas');
  const totalSize = size * cellSize;
  canvas.width = totalSize;
  canvas.height = totalSize;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, totalSize, totalSize);
  const hue1 = Math.floor(random() * 360);
  const hue2 = (hue1 + 30 + Math.floor(random() * 60)) % 360;
  bgGradient.addColorStop(0, `hsl(${hue1}, 70%, 40%)`);
  bgGradient.addColorStop(1, `hsl(${hue2}, 70%, 30%)`);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, totalSize, totalSize);

  // Draw geometric shapes
  const shapes = Math.floor(random() * 10) + 15;

  for (let i = 0; i < shapes; i++) {
    const x = random() * totalSize;
    const y = random() * totalSize;
    const shapeSize = random() * 100 + 30;
    const hue = Math.floor(random() * 360);
    const alpha = random() * 0.4 + 0.1;

    ctx.fillStyle = `hsla(${hue}, 60%, 60%, ${alpha})`;
    ctx.strokeStyle = `hsla(${hue}, 70%, 70%, ${alpha + 0.2})`;
    ctx.lineWidth = 2;

    const shapeType = Math.floor(random() * 4);

    ctx.beginPath();
    if (shapeType === 0) {
      // Circle
      ctx.arc(x, y, shapeSize / 2, 0, Math.PI * 2);
    } else if (shapeType === 1) {
      // Rectangle
      ctx.rect(x - shapeSize / 2, y - shapeSize / 2, shapeSize, shapeSize * (random() * 0.5 + 0.5));
    } else if (shapeType === 2) {
      // Triangle
      ctx.moveTo(x, y - shapeSize / 2);
      ctx.lineTo(x + shapeSize / 2, y + shapeSize / 2);
      ctx.lineTo(x - shapeSize / 2, y + shapeSize / 2);
      ctx.closePath();
    } else {
      // Star-like shape
      for (let j = 0; j < 5; j++) {
        const angle = (j * Math.PI * 2) / 5 - Math.PI / 2;
        const px = x + Math.cos(angle) * shapeSize / 2;
        const py = y + Math.sin(angle) * shapeSize / 2;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    }

    ctx.fill();
    ctx.stroke();
  }

  // Add some lines
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(random() * totalSize, random() * totalSize);
    ctx.lineTo(random() * totalSize, random() * totalSize);
    ctx.strokeStyle = `hsla(${Math.floor(random() * 360)}, 50%, 70%, 0.3)`;
    ctx.lineWidth = random() * 5 + 1;
    ctx.stroke();
  }

  return canvas.toDataURL();
}

function createPieces(size) {
  const pieces = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      pieces.push({
        id: row * size + col,
        correctRow: row,
        correctCol: col,
        currentIndex: row * size + col,
      });
    }
  }
  return pieces;
}

function shufflePieces(pieces, random) {
  const shuffled = [...pieces];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    // Swap currentIndex
    const tempIndex = shuffled[i].currentIndex;
    shuffled[i].currentIndex = shuffled[j].currentIndex;
    shuffled[j].currentIndex = tempIndex;
  }
  return shuffled;
}

function checkSolved(pieces) {
  return pieces.every(p => p.currentIndex === p.id);
}

export default function TileSwap() {
  const [size, setSize] = useState(3);
  const [pieces, setPieces] = useState([]);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const [showPreview, setShowPreview] = useState(false);

  const cellSize = 80;

  const initGame = useCallback((newSize = size) => {
    const today = getTodayDateString();
    const seed = stringToSeed(`tileswap-${today}-${newSize}`);
    const random = createSeededRandom(seed);

    const url = generatePatternImage(newSize, seed, cellSize);
    setImageUrl(url);

    const newPieces = createPieces(newSize);
    const shuffled = shufflePieces(newPieces, random);

    setPieces(shuffled);
    setSize(newSize);
    setSelectedPiece(null);
    setMoves(0);
    setGameState('playing');
    setShowPreview(false);
  }, [size]);

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    if (pieces.length > 0 && checkSolved(pieces) && moves > 0) {
      setGameState('won');
    }
  }, [pieces, moves]);

  const handlePieceClick = (piece) => {
    if (gameState === 'won') return;

    if (selectedPiece === null) {
      setSelectedPiece(piece);
    } else if (selectedPiece.id === piece.id) {
      setSelectedPiece(null);
    } else {
      // Swap pieces
      setPieces(prev => {
        const newPieces = prev.map(p => {
          if (p.id === selectedPiece.id) {
            return { ...p, currentIndex: piece.currentIndex };
          }
          if (p.id === piece.id) {
            return { ...p, currentIndex: selectedPiece.currentIndex };
          }
          return p;
        });
        return newPieces;
      });

      setMoves(m => m + 1);
      setSelectedPiece(null);
    }
  };

  const getPieceAtPosition = (index) => {
    return pieces.find(p => p.currentIndex === index);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Tile Swap</h1>
        <p className={styles.instructions}>
          Click two pieces to swap them. Arrange the image correctly!
        </p>
      </div>

      <div className={styles.sizeSelector}>
        {Object.entries(GRID_SIZES).map(([label, value]) => (
          <button
            key={label}
            className={`${styles.sizeBtn} ${size === value ? styles.active : ''}`}
            onClick={() => initGame(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.gameArea}>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Moves</span>
            <span className={styles.statValue}>{moves}</span>
          </div>
          <button
            className={styles.previewBtn}
            onMouseDown={() => setShowPreview(true)}
            onMouseUp={() => setShowPreview(false)}
            onMouseLeave={() => setShowPreview(false)}
          >
            👁️ Preview
          </button>
        </div>

        <div className={styles.puzzleContainer}>
          {showPreview && (
            <div className={styles.previewOverlay}>
              <img src={imageUrl} alt="Solution preview" />
            </div>
          )}

          <div
            className={styles.puzzle}
            style={{
              gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
            }}
          >
            {Array.from({ length: size * size }).map((_, index) => {
              const piece = getPieceAtPosition(index);
              const isSelected = selectedPiece?.id === piece?.id;
              const isCorrect = piece && piece.currentIndex === piece.id;

              return (
                <div
                  key={index}
                  className={`${styles.piece} ${isSelected ? styles.selected : ''} ${isCorrect ? styles.correct : ''}`}
                  onClick={() => piece && handlePieceClick(piece)}
                  style={{
                    backgroundImage: `url(${imageUrl})`,
                    backgroundPosition: piece
                      ? `-${piece.correctCol * cellSize}px -${piece.correctRow * cellSize}px`
                      : '0 0',
                    backgroundSize: `${size * cellSize}px ${size * cellSize}px`,
                  }}
                />
              );
            })}
          </div>
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            🎉 Puzzle complete in {moves} moves!
          </div>
        )}

        <button className={styles.newGameBtn} onClick={() => initGame(size)}>
          New Puzzle
        </button>
      </div>
    </div>
  );
}
