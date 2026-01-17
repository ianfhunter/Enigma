// Create a pattern with exactly 9 cells per region
const grid = Array(9).fill(null).map(() => Array(9).fill(-1));
const regions = [];
let regionId = 0;

// Fill region by region, ensuring 9 cells each
for (let rid = 0; rid < 9; rid++) {
  const cells = [];
  let attempts = 0;
  
  while (cells.length < 9 && attempts < 1000) {
    attempts++;
    // Try to find an adjacent cell to an existing cell in this region
    if (cells.length === 0) {
      // First cell - find any empty cell
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (grid[r][c] === -1) {
            cells.push([r, c]);
            grid[r][c] = rid;
            break;
          }
        }
        if (cells.length > 0) break;
      }
    } else {
      // Find adjacent to existing cells
      let found = false;
      for (const [cr, cc] of cells) {
        const neighbors = [[cr-1,cc], [cr+1,cc], [cr,cc-1], [cr,cc+1]];
        for (const [nr, nc] of neighbors) {
          if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9 && grid[nr][nc] === -1) {
            cells.push([nr, nc]);
            grid[nr][nc] = rid;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (!found) break; // Can't grow this region further
    }
  }
  
  if (cells.length !== 9) {
    console.error(`Region ${rid} only has ${cells.length} cells`);
  }
  regions.push(cells);
}

// Output pattern
console.log('const pattern = [');
for (let r = 0; r < 9; r++) {
  console.log('  [' + grid[r].join(', ') + '],');
}
console.log('];');

// Verify
const counts = {};
for (let r = 0; r < 9; r++) {
  for (let c = 0; c < 9; c++) {
    const id = grid[r][c];
    counts[id] = (counts[id] || 0) + 1;
  }
}
console.log('\nCounts:', counts);
