import { describe, it, expect } from 'vitest';
import {
  createSeededRandom,
} from '../../data/wordUtils';

// ===========================================
// Maze - Grid Creation Tests
// ===========================================
describe('Maze - Grid Creation', () => {
  // Cell types: 0 = wall, 1 = path, 2 = start, 3 = end
  const createEmptyMaze = (rows, cols) => {
    return Array(rows).fill(null).map(() => Array(cols).fill(0));
  };

  it('should create maze of correct dimensions', () => {
    const maze = createEmptyMaze(10, 15);

    expect(maze.length).toBe(10);
    maze.forEach(row => {
      expect(row.length).toBe(15);
    });
  });

  it('should initialize all cells as walls', () => {
    const maze = createEmptyMaze(5, 5);

    maze.forEach(row => {
      row.forEach(cell => {
        expect(cell).toBe(0);
      });
    });
  });
});

// ===========================================
// Maze - Path Validation Tests
// ===========================================
describe('Maze - Path Validation', () => {
  const isValidMove = (maze, fromRow, fromCol, toRow, toCol) => {
    const rows = maze.length;
    const cols = maze[0].length;

    // Check bounds
    if (toRow < 0 || toRow >= rows || toCol < 0 || toCol >= cols) {
      return false;
    }

    // Check if target is path/start/end (not wall)
    if (maze[toRow][toCol] === 0) {
      return false;
    }

    // Check if adjacent (no diagonal moves)
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  };

  const maze = [
    [0, 2, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 1, 0],
    [0, 1, 1, 1, 0],
    [0, 1, 0, 3, 0],
  ];

  it('should allow moving to adjacent path cell', () => {
    expect(isValidMove(maze, 0, 1, 1, 1)).toBe(true); // Down
    expect(isValidMove(maze, 1, 1, 1, 2)).toBe(true); // Right
  });

  it('should reject moving to wall', () => {
    expect(isValidMove(maze, 1, 1, 2, 1)).toBe(false);
  });

  it('should reject diagonal moves', () => {
    expect(isValidMove(maze, 1, 1, 2, 2)).toBe(false);
  });

  it('should reject out of bounds', () => {
    expect(isValidMove(maze, 0, 0, -1, 0)).toBe(false);
    expect(isValidMove(maze, 4, 4, 4, 5)).toBe(false);
  });
});

// ===========================================
// Maze - Start/End Detection Tests
// ===========================================
describe('Maze - Start/End Detection', () => {
  const findCell = (maze, cellType) => {
    for (let r = 0; r < maze.length; r++) {
      for (let c = 0; c < maze[r].length; c++) {
        if (maze[r][c] === cellType) {
          return [r, c];
        }
      }
    }
    return null;
  };

  const maze = [
    [0, 2, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 1, 0],
    [0, 1, 1, 1, 0],
    [0, 1, 0, 3, 0],
  ];

  it('should find start cell (2)', () => {
    const start = findCell(maze, 2);
    expect(start).toEqual([0, 1]);
  });

  it('should find end cell (3)', () => {
    const end = findCell(maze, 3);
    expect(end).toEqual([4, 3]);
  });

  it('should return null if cell not found', () => {
    const notFound = findCell(maze, 9);
    expect(notFound).toBeNull();
  });
});

// ===========================================
// Maze - Path Finding Tests
// ===========================================
describe('Maze - Path Finding (BFS)', () => {
  const findPath = (maze, start, end) => {
    const rows = maze.length;
    const cols = maze[0].length;
    const visited = new Set();
    const queue = [[start, [start]]];

    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    while (queue.length > 0) {
      const [[row, col], path] = queue.shift();
      const key = `${row},${col}`;

      if (row === end[0] && col === end[1]) {
        return path;
      }

      if (visited.has(key)) continue;
      visited.add(key);

      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;

        if (newRow >= 0 && newRow < rows &&
            newCol >= 0 && newCol < cols &&
            maze[newRow][newCol] !== 0 &&
            !visited.has(`${newRow},${newCol}`)) {
          queue.push([[newRow, newCol], [...path, [newRow, newCol]]]);
        }
      }
    }

    return null; // No path found
  };

  const maze = [
    [0, 2, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 1, 0],
    [0, 1, 1, 1, 0],
    [0, 1, 0, 3, 0],
  ];

  it('should find path from start to end', () => {
    const path = findPath(maze, [0, 1], [4, 3]);

    expect(path).not.toBeNull();
    expect(path[0]).toEqual([0, 1]); // Start
    expect(path[path.length - 1]).toEqual([4, 3]); // End
  });

  it('should return null for impossible maze', () => {
    const impossibleMaze = [
      [2, 0, 3],
      [0, 0, 0],
      [0, 0, 0],
    ];

    const path = findPath(impossibleMaze, [0, 0], [0, 2]);
    expect(path).toBeNull();
  });

  it('should find shortest path', () => {
    const simpleMaze = [
      [2, 1, 1],
      [0, 0, 1],
      [0, 0, 3],
    ];

    const path = findPath(simpleMaze, [0, 0], [2, 2]);
    expect(path.length).toBe(5); // Shortest is 5 cells
  });
});

