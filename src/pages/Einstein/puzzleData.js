/**
 * Theme sets for Einstein puzzles
 * Each theme provides different categories and items for variety
 */

export const THEME_SETS = {
  classic: {
    id: 'classic',
    name: 'Classic Einstein',
    description: 'The original zebra puzzle theme',
    categories: [
      {
        name: 'nationality',
        icon: '🌍',
        items: ['Brit', 'Swede', 'Dane', 'Norwegian', 'German'],
      },
      {
        name: 'color',
        icon: '🎨',
        items: ['Red', 'Green', 'White', 'Yellow', 'Blue'],
      },
      {
        name: 'drink',
        icon: '🥤',
        items: ['Tea', 'Coffee', 'Milk', 'Beer', 'Water'],
      },
      {
        name: 'pet',
        icon: '🐾',
        items: ['Dog', 'Bird', 'Cat', 'Horse', 'Fish'],
      },
    ],
  },

  fantasy: {
    id: 'fantasy',
    name: 'Fantasy Kingdoms',
    description: 'Medieval fantasy theme',
    categories: [
      {
        name: 'race',
        icon: '🧝',
        items: ['Elf', 'Dwarf', 'Human', 'Orc', 'Wizard'],
      },
      {
        name: 'weapon',
        icon: '⚔️',
        items: ['Sword', 'Bow', 'Axe', 'Staff', 'Dagger'],
      },
      {
        name: 'mount',
        icon: '🐴',
        items: ['Horse', 'Dragon', 'Wolf', 'Griffin', 'Eagle'],
      },
      {
        name: 'treasure',
        icon: '💎',
        items: ['Gold', 'Silver', 'Ruby', 'Emerald', 'Diamond'],
      },
    ],
  },

  space: {
    id: 'space',
    name: 'Space Station',
    description: 'Sci-fi space theme',
    categories: [
      {
        name: 'species',
        icon: '👽',
        items: ['Human', 'Martian', 'Android', 'Cyborg', 'Alien'],
      },
      {
        name: 'ship',
        icon: '🚀',
        items: ['Cruiser', 'Fighter', 'Shuttle', 'Freighter', 'Scout'],
      },
      {
        name: 'planet',
        icon: '🪐',
        items: ['Earth', 'Mars', 'Venus', 'Jupiter', 'Saturn'],
      },
      {
        name: 'cargo',
        icon: '📦',
        items: ['Fuel', 'Food', 'Weapons', 'Medicine', 'Tech'],
      },
    ],
  },

  office: {
    id: 'office',
    name: 'Office Mystery',
    description: 'Modern office theme',
    categories: [
      {
        name: 'department',
        icon: '🏢',
        items: ['Sales', 'IT', 'HR', 'Finance', 'Marketing'],
      },
      {
        name: 'snack',
        icon: '🍪',
        items: ['Coffee', 'Donut', 'Apple', 'Chips', 'Sandwich'],
      },
      {
        name: 'plant',
        icon: '🌱',
        items: ['Cactus', 'Fern', 'Orchid', 'Bamboo', 'Succulent'],
      },
      {
        name: 'mug',
        icon: '☕',
        items: ['Blue', 'Red', 'White', 'Black', 'Green'],
      },
    ],
  },

  ocean: {
    id: 'ocean',
    name: 'Ocean Adventure',
    description: 'Nautical pirate theme',
    categories: [
      {
        name: 'crew',
        icon: '🏴‍☠️',
        items: ['Captain', 'Navigator', 'Cook', 'Gunner', 'Medic'],
      },
      {
        name: 'ship',
        icon: '⛵',
        items: ['Galleon', 'Sloop', 'Frigate', 'Schooner', 'Brig'],
      },
      {
        name: 'treasure',
        icon: '💰',
        items: ['Gold', 'Jewels', 'Maps', 'Rum', 'Spices'],
      },
      {
        name: 'parrot',
        icon: '🦜',
        items: ['Red', 'Blue', 'Green', 'Yellow', 'Purple'],
      },
    ],
  },

  cooking: {
    id: 'cooking',
    name: 'Chef Competition',
    description: 'Culinary cooking theme',
    categories: [
      {
        name: 'chef',
        icon: '👨‍🍳',
        items: ['Pierre', 'Marco', 'Yuki', 'Anna', 'Carlos'],
      },
      {
        name: 'cuisine',
        icon: '🍽️',
        items: ['French', 'Italian', 'Japanese', 'Mexican', 'Indian'],
      },
      {
        name: 'ingredient',
        icon: '🥕',
        items: ['Truffle', 'Lobster', 'Wagyu', 'Saffron', 'Caviar'],
      },
      {
        name: 'dessert',
        icon: '🍰',
        items: ['Cake', 'Tart', 'Mousse', 'Sorbet', 'Soufflé'],
      },
    ],
  },
};

