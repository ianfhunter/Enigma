import { describe, it, expect } from 'vitest';
import {
  DIFFICULTY,
  createPieces,
  shufflePieces,
  areAdjacent,
  getExpectedRelativePosition,
} from './Jigsaw';

const stubRandom = (value = 0.72) => () => value;

describe('Jigsaw - piece generation', () => {
  it('creates the right number of pieces with coordinates', () => {
    const cols = 3;
    const rows = 2;
    const pieceWidth = 50;
    const pieceHeight = 40;
    const pieces = createPieces(cols, rows, pieceWidth, pieceHeight, stubRandom());

    expect(pieces.length).toBe(cols * rows);
    pieces.forEach(piece => {
      expect(piece.correctX).toBe(piece.col * pieceWidth);
      expect(piece.correctY).toBe(piece.row * pieceHeight);
      expect(piece.path.length).toBeGreaterThan(0);
    });
  });

  it('assigns complementary edges between adjacent pieces', () => {
    const pieces = createPieces(3, 2, 50, 40, stubRandom(0.9)); // all tabs = 1
    const getPiece = (r, c) => pieces.find(p => p.row === r && p.col === c);

    // Horizontal neighbor edge agreement
    const left = getPiece(0, 0);
    const right = getPiece(0, 1);
    expect(left.edges.right).toBe(-right.edges.left);

    // Vertical neighbor edge agreement
    const top = getPiece(0, 2);
    const bottom = getPiece(1, 2);
    expect(top.edges.bottom).toBe(-bottom.edges.top);
  });
});

describe('Jigsaw - adjacency helpers', () => {
  it('detects orthogonal adjacency and rejects diagonals', () => {
    const a = { row: 0, col: 0 };
    const b = { row: 0, col: 1 };
    const c = { row: 1, col: 1 };

    expect(areAdjacent(a, b, 3)).toBe(true);
    expect(areAdjacent(a, c, 3)).toBe(false);
  });

  it('computes expected relative positions', () => {
    const piece1 = { row: 0, col: 0 };
    const piece2 = { row: 1, col: 0 };
    const delta = getExpectedRelativePosition(piece1, piece2, 80, 60);

    expect(delta).toEqual({ x: 0, y: 60 });
  });
});

describe('Jigsaw - shuffling', () => {
  it('shuffles pieces with deterministic positions and groups', () => {
    const cols = 2;
    const rows = 2;
    const pieces = createPieces(cols, rows, 80, 80, stubRandom(0.3));
    const shuffled = shufflePieces(pieces, cols * 80, rows * 80, 80, 80, stubRandom(0.15));

    expect(shuffled.length).toBe(pieces.length);
    shuffled.forEach((piece, idx) => {
      expect(piece.groupId).toBe(piece.id);
      expect(piece.isPlaced).toBe(false);
      expect(Number.isFinite(piece.currentX)).toBe(true);
      expect(Number.isFinite(piece.currentY)).toBe(true);
      // Deterministic shuffling should move pieces away from origin
      expect(piece.currentX).toBeGreaterThan(0);
      expect(piece.currentY).toBeGreaterThan(0);
      // IDs preserved
      expect(piece.id).toBe(pieces[idx].id);
    });
  });

  it('honors difficulty presets for dimensions', () => {
    expect(DIFFICULTY['Easy (3×2)']).toEqual({ cols: 3, rows: 2 });
    expect(DIFFICULTY['Medium (4×3)']).toEqual({ cols: 4, rows: 3 });
    expect(DIFFICULTY['Hard (5×4)']).toEqual({ cols: 5, rows: 4 });
  });
});