// ===========================================
// Maze - Player Movement Tests
// ===========================================
describe('Maze - Player Movement', () => {
  const movePlayer = (position, direction, maze) => {
    const [row, col] = position;
    const directions = {
      up: [-1, 0],
      down: [1, 0],
      left: [0, -1],
      right: [0, 1],
    };

    const [dr, dc] = directions[direction];
    const newRow = row + dr;
    const newCol = col + dc;

    // Check bounds and walls
    if (newRow < 0 || newRow >= maze.length ||
        newCol < 0 || newCol >= maze[0].length ||
        maze[newRow][newCol] === 0) {
      return position; // Can't move
    }

    return [newRow, newCol];
  };

  const maze = [
    [0, 2, 1],
    [0, 1, 1],
    [0, 0, 3],
  ];

  it('should move player in valid direction', () => {
    const newPos = movePlayer([0, 1], 'right', maze);
    expect(newPos).toEqual([0, 2]);
  });

  it('should not move into wall', () => {
    const newPos = movePlayer([0, 1], 'left', maze);
    expect(newPos).toEqual([0, 1]); // Same position
  });

  it('should not move out of bounds', () => {
    const newPos = movePlayer([0, 1], 'up', maze);
    expect(newPos).toEqual([0, 1]); // Same position
  });
});

// ===========================================
// Maze - Win Detection Tests
// ===========================================
describe('Maze - Win Detection', () => {
  const checkWin = (playerPos, endPos) => {
    return playerPos[0] === endPos[0] && playerPos[1] === endPos[1];
  };

  it('should detect win when player reaches end', () => {
    expect(checkWin([4, 3], [4, 3])).toBe(true);
  });

  it('should not detect win otherwise', () => {
    expect(checkWin([0, 1], [4, 3])).toBe(false);
    expect(checkWin([4, 2], [4, 3])).toBe(false);
  });
});

// ===========================================
// Maze - Maze Generation Tests
// ===========================================
describe('Maze - Generation', () => {
  const generateSimpleMaze = (rows, cols, random) => {
    const maze = Array(rows).fill(null).map(() => Array(cols).fill(0));

    // Simplified DFS generation
    const stack = [[1, 1]];
    maze[1][1] = 1;

    while (stack.length > 0) {
      const [r, c] = stack[stack.length - 1];
      const neighbors = [];

      // Check all directions (2 cells away)
      const dirs = [[-2, 0], [2, 0], [0, -2], [0, 2]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr > 0 && nr < rows - 1 && nc > 0 && nc < cols - 1 && maze[nr][nc] === 0) {
          neighbors.push([nr, nc, dr / 2, dc / 2]);
        }
      }

      if (neighbors.length > 0) {
        const idx = Math.floor(random() * neighbors.length);
        const [nr, nc, dr, dc] = neighbors[idx];
        maze[r + dr][c + dc] = 1; // Carve wall
        maze[nr][nc] = 1;
        stack.push([nr, nc]);
      } else {
        stack.pop();
      }
    }

    // Set start and end
    maze[1][1] = 2;
    maze[rows - 2][cols - 2] = 3;

    return maze;
  };

  it('should generate maze with start and end', () => {
    const random = createSeededRandom(12345);
    const maze = generateSimpleMaze(11, 11, random);

    let hasStart = false;
    let hasEnd = false;

    maze.forEach(row => {
      row.forEach(cell => {
        if (cell === 2) hasStart = true;
        if (cell === 3) hasEnd = true;
      });
    });

    expect(hasStart).toBe(true);
    expect(hasEnd).toBe(true);
  });

  it('should be deterministic with same seed', () => {
    const random1 = createSeededRandom(12345);
    const random2 = createSeededRandom(12345);

    const maze1 = generateSimpleMaze(11, 11, random1);
    const maze2 = generateSimpleMaze(11, 11, random2);

    expect(maze1).toEqual(maze2);
  });
});
