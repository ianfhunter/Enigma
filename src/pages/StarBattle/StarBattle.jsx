import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './StarBattle.module.css';

const GRID_SIZES = {
  '6×6': 6,
  '8×8': 8,
  '10×10': 10,
  '12×12': 12,
};

// Check validity
function checkValidity(stars, regions, starsPerUnit) {
  const size = stars.length;
  const errors = new Set();

  // Check rows
  for (let r = 0; r < size; r++) {
    let count = 0;
    for (let c = 0; c < size; c++) {
      if (stars[r][c]) count++;
    }
    if (count > starsPerUnit) {
      for (let c = 0; c < size; c++) {
        if (stars[r][c]) errors.add(`${r},${c}`);
      }
    }
  }

  // Check columns
  for (let c = 0; c < size; c++) {
    let count = 0;
    for (let r = 0; r < size; r++) {
      if (stars[r][c]) count++;
    }
    if (count > starsPerUnit) {
      for (let r = 0; r < size; r++) {
        if (stars[r][c]) errors.add(`${r},${c}`);
      }
    }
  }

  // Check regions
  const regionCounts = {};
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (stars[r][c]) {
        const region = regions[r][c];
        regionCounts[region] = (regionCounts[region] || 0) + 1;
      }
    }
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (stars[r][c] && regionCounts[regions[r][c]] > starsPerUnit) {
        errors.add(`${r},${c}`);
      }
    }
  }

  // Check adjacent stars
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!stars[r][c]) continue;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && stars[nr][nc]) {
            errors.add(`${r},${c}`);
            errors.add(`${nr},${nc}`);
          }
        }
      }
    }
  }

  return errors;
}

function checkSolved(stars, regions, starsPerUnit) {
  const size = stars.length;
  const errors = checkValidity(stars, regions, starsPerUnit);
  if (errors.size > 0) return false;

  // Check each row has exactly starsPerUnit stars
  for (let r = 0; r < size; r++) {
    let count = 0;
    for (let c = 0; c < size; c++) {
      if (stars[r][c]) count++;
    }
    if (count !== starsPerUnit) return false;
  }

  return true;
}

// Generate colors for regions
const REGION_COLORS = [
  'rgba(239, 68, 68, 0.3)',
  'rgba(249, 115, 22, 0.3)',
  'rgba(234, 179, 8, 0.3)',
  'rgba(34, 197, 94, 0.3)',
  'rgba(14, 165, 233, 0.3)',
  'rgba(99, 102, 241, 0.3)',
  'rgba(168, 85, 247, 0.3)',
  'rgba(236, 72, 153, 0.3)',
  'rgba(20, 184, 166, 0.3)',
  'rgba(251, 191, 36, 0.3)',
  'rgba(74, 222, 128, 0.3)',
  'rgba(56, 189, 248, 0.3)',
];

