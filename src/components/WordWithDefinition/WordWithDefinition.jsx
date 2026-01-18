import { useSettings } from '../../context/SettingsContext';
import styles from './WordWithDefinition.module.css';

/**
 * Get search URL for a word based on search engine preference
 */
function getSearchUrl(word, searchEngine) {
  const searchQuery = `define:${word}`;
  const engines = {
    google: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
    bing: `https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}`,
    duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}`,
    yahoo: `https://search.yahoo.com/search?p=${encodeURIComponent(searchQuery)}`,
  };
  return engines[searchEngine] || engines.google;
}

/**
 * Component that displays a word with a question mark icon
 * Clicking the question mark opens search engine with "define:" prefix
 */
export default function WordWithDefinition({ word, className = '', children }) {
  const { settings } = useSettings();
  const searchEngine = settings?.searchEngine || 'google';

  const handleDefineClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getSearchUrl(word, searchEngine);
    window.open(url, '_blank');
  };

  return (
    <span className={`${styles.wordContainer} ${className}`}>
      {children || <span className={styles.word}>{word}</span>}
      <button
        className={styles.questionMark}
        onClick={handleDefineClick}
        title={`Look up "${word}" definition`}
        aria-label={`Define ${word}`}
      >
        ?
      </button>
    </span>
  );
}
