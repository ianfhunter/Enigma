// Temporary script to validate jigsaw pattern
const pattern = [
  [0, 0, 0, 1, 1, 1, 2, 2, 2],
  [0, 0, 3, 3, 1, 1, 2, 2, 4],
  [0, 0, 3, 3, 3, 1, 4, 4, 4],
  [5, 5, 5, 3, 6, 6, 4, 4, 7],
  [5, 5, 6, 6, 6, 6, 7, 7, 7],
  [5, 8, 8, 6, 6, 7, 7, 7, 7],
  [5, 8, 8, 8, 6, 2, 2, 4, 7],
  [5, 5, 8, 8, 8, 8, 2, 1, 1],
  [5, 5, 5, 8, 8, 8, 2, 1, 1]
];

const regionCounts = {};
pattern.forEach(row => row.forEach(id => {
  regionCounts[id] = (regionCounts[id] || 0) + 1;
}));

console.log('Region counts:', regionCounts);
const allNine = Object.keys(regionCounts).every(id => regionCounts[id] === 9);
console.log('All regions have 9 cells:', allNine);
const totalCells = Object.values(regionCounts).reduce((a, b) => a + b, 0);
console.log('Total cells:', totalCells);
