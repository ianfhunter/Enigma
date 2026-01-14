import { useState, useEffect } from 'react';

/**
 * A hook that persists state to localStorage
 * @param {string} key - The localStorage key
 * @param {any} defaultValue - The default value if no stored value exists
 * @returns {[any, function]} - State and setter, like useState
 */
export function usePersistedState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.error(`Failed to save ${key} to localStorage:`, e);
    }
  }, [key, state]);

  return [state, setState];
}

export default usePersistedState;