// Smaller 4-house versions of themes
export const THEME_SETS_4 = {
  classic4: {
    id: 'classic4',
    name: 'Classic Mini',
    description: '4-house version of classic',
    categories: [
      {
        name: 'nationality',
        icon: '🌍',
        items: ['Brit', 'Swede', 'Dane', 'German'],
      },
      {
        name: 'color',
        icon: '🎨',
        items: ['Red', 'Green', 'White', 'Blue'],
      },
      {
        name: 'drink',
        icon: '🥤',
        items: ['Tea', 'Coffee', 'Milk', 'Beer'],
      },
      {
        name: 'pet',
        icon: '🐾',
        items: ['Dog', 'Bird', 'Cat', 'Fish'],
      },
    ],
  },

  fantasy4: {
    id: 'fantasy4',
    name: 'Fantasy Mini',
    description: '4-house fantasy version',
    categories: [
      {
        name: 'race',
        icon: '🧝',
        items: ['Elf', 'Dwarf', 'Human', 'Wizard'],
      },
      {
        name: 'weapon',
        icon: '⚔️',
        items: ['Sword', 'Bow', 'Axe', 'Staff'],
      },
      {
        name: 'mount',
        icon: '🐴',
        items: ['Horse', 'Dragon', 'Wolf', 'Griffin'],
      },
      {
        name: 'treasure',
        icon: '💎',
        items: ['Gold', 'Ruby', 'Emerald', 'Diamond'],
      },
    ],
  },

  pets4: {
    id: 'pets4',
    name: 'Pet Show',
    description: '4-house pet theme',
    categories: [
      {
        name: 'owner',
        icon: '👤',
        items: ['Alice', 'Bob', 'Carol', 'Dave'],
      },
      {
        name: 'pet',
        icon: '🐕',
        items: ['Dog', 'Cat', 'Bird', 'Rabbit'],
      },
      {
        name: 'color',
        icon: '🎨',
        items: ['Brown', 'White', 'Black', 'Orange'],
      },
      {
        name: 'treat',
        icon: '🦴',
        items: ['Biscuit', 'Fish', 'Seeds', 'Carrot'],
      },
    ],
  },
};

// Difficulty descriptions
export const DIFFICULTIES = {
  easy: {
    id: 'easy',
    name: 'Easy',
    description: 'Good for beginners',
    color: '#22c55e',
  },
  medium: {
    id: 'medium',
    name: 'Medium',
    description: 'Standard difficulty',
    color: '#f59e0b',
  },
  hard: {
    id: 'hard',
    name: 'Hard',
    description: 'Challenging puzzles',
    color: '#ef4444',
  },
  expert: {
    id: 'expert',
    name: 'Expert',
    description: 'For puzzle masters',
    color: '#8b5cf6',
  },
};

/**
 * Get all available themes for a given house count
 */
export function getThemesForSize(numHouses) {
  if (numHouses === 4) {
    return Object.values(THEME_SETS_4);
  }
  return Object.values(THEME_SETS);
}

/**
 * Get a random theme for a given house count
 */
export function getRandomTheme(numHouses) {
  const themes = getThemesForSize(numHouses);
  return themes[Math.floor(Math.random() * themes.length)];
}

