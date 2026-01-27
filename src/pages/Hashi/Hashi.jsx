import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import { createSeededRandom } from '../../data/wordUtils';
import styles from './Hashi.module.css';

const GRID_SIZES = {
  'Small': { size: 7, islands: 8 },
  'Medium': { size: 9, islands: 12 },
  'Large': { size: 11, islands: 16 },
};

// Generate a guaranteed-solvable Hashi puzzle
function generatePuzzle(gridSize, numIslands, random = Math.random) {
  // Try multiple times to generate a valid puzzle
  for (let attempt = 0; attempt < 20; attempt++) {
    const result = tryGeneratePuzzle(gridSize, numIslands, random);
    if (result && result.islands.length >= Math.floor(numIslands * 0.7)) {
      return result;
    }
  }
  // Fallback to a simpler guaranteed puzzle
  return generateSimplePuzzle(gridSize, random);
}

function tryGeneratePuzzle(gridSize, numIslands, random = Math.random) {
  const islands = [];
  const bridges = new Map();

  // Place islands on a grid pattern with some randomization
  const _spacing = Math.max(2, Math.floor(gridSize / Math.sqrt(numIslands)));
  const candidates = [];

  for (let r = 1; r < gridSize - 1; r++) {
    for (let c = 1; c < gridSize - 1; c++) {
      candidates.push([r, c]);
    }
  }

  // Shuffle candidates
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  // Place islands ensuring minimum spacing
  for (const [r, c] of candidates) {
    if (islands.length >= numIslands) break;

    let valid = true;
    for (const island of islands) {
      // Manhattan distance check - but allow same row/column for bridges
      const sameRow = island.r === r;
      const sameCol = island.c === c;
      const dist = Math.abs(island.r - r) + Math.abs(island.c - c);

      // Too close if adjacent and not aligned
      if (dist < 2) {
        valid = false;
        break;
      }
      // If aligned, ensure some spacing
      if (sameRow && Math.abs(island.c - c) < 2) {
        valid = false;
        break;
      }
      if (sameCol && Math.abs(island.r - r) < 2) {
        valid = false;
        break;
      }
    }

    if (valid) {
      islands.push({ r, c, value: 0 });
    }
  }

  if (islands.length < 3) return null;

  // Helper to get bridge key
  function getBridgeKey(i1, i2) {
    const island1 = islands[i1];
    const island2 = islands[i2];
    const key1 = `${island1.r},${island1.c}`;
    const key2 = `${island2.r},${island2.c}`;
    return key1 < key2 ? `${key1}-${key2}` : `${key2}-${key1}`;
  }

  // Check if two islands can be connected
  function canConnect(i1, i2, checkCrossing = true) {
    const island1 = islands[i1];
    const island2 = islands[i2];

    // Must be aligned
    if (island1.r !== island2.r && island1.c !== island2.c) return false;

    const minR = Math.min(island1.r, island2.r);
    const maxR = Math.max(island1.r, island2.r);
    const minC = Math.min(island1.c, island2.c);
    const maxC = Math.max(island1.c, island2.c);

    // Check for islands in between
    for (let i = 0; i < islands.length; i++) {
      if (i === i1 || i === i2) continue;
      const other = islands[i];

      if (island1.r === island2.r && other.r === island1.r) {
        if (other.c > minC && other.c < maxC) return false;
      }
      if (island1.c === island2.c && other.c === island1.c) {
        if (other.r > minR && other.r < maxR) return false;
      }
    }

    if (!checkCrossing) return true;

    // Check for crossing bridges
    for (const [key] of bridges) {
      const [p1, p2] = key.split('-');
      const [r1, c1] = p1.split(',').map(Number);
      const [r2, c2] = p2.split(',').map(Number);

      // Our bridge is horizontal
      if (island1.r === island2.r) {
        // Other bridge is vertical
        if (c1 === c2) {
          const ourR = island1.r;
          const otherC = c1;
          const otherMinR = Math.min(r1, r2);
          const otherMaxR = Math.max(r1, r2);
          if (otherC > minC && otherC < maxC &&
              ourR > otherMinR && ourR < otherMaxR) {
            return false;
          }
        }
      } else {
        // Our bridge is vertical, other is horizontal
        if (r1 === r2) {
          const ourC = island1.c;
          const otherR = r1;
          const otherMinC = Math.min(c1, c2);
          const otherMaxC = Math.max(c1, c2);
          if (otherR > minR && otherR < maxR &&
              ourC > otherMinC && ourC < otherMaxC) {
            return false;
          }
        }
      }
    }

    return true;
  }

  // Build adjacency list of possible connections
  const possibleConnections = [];
  for (let i = 0; i < islands.length; i++) {
    for (let j = i + 1; j < islands.length; j++) {
      if (canConnect(i, j, false)) {
        const dist = Math.abs(islands[i].r - islands[j].r) +
                    Math.abs(islands[i].c - islands[j].c);
        possibleConnections.push({ i1: i, i2: j, dist });
      }
    }
  }

  // Sort by distance (prefer shorter bridges)
  possibleConnections.sort((a, b) => a.dist - b.dist);

  // Build minimum spanning tree using Kruskal's algorithm
  const parent = islands.map((_, i) => i);

  function find(x) {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }

  function union(x, y) {
    const px = find(x), py = find(y);
    if (px !== py) {
      parent[px] = py;
      return true;
    }
    return false;
  }

  // First pass: build spanning tree
  for (const { i1, i2 } of possibleConnections) {
    if (!canConnect(i1, i2, true)) continue;

    if (find(i1) !== find(i2)) {
      const key = getBridgeKey(i1, i2);
      const count = random() > 0.5 ? 2 : 1;
      bridges.set(key, count);
      islands[i1].value += count;
      islands[i2].value += count;
      union(i1, i2);
    }
  }

  // Check if all islands are connected
  const root = find(0);
  for (let i = 1; i < islands.length; i++) {
    if (find(i) !== root) {
      return null; // Failed to connect all islands
    }
  }

  // Second pass: add some extra bridges for variety
  const shuffledConnections = [...possibleConnections];
  for (let i = shuffledConnections.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffledConnections[i], shuffledConnections[j]] = [shuffledConnections[j], shuffledConnections[i]];
  }

  for (const { i1, i2 } of shuffledConnections) {
    if (!canConnect(i1, i2, true)) continue;

    const key = getBridgeKey(i1, i2);
    const existing = bridges.get(key) || 0;

    // Don't exceed max bridges per connection or per island
    if (existing >= 2) continue;
    if (islands[i1].value >= 8 || islands[i2].value >= 8) continue;

    // Add 1 or 2 bridges with some probability
    if (random() < 0.3) {
      const add = existing === 0 ? (random() > 0.6 ? 2 : 1) : 1;
      bridges.set(key, existing + add);
      islands[i1].value += add;
      islands[i2].value += add;
    }
  }

  // Filter out islands with no bridges (shouldn't happen, but safety check)
  const activeIslands = islands.filter(i => i.value > 0);

  return {
    gridSize,
    islands: activeIslands,
    solution: bridges
  };
}

