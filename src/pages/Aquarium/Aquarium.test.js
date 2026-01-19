import { describe, it, expect } from 'vitest';

// ===========================================
// Aquarium - Tank Analysis Tests
// ===========================================
describe('Aquarium - Tank Analysis', () => {
  function analyzeTanks(tanks) {
    const size = tanks.length;
    const tankInfo = {};

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const tank = tanks[r][c];
        if (!(tank in tankInfo)) {
          tankInfo[tank] = { rows: new Set(), rowCells: {}, topRow: size, bottomRow: -1 };
        }
        tankInfo[tank].rows.add(r);
        if (!tankInfo[tank].rowCells[r]) tankInfo[tank].rowCells[r] = [];
        tankInfo[tank].rowCells[r].push(c);
        tankInfo[tank].topRow = Math.min(tankInfo[tank].topRow, r);
        tankInfo[tank].bottomRow = Math.max(tankInfo[tank].bottomRow, r);
      }
    }

    return tankInfo;
  }

  it('should identify separate tanks', () => {
    const tanks = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ];

    const info = analyzeTanks(tanks);

    expect(Object.keys(info).length).toBe(4);
    expect(info[0].rows.size).toBe(2);
    expect(info[0].topRow).toBe(0);
    expect(info[0].bottomRow).toBe(1);
  });

  it('should track row cells for each tank', () => {
    const tanks = [
      [0, 0, 1],
      [0, 1, 1],
      [2, 2, 2],
    ];

    const info = analyzeTanks(tanks);

    // Tank 0 should span rows 0 and 1
    expect(info[0].rowCells[0]).toEqual([0, 1]);
    expect(info[0].rowCells[1]).toEqual([0]);
  });

  it('should handle irregular tank shapes', () => {
    const tanks = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ];

    const info = analyzeTanks(tanks);

    expect(info[0].topRow).toBe(0);
    expect(info[0].bottomRow).toBe(2);
    expect(info[1].topRow).toBe(1);
    expect(info[1].bottomRow).toBe(1);
  });
});

// ===========================================
// Aquarium - Water Validity Tests
// ===========================================
describe('Aquarium - Water Validity', () => {
  function analyzeTanks(tanks) {
    const size = tanks.length;
    const tankInfo = {};

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const tank = tanks[r][c];
        if (!(tank in tankInfo)) {
          tankInfo[tank] = { rows: new Set(), rowCells: {}, topRow: size, bottomRow: -1 };
        }
        tankInfo[tank].rows.add(r);
        if (!tankInfo[tank].rowCells[r]) tankInfo[tank].rowCells[r] = [];
        tankInfo[tank].rowCells[r].push(c);
        tankInfo[tank].topRow = Math.min(tankInfo[tank].topRow, r);
        tankInfo[tank].bottomRow = Math.max(tankInfo[tank].bottomRow, r);
      }
    }

    return tankInfo;
  }

  function checkWaterSettling(tanks, water) {
    const size = tanks.length;
    const tankInfo = analyzeTanks(tanks);
    const errors = new Set();

    // Check water settling rules for each tank
    for (const tankId in tankInfo) {
      const info = tankInfo[tankId];
      const rows = Array.from(info.rows).sort((a, b) => b - a); // bottom to top

      let foundAirRow = false;
      for (const r of rows) {
        const cells = info.rowCells[r];
        const waterCount = cells.filter(c => water[r][c]).length;

        // Rule 1: Row must be all water or all air
        if (waterCount > 0 && waterCount < cells.length) {
          for (const c of cells) {
            errors.add(`${r},${c}`);
          }
          foundAirRow = true;
        }

        // Rule 2: Water can't float above air
        const hasWater = waterCount === cells.length;
        const hasAir = waterCount === 0;

        if (hasAir) {
          foundAirRow = true;
        } else if (hasWater && foundAirRow) {
          for (const c of cells) {
            errors.add(`${r},${c}`);
          }
        }
      }
    }

    return errors;
  }

  it('should allow valid water placement (water at bottom)', () => {
    const tanks = [
      [0, 0],
      [0, 0],
    ];
    const water = [
      [false, false],
      [true, true],  // Water only at bottom
    ];

    const errors = checkWaterSettling(tanks, water);
    expect(errors.size).toBe(0);
  });

  it('should detect water floating above air', () => {
    const tanks = [
      [0, 0],
      [0, 0],
    ];
    const water = [
      [true, true],   // Water at top
      [false, false], // Air at bottom - invalid!
    ];

    const errors = checkWaterSettling(tanks, water);
    expect(errors.size).toBeGreaterThan(0);
  });

  it('should detect partial row fill', () => {
    // Partial fill within a tank row is invalid
    const tanks = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const water = [
      [false, false, false],
      [true, true, false],  // Partial fill in same tank row
      [true, true, true],   // Full row at bottom
    ];

    const errors = checkWaterSettling(tanks, water);
    // The middle row has partial fill - should be errors
    expect(errors.size).toBeGreaterThan(0);
  });

  it('should allow completely filled tank', () => {
    const tanks = [
      [0, 0],
      [0, 0],
    ];
    const water = [
      [true, true],
      [true, true],
    ];

    const errors = checkWaterSettling(tanks, water);
    expect(errors.size).toBe(0);
  });

  it('should allow completely empty tank', () => {
    const tanks = [
      [0, 0],
      [0, 0],
    ];
    const water = [
      [false, false],
      [false, false],
    ];

    const errors = checkWaterSettling(tanks, water);
    expect(errors.size).toBe(0);
  });
});

