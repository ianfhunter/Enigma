/**
 * Example Community Pack - Backend Plugin
 *
 * This demonstrates how community packs can add backend functionality.
 * The plugin can:
 * - Register API routes
 * - Access the database
 * - Use authentication
 * - Run database migrations
 */

export default {
  name: 'example-community',
  version: '1.0.0',

  /**
   * Database migrations for this plugin
   * Run automatically when the plugin loads
   */
  migrations: [
    {
      version: 1,
      up: `
        CREATE TABLE IF NOT EXISTS daily_number_scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          date TEXT NOT NULL,
          attempts INTEGER NOT NULL,
          won INTEGER NOT NULL DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_daily_number_date
        ON daily_number_scores(date);

        CREATE INDEX IF NOT EXISTS idx_daily_number_user
        ON daily_number_scores(user_id, date);
      `
    }
  ],

  /**
   * Register routes for this plugin
   * Routes are mounted at /api/packs/example-community/
   */
  register(router, context) {

    /**
     * Get today's challenge
     * Returns a hint about the secret number (but not the number itself!)
     */
    router.get('/daily-challenge', (req, res) => {
      const today = new Date().toISOString().split('T')[0];
      const secretNumber = generateDailyNumber(today);

      res.json({
        date: today,
        hint: `The number is between 1 and 100`,
        range: { min: 1, max: 100 }
      });
    });

    /**
     * Make a guess
     */
    router.post('/guess', (req, res) => {
      const { guess, date } = req.body;

      if (!guess || typeof guess !== 'number') {
        return res.status(400).json({ error: 'Invalid guess' });
      }

      const today = new Date().toISOString().split('T')[0];
      const targetDate = date || today;
      const secretNumber = generateDailyNumber(targetDate);

      let result;
      if (guess === secretNumber) {
        result = 'correct';
      } else if (guess < secretNumber) {
        result = 'higher';
      } else {
        result = 'lower';
      }

      res.json({
        guess,
        result,
        date: targetDate
      });
    });

    /**
     * Submit final score (requires auth)
     */
    router.post('/submit-score', context.requireAuth, (req, res) => {
      const { attempts, won, date } = req.body;
      const user = context.getCurrentUser(req);
      const today = date || new Date().toISOString().split('T')[0];

      // Check if user already submitted for today
      const existing = context.db.get(
        'SELECT id FROM daily_number_scores WHERE user_id = ? AND date = ?',
        [user.id, today]
      );

      if (existing) {
        return res.status(400).json({ error: 'Already submitted for today' });
      }

      // Save score
      context.db.run(
        'INSERT INTO daily_number_scores (user_id, date, attempts, won) VALUES (?, ?, ?, ?)',
        [user.id, today, attempts, won ? 1 : 0]
      );

      res.json({ success: true });
    });

    /**
     * Get leaderboard for today
     */
    router.get('/leaderboard', (req, res) => {
      const today = new Date().toISOString().split('T')[0];

      const scores = context.db.all(`
        SELECT
          dns.user_id,
          dns.attempts,
          dns.won,
          u.username
        FROM daily_number_scores dns
        LEFT JOIN users u ON dns.user_id = u.id
        WHERE dns.date = ? AND dns.won = 1
        ORDER BY dns.attempts ASC
        LIMIT 10
      `, [today]);

      res.json({
        date: today,
        leaderboard: scores.map((s, i) => ({
          rank: i + 1,
          username: s.username || 'Anonymous',
          attempts: s.attempts
        }))
      });
    });

    /**
     * Get user's stats
     */
    router.get('/my-stats', context.requireAuth, (req, res) => {
      const user = context.getCurrentUser(req);

      const stats = context.db.get(`
        SELECT
          COUNT(*) as total_games,
          SUM(won) as wins,
          AVG(CASE WHEN won = 1 THEN attempts END) as avg_attempts
        FROM daily_number_scores
        WHERE user_id = ?
      `, [user.id]);

      res.json({
        totalGames: stats?.total_games || 0,
        wins: stats?.wins || 0,
        avgAttempts: stats?.avg_attempts ? Math.round(stats.avg_attempts * 10) / 10 : null
      });
    });
  }
};

/**
 * Generate a deterministic "random" number based on date
 * This ensures everyone gets the same number on the same day
 */
function generateDailyNumber(dateString) {
  // Simple hash of the date string
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert to number between 1 and 100
  return Math.abs(hash % 100) + 1;
}
