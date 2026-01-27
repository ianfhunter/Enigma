# Testing Strategy

## Overview

Enigma uses a hybrid testing approach to handle the complexities of testing both frontend React components and backend plugin system functionality.

## Test Structure

### Frontend Tests (3,425+ tests)
- **Location**: `src/**/*.test.js`, `src/**/*.test.jsx`
- **Framework**: Vitest
- **Run with**: `npm test` or `npm run test:run`
- **CI**: Runs on every push/PR via `.github/workflows/vitest.yml`

All frontend tests run smoothly with vitest's default configuration.

### Backend Plugin Tests

The backend plugin system uses `better-sqlite3`, a native Node.js module that causes segmentation faults when loaded in vitest's worker pool. To work around this, we use two approaches:

#### 1. Standalone Tests (6 tests)
- **Location**: `backend/test-scripts/*.js`
- **Framework**: Plain Node.js (no test framework)
- **Run with**: `npm run test:backend-standalone`
- **CI**: Runs in both workflows
- **What it tests**:
  - Plugin database isolation
  - Data separation between plugins
  - File system operations
  - Database size checking

**Example output:**
```
🧪 Testing Plugin Database Isolation...
✅ PASS: Plugin databases are separate files
✅ PASS: Plugin A can store data
✅ PASS: Plugin B cannot access Plugin A tables
✅ PASS: Plugin B can store independent data
✅ PASS: Plugin A still cannot see Plugin B data
✅ PASS: Can calculate database file size
```

#### 2. Integration Tests (Placeholders)
- **Location**: `tests/integration/backend-plugins.test.js`
- **Framework**: Vitest
- **Run with**: `npm run test:backend-integration`
- **Status**: Placeholder tests, ready for HTTP API testing
- **Requires**: Backend server running (`cd backend && npm start`)

These tests will verify plugin functionality through HTTP endpoints once the plugin API is exposed.

#### 3. Original Unit Tests (72 tests - Reference Only)
- **Location**: `backend/src/plugins/*.test.js`
- **Status**: Cannot run with vitest (worker fork crashes)
- **Purpose**: Documentation and reference for expected behavior
- **Options**:
  - Convert to standalone scripts (like approach #1)
  - Convert to integration tests (like approach #2)
  - Run with Node's native test runner (requires rewriting)
  - Run with Jest `--runInBand` (requires different test framework)

## Running Tests Locally

### Run all frontend tests:
```bash
npm test
# or
npm run test:run
```

### Run backend plugin tests:
```bash
npm run test:backend-standalone
```

### Run both:
```bash
npm run test:run && npm run test:backend-standalone
```

### Run specific test files:
```bash
npm test -- src/pages/Sudoku/Sudoku.test.js
```

### Run tests in watch mode:
```bash
npm test
```

## CI/CD

### Main Test Workflow (`.github/workflows/vitest.yml`)
Runs on every push and PR:
1. Frontend tests (`npm run test:run`)
2. Backend plugin standalone tests (`npm run test:backend-standalone`)

### Integration Tests Workflow (`.github/workflows/integration-tests.yml`)
Runs when backend or integration test files change:
1. Backend plugin standalone tests
2. Integration tests (currently placeholders)

## Why This Approach?

**Problem**: `better-sqlite3` is a native Node.js addon that causes segmentation faults when loaded in vitest's worker threads/forks.

**Solutions tried**:
- ❌ Different vitest pool configurations (threads, forks, vmThreads)
- ❌ Lazy loading in `beforeAll` hooks
- ❌ Version consolidation (both root and backend use same version)
- ❌ Single fork mode

**Root cause**: Native modules and worker pools fundamentally don't mix well.

**Final solution**: 
- ✅ Standalone scripts run in main Node.js process (no workers)
- ✅ Tests real SQLite behavior (not mocked)
- ✅ Fast and reliable
- ✅ No test framework dependency issues

## Adding New Tests

### Frontend tests:
Create `*.test.js` or `*.test.jsx` files next to your components. They'll automatically be picked up by vitest.

### Backend plugin tests:
1. For **quick verification**: Add to or create new scripts in `backend/test-scripts/`
2. For **API testing**: Add to `tests/integration/backend-plugins.test.js`
3. For **reference**: Keep comprehensive unit tests in `backend/src/plugins/*.test.js` as documentation

## Test Coverage

Run coverage reports:
```bash
npm run test:coverage
```

View in browser:
```bash
npm run test:ui:coverage
```

## Troubleshooting

### "Worker fork errors" in test output
- These should no longer appear after excluding `backend/src/plugins/*.test.js`
- If they return, check `vite.config.js` exclude patterns

### Standalone tests fail
- Ensure you're in the root directory
- Check that `better-sqlite3` is installed: `npm list better-sqlite3`
- Verify Node.js version (requires v18+): `node --version`

### Integration tests always skip
- Backend server must be running for integration tests
- Start with: `cd backend && npm start`
- Check backend is available at `http://localhost:3000/api/health`
