import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './TheseusMinotaur.module.css';

// Difficulty presets
const DIFFICULTIES = {
  'Easy': { width: 5, height: 5, wallDensity: 0.25, minMoves: 5 },
  'Medium': { width: 7, height: 7, wallDensity: 0.3, minMoves: 10 },
  'Hard': { width: 9, height: 9, wallDensity: 0.35, minMoves: 15 },
  'Expert': { width: 11, height: 11, wallDensity: 0.4, minMoves: 20 },
};

// Check if movement from (x, y) in direction (dx, dy) is blocked by a wall
function isBlocked(walls, width, height, x, y, dx, dy) {
  // Check boundary walls
  if (x + dx < 0 || x + dx >= width || y + dy < 0 || y + dy >= height) {
    return true;
  }
  
  // Check internal walls based on direction
  if (dy === -1) {
    return (walls[y][x] & 1) !== 0; // wall above
  } else if (dx === 1) {
    return (walls[y][x] & 2) !== 0; // wall right
  } else if (dy === 1) {
    return (walls[y][x] & 4) !== 0; // wall below
  } else if (dx === -1) {
    return (walls[y][x] & 8) !== 0; // wall left
  }
  
  return false;
}

// Move the minotaur towards Theseus (horizontal first, then vertical)
function moveMinotaurOnce(walls, width, height, minotaur, theseus) {
  let { x, y } = minotaur;
  
  // Horizontal movement first
  if (theseus.x > x && !isBlocked(walls, width, height, x, y, 1, 0)) {
    return { x: x + 1, y };
  } else if (theseus.x < x && !isBlocked(walls, width, height, x, y, -1, 0)) {
    return { x: x - 1, y };
  }
  // Vertical movement if horizontal didn't move or wasn't needed
  else if (theseus.y > y && !isBlocked(walls, width, height, x, y, 0, 1)) {
    return { x, y: y + 1 };
  } else if (theseus.y < y && !isBlocked(walls, width, height, x, y, 0, -1)) {
    return { x, y: y - 1 };
  }
  
  return { x, y };
}

// State key for BFS
function stateKey(theseus, minotaur) {
  return `${theseus.x},${theseus.y},${minotaur.x},${minotaur.y}`;
}

// BFS solver to find minimum moves to solve the puzzle
function solvePuzzle(walls, width, height, startTheseus, startMinotaur, exit) {
  const visited = new Set();
  const queue = [{ theseus: startTheseus, minotaur: startMinotaur, moves: 0, path: [] }];
  
  const directions = [
    { dx: 0, dy: -1, name: 'up' },
    { dx: 1, dy: 0, name: 'right' },
    { dx: 0, dy: 1, name: 'down' },
    { dx: -1, dy: 0, name: 'left' },
    { dx: 0, dy: 0, name: 'wait' },
  ];
  
  while (queue.length > 0) {
    const { theseus, minotaur, moves, path } = queue.shift();
    const key = stateKey(theseus, minotaur);
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    // Try each direction
    for (const { dx, dy, name } of directions) {
      // Check if Theseus can move
      if (dx !== 0 || dy !== 0) {
        if (isBlocked(walls, width, height, theseus.x, theseus.y, dx, dy)) {
          continue;
        }
      }
      
      const newTheseus = { x: theseus.x + dx, y: theseus.y + dy };
      
      // Check if Theseus reached exit
      if (newTheseus.x === exit.x && newTheseus.y === exit.y) {
        return { solvable: true, minMoves: moves + 1, path: [...path, name] };
      }
      
      // Minotaur moves twice
      let newMinotaur = { ...minotaur };
      let caught = false;
      
      for (let i = 0; i < 2; i++) {
        newMinotaur = moveMinotaurOnce(walls, width, height, newMinotaur, newTheseus);
        if (newMinotaur.x === newTheseus.x && newMinotaur.y === newTheseus.y) {
          caught = true;
          break;
        }
      }
      
      if (caught) continue;
      
      const newKey = stateKey(newTheseus, newMinotaur);
      if (!visited.has(newKey)) {
        queue.push({
          theseus: newTheseus,
          minotaur: newMinotaur,
          moves: moves + 1,
          path: [...path, name],
        });
      }
    }
  }
  
  return { solvable: false, minMoves: 0, path: [] };
}

