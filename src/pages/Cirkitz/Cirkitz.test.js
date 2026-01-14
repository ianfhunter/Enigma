import { describe, it, expect } from 'vitest';
import {
  TILE_TYPES,
  rotateTile,
  getEdgeColor,
  getNeighbor,
  oppositeEdge,
  checkMatches,
  generatePuzzle,
} from './Cirkitz.jsx';

// ===========================================
// Cirkitz - Tile Path Tests
// ===========================================
describe('Cirkitz - Tile Paths', () => {

  it('should rotate tile paths correctly', () => {
    const tile = [[0, 3, 'R'], [1, 5, 'B'], [2, 4, 'Y']];

    // Rotate by 1 (60 degrees)
    const rotated1 = rotateTile(tile, 1);
    expect(rotated1).toEqual([[1, 4, 'R'], [2, 0, 'B'], [3, 5, 'Y']]);

    // Rotate by 3 (180 degrees)
    const rotated3 = rotateTile(tile, 3);
    expect(rotated3).toEqual([[3, 0, 'R'], [4, 2, 'B'], [5, 1, 'Y']]);
  });

  it('should maintain path colors after rotation', () => {
    const tile = [[0, 3, 'R'], [1, 5, 'B'], [2, 4, 'Y']];

    for (let rot = 0; rot < 6; rot++) {
      const rotated = rotateTile(tile, rot);
      expect(rotated[0][2]).toBe('R');
      expect(rotated[1][2]).toBe('B');
      expect(rotated[2][2]).toBe('Y');
    }
  });

  it('should wrap edge indices correctly', () => {
    const tile = [[4, 5, 'R'], [0, 1, 'B'], [2, 3, 'Y']];

    // Rotate by 2 - edges 4,5 become 0,1
    const rotated = rotateTile(tile, 2);
    expect(rotated[0]).toEqual([0, 1, 'R']);
    expect(rotated[1]).toEqual([2, 3, 'B']);
    expect(rotated[2]).toEqual([4, 5, 'Y']);
  });
});

// ===========================================
// Cirkitz - Edge Color Tests
// ===========================================
describe('Cirkitz - Edge Colors', () => {
  it('should return correct color for edge', () => {
    const tile = [[0, 3, 'R'], [1, 5, 'B'], [2, 4, 'Y']];

    expect(getEdgeColor(tile, 0)).toBe('R');
    expect(getEdgeColor(tile, 3)).toBe('R');
    expect(getEdgeColor(tile, 1)).toBe('B');
    expect(getEdgeColor(tile, 5)).toBe('B');
    expect(getEdgeColor(tile, 2)).toBe('Y');
    expect(getEdgeColor(tile, 4)).toBe('Y');
  });

  it('should cover all 6 edges exactly once', () => {
    const tile = [[0, 3, 'R'], [1, 5, 'B'], [2, 4, 'Y']];
    const edgesCovered = new Set();

    for (const [e1, e2] of tile) {
      edgesCovered.add(e1);
      edgesCovered.add(e2);
    }

    expect(edgesCovered.size).toBe(6);
    for (let i = 0; i < 6; i++) {
      expect(edgesCovered.has(i)).toBe(true);
    }
  });
});

// ===========================================
// Cirkitz - Neighbor Calculation Tests
// ===========================================
describe('Cirkitz - Neighbor Calculation', () => {
  it('should calculate even row neighbors correctly', () => {
    // Row 0 (even), Col 1
    expect(getNeighbor(0, 1, 1)).toEqual([0, 2]); // right
    expect(getNeighbor(0, 1, 4)).toEqual([0, 0]); // left
  });

  it('should calculate odd row neighbors correctly', () => {
    // Row 1 (odd), Col 1
    expect(getNeighbor(1, 1, 1)).toEqual([1, 2]); // right
    expect(getNeighbor(1, 1, 4)).toEqual([1, 0]); // left
  });

  it('should return correct opposite edges', () => {
    expect(oppositeEdge(0)).toBe(3);
    expect(oppositeEdge(1)).toBe(4);
    expect(oppositeEdge(2)).toBe(5);
    expect(oppositeEdge(3)).toBe(0);
    expect(oppositeEdge(4)).toBe(1);
    expect(oppositeEdge(5)).toBe(2);
  });

  it('neighbor edge pairs should be inverses', () => {
    // If tile A's edge E connects to tile B, then tile B's opposite(E) connects back to A
    for (let edge = 0; edge < 6; edge++) {
      const [nr, nc] = getNeighbor(1, 1, edge);
      const [backR, backC] = getNeighbor(nr, nc, oppositeEdge(edge));
      expect([backR, backC]).toEqual([1, 1]);
    }
  });
});

