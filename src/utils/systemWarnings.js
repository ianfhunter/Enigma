/**
 * System warnings utility functions
 * Provides centralized logic for detecting and managing system warnings
 * that can be shared across components like DismissibleAlert and Profile Action Items
 */

/**
 * System warning types
 */
export const WARNING_TYPES = {
  GIT_LFS: 'git-lfs-issue',
  NEW_VERSION_AVAILABLE: 'new-version-available',
  // Add more warning types as needed
};

/**
 * System warning definitions
 */
const WARNING_DEFINITIONS = {
  [WARNING_TYPES.GIT_LFS]: {
    id: WARNING_TYPES.GIT_LFS,
    type: 'warning',
    title: 'Git LFS Issue Detected',
    message: 'Some files may not have been downloaded properly. Run "git lfs pull" to fix this.',
    icon: '⚠️',
    action: 'git lfs pull',
    fileCheck: '/BUG'
  },
  [WARNING_TYPES.NEW_VERSION_AVAILABLE]: {
    id: WARNING_TYPES.NEW_VERSION_AVAILABLE,
    type: 'warning',
    title: 'New Version Available',
    message: 'A new version of the game is available. Please update to the latest version.',
    icon: '🔄',
    action: 'Update to the latest version',
    fileCheck: null // Could check for package-lock.json or node_modules
  }
};

/**
 * Check if a specific warning has been dismissed by the user
 * @param {string} warningId - The ID of the warning to check
 * @returns {boolean} True if the warning has been dismissed
 */
export function isWarningDismissed(warningId) {
  try {
    const dismissed = JSON.parse(localStorage.getItem('dismissedWarnings') || '{}');
    return !!dismissed[warningId];
  } catch (error) {
    console.warn('Failed to check dismissed warnings:', error);
    return false;
  }
}

/**
 * Dismiss a specific warning
 * @param {string} warningId - The ID of the warning to dismiss
 */
export function dismissWarning(warningId) {
  try {
    const dismissed = JSON.parse(localStorage.getItem('dismissedWarnings') || '{}');
    dismissed[warningId] = Date.now();
    localStorage.setItem('dismissedWarnings', JSON.stringify(dismissed));
  } catch (error) {
    console.warn('Failed to dismiss warning:', error);
  }
}

/**
 * Clear all dismissed warnings (for testing or reset purposes)
 */
export function clearDismissedWarnings() {
  try {
    localStorage.removeItem('dismissedWarnings');
  } catch (error) {
    console.warn('Failed to clear dismissed warnings:', error);
  }
}

/**
 * Check for the existence of a file
 * @param {string} filePath - The path to the file to check
 * @returns {Promise<boolean>} True if the file exists
 */
async function checkFileExists(filePath) {
  try {
    const response = await fetch(filePath, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    // Network errors or CORS issues should not be considered as file existence
    return false;
  }
}

/**
 * Detect system warnings by checking for specific conditions
 * @param {string[]} warningTypes - Array of warning types to check (optional, checks all if not provided)
 * @returns {Promise<Array>} Array of active warnings
 */
export async function detectSystemWarnings(warningTypes = null) {
  const warnings = [];
  const typesToCheck = warningTypes || Object.keys(WARNING_DEFINITIONS);

  for (const warningType of typesToCheck) {
    const definition = WARNING_DEFINITIONS[warningType];

    // Skip if warning type doesn't exist
    if (!definition) {
      console.warn(`Unknown warning type: ${warningType}`);
      continue;
    }

    // Skip if already dismissed
    if (isWarningDismissed(definition.id)) {
      continue;
    }

    // Check file condition if specified
    if (definition.fileCheck) {
      const fileExists = await checkFileExists(definition.fileCheck);
      if (!fileExists) {
        continue;
      }
    }

    // Additional custom checks can be added here based on warning type
    // For now, we'll assume file existence is the main check
    warnings.push(definition);
  }

  return warnings;
}

/**
 * Get a specific warning definition
 * @param {string} warningType - The type of warning to get
 * @returns {Object|null} The warning definition or null if not found
 */
export function getWarningDefinition(warningType) {
  return WARNING_DEFINITIONS[warningType] || null;
}

/**
 * Get all available warning types
 * @returns {Array} Array of warning type keys
 */
export function getAvailableWarningTypes() {
  return Object.keys(WARNING_DEFINITIONS);
}

/**
 * Check if there are any active warnings
 * @param {string[]} warningTypes - Array of warning types to check (optional)
 * @returns {Promise<boolean>} True if there are active warnings
 */
export async function hasActiveWarnings(warningTypes = null) {
  const warnings = await detectSystemWarnings(warningTypes);
  return warnings.length > 0;
}

/**
 * Hook-style function for React components to use system warnings
 * This provides a consistent way to manage warnings in React components
 * @param {string[]} warningTypes - Array of warning types to monitor
 * @returns {Object} Object with warnings, loading state, and dismiss function
 */
export function useSystemWarnings(warningTypes = null) {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWarnings() {
      setLoading(true);
      try {
        const detectedWarnings = await detectSystemWarnings(warningTypes);
        setWarnings(detectedWarnings);
      } catch (error) {
        console.error('Failed to load system warnings:', error);
        setWarnings([]);
      } finally {
        setLoading(false);
      }
    }

    loadWarnings();
  }, [warningTypes]);

  const dismissWarningHandler = useCallback((warningId) => {
    dismissWarning(warningId);
    setWarnings(prev => prev.filter(w => w.id !== warningId));
  }, []);

  return {
    warnings,
    loading,
    dismissWarning: dismissWarningHandler,
    hasWarnings: warnings.length > 0
  };
}

// Export the hook for React components
export { useSystemWarnings };