// Generate a simple fallback puzzle that's always solvable
function generateSimplePuzzle(gridSize, random = Math.random) {
  const islands = [];
  const bridges = new Map();

  // Create a simple connected chain of islands
  const positions = [
    [1, 1], [1, Math.floor(gridSize/2)], [1, gridSize - 2],
    [Math.floor(gridSize/2), gridSize - 2],
    [gridSize - 2, gridSize - 2], [gridSize - 2, Math.floor(gridSize/2)],
    [gridSize - 2, 1], [Math.floor(gridSize/2), 1]
  ].filter(([r, c]) => r > 0 && r < gridSize - 1 && c > 0 && c < gridSize - 1);

  for (const [r, c] of positions) {
    islands.push({ r, c, value: 0 });
  }

  // Connect in a chain
  for (let i = 0; i < islands.length; i++) {
    const next = (i + 1) % islands.length;
    const island1 = islands[i];
    const island2 = islands[next];

    // Only connect if aligned
    if (island1.r === island2.r || island1.c === island2.c) {
      const key1 = `${island1.r},${island1.c}`;
      const key2 = `${island2.r},${island2.c}`;
      const key = key1 < key2 ? `${key1}-${key2}` : `${key2}-${key1}`;
      const count = random() > 0.5 ? 2 : 1;
      bridges.set(key, count);
      islands[i].value += count;
      islands[next].value += count;
    }
  }

  return {
    gridSize,
    islands: islands.filter(i => i.value > 0),
    solution: bridges
  };
}

function bridgeKey(r1, c1, r2, c2) {
  if (r1 === r2) {
    return c1 < c2 ? `${r1},${c1}-${r2},${c2}` : `${r2},${c2}-${r1},${c1}`;
  }
  return r1 < r2 ? `${r1},${c1}-${r2},${c2}` : `${r2},${c2}-${r1},${c1}`;
}

function checkValidity(islands, bridges) {
  const errors = new Set();

  // Check each island's bridge count
  const islandBridges = new Map();
  for (const island of islands) {
    islandBridges.set(`${island.r},${island.c}`, 0);
  }

  for (const [key, count] of bridges) {
    const [p1, p2] = key.split('-');
    const current1 = islandBridges.get(p1) || 0;
    const current2 = islandBridges.get(p2) || 0;
    islandBridges.set(p1, current1 + count);
    islandBridges.set(p2, current2 + count);
  }

  for (const island of islands) {
    const key = `${island.r},${island.c}`;
    const actual = islandBridges.get(key) || 0;
    if (actual > island.value) {
      errors.add(key);
    }
  }

  return errors;
}

