import { useState, useCallback, useRef, useEffect } from 'react';
import styles from './SeedDisplay.module.css';

/**
 * SeedDisplay - Shows the current puzzle seed with copy and share functionality
 *
 * @param {Object} props
 * @param {number|string} props.seed - The seed value to display
 * @param {string} [props.label] - Optional label (default: "Seed")
 * @param {boolean} [props.showCopy] - Show copy button (default: true)
 * @param {boolean} [props.showShare] - Show share button (default: true)
 * @param {string} [props.shareUrl] - Custom share URL (default: current URL with seed param)
 * @param {string} [props.shareTitle] - Title for share dialog
 * @param {string} [props.shareText] - Text for share dialog
 * @param {string} [props.className] - Additional CSS class
 * @param {'compact' | 'default' | 'inline'} [props.variant] - Display variant
 * @param {function} [props.onNewSeed] - Callback when "New" button is clicked
 * @param {boolean} [props.showNewButton] - Show "New Puzzle" button (default: false)
 * @param {function} [props.onSeedChange] - Callback when seed is changed (receives new seed value)
 * @param {boolean} [props.editable] - Allow editing the seed (default: true if onSeedChange is provided)
 */
export default function SeedDisplay({
  seed,
  label = 'Seed',
  showCopy = true,
  showShare = true,
  shareUrl,
  shareTitle = 'Check out this puzzle!',
  shareText,
  className = '',
  variant = 'default',
  onNewSeed,
  showNewButton = false,
  onSeedChange,
  editable,
}) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);
  
  const isEditable = editable !== undefined ? editable : !!onSeedChange;

  const seedString = String(seed);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle seed change from props
  useEffect(() => {
    if (!isEditing) {
      setEditValue(seedString);
    }
  }, [seed, seedString, isEditing]);

  // Start editing
  const handleStartEdit = useCallback(() => {
    if (isEditable) {
      setEditValue(seedString);
      setIsEditing(true);
    }
  }, [isEditable, seedString]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditValue(seedString);
    setIsEditing(false);
  }, [seedString]);

  // Submit edited seed
  const handleSubmitEdit = useCallback(() => {
    if (!onSeedChange) {
      setIsEditing(false);
      return;
    }

    const trimmed = editValue.trim();
    if (!trimmed) {
      handleCancelEdit();
      return;
    }

    // Try to parse as number
    const parsed = parseInt(trimmed, 10);
    if (!isNaN(parsed)) {
      onSeedChange(parsed);
      setIsEditing(false);
    } else {
      // If not a number, try to use it as-is (might be a string seed)
      onSeedChange(trimmed);
      setIsEditing(false);
    }
  }, [editValue, onSeedChange, handleCancelEdit]);

  // Handle input key events
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  }, [handleSubmitEdit, handleCancelEdit]);

  // Get the shareable URL
  const getShareUrl = useCallback(() => {
    if (shareUrl) return shareUrl;
    if (typeof window === 'undefined') return '';

    const url = new URL(window.location.href);
    url.searchParams.set('seed', seedString);
    return url.toString();
  }, [shareUrl, seedString]);

  // Copy seed to clipboard
  const handleCopySeed = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(seedString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = seedString;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [seedString]);

  // Copy share URL to clipboard
  const handleCopyUrl = useCallback(async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [getShareUrl]);

  // Share using Web Share API
  const handleShare = useCallback(async () => {
    const url = getShareUrl();
    const text = shareText || `Try this puzzle! Seed: ${seedString}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text,
          url,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        // User cancelled or share failed, fall back to copy
        if (err.name !== 'AbortError') {
          handleCopyUrl();
        }
      }
    } else {
      // No Web Share API, copy URL instead
      handleCopyUrl();
    }
  }, [getShareUrl, shareTitle, shareText, seedString, handleCopyUrl]);

  const containerClass = [
    styles.container,
    styles[variant],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.wrapper}>
      <div className={containerClass}>
      {variant !== 'inline' && label && (
        <span className={styles.label}>{label}:</span>
      )}

      <span className={styles.seed} title={`Seed: ${seedString}`}>
        {variant === 'inline' && label && (
          <span className={styles.inlineLabel}>{label}: </span>
        )}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className={styles.seedInput}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSubmitEdit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            aria-label="Enter seed value"
          />
        ) : (
          <code
            className={`${styles.seedValue} ${isEditable ? styles.editable : ''}`}
            onClick={handleStartEdit}
            title={isEditable ? 'Click to edit seed' : `Seed: ${seedString}`}
          >
            {seedString}
          </code>
        )}
      </span>

      <div className={styles.actions}>
        {showCopy && (
          <button
            className={styles.actionButton}
            onClick={handleCopySeed}
            title={copied ? 'Copied!' : 'Copy seed'}
            aria-label={copied ? 'Copied!' : 'Copy seed'}
          >
            {copied ? (
              <CheckIcon />
            ) : (
              <CopyIcon />
            )}
          </button>
        )}

        {showShare && (
          <button
            className={styles.actionButton}
            onClick={handleShare}
            title={shared ? 'Shared!' : 'Share puzzle'}
            aria-label={shared ? 'Shared!' : 'Share puzzle'}
          >
            {shared ? (
              <CheckIcon />
            ) : (
              <ShareIcon />
            )}
          </button>
        )}

        {showNewButton && onNewSeed && (
          <button
            className={styles.newButton}
            onClick={onNewSeed}
            title="Generate new puzzle"
            aria-label="Generate new puzzle"
          >
            🎲
          </button>
        )}
      </div>
      </div>
    </div>
  );
}

// Icon components
function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Hook to manage seed state with URL sync
 * @param {string} gameId - Unique game identifier
 * @param {function} generateSeed - Function to generate a new seed
 * @returns {Object} { seed, setSeed, newSeed, seedFromUrl }
 */
export function useSeed(gameId, generateSeed) {
  const [seed, setSeed] = useState(() => {
    // Check URL for seed parameter
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSeed = params.get('seed');
      if (urlSeed) {
        const parsed = parseInt(urlSeed, 10);
        if (!isNaN(parsed)) return parsed;
        // If it's a string seed, hash it
        return hashString(urlSeed);
      }
    }
    // Use provided generator or generate from game ID
    return generateSeed ? generateSeed() : generateDefaultSeed(gameId);
  });

  const seedFromUrl = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('seed');

  const newSeed = useCallback(() => {
    const nextSeed = generateSeed ? generateSeed() : generateDefaultSeed(gameId);
    setSeed(nextSeed);

    // Update URL without the seed param (so it doesn't stick)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('seed');
      window.history.replaceState({}, '', url.toString());
    }

    return nextSeed;
  }, [gameId, generateSeed]);

  return { seed, setSeed, newSeed, seedFromUrl };
}

// Helper functions
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function generateDefaultSeed(gameId = '') {
  const today = new Date().toISOString().split('T')[0];
  return hashString(`${gameId}-${today}`);
}
