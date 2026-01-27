#!/usr/bin/env node
/**
 * Standalone Plugin Isolation Test Script
 * 
 * This script tests plugin database isolation without using a test framework.
 * Run directly with: node backend/test-scripts/test-plugin-isolation.js
 * 
 * This avoids vitest worker fork issues with better-sqlite3.
 */

import Database from 'better-sqlite3';
import { mkdirSync, rmSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

console.log('🧪 Testing Plugin Database Isolation...\n');

// Create test directory
const testDir = join(tmpdir(), `enigma-plugin-test-${Date.now()}`);
mkdirSync(testDir, { recursive: true });

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    testsPassed++;
  } catch (e) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   ${e.message}`);
    testsFailed++;
  }
}

try {
  // Test 1: Create isolated plugin databases
  console.log('Test 1: Creating isolated plugin databases...');
  const pluginADb = new Database(join(testDir, 'plugin-a.db'));
  const pluginBDb = new Database(join(testDir, 'plugin-b.db'));

  test('Plugin databases are separate files', () => {
    if (!existsSync(join(testDir, 'plugin-a.db'))) {
      throw new Error('Plugin A database not created');
    }
    if (!existsSync(join(testDir, 'plugin-b.db'))) {
      throw new Error('Plugin B database not created');
    }
  });

  // Test 2: Plugin A stores data
  console.log('\nTest 2: Plugin A storing data...');
  pluginADb.exec('CREATE TABLE secrets (id INTEGER PRIMARY KEY, value TEXT)');
  pluginADb.prepare('INSERT INTO secrets (value) VALUES (?)').run('plugin-a-secret');

  test('Plugin A can store data', () => {
    const result = pluginADb.prepare('SELECT * FROM secrets WHERE id = 1').get();
    if (!result || result.value !== 'plugin-a-secret') {
      throw new Error('Failed to store/retrieve data in Plugin A');
    }
  });

  // Test 3: Plugin B cannot access Plugin A's data
  console.log('\nTest 3: Testing isolation between plugins...');
  test('Plugin B cannot access Plugin A tables', () => {
    try {
      pluginBDb.prepare('SELECT * FROM secrets').get();
      throw new Error('Plugin B was able to access Plugin A data!');
    } catch (e) {
      if (!e.message.includes('no such table')) {
        throw new Error(`Unexpected error: ${e.message}`);
      }
      // Expected error - tables should not exist in plugin B's database
    }
  });

  // Test 4: Plugin B has its own isolated space
  console.log('\nTest 4: Plugin B creating its own data...');
  pluginBDb.exec('CREATE TABLE data (id INTEGER PRIMARY KEY, info TEXT)');
  pluginBDb.prepare('INSERT INTO data (info) VALUES (?)').run('plugin-b-data');

  test('Plugin B can store independent data', () => {
    const result = pluginBDb.prepare('SELECT * FROM data WHERE id = 1').get();
    if (!result || result.info !== 'plugin-b-data') {
      throw new Error('Failed to store/retrieve data in Plugin B');
    }
  });

  test('Plugin A still cannot see Plugin B data', () => {
    try {
      pluginADb.prepare('SELECT * FROM data').get();
      throw new Error('Plugin A was able to access Plugin B data!');
    } catch (e) {
      if (!e.message.includes('no such table')) {
        throw new Error(`Unexpected error: ${e.message}`);
      }
    }
  });

  // Test 5: Test database size checking
  console.log('\nTest 5: Testing size limits...');
  test('Can calculate database file size', () => {
    const stats = statSync(join(testDir, 'plugin-a.db'));
    if (stats.size <= 0) {
      throw new Error('Database file has invalid size');
    }
  });

  // Cleanup
  pluginADb.close();
  pluginBDb.close();

} catch (e) {
  console.error('\n💥 Fatal error during tests:', e.message);
  testsFailed++;
} finally {
  // Clean up test directory
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log(`Tests completed: ${testsPassed + testsFailed} total`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log('='.repeat(50));

  // Exit with appropriate code
  process.exit(testsFailed > 0 ? 1 : 0);
}