export default function StarBattle() {
  const [sizeKey, setSizeKey] = useState('6×6');
  const [difficulty, setDifficulty] = useState('easy');
  const [allPuzzles, setAllPuzzles] = useState([]);
  const [puzzleData, setPuzzleData] = useState(null);
  const [stars, setStars] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [loading, setLoading] = useState(true);

  const size = GRID_SIZES[sizeKey];

  // Load puzzles from dataset
  useEffect(() => {
    fetch('/datasets/starbattlePuzzles.json')
      .then(res => res.json())
      .then(data => {
        setAllPuzzles(data.puzzles || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load Star Battle puzzles:', err);
        setLoading(false);
      });
  }, []);

  const initGame = useCallback(() => {
    if (allPuzzles.length === 0) return;

    let available = allPuzzles.filter(p =>
      p.rows === size && p.cols === size && p.difficulty === difficulty
    );

    if (available.length === 0) {
      available = allPuzzles.filter(p => p.rows === size && p.cols === size);
    }

    if (available.length === 0) {
      const sizes = [...new Set(allPuzzles.filter(p => p.rows === p.cols).map(p => p.rows))].sort((a,b) => a-b);
      const closest = sizes.reduce((prev, curr) => Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev, sizes[0]);
      available = allPuzzles.filter(p => p.rows === closest && p.cols === closest);
    }

    if (available.length === 0) return;

    const puzzle = available[Math.floor(Math.random() * available.length)];
    const puzzleSize = puzzle.rows;

    setPuzzleData({
      regions: puzzle.regions,
      solution: puzzle.solution,
      starsPerUnit: puzzle.stars,
      size: puzzleSize
    });
    setStars(Array(puzzleSize).fill(null).map(() => Array(puzzleSize).fill(false)));
    setGameState('playing');
    setErrors(new Set());
  }, [allPuzzles, size, difficulty]);

  useEffect(() => {
    if (!loading && allPuzzles.length > 0) {
      initGame();
    }
  }, [loading, allPuzzles, initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    const newErrors = showErrors ? checkValidity(stars, puzzleData.regions, puzzleData.starsPerUnit) : new Set();
    setErrors(newErrors);

    if (checkSolved(stars, puzzleData.regions, puzzleData.starsPerUnit)) {
      setGameState('won');
    }
  }, [stars, puzzleData, showErrors]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing') return;

    setStars(prev => {
      const newStars = prev.map(row => [...row]);
      newStars[r][c] = !newStars[r][c];
      return newStars;
    });
  };

  const handleReset = () => {
    const gridSize = puzzleData?.size || size;
    setStars(Array(gridSize).fill(null).map(() => Array(gridSize).fill(false)));
    setGameState('playing');
  };

  const handleGiveUp = () => {
    if (!puzzleData || gameState !== 'playing') return;
    setStars(puzzleData.solution.map(row => [...row]));
    setGameState('gaveUp');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/" className={styles.backLink}>← Back to Games</Link>
          <h1 className={styles.title}>Star Battle</h1>
        </div>
        <div className={styles.loading}>Loading puzzles...</div>
      </div>
    );
  }

  if (!puzzleData) return null;

  const gridSize = puzzleData.size || size;

  // Calculate border classes for regions
  const getBorderClasses = (r, c) => {
    const region = puzzleData.regions[r][c];
    const classes = [];
    if (r === 0 || puzzleData.regions[r-1][c] !== region) classes.push(styles.borderTop);
    if (r === gridSize - 1 || puzzleData.regions[r+1][c] !== region) classes.push(styles.borderBottom);
    if (c === 0 || puzzleData.regions[r][c-1] !== region) classes.push(styles.borderLeft);
    if (c === gridSize - 1 || puzzleData.regions[r][c+1] !== region) classes.push(styles.borderRight);
    return classes.join(' ');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Star Battle</h1>
        <p className={styles.instructions}>
          Place {puzzleData.starsPerUnit} star{puzzleData.starsPerUnit > 1 ? 's' : ''} in each row, column, and outlined region.
          Stars cannot touch each other, even diagonally.
        </p>
      </div>

      <div className={styles.sizeSelector}>
        {Object.keys(GRID_SIZES).map((key) => (
          <button
            key={key}
            className={`${styles.sizeBtn} ${sizeKey === key ? styles.active : ''}`}
            onClick={() => setSizeKey(key)}
          >
            {key}
          </button>
        ))}
      </div>

      <div className={styles.difficultySelector}>
        {['easy', 'medium', 'hard'].map((d) => (
          <button
            key={d}
            className={`${styles.difficultyBtn} ${difficulty === d ? styles.active : ''}`}
            onClick={() => setDifficulty(d)}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.gameArea}>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            width: `${Math.min(gridSize * 45, 500)}px`,
            height: `${Math.min(gridSize * 45, 500)}px`,
          }}
        >
          {stars.map((row, r) =>
            row.map((hasStar, c) => {
              const hasError = errors.has(`${r},${c}`);
              const region = puzzleData.regions[r][c];
              const bgColor = REGION_COLORS[(region - 1) % REGION_COLORS.length];

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${getBorderClasses(r, c)}
                    ${hasStar ? styles.star : ''}
                    ${hasError ? styles.error : ''}
                  `}
                  style={{ backgroundColor: bgColor }}
                  onClick={() => handleCellClick(r, c)}
                >
                  {hasStar && <span className={styles.starIcon}>⭐</span>}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🌟</div>
            <h3>Puzzle Solved!</h3>
            <p>All stars perfectly placed!</p>
          </div>
        )}

        {gameState === 'gaveUp' && (
          <div className={styles.gaveUpMessage}>
            <div className={styles.gaveUpEmoji}>🗺️</div>
            <h3>Solution Revealed</h3>
            <p>Study the pattern and try another puzzle!</p>
          </div>
        )}

        <div className={styles.controls}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showErrors}
              onChange={(e) => setShowErrors(e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            Show errors
          </label>
        </div>

        <div className={styles.buttons}>
          <button className={styles.resetBtn} onClick={handleReset}>
            Reset
          </button>
          {gameState === 'playing' && (
            <button className={styles.giveUpBtn} onClick={handleGiveUp}>
              Give Up
            </button>
          )}
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
