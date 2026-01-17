/**
 * Trivia & Knowledge Pack Manifest
 *
 * Test your knowledge across geography, science, history, art, music, and more!
 */

import constellationsIcon from '../../assets/icons/constellations.svg';
import pokemongenblitzIcon from '../../assets/icons/pokemongenblitz.svg';
import currencyquizIcon from '../../assets/icons/currencyquiz.svg';

const triviaKnowledgePack = {
  id: 'trivia-knowledge',
  type: 'official',
  name: 'Trivia & Knowledge',
  description: 'Test your knowledge! Geography, flags, capitals, science, history, and more.',
  icon: '🌍',
  color: '#10b981',
  version: '1.0.0',
  default: true,
  removable: true,

  categories: [
    {
      name: 'Trivia & Knowledge',
      icon: '🌍',
      description: 'Test your knowledge across various topics',
      games: [
        {
          slug: 'flag-guesser',
          title: 'Flag Guesser',
          description: 'Identify countries by their flags. Test your geography knowledge!',
          icon: '🌍',
          emojiIcon: '🌍',
          colors: { primary: '#2dd4bf', secondary: '#14b8a6' },
          gradient: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
          version: 'v1.0',
          component: () => import('../../pages/FlagGuesser'),
        },
        {
          slug: 'capital-guesser',
          title: 'Capital Guesser',
          description: 'Name the capital city of each country. How well do you know world capitals?',
          icon: '🏛️',
          emojiIcon: '🏛️',
          colors: { primary: '#f472b6', secondary: '#ec4899' },
          gradient: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
          version: 'v1.0',
          component: () => import('../../pages/CapitalGuesser'),
        },
        {
          slug: 'world-map-fill',
          title: 'World Map Fill',
          description: 'Name all the countries to fill in the world map. How many can you remember?',
          icon: '🗺️',
          emojiIcon: '🗺️',
          colors: { primary: '#22d3ee', secondary: '#06b6d4' },
          gradient: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)',
          version: 'v1.0',
          component: () => import('../../pages/WorldMapFill'),
        },
        {
          slug: 'provincial-map-fill',
          title: 'Provincial Map Fill',
          description: 'Fill in maps by region: US States, Canadian Provinces, Japanese Prefectures, Irish Counties!',
          icon: '🗺️',
          emojiIcon: '🗺️',
          colors: { primary: '#14b8a6', secondary: '#0d9488' },
          gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
          version: 'v1.0',
          component: () => import('../../pages/ProvincialMapFill'),
        },
        {
          slug: 'famous-paintings',
          title: 'Famous Paintings',
          description: 'Identify masterpieces by their artist, title, or art movement. Test your art history!',
          icon: '🖼️',
          emojiIcon: '🖼️',
          colors: { primary: '#b45309', secondary: '#d97706' },
          gradient: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
          version: 'v1.0',
          component: () => import('../../pages/FamousPaintings'),
        },
        {
          slug: 'trivia',
          title: 'Trivia',
          description: 'General knowledge quiz with thousands of questions across history, science, sports & more!',
          icon: '🧠',
          emojiIcon: '🧠',
          colors: { primary: '#7c3aed', secondary: '#8b5cf6' },
          gradient: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
          version: 'v1.0',
          component: () => import('../../pages/Trivia'),
        },
        {
          slug: 'anatomy-quiz',
          title: 'Anatomy Quiz',
          description: 'Identify bones, muscles, and organs by clicking on the human body diagram!',
          icon: '🫀',
          emojiIcon: '🫀',
          colors: { primary: '#ec4899', secondary: '#be185d' },
          gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
          version: 'v1.0',
          component: () => import('../../pages/AnatomyQuiz'),
        },
        {
          slug: 'constellations',
          title: 'Constellations',
          description: 'Identify star constellations! Learn the 88 IAU constellations and their star patterns.',
          icon: constellationsIcon,
          emojiIcon: '⭐',
          colors: { primary: '#0f172a', secondary: '#1e293b' },
          gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          version: 'v1.0',
          component: () => import('../../pages/Constellations'),
        },
        {
          slug: 'pokemon-quiz',
          title: 'Pokémon Quiz',
          description: 'Text-only quiz: identify the generation and type(s) for a Pokémon.',
          icon: '📘',
          emojiIcon: '📘',
          colors: { primary: '#ef4444', secondary: '#dc2626' },
          gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          version: 'v1.0',
          component: () => import('../../pages/PokemonQuiz'),
        },
        {
          slug: 'pokemon-gen-blitz',
          title: 'Pokémon Gen Blitz',
          description: 'Name as many Pokémon as you can from a chosen generation before time runs out.',
          icon: pokemongenblitzIcon,
          emojiIcon: '⌛',
          colors: { primary: '#3b82f6', secondary: '#2563eb' },
          gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          version: 'v1.0',
          component: () => import('../../pages/PokemonGenBlitz'),
        },
        {
          slug: 'periodic-table-quiz',
          title: 'Periodic Table Quiz',
          description: 'Test your chemistry knowledge! Match element symbols to names and vice versa.',
          icon: '⚗️',
          emojiIcon: '⚗️',
          colors: { primary: '#06b6d4', secondary: '#0891b2' },
          gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
          version: 'v1.0',
          component: () => import('../../pages/PeriodicTableQuiz'),
        },
        {
          slug: 'language-quiz',
          title: 'Language Quiz',
          description: 'What languages are spoken in each country? Select all official languages!',
          icon: '🗣️',
          emojiIcon: '🗣️',
          colors: { primary: '#8b5cf6', secondary: '#7c3aed' },
          gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          version: 'v1.0',
          component: () => import('../../pages/LanguageQuiz'),
        },
        {
          slug: 'currency-quiz',
          title: 'Currency Quiz',
          description: 'Match countries to their official currencies. From Dollars to Dinars!',
          icon: currencyquizIcon,
          emojiIcon: '💰',
          colors: { primary: '#22c55e', secondary: '#16a34a' },
          gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          version: 'v1.0',
          component: () => import('../../pages/CurrencyQuiz'),
        },
        {
          slug: 'gods-quiz',
          title: 'Gods & Domains Quiz',
          description: 'Match deities to their domains across Greek, Roman, Norse, and Egyptian mythology.',
          icon: '⚡',
          emojiIcon: '⚡',
          colors: { primary: '#f59e0b', secondary: '#d97706' },
          gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          version: 'v1.0',
          component: () => import('../../pages/GodsQuiz'),
        },
        {
          slug: 'classical-music-quiz',
          title: 'Classical Music Quiz',
          description: 'Listen to classical masterpieces and guess the composer! Test your musical knowledge.',
          icon: '🎼',
          emojiIcon: '🎼',
          colors: { primary: '#a855f7', secondary: '#6366f1' },
          gradient: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
          version: 'v1.0',
          component: () => import('../../pages/ClassicalMusicQuiz'),
        },
        {
          slug: 'riddles',
          title: 'Riddles',
          description: 'Solve classic riddles! Read the question and try to figure out the answer before revealing it.',
          icon: '🤔',
          emojiIcon: '🤔',
          colors: { primary: '#f59e0b', secondary: '#d97706' },
          gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          version: 'v1.0',
          component: () => import('../../pages/Riddles'),
        },
        {
          slug: 'map',
          title: 'Map',
          description: 'Color regions on a map so adjacent regions have different colors.',
          icon: '🗺️',
          emojiIcon: '🗺️',
          colors: { primary: '#22d3ee', secondary: '#06b6d4' },
          gradient: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)',
          version: 'v1.0',
          component: () => import('../../pages/Map'),
        },
      ],
    },
  ],

  /**
   * Get all games in this pack (flattened from categories with categoryName)
   */
  get allGames() {
    return this.categories.flatMap(cat =>
      cat.games.map(game => ({ ...game, categoryName: cat.name }))
    );
  },

  /**
   * Find a game by slug
   */
  getGameBySlug(slug) {
    return this.allGames.find(g => g.slug === slug);
  },

  /**
   * Total game count
   */
  get gameCount() {
    return this.allGames.length;
  },

  /**
   * Preview games for pack display (first 4)
   */
  getPreviewGames() {
    return this.allGames.slice(0, 4);
  },
};

export default triviaKnowledgePack;
