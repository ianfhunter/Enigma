/**
 * Download and build a compact Knights & Knaves puzzle bank from:
 * https://huggingface.co/datasets/K-and-K/knights-and-knaves
 *
 * We intentionally use the `test/people{2..8}_num100.jsonl` splits to keep
 * the bundle size reasonable while still providing plenty of puzzles.
 *
 * Output: `src/data/knights_and_knaves_puzzles.json`
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATASET_BASE =
  'https://huggingface.co/datasets/K-and-K/knights-and-knaves/resolve/main';

const PEOPLE_COUNTS = [2, 3, 4, 5, 6, 7, 8];

function assertPuzzleRecord(obj, ctx) {
  const required = ['quiz', 'names', 'solution'];
  for (const k of required) {
    if (!(k in obj)) {
      throw new Error(`Missing key '${k}' in ${ctx}`);
    }
  }
  if (!Array.isArray(obj.names) || obj.names.length < 2) {
    throw new Error(`Invalid 'names' in ${ctx}`);
  }
  if (!Array.isArray(obj.solution) || obj.solution.length !== obj.names.length) {
    throw new Error(`Invalid 'solution' in ${ctx}`);
  }
  if (typeof obj.quiz !== 'string' || obj.quiz.length < 20) {
    throw new Error(`Invalid 'quiz' in ${ctx}`);
  }
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

function normalizeQuiz(quiz) {
  // Keep original text, but ensure consistent newlines.
  return quiz.replace(/\r\n/g, '\n').trim();
}

async function main() {
  const out = [];

  for (const peopleCount of PEOPLE_COUNTS) {
    const rel = `test/people${peopleCount}_num100.jsonl`;
    const url = `${DATASET_BASE}/${rel}`;
    const raw = await fetchText(url);
    const lines = raw.split(/\r?\n/).filter(Boolean);

    for (let i = 0; i < lines.length; i++) {
      const obj = JSON.parse(lines[i]);
      const ctx = `${rel} line ${i + 1}`;
      assertPuzzleRecord(obj, ctx);

      out.push({
        id: `kk-${peopleCount}-${obj.index ?? i}`,
        source: 'K-and-K/knights-and-knaves',
        split: 'test',
        peopleCount,
        names: obj.names,
        quiz: normalizeQuiz(obj.quiz),
        solution: obj.solution,
        solutionText: typeof obj.solution_text === 'string' ? obj.solution_text.trim() : null,
        solutionTextFormat:
          typeof obj.solution_text_format === 'string' ? obj.solution_text_format.trim() : null,
      });
    }
  }

  // Sort deterministically: peopleCount asc, then id asc.
  out.sort((a, b) => (a.peopleCount - b.peopleCount) || a.id.localeCompare(b.id));

  const outputPath = path.resolve(__dirname, '..', 'src', 'data', 'knights_and_knaves_puzzles.json');
  await fs.writeFile(outputPath, `${JSON.stringify(out, null, 2)}\n`, 'utf-8');

  console.log(`Wrote ${out.length} puzzles -> ${outputPath}`);
}

await main();

