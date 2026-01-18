/**
 * Pentomino Shape Definitions
 * 
 * Each pentomino is defined as an array of relative coordinates [row, col]
 * representing the 5 squares that make up the shape.
 * Coordinates are relative to a top-left origin (0,0).
 * 
 * The 12 free pentominoes (F, I, L, N, P, T, U, V, W, X, Y, Z)
 * are named after letters they resemble.
 */

// F pentomino
const F_SHAPE = [
  [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]
];

// I pentomino (straight line)
const I_SHAPE = [
  [0, 0], [1, 0], [2, 0], [3, 0], [4, 0]
];

// L pentomino
const L_SHAPE = [
  [0, 0], [1, 0], [2, 0], [3, 0], [3, 1]
];

// N pentomino
const N_SHAPE = [
  [0, 1], [1, 0], [1, 1], [2, 0], [3, 0]
];

// P pentomino
const P_SHAPE = [
  [0, 0], [0, 1], [1, 0], [1, 1], [2, 0]
];

// T pentomino
const T_SHAPE = [
  [0, 1], [1, 0], [1, 1], [1, 2], [2, 1]
];

// U pentomino
const U_SHAPE = [
  [0, 0], [0, 2], [1, 0], [1, 1], [1, 2]
];

// V pentomino
const V_SHAPE = [
  [0, 0], [1, 0], [2, 0], [2, 1], [2, 2]
];

// W pentomino
const W_SHAPE = [
  [0, 0], [1, 0], [1, 1], [2, 1], [2, 2]
];

// X pentomino (plus shape)
const X_SHAPE = [
  [0, 1], [1, 0], [1, 1], [1, 2], [2, 1]
];

// Y pentomino
const Y_SHAPE = [
  [0, 1], [1, 0], [1, 1], [2, 1], [3, 1]
];

// Z pentomino
const Z_SHAPE = [
  [0, 0], [0, 1], [1, 1], [2, 1], [2, 2]
];

/**
 * All pentomino shapes in order
 * Note: The dataset uses numbers 1-12, but the mapping may vary.
 * We'll need to determine the correct mapping from the dataset.
 */
export const PENTOMINO_SHAPES = [
  { name: 'F', shape: F_SHAPE, color: '#f87171' },
  { name: 'I', shape: I_SHAPE, color: '#fbbf24' },
  { name: 'L', shape: L_SHAPE, color: '#34d399' },
  { name: 'N', shape: N_SHAPE, color: '#60a5fa' },
  { name: 'P', shape: P_SHAPE, color: '#a78bfa' },
  { name: 'T', shape: T_SHAPE, color: '#f472b6' },
  { name: 'U', shape: U_SHAPE, color: '#fb923c' },
  { name: 'V', shape: V_SHAPE, color: '#22d3ee' },
  { name: 'W', shape: W_SHAPE, color: '#4ade80' },
  { name: 'X', shape: X_SHAPE, color: '#eab308' },
  { name: 'Y', shape: Y_SHAPE, color: '#ec4899' },
  { name: 'Z', shape: Z_SHAPE, color: '#818cf8' },
];

/**
 * Rotate a shape 90 degrees clockwise
 */
export function rotateShape(shape) {
  // Find bounding box
  let minR = Infinity, maxR = -Infinity;
  let minC = Infinity, maxC = -Infinity;
  
  for (const [r, c] of shape) {
    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
    minC = Math.min(minC, c);
    maxC = Math.max(maxC, c);
  }
  
  const height = maxR - minR + 1;
  const width = maxC - minC + 1;
  
  // Rotate: (r, c) -> (c, width - 1 - r)
  return shape.map(([r, c]) => {
    const relR = r - minR;
    const relC = c - minC;
    const newRelR = relC;
    const newRelC = width - 1 - relR;
    return [newRelR + minR, newRelC + minC];
  });
}

/**
 * Flip a shape horizontally
 */
export function flipShape(shape) {
  // Find bounding box
  let minR = Infinity, maxR = -Infinity;
  let minC = Infinity, maxC = -Infinity;
  
  for (const [r, c] of shape) {
    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
    minC = Math.min(minC, c);
    maxC = Math.max(maxC, c);
  }
  
  const width = maxC - minC + 1;
  
  // Flip: (r, c) -> (r, width - 1 - c)
  return shape.map(([r, c]) => {
    const relC = c - minC;
    const newRelC = width - 1 - relC;
    return [r, newRelC + minC];
  });
}

/**
 * Normalize shape coordinates to start at (0,0)
 */
export function normalizeShape(shape) {
  let minR = Infinity, minC = Infinity;
  
  for (const [r, c] of shape) {
    minR = Math.min(minR, r);
    minC = Math.min(minC, c);
  }
  
  return shape.map(([r, c]) => [r - minR, c - minC]);
}

/**
 * Get all rotations and reflections of a shape
 */
export function getAllOrientations(shape) {
  const orientations = new Set();
  const normalized = normalizeShape(shape);
  
  // Add original
  orientations.add(JSON.stringify(normalized));
  
  // Add rotations
  let current = normalized;
  for (let i = 0; i < 3; i++) {
    current = normalizeShape(rotateShape(current));
    orientations.add(JSON.stringify(current));
  }
  
  // Add flipped versions
  const flipped = normalizeShape(flipShape(shape));
  orientations.add(JSON.stringify(flipped));
  
  current = flipped;
  for (let i = 0; i < 3; i++) {
    current = normalizeShape(rotateShape(current));
    orientations.add(JSON.stringify(current));
  }
  
  return Array.from(orientations).map(s => JSON.parse(s));
}

// Export helpers for testing
export {
  F_SHAPE,
  I_SHAPE,
  L_SHAPE,
  N_SHAPE,
  P_SHAPE,
  T_SHAPE,
  U_SHAPE,
  V_SHAPE,
  W_SHAPE,
  X_SHAPE,
  Y_SHAPE,
  Z_SHAPE,
};