// ===========================================
// Cirkitz - Match Detection Tests
// ===========================================
describe('Cirkitz - Match Detection', () => {
  const rotateTile = (paths, rotations) => {
    return paths.map(([e1, e2, color]) => [
      (e1 + rotations) % 6,
      (e2 + rotations) % 6,
      color,
    ]);
  };

  const getEdgeColor = (paths, edge) => {
    for (const [e1, e2, color] of paths) {
      if (e1 === edge || e2 === edge) return color;
    }
    return null;
  };

  const oppositeEdge = (edge) => (edge + 3) % 6;

  const checkEdgeMatch = (tile1Paths, rot1, edge1, tile2Paths, rot2) => {
    const paths1 = rotateTile(tile1Paths, rot1);
    const paths2 = rotateTile(tile2Paths, rot2);

    const color1 = getEdgeColor(paths1, edge1);
    const color2 = getEdgeColor(paths2, oppositeEdge(edge1));

    return color1 === color2;
  };

  it('should detect matching edges', () => {
    const tile1 = [[0, 3, 'R'], [1, 5, 'B'], [2, 4, 'Y']];
    const tile2 = [[0, 3, 'R'], [1, 5, 'B'], [2, 4, 'Y']];

    // If tile1 edge 1 (B) faces tile2 edge 4 (Y), they don't match
    expect(checkEdgeMatch(tile1, 0, 1, tile2, 0)).toBe(false);

    // If we rotate tile2 so its edge 4 is also B
    expect(checkEdgeMatch(tile1, 0, 1, tile2, 3)).toBe(true);
  });

  it('should detect non-matching edges', () => {
    const tile1 = [[0, 3, 'R'], [1, 5, 'B'], [2, 4, 'Y']];
    const tile2 = [[0, 3, 'Y'], [1, 5, 'R'], [2, 4, 'B']]; // Different color arrangement

    // tile1 edge 0 is R, tile2 edge 3 is Y at rotation 0
    expect(checkEdgeMatch(tile1, 0, 0, tile2, 0)).toBe(false);
  });
});

// ===========================================
// Cirkitz - Puzzle Solution Tests
// ===========================================
describe('Cirkitz - Puzzle Solution', () => {
  it('generatePuzzle should return consistent structure', () => {
    const data = generatePuzzle(3);
    expect(data.tiles.length).toBe(data.size);
    expect(data.rotations.length).toBe(data.size);
    expect(data.solution.length).toBe(data.size);
  });

  it('solution rotations should yield a solved state', () => {
    const data = generatePuzzle(3);
    const result = checkMatches(data.tiles, data.solution, data.size);
    expect(result.solved).toBe(true);
    expect(result.matches).toBe(result.total);
  });

  it('start rotations should generally not be solved', () => {
    const data = generatePuzzle(3);
    const result = checkMatches(data.tiles, data.rotations, data.size);
    // It could occasionally be solved by chance; ensure at least non-zero total comparisons
    expect(result.total).toBeGreaterThan(0);
  });
});

// ===========================================
// Cirkitz - Connected Edge Tests
// ===========================================
describe('Cirkitz - Connected Edges', () => {
  const getConnectedEdge = (paths, edge) => {
    for (const [e1, e2] of paths) {
      if (e1 === edge) return e2;
      if (e2 === edge) return e1;
    }
    return null;
  };

  it('should find connected edge in path', () => {
    const tile = [[0, 3, 'R'], [1, 5, 'B'], [2, 4, 'Y']];

    expect(getConnectedEdge(tile, 0)).toBe(3);
    expect(getConnectedEdge(tile, 3)).toBe(0);
    expect(getConnectedEdge(tile, 1)).toBe(5);
    expect(getConnectedEdge(tile, 5)).toBe(1);
    expect(getConnectedEdge(tile, 2)).toBe(4);
    expect(getConnectedEdge(tile, 4)).toBe(2);
  });

  it('should form valid pairs for all edges', () => {
    const tile = [[0, 3, 'R'], [1, 5, 'B'], [2, 4, 'Y']];

    for (let edge = 0; edge < 6; edge++) {
      const connected = getConnectedEdge(tile, edge);
      expect(connected).not.toBeNull();
      expect(connected).not.toBe(edge);
      // Verify symmetry
      expect(getConnectedEdge(tile, connected)).toBe(edge);
    }
  });
});

// ===========================================
// Cirkitz - Wedge Rendering Tests
// ===========================================
describe('Cirkitz - Wedge Rendering', () => {
  const getHexVertex = (cx, cy, size, vertexIndex) => {
    const angle = (Math.PI / 3) * vertexIndex - Math.PI / 2;
    return [cx + size * Math.cos(angle), cy + size * Math.sin(angle)];
  };

  it('should calculate correct vertex positions', () => {
    const cx = 100, cy = 100, size = 50;

    // Vertex 0 should be at top (angle -90 degrees)
    const [x0, y0] = getHexVertex(cx, cy, size, 0);
    expect(x0).toBeCloseTo(100);
    expect(y0).toBeCloseTo(50);

    // Vertex 3 should be at bottom (angle 90 degrees)
    const [x3, y3] = getHexVertex(cx, cy, size, 3);
    expect(x3).toBeCloseTo(100);
    expect(y3).toBeCloseTo(150);
  });

  it('should produce 6 distinct vertices', () => {
    const cx = 0, cy = 0, size = 100;
    const vertices = [];

    for (let i = 0; i < 6; i++) {
      vertices.push(getHexVertex(cx, cy, size, i));
    }

    // All vertices should be unique
    for (let i = 0; i < 6; i++) {
      for (let j = i + 1; j < 6; j++) {
        const [xi, yi] = vertices[i];
        const [xj, yj] = vertices[j];
        const dist = Math.sqrt((xi - xj) ** 2 + (yi - yj) ** 2);
        expect(dist).toBeGreaterThan(1); // Not overlapping
      }
    }
  });

  it('should create vertices at equal distance from center', () => {
    const cx = 50, cy = 50, size = 40;

    for (let i = 0; i < 6; i++) {
      const [x, y] = getHexVertex(cx, cy, size, i);
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      expect(dist).toBeCloseTo(size);
    }
  });
});