// ===========================================
// Aquarium - Clue Checking Tests
// ===========================================
describe('Aquarium - Clue Checking', () => {
  function checkClues(water, rowClues, colClues) {
    const size = water.length;
    const errors = { rowOver: [], colOver: [] };

    // Check row counts
    for (let r = 0; r < size; r++) {
      let count = 0;
      for (let c = 0; c < size; c++) {
        if (water[r][c]) count++;
      }
      if (count > rowClues[r]) {
        errors.rowOver.push(r);
      }
    }

    // Check column counts
    for (let c = 0; c < size; c++) {
      let count = 0;
      for (let r = 0; r < size; r++) {
        if (water[r][c]) count++;
      }
      if (count > colClues[c]) {
        errors.colOver.push(c);
      }
    }

    return errors;
  }

  it('should detect row overflow', () => {
    const water = [
      [true, true, true],
      [false, false, false],
      [false, false, false],
    ];
    const rowClues = [2, 0, 0];  // Row 0 should have max 2
    const colClues = [1, 1, 1];

    const errors = checkClues(water, rowClues, colClues);
    expect(errors.rowOver).toContain(0);
  });

  it('should detect column overflow', () => {
    const water = [
      [true, false, false],
      [true, false, false],
      [true, false, false],
    ];
    const rowClues = [1, 1, 1];
    const colClues = [2, 0, 0];  // Col 0 should have max 2

    const errors = checkClues(water, rowClues, colClues);
    expect(errors.colOver).toContain(0);
  });

  it('should allow valid clue satisfaction', () => {
    const water = [
      [true, true, false],
      [true, false, false],
      [false, false, false],
    ];
    const rowClues = [2, 1, 0];
    const colClues = [2, 1, 0];

    const errors = checkClues(water, rowClues, colClues);
    expect(errors.rowOver.length).toBe(0);
    expect(errors.colOver.length).toBe(0);
  });
});

// ===========================================
// Aquarium - Solution Check Tests
// ===========================================
describe('Aquarium - Solution Check', () => {
  function checkSolved(water, solution) {
    const size = water.length;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (water[r][c] !== solution[r][c]) return false;
      }
    }
    return true;
  }

  it('should detect correct solution', () => {
    const solution = [
      [true, false],
      [true, true],
    ];
    const water = [
      [true, false],
      [true, true],
    ];

    expect(checkSolved(water, solution)).toBe(true);
  });

  it('should detect incorrect solution', () => {
    const solution = [
      [true, false],
      [true, true],
    ];
    const water = [
      [false, false],  // Wrong
      [true, true],
    ];

    expect(checkSolved(water, solution)).toBe(false);
  });

  it('should detect incomplete solution', () => {
    const solution = [
      [true, false],
      [true, true],
    ];
    const water = [
      [true, false],
      [true, false],  // Missing water
    ];

    expect(checkSolved(water, solution)).toBe(false);
  });
});
