import { describe, it, expect } from 'vitest';

// ===========================================
// Bag - Item Management Tests
// ===========================================
describe('Bag - Item Management', () => {
  it('should add item to bag', () => {
    const bag = [];
    const item = { id: 1, name: 'Apple', weight: 1 };
    bag.push(item);

    expect(bag.length).toBe(1);
    expect(bag[0]).toEqual(item);
  });

  it('should remove item from bag', () => {
    const bag = [
      { id: 1, name: 'Apple', weight: 1 },
      { id: 2, name: 'Banana', weight: 2 }
    ];
    const filtered = bag.filter(item => item.id !== 1);

    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Banana');
  });

  it('should calculate total weight', () => {
    const bag = [
      { id: 1, name: 'Apple', weight: 1 },
      { id: 2, name: 'Banana', weight: 2 },
      { id: 3, name: 'Orange', weight: 1.5 }
    ];
    const totalWeight = bag.reduce((sum, item) => sum + item.weight, 0);

    expect(totalWeight).toBe(4.5);
  });

  it('should handle empty bag', () => {
    const bag = [];
    const totalWeight = bag.reduce((sum, item) => sum + item.weight, 0);

    expect(totalWeight).toBe(0);
  });

  it('should check weight limit', () => {
    const bag = [
      { id: 1, name: 'Apple', weight: 5 },
      { id: 2, name: 'Banana', weight: 3 }
    ];
    const maxWeight = 10;
    const currentWeight = bag.reduce((sum, item) => sum + item.weight, 0);
    const canAdd = (currentWeight + 2) <= maxWeight;

    expect(canAdd).toBe(true);
  });

  it('should reject item exceeding weight limit', () => {
    const bag = [
      { id: 1, name: 'Apple', weight: 5 },
      { id: 2, name: 'Banana', weight: 4 }
    ];
    const maxWeight = 10;
    const currentWeight = bag.reduce((sum, item) => sum + item.weight, 0);
    const canAdd = (currentWeight + 2) <= maxWeight;

    expect(canAdd).toBe(false);
  });
});

// ===========================================
// Bag - Item Search Tests
// ===========================================
describe('Bag - Item Search', () => {
  const bag = [
    { id: 1, name: 'Apple', type: 'fruit', weight: 1 },
    { id: 2, name: 'Banana', type: 'fruit', weight: 2 },
    { id: 3, name: 'Carrot', type: 'vegetable', weight: 0.5 }
  ];

  it('should find item by id', () => {
    const found = bag.find(item => item.id === 2);
    expect(found?.name).toBe('Banana');
  });

  it('should find items by type', () => {
    const fruits = bag.filter(item => item.type === 'fruit');
    expect(fruits.length).toBe(2);
  });

  it('should return undefined for non-existent item', () => {
    const found = bag.find(item => item.id === 999);
    expect(found).toBeUndefined();
  });

  it('should search by name (case insensitive)', () => {
    const found = bag.find(item =>
      item.name.toLowerCase() === 'apple'.toLowerCase()
    );
    expect(found?.id).toBe(1);
  });
});

// ===========================================
// Bag - Sorting Tests
// ===========================================
describe('Bag - Sorting', () => {
  const bag = [
    { id: 3, name: 'Carrot', weight: 0.5 },
    { id: 1, name: 'Apple', weight: 1 },
    { id: 2, name: 'Banana', weight: 2 }
  ];

  it('should sort by name', () => {
    const sorted = [...bag].sort((a, b) => a.name.localeCompare(b.name));
    expect(sorted[0].name).toBe('Apple');
    expect(sorted[2].name).toBe('Carrot');
  });

  it('should sort by weight', () => {
    const sorted = [...bag].sort((a, b) => a.weight - b.weight);
    expect(sorted[0].weight).toBe(0.5);
    expect(sorted[2].weight).toBe(2);
  });

  it('should sort by id', () => {
    const sorted = [...bag].sort((a, b) => a.id - b.id);
    expect(sorted[0].id).toBe(1);
    expect(sorted[2].id).toBe(3);
  });
});
