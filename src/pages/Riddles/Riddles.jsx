import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay';
import { createSeededRandom } from '../../data/wordUtils';
import styles from './Riddles.module.css';

// Load dataset
let datasetCache = null;
let loadingPromise = null;

async function loadDataset() {
  if (datasetCache) return datasetCache;
  if (loadingPromise) return loadingPromise;

  loadingPromise = fetch('/datasets/riddles.json')
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load riddles: ${res.status}`);
      return res.json();
    })
    .then(data => {
      // Handle both old format {riddles: [...]} and new format [{riddle, answer, hint}]
      const riddles = Array.isArray(data) ? data : (data.riddles || []);
      datasetCache = riddles;
      return datasetCache;
    })
    .catch(err => {
      console.error('Failed to load riddles dataset:', err);
      datasetCache = [];
      return datasetCache;
    })
    .finally(() => {
      loadingPromise = null;
    });

  return loadingPromise;
}

// Select puzzle by seed
function selectRiddle(riddles, seed) {
  if (riddles.length === 0) return null;
  const random = createSeededRandom(seed);
  return riddles[Math.floor(random() * riddles.length)];
}

export default function Riddles() {
  const { t } = useTranslation();
  const [riddles, setRiddles] = useState(null);
  const [currentRiddle, setCurrentRiddle] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [seed, setSeed] = useState(null);
  const [showHint, setShowHint] = useState(false);

  // Load dataset
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await loadDataset();
        if (!mounted) return;
        setRiddles(data);
      } catch (e) {
        console.error('Failed to load riddles:', e);
        if (mounted) setRiddles([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const initRiddle = useCallback((customSeed = null) => {
    if (!riddles || riddles.length === 0) return;
    setRevealed(false);
    setShowHint(false);

    // Use custom seed or generate a unique seed using timestamp + random
    const uniqueSeed = customSeed ?? (Date.now() + Math.random() * 1000000);
    setSeed(uniqueSeed);
    const riddle = selectRiddle(riddles, uniqueSeed);
    setCurrentRiddle(riddle);
  }, [riddles]);

  useEffect(() => {
    if (riddles) {
      initRiddle();
    }
  }, [riddles, initRiddle]);

  const handleReveal = useCallback(() => {
    setRevealed(true);
  }, []);

  const handleNewRiddle = useCallback(() => {
    initRiddle();
  }, [initRiddle]);

  if (!riddles) {
    return (
      <div className={styles.container}>
        <GameHeader title="Riddles" instructions="Loading riddles..." />
        <div className={styles.loading}>Loading riddles...</div>
      </div>
    );
  }

  if (riddles.length === 0) {
    return (
      <div className={styles.container}>
        <GameHeader title="Riddles" instructions="No riddles available." />
      </div>
    );
  }

  if (!currentRiddle) {
    return (
      <div className={styles.container}>
        <GameHeader title="Riddles" instructions="Initializing..." />
      </div>
    );
  }

  // Normalize riddle format (handle both old and new formats)
  const question = currentRiddle.question || currentRiddle.riddle;
  const answer = currentRiddle.answer;
  const hint = currentRiddle.hint;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Riddles"
        instructions="Read the riddle and try to solve it. Click 'Reveal Answer' when you're ready."
      />

      {seed !== null && (
        <SeedDisplay
          seed={seed}
          variant="compact"
          showNewButton={false}
          showShare={false}
          onSeedChange={(newSeed) => {
            // Convert string seeds to numbers if needed
            const seedNum = typeof newSeed === 'string'
              ? (isNaN(parseInt(newSeed, 10)) ? parseInt(newSeed, 10) : Date.now())
              : newSeed;
            initRiddle(seedNum);
          }}
        />
      )}

      <div className={styles.gameArea}>
        <div className={styles.riddleCard}>
          <div className={styles.questionSection}>
            <h2 className={styles.questionLabel}>Riddle</h2>
            <p className={styles.questionText}>{question}</p>
          </div>

          {hint && !revealed && (
            <div className={styles.hintSection}>
              <button
                className={styles.hintBtn}
                onClick={() => setShowHint(!showHint)}
              >
                💡 {showHint ? 'Hide' : 'Show'} Hint
              </button>
              {showHint && (
                <div className={styles.hintText}>
                  {hint}
                </div>
              )}
            </div>
          )}

          {revealed && (
            <div className={styles.answerSection}>
              <h3 className={styles.answerLabel}>Answer</h3>
              <p className={styles.answerText}>{answer}</p>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {!revealed ? (
            <button className={styles.revealBtn} onClick={handleReveal}>
              Reveal Answer
            </button>
          ) : (
            <button className={styles.newRiddleBtn} onClick={handleNewRiddle}>
              New Riddle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
