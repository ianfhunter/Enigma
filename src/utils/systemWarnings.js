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
  SAMPLE_WARNING: 'sample-warning',
  // Add more warning types as needed
};

/**
 * System warning definitions
 */
const WARNING_DEFINITIONS = {
  [WARNING_TYPES.SAMPLE_WARNING]: {
    id: WARNING_TYPES.SAMPLE_WARNING,
    type: 'warning',
    title: 'Sample Warning',
    message: 'This is a sample warning. It is used to test the system warnings utility.',
    icon: '⚠️',
    action: 'Sample action',
    fileCheck: "BUG"
  },
  [WARNING_TYPES.GIT_LFS]: {
    id: WARNING_TYPES.GIT_LFS,
    type: 'warning',
    title: 'Git LFS Issue Detected',
    message: 'Some files may not have been downloaded properly.',
    icon: '⚠️',
    action: 'verify installation. Run `git lfs install` and `git lfs pull` or reinstall your app.',
    fileCheck: null,
    customCheck: checkGitLfsIssues
  },
  [WARNING_TYPES.NEW_VERSION_AVAILABLE]: {
    id: WARNING_TYPES.NEW_VERSION_AVAILABLE,
    type: 'warning',
    title: 'New Version Available',
    message: 'A new version of the game is available. Please update to the latest version.',
    icon: '🔄',
    action: 'Update to the latest version',
    fileCheck: null,
    customCheck: checkNewVersionAvailable
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
 * Check for Git LFS issues by looking for unexpanded LFS files
 * @returns {Promise<boolean>} True if Git LFS issues are detected
 */
async function checkGitLfsIssues() {
  try {

    // Check for common LFS file patterns that might be unexpanded
    const lfsPatterns = [
      '/public/audio/classical/Beethoven_Symphony_No_5.mp3',
      '/public/audio/classical/Mozart_Symphony_No_40.mp3',
      '/public/audio/classical/Bach_Goldberg_Variations.mp3',
      '/public/audio/classical/Chopin_Nocturne_Op_9_No_2.mp3',
      '/public/audio/classical/Vivaldi_Four_Seasons_Spring.mp3'
    ];

    for (const pattern of lfsPatterns) {
      try {
        const response = await fetch(pattern, { method: 'HEAD' });
        if (response.ok) {
          // Check if the file is actually an LFS pointer file
          const contentResponse = await fetch(pattern);
          if (contentResponse.ok) {
            const text = await contentResponse.text();
            // LFS pointer files typically start with "version https://git-lfs.github.com/spec/v1"
            if (text.includes('version https://git-lfs.github.com/spec/v1') ||
                text.includes('oid sha256:') ||
                text.includes('size ')) {
              return true;
            }
          }
        }
      } catch (error) {
        // Continue checking other patterns
        continue;
      }
    }

    return false;
  } catch (error) {
    console.warn('Failed to check Git LFS issues:', error);
    return false;
  }
}

/**
 * Check for new Docker image versions
 * @returns {Promise<boolean>} True if a new version is available
 */
async function checkNewVersionAvailable() {
  try {
    // Check if we're running in Docker by looking for Docker-specific environment
    const isDocker = navigator.userAgent.includes('Docker') ||
                     window.location.hostname === 'localhost' ||
                     window.location.hostname === 'ian-2014.local';

    if (!isDocker) {
      return false;
    }

    // Try to get current image info from environment or API
    let currentImageHash = null;

    try {
      // Check for environment variable or API endpoint that provides current image info
      const envResponse = await fetch('/api/system/info');
      if (envResponse.ok) {
        const systemInfo = await envResponse.json();
        currentImageHash = systemInfo.dockerImageHash || systemInfo.imageHash;
      }
    } catch (error) {
      // Fallback: try to get from meta tags or other sources
      const metaTag = document.querySelector('meta[name="docker-image-hash"]');
      if (metaTag) {
        currentImageHash = metaTag.getAttribute('content');
      }
    }

    if (!currentImageHash) {
      return false;
    }

    // Check for latest available version
    let latestImageHash = null;

    try {
      // Try to fetch latest version from a version endpoint
      const versionResponse = await fetch('/api/system/latest-version');
      if (versionResponse.ok) {
        const versionInfo = await versionResponse.json();
        latestImageHash = versionInfo.dockerImageHash || versionInfo.imageHash;
      }
    } catch (error) {
      // Fallback: check Docker Hub or registry API
      try {
        // This would need to be configured with your specific registry
        const registryResponse = await fetch('https://registry.hub.docker.com/v2/repositories/ianfhunter/enigma/tags/latest/');
        if (registryResponse.ok) {
          const registryData = await registryResponse.json();
          latestImageHash = registryData.images?.[0]?.digest;
        }
      } catch (registryError) {
        // Registry check failed, assume no update needed
      }
    }

    if (!latestImageHash) {
      return false;
    }

    // Compare hashes
    return currentImageHash !== latestImageHash;
  } catch (error) {
    console.warn('Failed to check for new version:', error);
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

    // Custom checks based on warning type
    let shouldShowWarning = true;

    if (definition.customCheck) {
      shouldShowWarning = await definition.customCheck();
    } else if (definition.fileCheck) {
      shouldShowWarning = await checkFileExists(definition.fileCheck);
    } else {
        // This should never happen, but at least
        // it will be obvious if it does.
      shouldShowWarning = true;
    }


    if (shouldShowWarning) {
      warnings.push(definition);
    }
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
