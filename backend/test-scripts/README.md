# Backend Plugin Test Scripts

These standalone scripts test backend plugin functionality without using vitest, avoiding worker fork issues with better-sqlite3.

## Running Tests

### Plugin Isolation Test
Tests that plugins cannot access each other's database tables:

```bash
node backend/test-scripts/test-plugin-isolation.js
```

## Why Standalone Scripts?

The backend plugin system uses better-sqlite3, a native Node.js module that causes segmentation faults when loaded in vitest's worker pool. These standalone scripts:

- ✅ Run in a normal Node.js process (no worker pools)
- ✅ Test real SQLite behavior (not mocked)
- ✅ Fast and simple to run
- ✅ No test framework dependencies

## Integration Tests

For testing through the HTTP API, see: `tests/integration/backend-plugins.test.js`

These require the backend server to be running:
```bash
cd backend && npm start
```

Then in another terminal:
```bash
npm test -- tests/integration/backend-plugins.test.js
```

## Original Unit Tests

The comprehensive unit tests are still available in `backend/src/plugins/*.test.js` but cannot run with vitest due to the native module issue. They can be:

1. Run manually by converting to standalone scripts (like above)
2. Run with a different test framework (Jest with --runInBand)
3. Run with Node's native test runner (requires rewriting)
4. Used as reference documentation for expected behavior
