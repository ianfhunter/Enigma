import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Get all game stats for current user
router.get('/stats', (req, res) => {
  const progress = db.prepare(`
    SELECT game_slug, played, won, best_score, best_time, current_streak, max_streak, extra_data, updated_at
    FROM game_progress
    WHERE user_id = ?
    ORDER BY updated_at DESC
  `).all(req.session.userId);

  // Calculate totals
  const totals = progress.reduce((acc, p) => ({
    totalPlayed: acc.totalPlayed + p.played,
    totalWon: acc.totalWon + p.won,
    gamesWithProgress: acc.gamesWithProgress + 1
  }), { totalPlayed: 0, totalWon: 0, gamesWithProgress: 0 });

  res.json({
    ...totals,
    games: progress.map(p => ({
      gameSlug: p.game_slug,
      played: p.played,
      won: p.won,
      bestScore: p.best_score,
      bestTime: p.best_time,
      currentStreak: p.current_streak,
      maxStreak: p.max_streak,
      winRate: p.played > 0 ? Math.round((p.won / p.played) * 100) : 0,
      updatedAt: p.updated_at
    }))
  });
});

// Export all progress data
router.get('/export', (req, res) => {
  const progress = db.prepare(`
    SELECT game_slug, played, won, best_score, best_time, current_streak, max_streak, extra_data, updated_at
    FROM game_progress
    WHERE user_id = ?
  `).all(req.session.userId);

  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    games: progress.map(p => ({
      gameSlug: p.game_slug,
      played: p.played,
      won: p.won,
      bestScore: p.best_score,
      bestTime: p.best_time,
      currentStreak: p.current_streak,
      maxStreak: p.max_streak,
      extraData: JSON.parse(p.extra_data || '{}'),
      updatedAt: p.updated_at
    }))
  };

  res.json(exportData);
});

// Import progress data
router.post('/import', (req, res) => {
  const { games, merge = true } = req.body;

  if (!Array.isArray(games)) {
    return res.status(400).json({ error: 'Invalid import data: games must be an array' });
  }

  let imported = 0;
  let skipped = 0;

  const insertStmt = db.prepare(`
    INSERT INTO game_progress (user_id, game_slug, played, won, best_score, best_time, current_streak, max_streak, extra_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, game_slug) DO UPDATE SET
      played = CASE WHEN ? THEN played + excluded.played ELSE excluded.played END,
      won = CASE WHEN ? THEN won + excluded.won ELSE excluded.won END,
      best_score = CASE WHEN excluded.best_score IS NOT NULL AND (best_score IS NULL OR excluded.best_score > best_score) THEN excluded.best_score ELSE best_score END,
      best_time = CASE WHEN excluded.best_time IS NOT NULL AND (best_time IS NULL OR excluded.best_time < best_time) THEN excluded.best_time ELSE best_time END,
      current_streak = excluded.current_streak,
      max_streak = CASE WHEN excluded.max_streak > max_streak THEN excluded.max_streak ELSE max_streak END,
      extra_data = excluded.extra_data,
      updated_at = datetime('now')
  `);

  const transaction = db.transaction(() => {
    for (const game of games) {
      if (!game.gameSlug) {
        skipped++;
        continue;
      }

      try {
        insertStmt.run(
          req.session.userId,
          game.gameSlug,
          game.played || 0,
          game.won || 0,
          game.bestScore ?? null,
          game.bestTime ?? null,
          game.currentStreak || 0,
          game.maxStreak || 0,
          JSON.stringify(game.extraData || {}),
          merge ? 1 : 0,
          merge ? 1 : 0
        );
        imported++;
      } catch (err) {
        console.error('Import error for game:', game.gameSlug, err);
        skipped++;
      }
    }
  });

  transaction();

  res.json({ message: `Imported ${imported} game(s), skipped ${skipped}` });
});

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
