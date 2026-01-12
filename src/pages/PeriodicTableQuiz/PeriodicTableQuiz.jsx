import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import GameHeader from '../../components/GameHeader';
import { usePersistedState } from '../../hooks/usePersistedState';
import styles from './PeriodicTableQuiz.module.css';

const MODES = [
  { id: 'symbol-to-name', label: 'Symbol → Name', prompt: 'symbol', answer: 'name' },
  { id: 'name-to-symbol', label: 'Name → Symbol', prompt: 'name', answer: 'symbol' },
];

export default function PeriodicTableQuiz() {
  const [data, setData] = useState(null);
  const [mode, setMode] = useState(MODES[0]);
  const [current, setCurrent] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const [stats, setStats] = usePersistedState('periodic-table-quiz-stats', {
    played: 0,
    correct: 0,
    streak: 0,
    maxStreak: 0,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const mod = await import('../../data/periodic_table.json');
      if (!mounted) return;
      setData(mod.default);
    })().catch((e) => {
      console.error('Failed to load periodic_table.json:', e);
      setData({ elements: [], categories: [] });
    });
    return () => { mounted = false; };
  }, []);

  const elements = useMemo(() => data?.elements || [], [data]);

  // All element names for autocomplete
  const allNames = useMemo(() =>
    elements.map(e => e.name).sort((a, b) => a.localeCompare(b)),
    [elements]
  );

  // Filter suggestions based on input (only for name mode)
  const suggestions = useMemo(() => {
    if (mode.answer !== 'name' || !inputValue.trim()) return [];
    const query = inputValue.toLowerCase().trim();
    return allNames
      .filter(name => name.toLowerCase().startsWith(query))
      .slice(0, 8);
  }, [mode.answer, inputValue, allNames]);

  const pickRandom = useCallback(() => {
    if (!elements.length) return null;
    const idx = Math.floor(Math.random() * elements.length);
    return elements[idx];
  }, [elements]);

  const startRound = useCallback(() => {
    const next = pickRandom();
    if (!next) return;
    setCurrent(next);
    setInputValue('');
    setResult(null);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    // Focus input after a short delay
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [pickRandom]);

  useEffect(() => {
    if (elements.length) {
      startRound();
    }
  }, [elements, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAnswer = useCallback((answer) => {
    if (result || !current) return;

    const correctAnswer = current[mode.answer];
    const normalizedInput = answer.trim().toLowerCase();
    const normalizedCorrect = correctAnswer.toLowerCase();

    const isCorrect = normalizedInput === normalizedCorrect;
    setResult({ correct: isCorrect, correctAnswer });

    setStats(prev => {
      const played = prev.played + 1;
      const correctCount = prev.correct + (isCorrect ? 1 : 0);
      const streak = isCorrect ? prev.streak + 1 : 0;
      const maxStreak = Math.max(prev.maxStreak, streak);
      return { played, correct: correctCount, streak, maxStreak };
    });
  }, [result, current, mode.answer, setStats]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    checkAnswer(inputValue);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    checkAnswer(suggestion);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
    setSelectedSuggestionIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (mode.answer !== 'name' || !showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
      default:
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const promptValue = current ? (mode.prompt === 'symbol' ? current.symbol : current.name) : '';
  const promptLabel = mode.prompt === 'symbol' ? 'Element Symbol' : 'Element Name';
  const answerLabel = mode.answer === 'name' ? 'Element Name' : 'Symbol';
  const placeholder = mode.answer === 'name'
    ? 'Type the element name...'
    : 'Type the symbol (e.g., Fe)...';

  return (
    <div className={styles.container}>
      <GameHeader
        title="Periodic Table Quiz"
        instructions="Test your knowledge of element symbols and names!"
      />

      <div className={styles.controls}>
        <label className={styles.label}>
          Mode
          <select
            className={styles.select}
            value={mode.id}
            onChange={(e) => {
              const m = MODES.find(x => x.id === e.target.value);
              setMode(m);
            }}
          >
            {MODES.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </label>
      </div>

      {!data && <div className={styles.card}>Loading elements...</div>}

      {data && current && (
        <>
          <div className={styles.promptCard}>
            <div className={styles.promptLabel}>{promptLabel}</div>
            <div className={styles.prompt}>{promptValue}</div>
            <div className={styles.subtle}>
              Atomic Number: {current.number} • {current.category}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.sectionTitle}>
              What is the {answerLabel.toLowerCase()}?
            </div>

            <form onSubmit={handleSubmit} className={styles.inputForm}>
              <div className={styles.inputWrapper}>
                <input
                  ref={inputRef}
                  type="text"
                  className={`${styles.textInput} ${result ? (result.correct ? styles.inputCorrect : styles.inputWrong) : ''}`}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => mode.answer === 'name' && setShowSuggestions(true)}
                  placeholder={placeholder}
                  disabled={!!result}
                  autoComplete="off"
                  autoCapitalize={mode.answer === 'symbol' ? 'characters' : 'words'}
                  spellCheck="false"
                />

                {/* Autocomplete suggestions - only for names */}
                {mode.answer === 'name' && showSuggestions && suggestions.length > 0 && !result && (
                  <div ref={suggestionsRef} className={styles.suggestions}>
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion}
                        className={`${styles.suggestionItem} ${index === selectedSuggestionIndex ? styles.suggestionSelected : ''}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                      >
                        <span className={styles.suggestionText}>
                          <strong>{suggestion.slice(0, inputValue.length)}</strong>
                          {suggestion.slice(inputValue.length)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!result && (
                <button type="submit" className={styles.submitBtn} disabled={!inputValue.trim()}>
                  Check
                </button>
              )}
            </form>

            {result && (
              <>
                <div className={`${styles.result} ${result.correct ? styles.ok : styles.nope}`}>
                  <div className={styles.resultTitle}>
                    {result.correct ? '✓ Correct!' : '✗ Incorrect'}
                  </div>
                  <div className={styles.resultBody}>
                    {current.name} ({current.symbol}) - Atomic #{current.number}
                  </div>
                </div>

                <div className={styles.actions}>
                  <button className={styles.primaryBtn} onClick={startRound}>
                    Next Element →
                  </button>
                </div>
              </>
            )}
          </div>

          <div className={styles.statsPanel}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.played}</span>
              <span className={styles.statLabel}>Played</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {stats.played > 0 ? Math.round((stats.correct / stats.played) * 100) : 0}%
              </span>
              <span className={styles.statLabel}>Accuracy</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.streak}</span>
              <span className={styles.statLabel}>Streak</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.maxStreak}</span>
              <span className={styles.statLabel}>Best</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
