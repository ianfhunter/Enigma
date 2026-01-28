import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import DifficultySelector from '../../components/DifficultySelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import { createSeededRandom } from '../../data/wordUtils';
import styles from './StarBattle.module.css';

const GRID_SIZES = {
  '6×6': 6,
  '8×8': 8,
  '10×10': 10,
  '12×12': 12,
};

// Check validity
function checkValidity(stars, regions, starsPerUnit, crosses = null) {
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
  const { t } = useTranslation();
  const [sizeKey, setSizeKey] = useState('6×6');
  const [difficulty, setDifficulty] = useState('easy');
  const [allPuzzles, setAllPuzzles] = useState([]);
  const [puzzleData, setPuzzleData] = useState(null);
  const [stars, setStars] = useState([]);
  const [crosses, setCrosses] = useState([]);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(false);
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

    const random = createSeededRandom(Date.now());
    const puzzle = available[Math.floor(random() * available.length)];
    const puzzleSize = puzzle.rows;

    setPuzzleData({
      regions: puzzle.regions,
      solution: puzzle.solution,
      starsPerUnit: puzzle.stars,
      size: puzzleSize
    });
    setStars(Array(puzzleSize).fill(null).map(() => Array(puzzleSize).fill(false)));
    setCrosses(Array(puzzleSize).fill(null).map(() => Array(puzzleSize).fill(false)));
    resetGameState();
    setErrors(new Set());
  }, [allPuzzles, size, difficulty, resetGameState]);

  useEffect(() => {
    if (!loading && allPuzzles.length > 0) {
      initGame();
    }
  }, [loading, allPuzzles, initGame]);

  useEffect(() => {
    if (!puzzleData || !isPlaying) return;

    const newErrors = showErrors ? checkValidity(stars, puzzleData.regions, puzzleData.starsPerUnit) : new Set();
    setErrors(newErrors);

    checkWin(checkSolved(stars, puzzleData.regions, puzzleData.starsPerUnit));
  }, [stars, puzzleData, showErrors, isPlaying, checkWin]);

  const handleCellClick = (r, c) => {
    if (!isPlaying) return;

    setStars(prevStars => {
      const newStars = prevStars.map(row => [...row]);
      const newCrosses = crosses.map(row => [...row]);

      // If there's already a star, remove it and add a cross
      if (newStars[r][c]) {
        newStars[r][c] = false;
        newCrosses[r][c] = true;
      }
      // If there's already a cross, remove it (go back to empty)
      else if (newCrosses[r][c]) {
        newCrosses[r][c] = false;
      }
      // If empty, add a star
      else {
        newStars[r][c] = true;
      }

      setCrosses(newCrosses);
      return newStars;
    });
  };

  const handleReset = () => {
    const gridSize = puzzleData?.size || size;
    setStars(Array(gridSize).fill(null).map(() => Array(gridSize).fill(false)));
    setCrosses(Array(gridSize).fill(null).map(() => Array(gridSize).fill(false)));
    resetGameState();
  };

  const handleGiveUp = () => {
    if (!puzzleData || !isPlaying) return;
    setStars(puzzleData.solution.map(row => [...row]));
    giveUp();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <GameHeader title="Star Battle" />
        <div className={styles.loading}>{t('common.loadingPuzzles')}</div>
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
      <GameHeader
        title="Star Battle"
        instructions={`Place ${puzzleData.starsPerUnit} star${puzzleData.starsPerUnit > 1 ? 's' : ''} in each row, column, and outlined region. Stars cannot touch each other, even diagonally.`}
      />

      <SizeSelector
        options={Object.keys(GRID_SIZES)}
        value={sizeKey}
        onChange={setSizeKey}
        className={styles.sizeSelector}
      />

      <DifficultySelector
        options={['easy', 'medium', 'hard']}
        value={difficulty}
        onChange={setDifficulty}
        className={styles.difficultySelector}
      />

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
              const hasCross = crosses[r][c];
              const region = puzzleData.regions[r][c];
              const bgColor = REGION_COLORS[(region - 1) % REGION_COLORS.length];

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${getBorderClasses(r, c)}
                    ${hasStar ? styles.star : ''}
                    ${hasCross ? styles.cross : ''}
                    ${hasError ? styles.error : ''}
                  `}
                  style={{ backgroundColor: bgColor }}
                  onClick={() => handleCellClick(r, c)}
                >
                  {hasStar && <span className={styles.starIcon}>⭐</span>}
                  {hasCross && <span className={styles.crossIcon}>❌</span>}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title={t('gameStatus.solved')}
            message={t('common.allStarsPlaced', 'All stars perfectly placed!')}
            actions={[{ label: 'New Puzzle', onClick: initGame, primary: true }]}
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title="🗺️ Solution Revealed"
            message="Study the pattern and try another puzzle!"
            actions={[{ label: 'New Puzzle', onClick: initGame, primary: true }]}
          />
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
          <GiveUpButton
            onGiveUp={handleGiveUp}
            disabled={!isPlaying}
          />
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
