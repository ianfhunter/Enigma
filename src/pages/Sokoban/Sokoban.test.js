import { describe, it, expect } from 'vitest';
import {
  GRID_SIZE,
  PACKS,
  keyOf,
  parseBoxobanText,
  buildLevelState,
  isSolved,
} from './Sokoban.jsx';

describe('Sokoban - helpers', () => {
  it('exposes grid size and packs', () => {
    expect(GRID_SIZE).toBe(10);
    expect(Array.isArray(PACKS)).toBe(true);
  });

  it('keyOf formats coordinates', () => {
    expect(keyOf(1, 2)).toBe('1,2');
  });

  it('parseBoxobanText parses multiple levels', () => {
    const text = `; 0\n##########\n#........#\n#........#\n#........#\n#........#\n#........#\n#........#\n#........#\n#........#\n##########\n\n; 1\n##########\n#........#\n#........#\n#........#\n#........#\n#........#\n#........#\n#........#\n#........#\n##########\n`;
    const levels = parseBoxobanText(text);
    expect(levels.length).toBe(2);
    expect(levels[0].grid[0]).toHaveLength(GRID_SIZE);
  });

  it('buildLevelState extracts walls/targets/boxes/player', () => {
    const grid = [
      '##########',
      '#@  .    #',
      '#  $ .   #',
      '#   *    #',
      '#        #',
      '#   #    #',
      '#        #',
      '#        #',
      '#        #',
      '##########',
    ];
    const state = buildLevelState(grid);
    expect(state.walls.size).toBeGreaterThan(0);
    expect(state.boxes.size).toBe(2);
    expect(state.targets.size).toBe(3);
    expect(state.player).toEqual({ r: 1, c: 1 });
    expect(state.moves).toBe(0);
    expect(state.pushes).toBe(0);
  });

  it('isSolved checks all targets covered', () => {
    const targets = new Set(['0,0']);
    const boxes = new Set(['0,0']);
    expect(isSolved(targets, boxes)).toBe(true);
    boxes.delete('0,0');
    expect(isSolved(targets, boxes)).toBe(false);
  });
});