// Generate random walls for the maze
function generateWalls(width, height, density) {
  const walls = Array(height).fill(null).map(() => Array(width).fill(0));
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Add wall below (if not at bottom edge)
      if (y < height - 1 && Math.random() < density) {
        walls[y][x] |= 4; // wall below current cell
        walls[y + 1][x] |= 1; // wall above cell below
      }
      // Add wall to the right (if not at right edge)
      if (x < width - 1 && Math.random() < density) {
        walls[y][x] |= 2; // wall right of current cell
        walls[y][x + 1] |= 8; // wall left of cell to the right
      }
    }
  }
  
  return walls;
}

// Check if a position is reachable from another using BFS (ignoring minotaur)
function isReachable(walls, width, height, from, to) {
  const visited = new Set();
  const queue = [from];
  
  while (queue.length > 0) {
    const pos = queue.shift();
    const key = `${pos.x},${pos.y}`;
    
    if (pos.x === to.x && pos.y === to.y) return true;
    if (visited.has(key)) continue;
    visited.add(key);
    
    const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (const [dx, dy] of directions) {
      if (!isBlocked(walls, width, height, pos.x, pos.y, dx, dy)) {
        const newPos = { x: pos.x + dx, y: pos.y + dy };
        if (!visited.has(`${newPos.x},${newPos.y}`)) {
          queue.push(newPos);
        }
      }
    }
  }
  
  return false;
}

// Generate a complete puzzle
function generatePuzzle(difficulty) {
  const { width, height, wallDensity, minMoves } = DIFFICULTIES[difficulty];
  const maxAttempts = 100;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate walls
    const walls = generateWalls(width, height, wallDensity);
    
    // Place exit at a random edge position (prefer corners)
    const exitPositions = [
      { x: width - 1, y: 0 },
      { x: width - 1, y: height - 1 },
      { x: 0, y: 0 },
      { x: width - 1, y: Math.floor(height / 2) },
    ];
    const exit = exitPositions[Math.floor(Math.random() * exitPositions.length)];
    
    // Place Theseus far from exit
    let theseus;
    if (exit.x === width - 1) {
      theseus = { x: 0, y: Math.floor(Math.random() * height) };
    } else {
      theseus = { x: width - 1, y: Math.floor(Math.random() * height) };
    }
    
    // Check if Theseus can reach exit (basic connectivity)
    if (!isReachable(walls, width, height, theseus, exit)) {
      continue;
    }
    
    // Place Minotaur between Theseus and exit, but not too close to either
    let minotaur;
    let minotaurAttempts = 0;
    const maxMinotaurAttempts = 20;
    
    while (minotaurAttempts < maxMinotaurAttempts) {
      const mx = Math.floor(Math.random() * width);
      const my = Math.floor(Math.random() * height);
      minotaur = { x: mx, y: my };
      
      // Ensure minotaur is not on theseus, exit, or too close
      const distToTheseus = Math.abs(mx - theseus.x) + Math.abs(my - theseus.y);
      const distToExit = Math.abs(mx - exit.x) + Math.abs(my - exit.y);
      
      if (distToTheseus >= 2 && distToExit >= 2 &&
          !(mx === theseus.x && my === theseus.y) &&
          !(mx === exit.x && my === exit.y)) {
        break;
      }
      minotaurAttempts++;
    }
    
    if (minotaurAttempts >= maxMinotaurAttempts) continue;
    
    // Solve the puzzle to check if it's valid and challenging
    const solution = solvePuzzle(walls, width, height, theseus, minotaur, exit);
    
    if (solution.solvable && solution.minMoves >= minMoves) {
      return {
        width,
        height,
        walls,
        theseus,
        minotaur,
        exit,
        minMoves: solution.minMoves,
        solution: solution.path,
      };
    }
  }
  
  // Fallback: generate a simpler puzzle with fewer walls
  return generateSimplePuzzle(width, height, minMoves);
}

