import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'enigma-custom-packs';

/**
 * Generate a unique ID for packs and games
 */
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/**
 * Hook for managing custom user-created packs with iframe games
 * Persists to localStorage
 */
export function useCustomPacks() {
  const [customPacks, setCustomPacks] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomPacks(Array.isArray(parsed) ? parsed : []);
      } catch {
        // Invalid JSON, start fresh
        setCustomPacks([]);
      }
    }
  }, []);

  // Save to localStorage
  const save = useCallback((packs) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(packs));
    setCustomPacks(packs);
  }, []);

  /**
   * Create a new external pack
   */
  const createPack = useCallback((packData) => {
    const newPack = {
      id: generateId('pack'),
      name: packData.name || 'My Pack',
      description: packData.description || '',
      icon: packData.icon || '🎮',
      color: packData.color || '#f59e0b',
      games: [],
      createdAt: Date.now(),
    };
    const updated = [...customPacks, newPack];
    save(updated);
    return newPack;
  }, [customPacks, save]);

  /**
   * Update a pack's metadata (name, description, icon, color)
   */
  const updatePack = useCallback((packId, updates) => {
    const updated = customPacks.map(p =>
      p.id === packId ? { ...p, ...updates, updatedAt: Date.now() } : p
    );
    save(updated);
  }, [customPacks, save]);

  /**
   * Delete a pack and all its games
   */
  const deletePack = useCallback((packId) => {
    const updated = customPacks.filter(p => p.id !== packId);
    save(updated);
  }, [customPacks, save]);

  /**
   * Add a game to a pack
   */
  const addGameToPack = useCallback((packId, gameData) => {
    const newGame = {
      id: generateId('game'),
      title: gameData.title || 'Untitled Game',
      url: gameData.url,
      description: gameData.description || '',
      icon: gameData.icon || '🎮',
      addedAt: Date.now(),
    };
    const updated = customPacks.map(p =>
      p.id === packId
        ? { ...p, games: [...p.games, newGame], updatedAt: Date.now() }
        : p
    );
    save(updated);
    return newGame;
  }, [customPacks, save]);

  /**
   * Update a game's metadata
   */
  const updateGame = useCallback((packId, gameId, updates) => {
    const updated = customPacks.map(p =>
      p.id === packId
        ? {
            ...p,
            games: p.games.map(g =>
              g.id === gameId ? { ...g, ...updates } : g
            ),
            updatedAt: Date.now(),
          }
        : p
    );
    save(updated);
  }, [customPacks, save]);

  /**
   * Remove a game from a pack
   */
  const removeGameFromPack = useCallback((packId, gameId) => {
    const updated = customPacks.map(p =>
      p.id === packId
        ? { ...p, games: p.games.filter(g => g.id !== gameId), updatedAt: Date.now() }
        : p
    );
    save(updated);
  }, [customPacks, save]);

  /**
   * Get a specific pack by ID
   */
  const getPackById = useCallback((packId) => {
    return customPacks.find(p => p.id === packId);
  }, [customPacks]);

  /**
   * Get a specific game from a pack
   */
  const getGameFromPack = useCallback((packId, gameId) => {
    const pack = customPacks.find(p => p.id === packId);
    return pack?.games.find(g => g.id === gameId);
  }, [customPacks]);

  /**
   * Get total count of custom games across all packs
   */
  const totalGames = customPacks.reduce((sum, p) => sum + p.games.length, 0);

  return {
    customPacks,
    totalGames,
    createPack,
    updatePack,
    deletePack,
    addGameToPack,
    updateGame,
    removeGameFromPack,
    getPackById,
    getGameFromPack,
  };
}

