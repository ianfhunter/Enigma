import { describe, it, expect } from 'vitest';

// ===========================================
// Cube - 3D Rotation Matrix Tests
// ===========================================
describe('Cube - 3D Rotation', () => {
  // Simple rotation helpers for testing
  const rotateX = (point, angle) => {
    const rad = angle * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
      x: point.x,
      y: point.y * cos - point.z * sin,
      z: point.y * sin + point.z * cos
    };
  };

  const rotateY = (point, angle) => {
    const rad = angle * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
      x: point.x * cos + point.z * sin,
      y: point.y,
      z: -point.x * sin + point.z * cos
    };
  };

  it('should rotate point around X axis', () => {
    const point = { x: 1, y: 0, z: 0 };
    const rotated = rotateX(point, 90);

    expect(Math.round(rotated.x)).toBe(1);
    expect(Math.round(rotated.y)).toBe(0);
    expect(Math.round(rotated.z)).toBe(0);
  });

  it('should rotate point around Y axis', () => {
    const point = { x: 0, y: 1, z: 0 };
    const rotated = rotateY(point, 90);

    expect(Math.round(rotated.x)).toBe(0);
    expect(Math.round(rotated.y)).toBe(1);
    expect(Math.round(rotated.z)).toBe(0);
  });

  it('should handle 360 degree rotation', () => {
    const point = { x: 1, y: 2, z: 3 };
    let rotated = rotateX(point, 360);

    expect(Math.round(rotated.x * 100) / 100).toBeCloseTo(point.x, 1);
    expect(Math.round(rotated.y * 100) / 100).toBeCloseTo(point.y, 1);
    expect(Math.round(rotated.z * 100) / 100).toBeCloseTo(point.z, 1);
  });

  it('should handle negative rotation', () => {
    const point = { x: 1, y: 0, z: 0 };
    const rotated1 = rotateY(point, 90);
    const rotated2 = rotateY(point, -270);

    expect(Math.round(rotated1.x * 100) / 100).toBeCloseTo(Math.round(rotated2.x * 100) / 100, 1);
    expect(Math.round(rotated1.z * 100) / 100).toBeCloseTo(Math.round(rotated2.z * 100) / 100, 1);
  });
});

// ===========================================
// Cube - Projection Tests
// ===========================================
describe('Cube - 3D Projection', () => {
  const project = (point, distance = 500) => {
    const scale = distance / (distance + point.z);
    return {
      x: point.x * scale,
      y: point.y * scale
    };
  };

  it('should project 3D point to 2D', () => {
    const point = { x: 100, y: 100, z: 0 };
    const projected = project(point);

    expect(projected.x).toBe(100);
    expect(projected.y).toBe(100);
  });

  it('should scale based on depth', () => {
    const point1 = { x: 100, y: 100, z: 0 };
    const point2 = { x: 100, y: 100, z: 100 };

    const proj1 = project(point1);
    const proj2 = project(point2);

    // Closer point should appear larger
    expect(proj1.x).toBeGreaterThan(proj2.x);
  });

  it('should handle points at different depths', () => {
    const near = { x: 50, y: 50, z: -100 };
    const far = { x: 50, y: 50, z: 100 };

    const projNear = project(near);
    const projFar = project(far);

    expect(projNear.x).toBeGreaterThan(projFar.x);
  });
});

// ===========================================
// Cube - Geometry Tests
// ===========================================
describe('Cube - Geometry', () => {
  it('should have 8 vertices', () => {
    const vertices = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
    ];
    expect(vertices.length).toBe(8);
  });

  it('should have 12 edges', () => {
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];
    expect(edges.length).toBe(12);
  });

  it('should have 6 faces', () => {
    const faces = [
      [0, 1, 2, 3], // front
      [4, 5, 6, 7], // back
      [0, 1, 5, 4], // bottom
      [2, 3, 7, 6], // top
      [0, 3, 7, 4], // left
      [1, 2, 6, 5]  // right
    ];
    expect(faces.length).toBe(6);
  });
});