// Fallback puzzle generator with guaranteed solution
function generateSimplePuzzle(width, height, targetMoves) {
  const walls = Array(height).fill(null).map(() => Array(width).fill(0));
  
  // Add some strategic walls
  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      if (Math.random() < 0.4) {
        const dir = Math.floor(Math.random() * 2);
        if (dir === 0 && y < height - 1) {
          walls[y][x] |= 4;
          walls[y + 1][x] |= 1;
        } else if (x < width - 1) {
          walls[y][x] |= 2;
          walls[y][x + 1] |= 8;
        }
      }
    }
  }
  
  const exit = { x: width - 1, y: 0 };
  const theseus = { x: 0, y: height - 1 };
  const minotaur = { x: Math.floor(width / 2), y: Math.floor(height / 2) };
  
  const solution = solvePuzzle(walls, width, height, theseus, minotaur, exit);
  
  return {
    width,
    height,
    walls,
    theseus,
    minotaur,
    exit,
    minMoves: solution.solvable ? solution.minMoves : targetMoves,
    solution: solution.path,
  };
}

export default function TheseusMinotaur() {
  const [difficulty, setDifficulty] = useState('Medium');
  const [puzzle, setPuzzle] = useState(null);
  const [theseus, setTheseus] = useState({ x: 0, y: 0 });
  const [minotaur, setMinotaur] = useState({ x: 0, y: 0 });
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const [history, setHistory] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [gamesWon, setGamesWon] = useState(() => {
    const saved = localStorage.getItem('theseus-minotaur-wins');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  
  const gameAreaRef = useRef(null);

  const generateNewPuzzle = useCallback((diff) => {
    setIsGenerating(true);
    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      const newPuzzle = generatePuzzle(diff);
      setPuzzle(newPuzzle);
      setTheseus({ ...newPuzzle.theseus });
      setMinotaur({ ...newPuzzle.minotaur });
      setMoves(0);
      setGameState('playing');
      setHistory([{ theseus: { ...newPuzzle.theseus }, minotaur: { ...newPuzzle.minotaur } }]);
      setShowHint(false);
      setIsGenerating(false);
    }, 10);
  }, []);

  useEffect(() => {
    generateNewPuzzle(difficulty);
  }, [difficulty, generateNewPuzzle]);

  useEffect(() => {
    localStorage.setItem('theseus-minotaur-wins', gamesWon.toString());
  }, [gamesWon]);

  const moveTheseus = useCallback((dx, dy) => {
    if (gameState !== 'playing' || !puzzle) return;
    
    const { walls, width, height, exit } = puzzle;
    
    // Check if Theseus can move
    if (dx !== 0 || dy !== 0) {
      if (isBlocked(walls, width, height, theseus.x, theseus.y, dx, dy)) {
        return;
      }
    }
    
    const newTheseus = { x: theseus.x + dx, y: theseus.y + dy };
    
    // Check if Theseus reached exit
    if (newTheseus.x === exit.x && newTheseus.y === exit.y) {
      setTheseus(newTheseus);
      setMoves(m => m + 1);
      setGameState('won');
      setGamesWon(w => w + 1);
      return;
    }
    
    // Minotaur moves twice
    let newMinotaur = { ...minotaur };
    for (let i = 0; i < 2; i++) {
      newMinotaur = moveMinotaurOnce(walls, width, height, newMinotaur, newTheseus);
      
      if (newMinotaur.x === newTheseus.x && newMinotaur.y === newTheseus.y) {
        setTheseus(newTheseus);
        setMinotaur(newMinotaur);
        setMoves(m => m + 1);
        setGameState('lost');
        return;
      }
    }
    
    setTheseus(newTheseus);
    setMinotaur(newMinotaur);
    setMoves(m => m + 1);
    setHistory(h => [...h, { theseus: newTheseus, minotaur: newMinotaur }]);
    setShowHint(false);
  }, [gameState, puzzle, theseus, minotaur]);

  const undoMove = useCallback(() => {
    if (history.length <= 1) return;
    
    const newHistory = history.slice(0, -1);
    const lastState = newHistory[newHistory.length - 1];
    
    setTheseus(lastState.theseus);
    setMinotaur(lastState.minotaur);
    setHistory(newHistory);
    setMoves(m => m - 1);
    setGameState('playing');
    setShowHint(false);
  }, [history]);

  // Get hint for next move
  const getHint = useCallback(() => {
    if (!puzzle || gameState !== 'playing') return null;
    
    const solution = solvePuzzle(
      puzzle.walls, puzzle.width, puzzle.height,
      theseus, minotaur, puzzle.exit
    );
    
    if (solution.solvable && solution.path.length > 0) {
      return solution.path[0];
    }
    return null;
  }, [puzzle, theseus, minotaur, gameState]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          generateNewPuzzle(difficulty);
        }
        return;
      }
      
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          e.preventDefault();
          moveTheseus(0, -1);
          break;
        case 'arrowright':
        case 'd':
          e.preventDefault();
          moveTheseus(1, 0);
          break;
        case 'arrowdown':
        case 's':
          e.preventDefault();
          moveTheseus(0, 1);
          break;
        case 'arrowleft':
        case 'a':
          e.preventDefault();
          moveTheseus(-1, 0);
          break;
        case ' ':
          e.preventDefault();
          moveTheseus(0, 0);
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            undoMove();
          }
          break;
        case 'u':
          e.preventDefault();
          undoMove();
          break;
        case 'r':
          e.preventDefault();
          generateNewPuzzle(difficulty);
          break;
        case 'h':
          e.preventDefault();
          setShowHint(true);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, moveTheseus, undoMove, generateNewPuzzle, difficulty]);

  // Focus game area
  useEffect(() => {
    if (gameAreaRef.current) {
      gameAreaRef.current.focus();
    }
  }, [puzzle]);

  if (!puzzle || isGenerating) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/" className={styles.backLink}>← Back to Games</Link>
          <h1 className={styles.title}>Theseus & the Minotaur</h1>
        </div>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Generating puzzle...</p>
        </div>
      </div>
    );
  }

  const cellSize = Math.min(45, Math.floor(400 / Math.max(puzzle.width, puzzle.height)));
  const hint = showHint ? getHint() : null;

  // Render walls for a cell
  const renderWalls = (x, y) => {
    const wallValue = puzzle.walls[y][x];
    const wallClasses = [];
    
    if (wallValue & 1) wallClasses.push(styles.wallTop);
    if (wallValue & 2) wallClasses.push(styles.wallRight);
    if (wallValue & 4) wallClasses.push(styles.wallBottom);
    if (wallValue & 8) wallClasses.push(styles.wallLeft);
    
    return wallClasses.join(' ');
  };

  // Get hint arrow
  const getHintArrow = () => {
    switch (hint) {
      case 'up': return '↑';
      case 'down': return '↓';
      case 'left': return '←';
      case 'right': return '→';
      case 'wait': return '⏸';
      default: return '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Theseus & the Minotaur</h1>
        <p className={styles.instructions}>
          Guide Theseus 🦸 to the exit 🚪! The Minotaur 🐂 moves twice after each move (horizontal first).
        </p>
      </div>

      <div className={styles.difficultySelector}>
        {Object.keys(DIFFICULTIES).map((diff) => (
          <button
            key={diff}
            className={`${styles.diffBtn} ${difficulty === diff ? styles.active : ''}`}
            onClick={() => setDifficulty(diff)}
          >
            {diff}
          </button>
        ))}
      </div>

      <div className={styles.gameArea} ref={gameAreaRef} tabIndex={0}>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Moves</span>
            <span className={styles.statValue}>{moves}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Optimal</span>
            <span className={styles.statValue}>{puzzle.minMoves}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Wins</span>
            <span className={styles.statValue}>{gamesWon}</span>
          </div>
        </div>

        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${puzzle.width}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${puzzle.height}, ${cellSize}px)`,
          }}
        >
          {puzzle.walls.map((row, y) =>
            row.map((_, x) => {
              const isTheseusHere = theseus.x === x && theseus.y === y;
              const isMinotaurHere = minotaur.x === x && minotaur.y === y;
              const isExit = puzzle.exit.x === x && puzzle.exit.y === y;

              return (
                <div
                  key={`${x}-${y}`}
                  className={`${styles.cell} ${renderWalls(x, y)} ${isExit ? styles.exit : ''}`}
                  style={{ width: cellSize, height: cellSize }}
                >
                  {isTheseusHere && (
                    <span className={`${styles.character} ${styles.theseus}`} title="Theseus">
                      🦸
                    </span>
                  )}
                  {isMinotaurHere && (
                    <span className={`${styles.character} ${styles.minotaur}`} title="Minotaur">
                      🐂
                    </span>
                  )}
                  {isExit && !isTheseusHere && (
                    <span className={styles.exitIcon} title="Exit">🚪</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {hint && (
          <div className={styles.hintDisplay}>
            Hint: Move {hint} {getHintArrow()}
          </div>
        )}

        {/* Mobile controls */}
        <div className={styles.mobileControls}>
          <button className={styles.controlBtn} onClick={() => moveTheseus(0, -1)}>↑</button>
          <div className={styles.controlRow}>
            <button className={styles.controlBtn} onClick={() => moveTheseus(-1, 0)}>←</button>
            <button className={`${styles.controlBtn} ${styles.waitBtn}`} onClick={() => moveTheseus(0, 0)}>⏸</button>
            <button className={styles.controlBtn} onClick={() => moveTheseus(1, 0)}>→</button>
          </div>
          <button className={styles.controlBtn} onClick={() => moveTheseus(0, 1)}>↓</button>
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <h3>Escape Successful!</h3>
            <p>Completed in {moves} moves (optimal: {puzzle.minMoves})</p>
            {moves === puzzle.minMoves && (
              <p className={styles.perfect}>🏆 Perfect Solution!</p>
            )}
            <button className={styles.nextBtn} onClick={() => generateNewPuzzle(difficulty)}>
              New Puzzle →
            </button>
          </div>
        )}

        {gameState === 'lost' && (
          <div className={styles.loseMessage}>
            <div className={styles.loseEmoji}>💀</div>
            <h3>Caught by the Minotaur!</h3>
            <p>Try again or undo your last move</p>
            <div className={styles.loseButtons}>
              <button className={styles.undoBtnLarge} onClick={undoMove}>
                ↶ Undo
              </button>
              <button className={styles.restartBtnSmall} onClick={() => generateNewPuzzle(difficulty)}>
                New Puzzle
              </button>
            </div>
          </div>
        )}

        <div className={styles.buttons}>
          <button 
            className={styles.hintBtn} 
            onClick={() => setShowHint(true)}
            disabled={gameState !== 'playing'}
          >
            💡 Hint
          </button>
          <button 
            className={styles.undoBtn} 
            onClick={undoMove}
            disabled={history.length <= 1 || gameState === 'won'}
          >
            ↶ Undo
          </button>
          <button className={styles.newGameBtn} onClick={() => generateNewPuzzle(difficulty)}>
            🎲 New
          </button>
        </div>

        <div className={styles.controls}>
          <p>Arrow keys or WASD to move • Space to wait • U to undo • H for hint • R for new puzzle</p>
        </div>
      </div>
    </div>
  );
}
