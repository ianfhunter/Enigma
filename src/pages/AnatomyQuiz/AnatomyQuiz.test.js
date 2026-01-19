import { describe, it, expect } from 'vitest';

// ===========================================
// AnatomyQuiz - Stats Calculation Tests
// ===========================================
describe('AnatomyQuiz - Stats Calculation', () => {
  function calculateAccuracy(played, correct) {
    if (played === 0) return 0;
    return Math.round((correct / played) * 100);
  }

  it('should calculate accuracy correctly', () => {
    expect(calculateAccuracy(10, 8)).toBe(80);
    expect(calculateAccuracy(5, 5)).toBe(100);
    expect(calculateAccuracy(4, 1)).toBe(25);
  });

  it('should handle zero plays', () => {
    expect(calculateAccuracy(0, 0)).toBe(0);
  });
});

// ===========================================
// AnatomyQuiz - Streak Tracking Tests
// ===========================================
describe('AnatomyQuiz - Streak Tracking', () => {
  function updateStreak(currentStreak, maxStreak, isCorrect) {
    if (isCorrect) {
      const newStreak = currentStreak + 1;
      return {
        streak: newStreak,
        maxStreak: Math.max(maxStreak, newStreak)
      };
    }
    return {
      streak: 0,
      maxStreak
    };
  }

  it('should increment streak on correct answer', () => {
    const result = updateStreak(3, 5, true);
    expect(result.streak).toBe(4);
  });

  it('should update max streak when exceeded', () => {
    const result = updateStreak(5, 5, true);
    expect(result.maxStreak).toBe(6);
  });

  it('should reset streak on wrong answer', () => {
    const result = updateStreak(3, 5, false);
    expect(result.streak).toBe(0);
    expect(result.maxStreak).toBe(5);
  });
});

// ===========================================
// AnatomyQuiz - Part Selection Tests
// ===========================================
describe('AnatomyQuiz - Part Selection', () => {
  function selectRandomPart(parts, currentPartId) {
    if (parts.length === 0) return null;
    if (parts.length === 1) return parts[0];

    // Avoid picking the same part twice
    let newPart;
    let attempts = 0;
    do {
      const idx = Math.floor(Math.random() * parts.length);
      newPart = parts[idx];
      attempts++;
    } while (newPart?.id === currentPartId && attempts < 10 && parts.length > 1);

    return newPart;
  }

  it('should return null for empty parts', () => {
    expect(selectRandomPart([], 'current')).toBe(null);
  });

  it('should return single part when only one available', () => {
    const parts = [{ id: 'heart', name: 'Heart' }];
    const result = selectRandomPart(parts, 'other');
    expect(result.id).toBe('heart');
  });

  it('should select a part from the array', () => {
    const parts = [
      { id: 'heart', name: 'Heart' },
      { id: 'lung', name: 'Lung' },
      { id: 'brain', name: 'Brain' },
    ];
    const result = selectRandomPart(parts, null);
    expect(parts.some(p => p.id === result.id)).toBe(true);
  });
});

// ===========================================
// AnatomyQuiz - Answer Validation Tests
// ===========================================
describe('AnatomyQuiz - Answer Validation', () => {
  function validateAnswer(clickedPartId, targetPartId) {
    return clickedPartId === targetPartId;
  }

  it('should validate correct answer', () => {
    expect(validateAnswer('heart', 'heart')).toBe(true);
  });

  it('should reject wrong answer', () => {
    expect(validateAnswer('lung', 'heart')).toBe(false);
  });

  it('should handle null clicked part', () => {
    expect(validateAnswer(null, 'heart')).toBe(false);
  });
});

// ===========================================
// AnatomyQuiz - Hint Reveal Tests
// ===========================================
describe('AnatomyQuiz - Hint Reveal', () => {
  function shouldShowHint(wrongAttempts, threshold = 2) {
    return wrongAttempts >= threshold;
  }

  it('should not show hint initially', () => {
    expect(shouldShowHint(0)).toBe(false);
    expect(shouldShowHint(1)).toBe(false);
  });

  it('should show hint after threshold', () => {
    expect(shouldShowHint(2)).toBe(true);
    expect(shouldShowHint(3)).toBe(true);
  });
});

// ===========================================
// AnatomyQuiz - System Stats Tests
// ===========================================
describe('AnatomyQuiz - System Stats', () => {
  function updateSystemStats(bySystem, systemKey) {
    const newBySystem = { ...bySystem };
    newBySystem[systemKey] = (newBySystem[systemKey] || 0) + 1;
    return newBySystem;
  }

  it('should increment existing system count', () => {
    const bySystem = { skeletal: 3, muscular: 2 };
    const result = updateSystemStats(bySystem, 'skeletal');
    expect(result.skeletal).toBe(4);
  });

  it('should initialize new system count', () => {
    const bySystem = { skeletal: 3 };
    const result = updateSystemStats(bySystem, 'nervous');
    expect(result.nervous).toBe(1);
  });

  it('should preserve other systems', () => {
    const bySystem = { skeletal: 3, muscular: 2 };
    const result = updateSystemStats(bySystem, 'skeletal');
    expect(result.muscular).toBe(2);
  });
});
