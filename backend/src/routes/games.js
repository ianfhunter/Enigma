import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Get progress for a specific game
router.get('/:slug/progress', (req, res) => {
  const { slug } = req.params;

  const progress = db.prepare(`
    SELECT played, won, best_score, best_time, current_streak, max_streak, extra_data, updated_at
    FROM game_progress
    WHERE user_id = ? AND game_slug = ?
  `).get(req.session.userId, slug);

  if (!progress) {
    return res.json({
      played: 0,
      won: 0,
      bestScore: null,
      bestTime: null,
      currentStreak: 0,
      maxStreak: 0,
      extraData: {}
    });
  }

  res.json({
    played: progress.played,
    won: progress.won,
    bestScore: progress.best_score,
    bestTime: progress.best_time,
    currentStreak: progress.current_streak,
    maxStreak: progress.max_streak,
    extraData: JSON.parse(progress.extra_data || '{}'),
    updatedAt: progress.updated_at
  });
});

// Update progress for a specific game
router.put('/:slug/progress', (req, res) => {
  const { slug } = req.params;
  const { played, won, bestScore, bestTime, currentStreak, maxStreak, extraData } = req.body;

  // Check if record exists
  const existing = db.prepare(`
    SELECT id, best_score, best_time, max_streak
    FROM game_progress
    WHERE user_id = ? AND game_slug = ?
  `).get(req.session.userId, slug);

  if (existing) {
    // Update existing record
    // For best_score, best_time, max_streak - only update if new value is better
    const updates = [];
    const values = [];

    if (played !== undefined) {
      updates.push('played = ?');
      values.push(played);
    }

    if (won !== undefined) {
      updates.push('won = ?');
      values.push(won);
    }

    if (bestScore !== undefined) {
      // Higher score is better (unless null)
      if (existing.best_score === null || bestScore > existing.best_score) {
        updates.push('best_score = ?');
        values.push(bestScore);
      }
    }

    if (bestTime !== undefined) {
      // Lower time is better (unless null)
      if (existing.best_time === null || bestTime < existing.best_time) {
        updates.push('best_time = ?');
        values.push(bestTime);
      }
    }

    if (currentStreak !== undefined) {
      updates.push('current_streak = ?');
      values.push(currentStreak);
    }

    if (maxStreak !== undefined) {
      // Higher streak is better
      if (maxStreak > existing.max_streak) {
        updates.push('max_streak = ?');
        values.push(maxStreak);
      }
    }

    if (extraData !== undefined) {
      updates.push('extra_data = ?');
      values.push(JSON.stringify(extraData));
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(existing.id);

      db.prepare(`
        UPDATE game_progress
        SET ${updates.join(', ')}
        WHERE id = ?
      `).run(...values);
    }
  } else {
    // Insert new record
    db.prepare(`
      INSERT INTO game_progress (user_id, game_slug, played, won, best_score, best_time, current_streak, max_streak, extra_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.session.userId,
      slug,
      played || 0,
      won || 0,
      bestScore ?? null,
      bestTime ?? null,
      currentStreak || 0,
      maxStreak || 0,
      JSON.stringify(extraData || {})
    );
  }

  // Return updated progress
  const updated = db.prepare(`
    SELECT played, won, best_score, best_time, current_streak, max_streak, extra_data, updated_at
    FROM game_progress
    WHERE user_id = ? AND game_slug = ?
  `).get(req.session.userId, slug);

  res.json({
    played: updated.played,
    won: updated.won,
    bestScore: updated.best_score,
    bestTime: updated.best_time,
    currentStreak: updated.current_streak,
    maxStreak: updated.max_streak,
    extraData: JSON.parse(updated.extra_data || '{}'),
    updatedAt: updated.updated_at
  });
});

// Delete all progress for current user
router.delete('/progress', (req, res) => {
  const result = db.prepare('DELETE FROM game_progress WHERE user_id = ?')
    .run(req.session.userId);

  res.json({
    message: 'All game progress deleted',
    deletedCount: result.changes
  });
});

// Get leaderboard for a specific game
router.get('/:slug/leaderboard', (req, res) => {
  const { slug } = req.params;
  const { sortBy = 'won', limit = 10 } = req.query;

  // Validate sortBy
  const validSorts = ['won', 'played', 'best_score', 'best_time', 'max_streak'];
  if (!validSorts.includes(sortBy)) {
    return res.status(400).json({ error: 'Invalid sort field' });
  }

  // Determine sort order (best_time is ascending, others are descending)
  const order = sortBy === 'best_time' ? 'ASC' : 'DESC';

  // For best_time and best_score, exclude nulls
  const nullCondition = (sortBy === 'best_time' || sortBy === 'best_score')
    ? `AND gp.${sortBy} IS NOT NULL`
    : '';

  const leaderboard = db.prepare(`
    SELECT
      u.id,
      u.username,
      u.display_name,
      gp.played,
      gp.won,
      gp.best_score,
      gp.best_time,
      gp.max_streak
    FROM game_progress gp
    JOIN users u ON u.id = gp.user_id
    WHERE gp.game_slug = ? ${nullCondition}
    ORDER BY gp.${sortBy} ${order}
    LIMIT ?
  `).all(slug, Math.min(parseInt(limit) || 10, 100));

  res.json(leaderboard.map(row => ({
    userId: row.id,
    username: row.username,
    displayName: row.display_name,
    played: row.played,
    won: row.won,
    bestScore: row.best_score,
    bestTime: row.best_time,
    maxStreak: row.max_streak
  })));
});

export default router;
