/**
 * Vite Plugin: Community Packs Watcher
 *
 * Watches the .plugins/ directory for changes and regenerates
 * the community packs imports file automatically.
 *
 * In development mode, this provides hot-reload for community packs:
 * - Install a pack → file appears in .plugins/ → imports regenerated → HMR updates UI
 * - Uninstall a pack → file removed → imports regenerated → HMR updates UI
 */

import { existsSync, watch } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = join(__dirname, '..');
const PLUGINS_DIR = join(ROOT_DIR, '.plugins');
const SCRIPT_PATH = join(ROOT_DIR, 'scripts', 'generate-community-packs.js');

/**
 * Debounce function to prevent rapid regeneration
 */
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Run the generation script
 */
async function regenerate() {
  try {
    console.log('\n🔄 Community pack change detected, regenerating imports...');
    await execAsync(`node "${SCRIPT_PATH}"`);
    console.log('✅ Community packs imports regenerated\n');
    return true;
  } catch (error) {
    console.error('❌ Failed to regenerate community packs:', error.message);
    return false;
  }
}

/**
 * Vite plugin for community packs hot reload
 */
export default function communityPacksPlugin() {
  let watcher = null;

  return {
    name: 'community-packs-watcher',

    configureServer(server) {
      // Only watch in development mode
      if (!existsSync(PLUGINS_DIR)) {
        console.log('📦 No .plugins/ directory found, skipping watch');
        return;
      }

      console.log('👀 Watching .plugins/ for community pack changes...');

      // Debounced regenerate function
      const debouncedRegenerate = debounce(async () => {
        const success = await regenerate();
        if (success) {
          // Trigger HMR by invalidating the generated module
          const module = server.moduleGraph.getModuleByUrl(
            '/src/packs/installedCommunityPacks.js'
          );
          if (module) {
            server.moduleGraph.invalidateModule(module);
            server.ws.send({
              type: 'full-reload',
              path: '*',
            });
          }
        }
      }, 500);

      // Watch the plugins directory
      try {
        watcher = watch(PLUGINS_DIR, { recursive: true }, (eventType, filename) => {
          // Only react to manifest changes or directory changes
          if (
            filename &&
            (filename.endsWith('manifest.js') ||
              filename.endsWith('manifest.json') ||
              !filename.includes('.'))
          ) {
            console.log(`📦 Detected ${eventType} in .plugins/: ${filename}`);
            debouncedRegenerate();
          }
        });

        watcher.on('error', (error) => {
          console.error('⚠️ Watch error:', error.message);
        });
      } catch (error) {
        console.error('⚠️ Could not watch .plugins/:', error.message);
      }
    },

    closeBundle() {
      // Clean up watcher on build completion
      if (watcher) {
        watcher.close();
        watcher = null;
      }
    },
  };
}
