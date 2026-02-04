/**
 * Anatomy Quiz
 *
 * Interactive quiz where users identify body parts by clicking
 * on a human body diagram.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay';
import { useGameStats } from '../../hooks/useGameStats';
import { ALL_PARTS, BODY_SYSTEMS, getPartsBySystem, SYSTEM_IDS } from '../../data/anatomyData';
import { createSeededRandom, stringToSeed, getTodayDateString } from '../../data/wordUtils';
import BodySVG from './BodySVG';
import { getDisplaySystemIds } from './anatomyQuizUtils';
import styles from './AnatomyQuiz.module.css';

const FEEDBACK_DURATION = 1500;

export default function AnatomyQuiz() {
  const { t } = useTranslation();
  const [selectedSystem, setSelectedSystem] = useState('all');
  const [currentPart, setCurrentPart] = useState(null);
  const [highlightedPart, setHighlightedPart] = useState(null);
  const [highlightType, setHighlightType] = useState(null);
  const [showHints, setShowHints] = useState(false);
  const [message, setMessage] = useState(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [seed, setSeed] = useState(() => stringToSeed(`anatomy-quiz-${getTodayDateString()}`));
  const [roundNumber, setRoundNumber] = useState(0);

  const { stats, updateStats, recordWin, recordGiveUp, winRate } = useGameStats('anatomy-quiz', {
    trackBestTime: false,
    trackBestScore: false,
    defaultStats: { bySystem: {} },
  });

  // Get parts for current system
  const getQuizParts = useCallback(() => {
    return ALL_PARTS;
  }, []);

  const displaySystemIds = useMemo(
    () => getDisplaySystemIds(selectedSystem, currentPart?.systemId),
    [selectedSystem, currentPart?.systemId]
  );

  const displayParts = useMemo(() => {
    return displaySystemIds.flatMap(id =>
      getPartsBySystem(id).map(part => ({ ...part, systemId: id }))
    );
  }, [displaySystemIds]);

  // Pick a new random part
  const pickNewPart = useCallback(() => {
    const parts = getQuizParts();
    if (parts.length === 0) return;

    const random = createSeededRandom(seed + roundNumber);
    // Avoid picking the same part twice in a row
    let newPart;
    let attempts = 0;
    do {
      const idx = Math.floor(random() * parts.length);
      newPart = parts[idx];
      attempts++;
    } while (newPart?.id === currentPart?.id && attempts < 10 && parts.length > 1);

    setCurrentPart(newPart);
    setHighlightedPart(null);
    setHighlightType(null);
    setMessage(null);
    setWrongAttempts(0);
    setShowHints(false);
    setIsTransitioning(false);
    setRoundNumber(prev => prev + 1);
  }, [getQuizParts, currentPart, seed, roundNumber]);

  // Initialize on mount only - never change target when switching systems
  useEffect(() => {
    pickNewPart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle clicking on a body part
  const handlePartClick = useCallback((clickedPart) => {
    if (isTransitioning || !currentPart) return;

    if (!clickedPart) {
      // Clicked on body but not a hotspot
      setWrongAttempts(prev => prev + 1);
      setMessage({ text: t('anatomyQuiz.clickHighlight', 'Click on a highlighted region!'), type: 'hint' });

      // Show hints after 2 wrong attempts
      if (wrongAttempts >= 1) {
        setShowHints(true);
      }
      return;
    }

    const isCorrect = clickedPart.id === currentPart.id;

    setHighlightedPart(clickedPart);
    setHighlightType(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      // Correct answer
      setMessage({ text: t('anatomyQuiz.correct', '✓ Correct!'), type: 'success' });
      setIsTransitioning(true);

      // Update stats
      const systemKey = currentPart.systemId || selectedSystem;
      updateStats(prev => {
        const bySystem = { ...(prev.bySystem || {}) };
        bySystem[systemKey] = (bySystem[systemKey] || 0) + 1;
        return { ...prev, bySystem };
      });
      recordWin();

      // Move to next question after delay
      setTimeout(() => {
        pickNewPart();
      }, FEEDBACK_DURATION);

    } else {
      // Wrong answer
      const newWrongAttempts = wrongAttempts + 1;
      setWrongAttempts(newWrongAttempts);
      setMessage({
        text: t('anatomyQuiz.incorrect', "✗ That's the {{name}}", { name: clickedPart.name }),
        type: 'error'
      });

      // Show hints after 2 wrong attempts
      if (newWrongAttempts >= 2) {
        setShowHints(true);
      }

      // Clear highlight after brief delay
      setTimeout(() => {
        setHighlightedPart(null);
        setHighlightType(null);
      }, 800);
    }
  }, [
    currentPart,
    wrongAttempts,
    isTransitioning,
    selectedSystem,
    updateStats,
    recordWin,
    pickNewPart,
    t,
  ]);

  // Handle giving up / skip
  const handleSkip = () => {
    if (isTransitioning) return;

    // Show the correct answer
    setHighlightedPart(currentPart);
    setHighlightType('correct');
    setMessage({
      text: t('anatomyQuiz.giveUpReveal', 'The answer was: {{name}}', { name: currentPart.name }),
      type: 'reveal'
    });
    setIsTransitioning(true);

    // Update stats (count as played but not correct)
    recordGiveUp();

    // Move to next question
    setTimeout(() => {
      pickNewPart();
    }, FEEDBACK_DURATION + 500);
  };

  // Handle system change
  const handleSystemChange = (systemId) => {
    setSelectedSystem(systemId);
  };

  // Get display color for current system
  const getSystemColor = () => {
    if (selectedSystem === 'all') return '#a78bfa';
    return BODY_SYSTEMS[selectedSystem]?.color || '#666';
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title={t('anatomyQuiz.title', 'Anatomy Quiz')}
        instructions={currentPart ? (
          <>
            {t('anatomyQuiz.instructions', 'Click on the')} <strong>{currentPart.name}</strong>
          </>
        ) : t('common.loading', 'Loading...')}
      />

      <SeedDisplay
        seed={seed}
        variant="compact"
        showNewButton={false}
        showShare={false}
        onSeedChange={(newSeed) => {
          setSeed(newSeed);
          setRoundNumber(0);
          setCurrentPart(null);
        }}
      />

      {/* System selector */}
      <div className={styles.systemSelector}>
        <button
          className={`${styles.systemBtn} ${selectedSystem === 'all' ? styles.active : ''}`}
          onClick={() => handleSystemChange('all')}
          style={{ '--system-color': '#a78bfa' }}
        >
          <span className={styles.systemIcon}>🧬</span>
          <span>{t('anatomyQuiz.allSystems', 'All Systems')}</span>
        </button>
        {SYSTEM_IDS.map(id => {
          const system = BODY_SYSTEMS[id];
          return (
            <button
              key={id}
              className={`${styles.systemBtn} ${selectedSystem === id ? styles.active : ''}`}
              onClick={() => handleSystemChange(id)}
              style={{ '--system-color': system.color }}
            >
              <span className={styles.systemIcon}>{system.icon}</span>
              <span>
                {t(
                  `anatomyQuiz.systems.${id}`,
                  system.name.replace(' System', '').replace('Internal ', '')
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.gameArea}>
        {/* Body diagram */}
        <div className={styles.bodyContainer}>
          <BodySVG
            parts={displayParts}
            targetPart={currentPart}
            onPartClick={handlePartClick}
            showHints={showHints}
            highlightedPart={highlightedPart}
            highlightType={highlightType}
            systemColor={getSystemColor()}
            selectedSystem={selectedSystem}
          />

          {/* Hint display */}
          {currentPart && showHints && !isTransitioning && (
            <div className={styles.hintBox}>
              <span className={styles.hintLabel}>{t('common.hint', 'Hint')}:</span> {currentPart.hint}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className={styles.sidePanel}>
          {/* Message display */}
          {message && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}

          {/* Current target info */}
          {currentPart && (
            <div className={styles.targetCard}>
              <div className={styles.targetLabel}>{t('anatomyQuiz.find', 'Find')}:</div>
              <div className={styles.targetName}>{currentPart.name}</div>
              {currentPart.systemId && (
                <div className={styles.targetSystem}>
                  {BODY_SYSTEMS[currentPart.systemId]?.icon} {BODY_SYSTEMS[currentPart.systemId]?.name}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button
              className={styles.hintBtn}
              onClick={() => setShowHints(true)}
              disabled={showHints || isTransitioning}
            >
              💡 {t('anatomyQuiz.showHint', 'Show Hint')}
            </button>
            <button
              className={styles.skipBtn}
              onClick={handleSkip}
              disabled={isTransitioning}
            >
              ⏭️ {t('common.giveUp', 'Give Up')}
            </button>
          </div>

          {/* Stats panel */}
          <div className={styles.statsPanel}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.played}</span>
              <span className={styles.statLabel}>{t('common.played')}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{winRate}%</span>
              <span className={styles.statLabel}>{t('anatomyQuiz.accuracy', 'Accuracy')}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.currentStreak}</span>
              <span className={styles.statLabel}>{t('common.streak')}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.maxStreak}</span>
              <span className={styles.statLabel}>{t('common.best', 'Best')}</span>
            </div>
          </div>

          {/* Wrong attempts indicator */}
          {wrongAttempts > 0 && !isTransitioning && (
            <div className={styles.attemptsInfo}>
              {t('anatomyQuiz.wrongAttempts', '{{count}} wrong {{label}}', {
                count: wrongAttempts,
                label: wrongAttempts === 1
                  ? t('anatomyQuiz.attemptSingle', 'attempt')
                  : t('anatomyQuiz.attemptPlural', 'attempts'),
              })}
              {wrongAttempts >= 2 && ` • ${t('anatomyQuiz.hintRevealed', 'Hint revealed!')}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