function checkSolved(islands, bridges) {
  // Check all islands have correct bridge count
  const islandBridges = new Map();
  for (const island of islands) {
    islandBridges.set(`${island.r},${island.c}`, 0);
  }

  for (const [key, count] of bridges) {
    const [p1, p2] = key.split('-');
    islandBridges.set(p1, (islandBridges.get(p1) || 0) + count);
    islandBridges.set(p2, (islandBridges.get(p2) || 0) + count);
  }

  for (const island of islands) {
    const key = `${island.r},${island.c}`;
    if (islandBridges.get(key) !== island.value) return false;
  }

  // Check connectivity using BFS
  if (islands.length === 0) return true;

  const adj = new Map();
  for (const island of islands) {
    adj.set(`${island.r},${island.c}`, []);
  }

  for (const [key] of bridges) {
    const [p1, p2] = key.split('-');
    adj.get(p1)?.push(p2);
    adj.get(p2)?.push(p1);
  }

  const visited = new Set();
  const queue = [`${islands[0].r},${islands[0].c}`];

  while (queue.length > 0) {
    const curr = queue.shift();
    if (visited.has(curr)) continue;
    visited.add(curr);

    for (const neighbor of adj.get(curr) || []) {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  return visited.size === islands.length;
}

export default function Hashi() {
  const { t } = useTranslation();
  const [sizeKey, setSizeKey] = useState('Small');
  const [puzzleData, setPuzzleData] = useState(null);
  const [bridges, setBridges] = useState(new Map());
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const { recordWin, recordGiveUp } = useGameStats('hashi');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(false);
  const [selectedIsland, setSelectedIsland] = useState(null);

  const { size: gridSize, islands: numIslands } = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(gridSize, numIslands, createSeededRandom(Date.now()));
    setPuzzleData(data);
    setBridges(new Map());
    resetGameState();
    setErrors(new Set());
    setSelectedIsland(null);
  }, [gridSize, numIslands, resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData || !isPlaying) return;

    const newErrors = showErrors ? checkValidity(puzzleData.islands, bridges) : new Set();
    setErrors(newErrors);

    if (checkWin(checkSolved(puzzleData.islands, bridges))) {
      recordWin();
    }
  }, [bridges, puzzleData, showErrors, isPlaying, checkWin, recordWin]);

  const handleIslandClick = (island) => {
    if (!isPlaying) return;

    if (!selectedIsland) {
      setSelectedIsland(island);
    } else {
      // Try to add/remove bridge between selected and clicked
      if (selectedIsland.r === island.r && selectedIsland.c === island.c) {
        setSelectedIsland(null);
        return;
      }

      // Check if they're aligned
      if (selectedIsland.r !== island.r && selectedIsland.c !== island.c) {
        setSelectedIsland(island);
        return;
      }

      // Check for islands in between
      const minR = Math.min(selectedIsland.r, island.r);
      const maxR = Math.max(selectedIsland.r, island.r);
      const minC = Math.min(selectedIsland.c, island.c);
      const maxC = Math.max(selectedIsland.c, island.c);

      let blocked = false;
      for (const other of puzzleData.islands) {
        if (other.r === selectedIsland.r && other.c === selectedIsland.c) continue;
        if (other.r === island.r && other.c === island.c) continue;

        if (selectedIsland.r === island.r && other.r === selectedIsland.r) {
          if (other.c > minC && other.c < maxC) blocked = true;
        }
        if (selectedIsland.c === island.c && other.c === selectedIsland.c) {
          if (other.r > minR && other.r < maxR) blocked = true;
        }
      }

      if (blocked) {
        setSelectedIsland(island);
        return;
      }

      // Check for crossing bridges
      const key = bridgeKey(selectedIsland.r, selectedIsland.c, island.r, island.c);
      const currentCount = bridges.get(key) || 0;

      // Only check for crossings when adding a new bridge (not removing)
      if (currentCount === 0) {
        let crossingBlocked = false;
        for (const [existingKey] of bridges) {
          const [p1, p2] = existingKey.split('-');
          const [r1, c1] = p1.split(',').map(Number);
          const [r2, c2] = p2.split(',').map(Number);

          // Our bridge is horizontal
          if (selectedIsland.r === island.r) {
            // Other bridge is vertical
            if (c1 === c2) {
              const ourR = selectedIsland.r;
              const otherC = c1;
              const otherMinR = Math.min(r1, r2);
              const otherMaxR = Math.max(r1, r2);
              if (otherC > minC && otherC < maxC &&
                  ourR > otherMinR && ourR < otherMaxR) {
                crossingBlocked = true;
                break;
              }
            }
          } else {
            // Our bridge is vertical, other is horizontal
            if (r1 === r2) {
              const ourC = selectedIsland.c;
              const otherR = r1;
              const otherMinC = Math.min(c1, c2);
              const otherMaxC = Math.max(c1, c2);
              if (otherR > minR && otherR < maxR &&
                  ourC > otherMinC && ourC < otherMaxC) {
                crossingBlocked = true;
                break;
              }
            }
          }
        }

        if (crossingBlocked) {
          setSelectedIsland(island);
          return;
        }
      }

      setBridges(prev => {
        const newBridges = new Map(prev);
        const current = newBridges.get(key) || 0;
        if (current >= 2) {
          newBridges.delete(key);
        } else {
          newBridges.set(key, current + 1);
        }
        return newBridges;
      });

      setSelectedIsland(null);
    }
  };

  const handleReset = () => {
    setBridges(new Map());
    resetGameState();
    setSelectedIsland(null);
  };

  const handleGiveUp = () => {
    if (!puzzleData || !isPlaying) return;
    setBridges(new Map(puzzleData.solution));
    giveUp();
    recordGiveUp();
  };

  if (!puzzleData) return null;

  const cellSize = Math.min(40, 350 / gridSize);

  return (
    <div className={styles.container}>
      <GameHeader
        title="Hashi"
        instructions="Connect islands with bridges. Each island's number shows how many bridges connect to it. Use 1 or 2 bridges between islands. All islands must be connected."
      />

      <SizeSelector
        options={Object.keys(GRID_SIZES)}
        value={sizeKey}
        onChange={setSizeKey}
        className={styles.sizeSelector}
      />

      <div className={styles.gameArea}>
        <div
          className={styles.grid}
          style={{
            width: `${gridSize * cellSize}px`,
            height: `${gridSize * cellSize}px`,
          }}
        >
          {/* Draw bridges */}
          <svg className={styles.bridgesSvg} viewBox={`0 0 ${gridSize * cellSize} ${gridSize * cellSize}`}>
            {Array.from(bridges).map(([key, count]) => {
              const [p1, p2] = key.split('-');
              const [r1, c1] = p1.split(',').map(Number);
              const [r2, c2] = p2.split(',').map(Number);

              const x1 = c1 * cellSize + cellSize / 2;
              const y1 = r1 * cellSize + cellSize / 2;
              const x2 = c2 * cellSize + cellSize / 2;
              const y2 = r2 * cellSize + cellSize / 2;

              const isHorizontal = r1 === r2;
              const offset = 3;

              if (count === 1) {
                return (
                  <line
                    key={key}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="#14b8a6"
                    strokeWidth="3"
                  />
                );
              } else {
                return (
                  <g key={key}>
                    <line
                      x1={isHorizontal ? x1 : x1 - offset}
                      y1={isHorizontal ? y1 - offset : y1}
                      x2={isHorizontal ? x2 : x2 - offset}
                      y2={isHorizontal ? y2 - offset : y2}
                      stroke="#14b8a6"
                      strokeWidth="3"
                    />
                    <line
                      x1={isHorizontal ? x1 : x1 + offset}
                      y1={isHorizontal ? y1 + offset : y1}
                      x2={isHorizontal ? x2 : x2 + offset}
                      y2={isHorizontal ? y2 + offset : y2}
                      stroke="#14b8a6"
                      strokeWidth="3"
                    />
                  </g>
                );
              }
            })}
          </svg>

          {/* Draw islands */}
          {puzzleData.islands.map((island) => {
            const isSelected = selectedIsland?.r === island.r && selectedIsland?.c === island.c;
            const hasError = errors.has(`${island.r},${island.c}`);

            // Calculate current bridges for this island
            let currentBridges = 0;
            const islandKey = `${island.r},${island.c}`;
            for (const [key, count] of bridges) {
              const [p1, p2] = key.split('-');
              if (p1 === islandKey || p2 === islandKey) {
                currentBridges += count;
              }
            }
            const isComplete = currentBridges === island.value;

            return (
              <button
                key={`${island.r}-${island.c}`}
                className={`
                  ${styles.island}
                  ${isSelected ? styles.selected : ''}
                  ${hasError ? styles.error : ''}
                  ${isComplete ? styles.complete : ''}
                `}
                style={{
                  left: `${island.c * cellSize + cellSize / 2}px`,
                  top: `${island.r * cellSize + cellSize / 2}px`,
                  width: `${cellSize * 0.7}px`,
                  height: `${cellSize * 0.7}px`,
                }}
                onClick={() => handleIslandClick(island)}
              >
                {island.value}
              </button>
            );
          })}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title={t('gameStatus.solved')}
            message={t('gameMessages.allIslandsConnected')}
            actions={[{ label: 'New Puzzle', onClick: initGame, primary: true }]}
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            message="Better luck next time!"
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
