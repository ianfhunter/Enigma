#!/usr/bin/env node
/**
 * Generate README files for all games with actual rules
 * Run with: node scripts/generate-game-readmes.js
 */

import { existsSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pagesDir = join(__dirname, '../src/pages');

// Game data with full rules
const games = [
  // Word Formation
  {
    folder: 'WordGuess',
    title: 'WordGuess',
    icon: '🟩',
    description: 'Guess the 5-letter word in 6 tries. Colors show how close you are!',
    category: 'Word Formation',
    rules: `1. You have 6 attempts to guess a secret 5-letter word
2. Type a valid 5-letter word and press Enter
3. After each guess, tiles change color:
   - 🟩 **Green**: Letter is correct and in the right position
   - 🟨 **Yellow**: Letter is in the word but wrong position
   - ⬛ **Gray**: Letter is not in the word
4. Use the feedback to narrow down possibilities
5. Win by guessing the word within 6 tries`,
    tips: `- Start with words containing common letters (E, A, R, T, O, I, N, S)
- Avoid repeating letters you know are wrong
- Pay attention to letter positions, not just which letters are present`
  },
  {
    folder: 'WordWheel',
    title: 'Word Wheel',
    icon: '🎯',
    description: 'Find words using letters from the wheel. Every word must include the center letter!',
    category: 'Word Formation',
    rules: `1. You see 9 letters arranged in a wheel with one in the center
2. Form words using the available letters
3. **Every word must include the center letter**
4. Each letter can only be used once per word
5. Words must be at least 3 letters long
6. Find as many words as possible, including the 9-letter word`,
    tips: `- Always start by finding short words with the center letter
- Look for common prefixes and suffixes
- The 9-letter word uses all letters exactly once`
  },
  {
    folder: 'WordLadder',
    title: 'Word Ladder',
    icon: '🪜',
    description: 'Transform one word into another by changing one letter at a time.',
    category: 'Word Formation',
    rules: `1. You're given a starting word and a target word
2. Change exactly one letter at a time to form a new valid word
3. Each step must be a real English word
4. Find the shortest path from start to target
5. You cannot add or remove letters, only substitute`,
    tips: `- Work from both ends - try transforming the target backwards too
- Focus on vowels first as they're often easier to swap
- Common patterns: changing word endings (-at, -an, -it)`
  },
  {
    folder: 'Conundrum',
    title: 'Conundrum',
    icon: '🔮',
    description: 'Unscramble the nine letters to find the hidden word.',
    category: 'Word Formation',
    rules: `1. Nine scrambled letters are displayed
2. Rearrange all nine letters to form a single valid word
3. You must use every letter exactly once
4. There is always exactly one solution
5. Race against the clock to solve it`,
    tips: `- Look for common letter patterns (ING, TION, ED)
- Identify rare letters (Q, X, Z) as they limit possibilities
- Try mentally grouping consonants and vowels`
  },
  {
    folder: 'Hangman',
    title: 'Hangman',
    icon: '☠️',
    description: 'Guess the hidden word one letter at a time before running out of chances.',
    category: 'Word Formation',
    rules: `1. A secret word is represented by blank spaces
2. Guess one letter at a time
3. Correct guesses reveal all instances of that letter
4. Wrong guesses cost you a life (limited lives)
5. Win by revealing the complete word before running out of lives`,
    tips: `- Start with common vowels: E, A, I, O, U
- Then try frequent consonants: R, S, T, L, N
- Use word length and revealed patterns to make educated guesses`
  },
  {
    folder: 'Anagrams',
    title: 'Anagrams',
    icon: '🔀',
    description: 'Rearrange all the letters to form as many words as possible.',
    category: 'Word Formation',
    rules: `1. You're given a set of letters
2. Form as many valid words as possible using these letters
3. Each letter can only be used once per word
4. Words must be at least 3 letters long
5. Score points for each valid word found`,
    tips: `- Start with shorter words and work up
- Look for common word endings (-ED, -ING, -ER)
- Check for plural forms of words you've found`
  },
  {
    folder: 'CountdownLetters',
    title: 'Countdown Letters',
    icon: '⏱️',
    description: 'Pick vowels and consonants, then find the longest word in 30 seconds!',
    category: 'Word Formation',
    rules: `1. Select 9 letters by choosing vowels or consonants
2. A good mix is typically 3-4 vowels and 5-6 consonants
3. Once selected, you have 30 seconds to find the longest word
4. Use any combination of the available letters
5. Longer words score more points`,
    tips: `- Aim for a balanced selection of letters
- Look for 9-letter words first, then work down
- Common long word patterns: -TION, -NESS, -ABLE`
  },
  {
    folder: 'WordShuffle',
    title: 'WordShuffle',
    icon: '🎲',
    description: 'Connect adjacent letters to form words before time runs out!',
    category: 'Word Formation',
    rules: `1. Letters are arranged in a grid
2. Form words by connecting adjacent letters (including diagonals)
3. Letters must be connected in sequence
4. Each letter can only be used once per word
5. Find as many words as possible before time expires`,
    tips: `- Scan for common prefixes at the edges
- Longer words score more points
- Look for high-value letters and build words around them`
  },
  {
    folder: 'LongestWord',
    title: 'Longest Word',
    icon: '📏',
    description: 'Find the longest word containing the seed letters in order.',
    category: 'Word Formation',
    rules: `1. You're given 2-3 seed letters that must appear in order
2. Find the longest word containing these letters in sequence
3. The seed letters don't need to be adjacent
4. You can add any letters before, between, or after
5. Longer words score higher`,
    tips: `- Think of common words containing the letter sequence
- Try adding prefixes (UN-, RE-, PRE-) and suffixes (-ING, -TION)
- Consider less common but longer words`
  },
  {
    folder: 'Pyramid',
    title: 'Pyramid',
    icon: '🐪',
    description: 'Build words in a pyramid shape, adding one letter per row from clues.',
    category: 'Word Formation',
    rules: `1. Build a word pyramid from top to bottom
2. Each row adds one letter to the previous word
3. Letters can be rearranged when adding the new letter
4. Clues hint at each word
5. Complete the pyramid from 1 letter to the longest word`,
    tips: `- Start from the top - single letters are easy
- Each new word is an anagram of the previous plus one letter
- Use the clues to guide your answers`
  },
  {
    folder: 'Shiritori',
    title: 'Shiritori',
    icon: '🔗',
    description: 'Word chain game! Each word starts with the last letter of the previous.',
    category: 'Word Formation',
    rules: `1. Enter a word that starts with the last letter of the previous word
2. Words cannot be repeated
3. Words must be valid English (or Japanese in JP mode)
4. Keep the chain going as long as possible
5. The game ends if you can't think of a valid word`,
    tips: `- Avoid words ending in difficult letters (X, Z, Q)
- Keep a mental list of backup words for common endings
- Think ahead - don't trap yourself with rare letter endings`
  },
  {
    folder: 'WordTiles',
    title: 'WordTiles',
    icon: '🎯',
    description: 'Score big with random tiles! Place a double word bonus strategically to maximize points.',
    category: 'Word Formation',
    rules: `1. You receive random letter tiles with point values
2. Form the highest-scoring word possible
3. Place the double word bonus tile strategically
4. Submit your word to score points
5. Rare letters (Q, Z, X) are worth more points`,
    tips: `- Prioritize using high-value letters
- Place double word bonus on your highest-scoring word
- Sometimes shorter words with rare letters beat longer common words`
  },

  // Word Grids
  {
    folder: 'Crossword',
    title: 'Crossword',
    icon: '📰',
    description: 'Solve the classic crossword puzzle! Fill in the grid using across and down clues.',
    category: 'Word Grids',
    rules: `1. Fill the white squares with letters to form words
2. Words read left-to-right (Across) and top-to-bottom (Down)
3. Each clue corresponds to a numbered position
4. Letters are shared where words intersect
5. Complete all words to solve the puzzle`,
    tips: `- Start with clues you're confident about
- Use crossing letters to help solve harder clues
- Fill-in-the-blank clues are often easiest`
  },
  {
    folder: 'Squarish',
    title: 'Squar-ish',
    icon: '🧇',
    description: 'Swap letters on the grid to form valid words in all directions.',
    category: 'Word Grids',
    rules: `1. Letters are arranged in a grid
2. Swap adjacent letters to form valid words
3. Words must read correctly in rows and columns
4. All rows and columns must be valid words
5. Minimize swaps to achieve the best score`,
    tips: `- Focus on one direction first (rows or columns)
- Look for letters that could work in multiple words
- Common short words help fill gaps`
  },
  {
    folder: 'LetterWeb',
    title: 'Letter Web',
    icon: '📦',
    description: 'Use letters on box edges to spell connected words. Use all letters!',
    category: 'Word Grids',
    rules: `1. Letters appear on the edges of connected boxes
2. Form words by tracing paths along the edges
3. Each letter must be used exactly once
4. Words connect through shared letters
5. Find words that use all available letters`,
    tips: `- Start with longer words to use up letters
- Look for common word patterns
- Letters at junctions can be part of multiple words`
  },
  {
    folder: 'WordSearch',
    title: 'Word Search',
    icon: '🔍',
    description: 'Find hidden words in a grid of letters. Words can go any direction!',
    category: 'Word Grids',
    rules: `1. Words are hidden in the letter grid
2. Find words from the given list
3. Words can run horizontally, vertically, or diagonally
4. Words can be forwards or backwards
5. Click and drag to highlight found words`,
    tips: `- Scan for distinctive letters first (Q, X, Z, J)
- Check all 8 directions from each starting letter
- Cross off words as you find them`
  },
  {
    folder: 'Threads',
    title: 'Threads',
    icon: '🧵',
    description: 'Find themed words by connecting adjacent letters. Discover the MegaThread that ties them all together!',
    category: 'Word Grids',
    rules: `1. Connect adjacent letters to form themed words
2. All words share a common theme (the MegaThread)
3. Letters can connect horizontally, vertically, or diagonally
4. Each letter can only be used once per word
5. Discover all words and identify the theme`,
    tips: `- Found words give hints about the theme
- Work backwards - guess the theme to find remaining words
- Look for less obvious thematic connections`
  },
  {
    folder: 'Categories',
    title: 'Categories',
    icon: '🔗',
    description: 'Find groups of four words that share a hidden connection. Four categories, four chances!',
    category: 'Word Grids',
    rules: `1. 16 words are displayed in a grid
2. Find groups of 4 words that share a connection
3. Select 4 words and submit to check if they're a category
4. You have 4 mistakes allowed before losing
5. Categories range from obvious to tricky`,
    tips: `- Start with categories you're most confident about
- Watch for words that could fit multiple categories
- Harder categories often involve wordplay or less obvious connections`
  },
  {
    folder: 'FlipQuotes',
    title: 'FlipQuotes',
    icon: '🔄',
    description: 'Flip letter tiles up or down to reveal the hidden quote.',
    category: 'Word Grids',
    rules: `1. Letter tiles show two possible letters (flip up/down)
2. Choose the correct orientation for each tile
3. Reveal a famous quote or phrase
4. Punctuation and spaces are provided
5. Complete the quote to win`,
    tips: `- Look for common short words first (THE, AND, TO)
- Quote structure helps - look for sentence patterns
- Famous quote openings can give you a head start`
  },

  // Cipher & Decode
  {
    folder: 'Cryptogram',
    title: 'Cryptogram',
    icon: '🔐',
    description: 'Decode the secret message by cracking the letter substitution cipher!',
    category: 'Cipher & Decode',
    rules: `1. A quote is encrypted with a substitution cipher
2. Each letter consistently represents another letter
3. Click a letter to see all its occurrences
4. Substitute letters to decode the message
5. Spaces and punctuation are preserved`,
    tips: `- Single-letter words are usually A or I
- Look for common patterns: THE, AND, -ING, -TION
- Most frequent letters in English: E, T, A, O, I, N`
  },
  {
    folder: 'PhraseGuess',
    title: 'PhraseGuess',
    icon: '🎡',
    description: 'Guess letters to reveal the hidden phrase before you run out of chances!',
    category: 'Cipher & Decode',
    rules: `1. A phrase is hidden behind blank spaces
2. Guess one letter at a time
3. Correct letters are revealed in all positions
4. Limited wrong guesses before losing
5. Reveal the complete phrase to win`,
    tips: `- Start with R, S, T, L, N, E - most common consonants and vowel
- Look at word lengths for clues
- Common phrase patterns help narrow it down`
  },
  {
    folder: 'CodeBreaker',
    title: 'CodeBreaker',
    icon: '🧠',
    description: 'Crack the secret color code using logic and deduction.',
    category: 'Cipher & Decode',
    rules: `1. A secret code of colored pegs is hidden
2. Make guesses by placing colored pegs
3. Feedback shows:
   - ⚫ Black: Correct color in correct position
   - ⚪ White: Correct color in wrong position
4. Use logic to deduce the code
5. Solve within the allowed number of guesses`,
    tips: `- First guesses should test multiple colors
- Process of elimination narrows possibilities
- Keep track of what you've learned from each guess`
  },
  {
    folder: 'WordArithmetic',
    title: 'Word Arithmetic',
    icon: '🧮',
    description: 'Assign digits to letters so the equation works. Classic SEND+MORE=MONEY puzzles!',
    category: 'Cipher & Decode',
    rules: `1. Each letter represents a unique digit (0-9)
2. The arithmetic equation must be valid
3. Leading digits cannot be zero
4. Find the digit assignment that makes the equation true
5. Each letter always represents the same digit`,
    tips: `- Start with the leftmost column - it often has carrying constraints
- Leading letters can't be 0
- Work through carries systematically`
  },
  {
    folder: 'DropQuotes',
    title: 'Drop Quotes',
    icon: '📜',
    description: 'Letters drop down from columns to form a hidden quote.',
    category: 'Cipher & Decode',
    rules: `1. Letters above the grid must drop into columns below
2. Each letter falls straight down into its column
3. Arrange letters within columns to form a quote
4. Black squares indicate word boundaries
5. Reveal the quote to win`,
    tips: `- Word boundaries help determine letter placement
- Common short words anchor longer discoveries
- Work on multiple words simultaneously`
  },
  {
    folder: 'WordSnake',
    title: 'Word Snake',
    icon: '🐍',
    description: 'Find the hidden word by tracing a continuous path through adjacent cells.',
    category: 'Cipher & Decode',
    rules: `1. A word is hidden in the grid as a snake path
2. Trace through adjacent cells (no diagonals)
3. The path doesn't cross itself
4. Find the start and follow to the end
5. The path uses all cells exactly once`,
    tips: `- Look for uncommon letter combinations to find the start
- The snake must be continuous without gaps
- Dead ends help identify wrong paths`
  },

  // Sudoku Family
  {
    folder: 'Sudoku',
    title: 'Sudoku',
    icon: '🔢',
    description: 'Fill the 9×9 grid so each row, column, and box contains 1-9.',
    category: 'Sudoku Family',
    rules: `1. Fill empty cells with digits 1-9
2. Each row must contain 1-9 exactly once
3. Each column must contain 1-9 exactly once
4. Each 3×3 box must contain 1-9 exactly once
5. Use logic to determine each cell's value`,
    tips: `- Start by scanning for cells with only one possibility
- Look for numbers that can only go in one place in a row/column/box
- Use pencil marks to track possibilities`
  },
  {
    folder: 'KillerSudoku',
    title: 'Killer Sudoku',
    icon: '💀',
    description: 'Sudoku with cage sums. Numbers in dotted cages must sum to the clue.',
    category: 'Sudoku Family',
    rules: `1. Standard Sudoku rules apply (1-9 in rows, columns, boxes)
2. Dotted cages show a sum that cells must total
3. Numbers cannot repeat within a cage
4. Use both Sudoku logic and sum constraints
5. Some cages span multiple boxes`,
    tips: `- Learn cage sum combinations (e.g., 3 in 2 cells = 1+2)
- Small and large sums have fewer possibilities
- Overlapping constraints are powerful solving tools`
  },
  {
    folder: 'SandwichSudoku',
    title: 'Sandwich Sudoku',
    icon: '🥪',
    description: 'Sudoku where clues show the sum of digits sandwiched between 1 and 9.',
    category: 'Sudoku Family',
    rules: `1. Standard Sudoku rules apply
2. Numbers outside the grid show sandwich sums
3. The sum is the total of digits between 1 and 9 in that row/column
4. A sum of 0 means 1 and 9 are adjacent
5. Use sandwich clues to place 1s and 9s first`,
    tips: `- Start by finding where 1 and 9 must be
- Maximum sandwich sum is 35 (2+3+4+5+6+7+8)
- Low sums mean 1 and 9 are close together`
  },
  {
    folder: 'Calcudoku',
    title: 'Calcudoku',
    icon: '➕',
    description: 'Fill the grid using math clues. Like Sudoku meets arithmetic!',
    category: 'Sudoku Family',
    rules: `1. Fill the grid with numbers (1-N for an NxN grid)
2. Each row and column contains each number once
3. Cages show a target number and operation (+, -, ×, ÷)
4. Cells in a cage must produce the target using the operation
5. For subtraction/division, order doesn't matter`,
    tips: `- Multiplication cages with large targets limit possibilities
- Single-cell cages give free numbers
- Division cages help identify factor pairs`
  },
  {
    folder: 'Kakuro',
    title: 'Kakuro',
    icon: '➗',
    description: 'Fill in numbers that add up to the clues. A crossword with math!',
    category: 'Sudoku Family',
    rules: `1. Fill white cells with digits 1-9
2. Numbers in each run must sum to the clue
3. Numbers cannot repeat within a single run
4. Clues appear in black cells (down\\across format)
5. All runs are either horizontal or vertical`,
    tips: `- Memorize unique combinations (e.g., 16 in 2 cells = 7+9)
- Intersecting runs create constraints
- Start with runs that have few possible combinations`
  },
  {
    folder: 'Futoshiki',
    title: 'Futoshiki',
    icon: '⚖️',
    description: 'Fill the grid following inequalities. Like Sudoku with greater-than clues!',
    category: 'Sudoku Family',
    rules: `1. Fill the grid with numbers 1-N (for NxN grid)
2. Each row contains each number exactly once
3. Each column contains each number exactly once
4. Inequality signs (< >) between cells must be satisfied
5. The larger end of < points to the larger number`,
    tips: `- Chain inequalities to find extremes (1s and Ns)
- Cells with multiple < pointing away must be high
- Cells with multiple < pointing toward must be low`
  },
  {
    folder: 'Str8ts',
    title: 'Str8ts',
    icon: '🔢',
    description: 'Fill white cells with 1-9. Compartments must form consecutive sequences!',
    category: 'Sudoku Family',
    rules: `1. Fill white cells with digits 1-9
2. Each row has unique digits (no repeats)
3. Each column has unique digits (no repeats)
4. White cell compartments must form straights (consecutive numbers)
5. Black cells can contain numbers that affect row/column uniqueness`,
    tips: `- Compartment length limits which numbers fit
- Numbers in black cells eliminate possibilities
- Straights don't need to be in order (3,5,4 is valid)`
  },
  {
    folder: 'Kropki',
    title: 'Kropki',
    icon: '⚫',
    description: 'Fill the grid with numbers. White dots = consecutive, black dots = double.',
    category: 'Sudoku Family',
    rules: `1. Fill the grid with numbers 1-N
2. Each row and column contains each number once
3. White dot: adjacent numbers are consecutive (like 4,5)
4. Black dot: one number is double the other (like 2,4)
5. No dot means neither relationship exists`,
    tips: `- 1 and 2 can have both a white dot (consecutive) and black dot (double)
- No dot eliminates many possibilities
- Black dots involving high numbers are very constraining`
  },
  {
    folder: 'Sujiko',
    title: 'Sujiko',
    icon: '⭕',
    description: 'Fill the 3×3 grid with 1-9. Circle clues show the sum of surrounding cells.',
    category: 'Sudoku Family',
    rules: `1. Place digits 1-9 in the 3×3 grid (each used once)
2. Circled numbers appear at grid intersections
3. Each circle shows the sum of its 4 surrounding cells
4. All four circle clues must be satisfied
5. Use overlapping sums to deduce placements`,
    tips: `- The total of all circles equals 2× the sum of corner cells + inner values
- Center cell appears in all four sums
- Corner cells each appear in only one sum`
  },
  {
    folder: 'Skyscraper',
    title: 'Skyscraper',
    icon: '🏙️',
    description: 'Fill the grid with building heights. Edge clues show how many buildings are visible.',
    category: 'Sudoku Family',
    rules: `1. Fill the grid with heights 1-N (N = grid size)
2. Each row and column has each height once
3. Edge numbers show visible buildings from that direction
4. Taller buildings block shorter ones behind them
5. A clue of 1 means the first building is tallest (N)`,
    tips: `- Clue of N means buildings are in ascending order
- Clue of 1 means N is first in that row/column
- High clues mean low numbers come first`
  },
  {
    folder: 'ABCEndView',
    title: 'ABC End View',
    icon: '🔤',
    description: 'Place letters so clues show which letter is seen first from each edge.',
    category: 'Sudoku Family',
    rules: `1. Place letters (A, B, C, etc.) in the grid
2. Each row and column has each letter once, plus empty cells
3. Edge clues show the first letter seen from that direction
4. Empty cells don't block the view
5. No clue means any letter (or none) could be first`,
    tips: `- Count empty cells needed based on grid size
- A letter seen from opposite sides means it's the only one in that row/column
- Process of elimination is key`
  },

  // Grid Shading
  {
    folder: 'Nonogram',
    title: 'Nonogram',
    icon: '🖼️',
    description: 'Fill in cells using number clues to reveal a hidden picture!',
    category: 'Grid Shading',
    rules: `1. Numbers indicate consecutive filled cells in each row/column
2. Multiple numbers mean multiple groups separated by at least one empty cell
3. Order of numbers matches order of groups (left-to-right, top-to-bottom)
4. Use logic to determine which cells are filled
5. Complete the grid to reveal the picture`,
    tips: `- Start with rows/columns where numbers sum close to the total length
- Mark cells you know are empty with X
- Overlap logic: if a group can't fit without filling certain cells, fill them`
  },
  {
    folder: 'Minesweeper',
    title: 'Minesweeper',
    icon: '💣',
    description: "Clear the minefield using number clues. Don't click a mine!",
    category: 'Grid Shading',
    rules: `1. Click cells to reveal them
2. Numbers show how many mines are in the 8 surrounding cells
3. Empty cells (0) auto-reveal their neighbors
4. Right-click to flag suspected mines
5. Reveal all non-mine cells to win`,
    tips: `- Start with cells that have space around them
- If a number equals its remaining hidden neighbors, they're all mines
- If a number equals its flagged neighbors, remaining neighbors are safe`
  },
  {
    folder: 'Nurikabe',
    title: 'Nurikabe',
    icon: '🌊',
    description: 'Shade cells to form one connected sea around numbered islands.',
    category: 'Grid Shading',
    rules: `1. Numbered cells are islands; shade other cells to create the sea
2. Each number shows how many cells are in its island (including itself)
3. Islands cannot touch each other (not even diagonally)
4. The sea must be one connected region
5. No 2×2 area can be entirely sea (shaded)`,
    tips: `- Cells between two islands must be sea
- Expand islands to their required size
- Watch for 2×2 sea violations - they're easy to miss`
  },
  {
    folder: 'Hitori',
    title: 'Hitori',
    icon: '⬛',
    description: 'Shade cells to eliminate duplicates while keeping unshaded cells connected.',
    category: 'Grid Shading',
    rules: `1. Shade cells so no number repeats in any row or column
2. Shaded cells cannot be adjacent horizontally or vertically
3. All unshaded cells must form one connected group
4. The shaded cells eliminate the duplicates
5. Some cells may not need shading if no conflict exists`,
    tips: `- If two identical numbers are adjacent, exactly one must be shaded
- Shading a cell means its neighbors must stay unshaded
- Check connectivity as you shade - don't isolate white regions`
  },
  {
    folder: 'Aquarium',
    title: 'Aquarium',
    icon: '🐠',
    description: 'Fill water in tanks to match row and column totals. Water settles to the bottom!',
    category: 'Grid Shading',
    rules: `1. The grid is divided into tanks (regions)
2. Fill cells with water to match row/column counts
3. Water settles to the bottom of each tank (gravity)
4. Within a tank, water level is consistent across columns
5. Different tanks can have different water levels`,
    tips: `- Water in a tank fills from the bottom up uniformly
- If one cell in a tank row is filled, all cells in that row of the tank are filled
- Use row/column counts to determine water levels`
  },
  {
    folder: 'StarBattle',
    title: 'Star Battle',
    icon: '⭐',
    description: 'Place stars so each row, column, and region has exactly the right count. No touching!',
    category: 'Grid Shading',
    rules: `1. Place the required number of stars (usually 1 or 2) per row
2. Same number of stars in each column
3. Same number of stars in each marked region
4. Stars cannot touch each other, even diagonally
5. Use the no-touching rule to eliminate possibilities`,
    tips: `- Mark cells where stars definitely cannot go
- Small regions with few cells are easier to solve first
- If a row/column/region has only N valid cells, stars must go there`
  },
  {
    folder: 'Campixu',
    title: 'Campixu',
    icon: '🏕️',
    description: 'Place tents using nonogram clues. Tents must be next to trees and cannot touch.',
    category: 'Grid Shading',
    rules: `1. Place tents in the grid according to nonogram-style clues
2. Each tent must be orthogonally adjacent to a tree
3. Tents cannot touch each other (even diagonally)
4. Number clues show tent counts for rows/columns
5. Each tree pairs with exactly one tent`,
    tips: `- Trees with only one adjacent empty cell must have their tent there
- Tents that would touch can't both exist
- Use nonogram logic for row/column counts`
  },
  {
    folder: 'Takuzu',
    title: 'Takuzu',
    icon: '🔘',
    description: 'Fill the grid with 0s and 1s. No more than two in a row, equal count per line!',
    category: 'Grid Shading',
    rules: `1. Fill every cell with either 0 or 1
2. No more than two consecutive same digits in any row or column
3. Each row has equal numbers of 0s and 1s
4. Each column has equal numbers of 0s and 1s
5. No two rows can be identical; no two columns can be identical`,
    tips: `- Three in a row is never allowed - block it immediately
- Count remaining 0s and 1s needed for each line
- If a row/column has its quota of one digit, fill rest with the other`
  },
  {
    folder: 'YinYang',
    title: 'Yin-Yang',
    icon: '☯️',
    description: 'Fill cells black or white. Each color must connect. No 2×2 same color.',
    category: 'Grid Shading',
    rules: `1. Fill every cell either black or white
2. All black cells must form one connected group
3. All white cells must form one connected group
4. No 2×2 area can be all one color
5. Some cells may be pre-filled as clues`,
    tips: `- Check every potential 2×2 square before placing
- Connectivity is key - don't isolate any region
- Corners and edges are often good starting points`
  },
  {
    folder: 'Creek',
    title: 'Creek',
    icon: '🏞️',
    description: 'Shade cells based on corner clues. Each number shows adjacent shaded cells.',
    category: 'Grid Shading',
    rules: `1. Shade some cells in the grid
2. Numbers appear at grid intersections (corners of cells)
3. Each number shows how many of its 4 adjacent cells are shaded
4. Unshaded cells must form one connected region
5. Use the clues to deduce the shading pattern`,
    tips: `- A clue of 0 means all 4 adjacent cells are unshaded
- A clue of 4 means all 4 adjacent cells are shaded
- Work from extreme clues (0 and 4) first`
  },
  {
    folder: 'Kurotto',
    title: 'Kurotto',
    icon: '⭕',
    description: 'Shade cells so circled numbers equal the sum of adjacent shaded group sizes.',
    category: 'Grid Shading',
    rules: `1. Shade some cells in the grid
2. Circled numbers must equal the total size of orthogonally adjacent shaded groups
3. Shaded cells form groups (connected components)
4. Each shaded group only counts once per clue it touches
5. Cells with circles are never shaded`,
    tips: `- A circle with 0 means no adjacent shaded cells
- Large numbers need large adjacent groups or multiple groups
- Shaded groups can touch multiple circle clues`
  },
  {
    folder: 'Thermometers',
    title: 'Thermometers',
    icon: '🌡️',
    description: 'Fill thermometers from the bulb. Numbers show filled cells per row/column.',
    category: 'Grid Shading',
    rules: `1. Thermometers span multiple cells with a bulb at one end
2. Fill thermometers starting from the bulb
3. A thermometer can be partially filled but must be continuous from bulb
4. Row/column numbers show total filled cells
5. Empty thermometers are allowed`,
    tips: `- A row/column count of 0 means no filled cells there
- If count equals available thermometer cells, fill them all
- Work from both high and low counts`
  },
  {
    folder: 'LightsOut',
    title: 'Lights Out',
    icon: '💡',
    description: 'Toggle lights to turn them all off. Each press affects neighbors!',
    category: 'Grid Shading',
    rules: `1. Click a cell to toggle it and its orthogonal neighbors
2. Toggling changes ON to OFF and OFF to ON
3. Turn all lights OFF to win
4. Order of clicks doesn't matter
5. Clicking the same cell twice cancels out`,
    tips: `- Each cell only needs to be clicked 0 or 1 times
- Work systematically from one edge to the other
- The solution, if it exists, is unique (up to order)`
  },
  {
    folder: 'Lightup',
    title: 'Light Up',
    icon: '💡',
    description: 'Place lights so every cell is lit, without lights seeing each other.',
    category: 'Grid Shading',
    rules: `1. Place light bulbs in white cells
2. Bulbs illuminate all cells in their row and column until blocked
3. Black cells block light
4. Numbers on black cells show how many adjacent bulbs
5. No bulb can illuminate another bulb`,
    tips: `- Numbered cells with few empty neighbors are easier
- A 4 means all four neighbors have bulbs
- A 0 means no adjacent bulbs - helpful for elimination`
  },
  {
    folder: 'Mosaic',
    title: 'Mosaic',
    icon: '🧱',
    description: 'Shade tiles to match the numeric clues.',
    category: 'Grid Shading',
    rules: `1. Shade some cells in the grid
2. Numbers indicate how many cells in the 3×3 area (including itself) are shaded
3. Use logic to determine which cells to shade
4. Numbered cells themselves can be shaded or unshaded
5. Complete the pattern to solve`,
    tips: `- A 9 means the entire 3×3 area is shaded
- A 0 means the entire 3×3 area is unshaded
- Edge and corner clues cover fewer cells`
  },

  // Loop & Path
  {
    folder: 'Numberlink',
    title: 'Numberlink',
    icon: '🔗',
    description: 'Connect matching number pairs without crossing paths.',
    category: 'Loop & Path',
    rules: `1. Connect each pair of identical numbers with a path
2. Paths travel horizontally and vertically (not diagonally)
3. Paths cannot cross each other
4. Paths cannot pass through numbered cells
5. Every cell must be used by exactly one path`,
    tips: `- Numbers near edges often have limited routing options
- Work on constrained pairs first
- If a path must go a certain way initially, draw it`
  },
  {
    folder: 'Hashi',
    title: 'Hashi',
    icon: '🌉',
    description: 'Connect islands with bridges. Each island shows how many bridges connect to it.',
    category: 'Loop & Path',
    rules: `1. Islands are circles with numbers
2. Connect islands with horizontal or vertical bridges
3. The number shows how many bridges connect to that island
4. Maximum 2 bridges between any two islands
5. All islands must be connected (one network)
6. Bridges cannot cross each other`,
    tips: `- An island with value 1 in a corner must connect to its only neighbor
- High-value islands (7, 8) have very limited valid configurations
- Ensure global connectivity as you solve`
  },
  {
    folder: 'Loopy',
    title: 'Loopy',
    icon: '⭕',
    description: 'Draw a single loop around the grid, satisfying the numeric clues.',
    category: 'Loop & Path',
    rules: `1. Draw a single continuous loop through the grid
2. The loop uses edges between cells
3. Numbers show how many edges of that cell are used by the loop
4. The loop doesn't cross or branch
5. Not all edges need to be used`,
    tips: `- 0 means no edges of that cell are used
- 3 means three edges, which severely constrains the fourth
- Look for cells where only one valid configuration exists`
  },
  {
    folder: 'Pearl',
    title: 'Pearl',
    icon: '🫧',
    description: 'Draw a single loop through all pearls. Black = corner, white = straight with turn.',
    category: 'Loop & Path',
    rules: `1. Draw a single continuous loop through all pearl cells
2. Black pearls: the loop turns 90° on this cell
3. Black pearls: the loop goes straight on both sides of the turn
4. White pearls: the loop goes straight through
5. White pearls: the loop must turn on at least one adjacent cell`,
    tips: `- Black pearls force specific corner shapes
- White pearls with limited neighbors are constraining
- The loop must be exactly one closed path`
  },
  {
    folder: 'Yajilin',
    title: 'Yajilin',
    icon: '↗️',
    description: 'Shade cells and draw a loop. Arrows show shaded cell counts in that direction.',
    category: 'Loop & Path',
    rules: `1. Shade some cells and draw a loop through remaining white cells
2. Arrow clues show how many shaded cells in that direction
3. Shaded cells cannot be adjacent (even diagonally)
4. The loop visits all unshaded cells exactly once
5. The loop doesn't pass through clue cells`,
    tips: `- Shaded cells can't touch, which limits placements
- Arrow clues help count shaded cells precisely
- The loop must use all non-shaded, non-clue cells`
  },
  {
    folder: 'Slant',
    title: 'Slant',
    icon: '／',
    description: 'Draw slashes in cells so the vertex counts match the clues.',
    category: 'Loop & Path',
    rules: `1. Draw exactly one diagonal line in each cell (/ or \\)
2. Numbers appear at intersections (vertices)
3. Each number shows how many line endpoints meet there
4. Lines cannot form closed loops
5. Fill all cells with valid diagonals`,
    tips: `- A vertex with 0 means no lines end there (all pass through)
- A vertex with 4 means all four adjacent cells point to it
- Corner and edge vertices have fewer adjacent cells`
  },
  {
    folder: 'GokigenNaname',
    title: 'Gokigen Naname',
    icon: '／',
    description: 'Draw diagonals in cells. Numbers show how many lines meet at that point.',
    category: 'Loop & Path',
    rules: `1. Each cell gets exactly one diagonal (/ or \\)
2. Numbers at vertices show line endpoints meeting there
3. Diagonals cannot form closed loops
4. Use the numbers to constrain diagonal directions
5. All cells must contain a diagonal`,
    tips: `- 0 at a vertex: all diagonals point away
- 4 at a vertex: all diagonals point toward it
- Avoid creating closed loops as you solve`
  },
  {
    folder: 'HotaruBeam',
    title: 'Hotaru Beam',
    icon: '✨',
    description: 'Draw lines forming closed loops. Circles show line segment counts.',
    category: 'Loop & Path',
    rules: `1. Draw lines along grid edges
2. All lines must form closed loops
3. Numbers in circles show how many lines connect to that circle
4. Lines can only connect at circles
5. Multiple separate loops are allowed`,
    tips: `- A circle with 0 has no lines connected
- A circle with 2 is part of exactly one loop
- Higher numbers mean junction points`
  },
  {
    folder: 'Hidato',
    title: 'Hidato',
    icon: '🔢',
    description: 'Fill the grid with consecutive numbers that connect through adjacent cells.',
    category: 'Loop & Path',
    rules: `1. Place consecutive numbers starting from 1
2. Each number touches the next (including diagonals)
3. Some numbers are given as clues
4. Find a path from 1 to the maximum number
5. All cells must be filled`,
    tips: `- Start from given numbers and work outward
- Large gaps between givens constrain the path
- Count cells to verify you have room for all numbers`
  },
  {
    folder: 'Signpost',
    title: 'Signpost',
    icon: '⛳',
    description: 'Link numbered squares into a continuous path using arrow directions.',
    category: 'Loop & Path',
    rules: `1. Arrows point toward the next number in sequence
2. Numbers form a consecutive path (1, 2, 3, ...)
3. Fill in missing numbers following arrow directions
4. The start (1) and end (max) are given
5. Each cell is used exactly once`,
    tips: `- Follow arrows from known numbers
- Work backwards from the end
- Count steps between known numbers`
  },
  {
    folder: 'Tracks',
    title: 'Tracks',
    icon: '🛤️',
    description: 'Lay tracks through the grid to satisfy the numbers.',
    category: 'Loop & Path',
    rules: `1. Draw a single track from start (S) to finish (F)
2. Numbers outside show how many cells in that row/column have track
3. Track segments connect orthogonally
4. Track cannot cross itself
5. Track doesn't need to fill all cells`,
    tips: `- The track must be continuous from S to F
- Use row/column counts to narrow possibilities
- Corners and turns are often key solving points`
  },
  {
    folder: 'Maze',
    title: 'Maze',
    icon: '🌀',
    description: 'Navigate from start to finish through the winding passages.',
    category: 'Loop & Path',
    rules: `1. Find a path from the entrance to the exit
2. You can only move through open passages
3. Walls block movement
4. The path cannot cross itself
5. There is always exactly one solution`,
    tips: `- Try both working forward from start and backward from end
- Dead ends help eliminate wrong paths
- Keep one hand on the wall (wall-following) as a systematic approach`
  },
  {
    folder: 'Bag',
    title: 'Bag (Corral)',
    icon: '🎒',
    description: 'Draw a loop so numbered cells are inside and can see exactly that many cells.',
    category: 'Loop & Path',
    rules: `1. Draw a single closed loop on the grid
2. All numbered cells must be inside the loop
3. Each number shows how many cells that cell can "see"
4. Cells see horizontally and vertically until the loop edge
5. The loop doesn't cross itself`,
    tips: `- Large numbers need lots of visible cells
- Small numbers mean the loop is close
- Numbers must see exactly their value (not more, not less)`
  },

  // Region Division
  {
    folder: 'Shikaku',
    title: 'Shikaku',
    icon: '▢',
    description: 'Divide the grid into rectangles. Each rectangle contains exactly one number.',
    category: 'Region Division',
    rules: `1. Divide the entire grid into rectangles
2. Each rectangle contains exactly one number
3. The number equals the rectangle's area (width × height)
4. Rectangles cannot overlap
5. All cells must be part of a rectangle`,
    tips: `- Numbers with few factor pairs have limited shapes
- Prime numbers make 1×N rectangles
- Large numbers in corners are often easier to place`
  },
  {
    folder: 'Fillomino',
    title: 'Fillomino',
    icon: '🔢',
    description: 'Fill numbers so connected groups of the same number have that many cells.',
    category: 'Region Division',
    rules: `1. Fill every cell with a number
2. Groups of connected same numbers (polyominoes) form regions
3. Each region's size equals its number
4. Regions of the same number cannot touch orthogonally
5. Different regions can have the same number if they don't touch`,
    tips: `- A 1 is always isolated
- Given numbers constrain their region's final size
- Large numbers need room to expand`
  },
  {
    folder: 'Galaxies',
    title: 'Galaxies',
    icon: '🌌',
    description: 'Divide the grid into symmetric galaxies around their centers.',
    category: 'Region Division',
    rules: `1. Divide the grid into regions (galaxies)
2. Each region has a center point (marked with a dot)
3. Each region must have 180° rotational symmetry around its center
4. Regions cannot overlap
5. All cells belong to exactly one galaxy`,
    tips: `- Centers on edges create specific symmetry constraints
- Centers on corners allow only 90° rotations
- Start with galaxies whose shape is most constrained`
  },
  {
    folder: 'Tatamibari',
    title: 'Tatamibari',
    icon: '🔲',
    description: 'Divide the grid into rectangles. Each contains one clue showing its shape.',
    category: 'Region Division',
    rules: `1. Divide the grid into rectangles
2. Each rectangle contains exactly one symbol
3. + means the rectangle is square
4. - means it's wider than tall
5. | means it's taller than wide
6. No four rectangles can share a corner`,
    tips: `- + clues must be in squares (1×1, 2×2, 3×3, etc.)
- The no-four-corners rule limits arrangements
- Count available cells to determine rectangle sizes`
  },
  {
    folder: 'LITS',
    title: 'LITS',
    icon: '🧱',
    description: 'Place L, I, T, S tetrominoes in regions. Same shapes cannot touch.',
    category: 'Region Division',
    rules: `1. Shade exactly 4 cells in each region to form a tetromino
2. Tetrominoes must be L, I, T, or S shaped (including rotations)
3. Same-shaped tetrominoes cannot touch orthogonally
4. All shaded cells must form one connected group
5. No 2×2 area can be entirely shaded`,
    tips: `- There are only 4 tetromino shapes (and their rotations)
- Same shapes touching would violate rules
- Check 2×2 violations as you shade`
  },
  {
    folder: 'Suguru',
    title: 'Suguru',
    icon: '🔢',
    description: 'Fill regions with 1-N. Same numbers cannot touch, even diagonally.',
    category: 'Region Division',
    rules: `1. Fill each cell with a number
2. In a region of N cells, use numbers 1 through N
3. Same numbers cannot touch (including diagonally)
4. Each number appears exactly once per region
5. Use given numbers as starting clues`,
    tips: `- In a 5-cell region, use digits 1-5
- Numbers touching diagonally can't be the same
- Small numbers (1, 2) are often easiest to place first`
  },
  {
    folder: 'Norinori',
    title: 'Norinori',
    icon: '▪️',
    description: 'Shade cells to form dominoes. Each region must contain exactly 2 shaded cells.',
    category: 'Region Division',
    rules: `1. Shade exactly 2 cells in each region
2. Every shaded cell must be part of a domino (pair of adjacent shaded cells)
3. Dominoes can span multiple regions
4. Shaded cells in a region don't need to touch each other
5. All shaded cells must form dominoes (no isolated cells)`,
    tips: `- Single-cell regions cannot exist (would isolate a shade)
- Dominoes can bridge between regions
- Small regions are more constrained`
  },
  {
    folder: 'InshiNoHeya',
    title: 'Inshi no Heya',
    icon: '✖️',
    description: 'Fill numbers so each row/column has 1-N once. Room numbers multiply.',
    category: 'Region Division',
    rules: `1. Fill the grid with numbers 1 to N (N = grid size)
2. Each row contains 1-N exactly once
3. Each column contains 1-N exactly once
4. Numbers in each room multiply to give the room's clue
5. Rooms are outlined regions with a product clue`,
    tips: `- Factor the room's product to find possible combinations
- Single-cell rooms give you that number directly
- Large products with few cells constrain possibilities`
  },

  // Chess & Movement
  {
    folder: 'ChessPuzzle',
    title: 'Chess Puzzles',
    icon: '♟️',
    description: 'Solve tactical chess puzzles! Find the best move or checkmate.',
    category: 'Chess & Movement',
    rules: `1. You play as the side to move (usually white)
2. Find the best move or series of moves
3. Goals may be checkmate, winning material, or gaining advantage
4. Standard chess rules apply
5. There's usually one optimal solution`,
    tips: `- Look for checks, captures, and threats first
- Consider forcing moves that limit opponent options
- Checkmate patterns are often tactical motifs`
  },
  {
    folder: 'KnightsTour',
    title: "Knight's Tour",
    icon: '♞',
    description: 'Move the knight to visit every square exactly once.',
    category: 'Chess & Movement',
    rules: `1. The knight moves in an L-shape (2+1 squares)
2. Visit every square on the board exactly once
3. Start from the given position
4. The knight cannot revisit squares
5. Complete tour visits all squares`,
    tips: `- Prefer moves that go to corners and edges first
- Use Warnsdorff's rule: move to the square with fewest onward moves
- Plan several moves ahead to avoid getting stuck`
  },
  {
    folder: 'NQueens',
    title: 'N-Queens',
    icon: '👑',
    description: 'Place queens so none can attack each other.',
    category: 'Chess & Movement',
    rules: `1. Place N queens on an N×N board
2. No two queens can share a row
3. No two queens can share a column
4. No two queens can share a diagonal
5. Find a valid arrangement`,
    tips: `- Each row and column gets exactly one queen
- Diagonals are the tricky constraint
- For 8×8, there are 92 solutions`
  },
  {
    folder: 'ChessMaze',
    title: 'Chess Maze',
    icon: '🏰',
    description: 'Navigate your piece to the goal without getting captured!',
    category: 'Chess & Movement',
    rules: `1. Move your chess piece from start to goal
2. Enemy pieces can capture you if you move to an attacked square
3. Each piece type moves according to chess rules
4. Plan your path to avoid all threats
5. Reach the goal square to win`,
    tips: `- Map out attacked squares before moving
- Some routes may look shorter but pass through danger
- Consider waiting moves if enemies move too`
  },
  {
    folder: 'TheseusMinotaur',
    title: 'Theseus & the Minotaur',
    icon: '🐂',
    description: 'Guide Theseus to the exit while the Minotaur chases!',
    category: 'Chess & Movement',
    rules: `1. Move Theseus one square in any direction (or wait)
2. After your move, the Minotaur takes two steps toward Theseus
3. Minotaur prefers horizontal movement, then vertical
4. Walls block movement
5. Reach the exit before being caught`,
    tips: `- The Minotaur's movement pattern is predictable
- Use walls to your advantage
- Sometimes waiting lets the Minotaur pass`
  },
  {
    folder: 'Pegs',
    title: 'Pegs',
    icon: '📍',
    description: 'Classic peg solitaire: jump pegs to leave as few as possible.',
    category: 'Chess & Movement',
    rules: `1. Jump one peg over an adjacent peg into an empty hole
2. The jumped peg is removed
3. Jumps are horizontal or vertical only
4. Continue until no more jumps are possible
5. Goal: leave as few pegs as possible (ideally just one)`,
    tips: `- Plan sequences of jumps, not just one at a time
- Leaving one peg in the center is the classic goal
- Some positions are unsolvable - recognize dead ends`
  },
  {
    folder: 'Sokoban',
    title: 'Sokoban',
    icon: '📦',
    description: 'Push boxes onto targets with classic Sokoban rules.',
    category: 'Chess & Movement',
    rules: `1. Push boxes onto target locations
2. You can only push, not pull
3. You can only push one box at a time
4. Boxes can't be pushed into walls or other boxes
5. Get all boxes on targets to complete the level`,
    tips: `- Avoid pushing boxes into corners (they get stuck)
- Plan the order of box movements carefully
- Sometimes you need to push boxes around obstacles`
  },
  {
    folder: 'Inertia',
    title: 'Inertia',
    icon: '🧲',
    description: 'Slide around an arena with momentum to reach the goal.',
    category: 'Chess & Movement',
    rules: `1. Move in a direction and you'll slide until hitting something
2. Collect gems while avoiding hazards
3. Walls and obstacles stop your movement
4. Some surfaces may affect your momentum
5. Reach the goal after collecting required gems`,
    tips: `- Plan your path considering where you'll stop
- Use walls strategically to control your position
- Some gems may require multiple moves to reach`
  },

  // Tile & Spatial
  {
    folder: 'Jigsaw',
    title: 'Jigsaw',
    icon: '🧩',
    description: 'Drag and drop pieces to complete the picture puzzle!',
    category: 'Tile & Spatial',
    rules: `1. Drag puzzle pieces to their correct positions
2. Pieces lock when placed correctly
3. Use edge pieces to build the frame first
4. Match colors and patterns to connect pieces
5. Complete the entire picture to win`,
    tips: `- Start with corner pieces (4 unique pieces)
- Build the edge frame first
- Group pieces by color/pattern before placing`
  },
  {
    folder: 'SlidingPuzzle',
    title: 'Sliding Puzzle',
    icon: '🔲',
    description: 'Slide tiles to complete the image. A classic brain teaser!',
    category: 'Tile & Spatial',
    rules: `1. Slide tiles into the empty space
2. Only one tile can move at a time
3. Tiles can only move into the adjacent empty space
4. Arrange tiles to form the complete picture/sequence
5. Minimize moves for the best score`,
    tips: `- Solve the top row first, then work down
- Keep solved pieces in place while working on others
- The last two rows are often solved together`
  },
  {
    folder: 'Congestion',
    title: 'Congestion',
    icon: '🚗',
    description: 'Slide cars and trucks to free the red car from the traffic jam!',
    category: 'Tile & Spatial',
    rules: `1. Slide vehicles forward or backward only
2. Cars are 2 squares, trucks are 3 squares
3. Free the red car by getting it to the exit
4. Vehicles cannot pass through each other
5. Find the solution in minimum moves`,
    tips: `- Work backwards - what's blocking the red car?
- Sometimes you need to create space by moving distant vehicles
- Trucks often need the most room to maneuver`
  },
  {
    folder: 'TileSwap',
    title: 'Tile Swap',
    icon: '🔄',
    description: 'Swap tiles to reassemble the scrambled image.',
    category: 'Tile & Spatial',
    rules: `1. Click two tiles to swap their positions
2. Continue swapping until the image is correct
3. Try to minimize the number of swaps
4. All tiles are on the board (no sliding)
5. Complete the image to win`,
    tips: `- Look for distinctive features to identify positions
- Swap tiles that are in each other's correct positions
- Build completed sections from one corner`
  },
  {
    folder: 'Cirkitz',
    title: 'Cirkitz',
    icon: '⚡',
    description: 'Rotate hexagonal tiles so all adjacent circuit wedges connect.',
    category: 'Tile & Spatial',
    rules: `1. Hexagonal tiles have circuit paths on their edges
2. Rotate tiles to connect all adjacent circuits
3. All connections must match at shared edges
4. Complete the circuit network
5. Every edge pair must match or both be empty`,
    tips: `- Start from tiles with the most constraints
- Work outward from completed connections
- Some tiles may have multiple valid orientations initially`
  },
  {
    folder: 'PipePuzzle',
    title: 'Pipe Puzzle',
    icon: '🔧',
    description: 'Rotate pipe segments to create a continuous flow from start to end.',
    category: 'Tile & Spatial',
    rules: `1. Rotate pipe pieces to connect them
2. Create a path from the source to the drain
3. All pipe ends must connect (no leaks)
4. Click/tap to rotate pieces
5. Water flows when the path is complete`,
    tips: `- Start from the source and work outward
- End pieces and corners are more constrained
- Fill the entire grid with connected pipes`
  },
  {
    folder: 'FloodIt',
    title: 'Flood It',
    icon: '🌊',
    description: 'Fill the board with one color in limited moves. Start from the corner!',
    category: 'Tile & Spatial',
    rules: `1. Start with the top-left cell
2. Choose a color to "flood" your region
3. Your region absorbs adjacent cells of the chosen color
4. Continue until the entire board is one color
5. Complete within the move limit`,
    tips: `- Plan ahead - which colors connect to your region?
- Sometimes choosing a color that's not immediately adjacent sets up bigger gains
- Count cells of each color touching your region`
  },
  {
    folder: 'ColorCube',
    title: 'Color Cube 3×3×3',
    icon: '🧊',
    description: 'Solve the classic 3×3×3 cube using standard moves.',
    category: 'Tile & Spatial',
    rules: `1. Each face should be a solid color when solved
2. Rotate faces using U/D/L/R/F/B moves
3. U=Up, D=Down, L=Left, R=Right, F=Front, B=Back
4. ' (prime) means counter-clockwise
5. Solve all six faces`,
    tips: `- Learn layer-by-layer method: white cross → corners → middle → last layer
- Algorithms exist for each step
- Practice recognition of patterns`
  },
  {
    folder: 'Entanglement',
    title: 'Entanglement',
    icon: '🕸️',
    description: 'Place and rotate hex tiles to extend the path as far as possible.',
    category: 'Tile & Spatial',
    rules: `1. Place hexagonal path tiles on the board
2. Rotate tiles before placing to connect paths
3. The goal is to make the longest possible path
4. The game ends when the path exits the board
5. Score based on path length`,
    tips: `- Rotate tiles to maximize path length
- Try to keep the path in the center of the board
- Avoid creating paths that quickly exit`
  },
  {
    folder: 'StainedGlass',
    title: 'Stained Glass',
    icon: '🎨',
    description: 'Color each region so no two adjacent regions share the same color.',
    category: 'Tile & Spatial',
    rules: `1. Color every region in the design
2. Adjacent regions cannot have the same color
3. Use the minimum number of colors possible
4. Most puzzles can be solved with 3-4 colors
5. Complete the coloring to finish`,
    tips: `- Start with regions that border the most other regions
- Four colors are sufficient for any map (Four Color Theorem)
- Work systematically through constrained regions first`
  },
  {
    folder: 'TowerOfHanoi',
    title: 'Tower of Hanoi',
    icon: '🗼',
    description: "Move the disk stack to another peg. Larger disks can't go on smaller ones!",
    category: 'Tile & Spatial',
    rules: `1. Move all disks from the starting peg to another peg
2. Move only one disk at a time
3. A larger disk cannot be placed on a smaller disk
4. Use the spare peg as intermediate storage
5. Minimum moves = 2^n - 1 (n = number of disks)`,
    tips: `- Move the smallest disk first, then alternate
- The recursive pattern: move n-1 disks, move largest, move n-1 back
- For 3 disks: move smallest every other turn, alternating direction`
  },
  {
    folder: 'Fifteen',
    title: 'Fifteen',
    icon: '1️⃣',
    description: 'Classic 15-puzzle: slide tiles to put them in order.',
    category: 'Tile & Spatial',
    rules: `1. Slide numbered tiles into the empty space
2. Arrange tiles in order: 1-15 with blank in corner
3. Only tiles adjacent to the blank can move
4. Solve by achieving the goal configuration
5. Some scrambles are unsolvable by design`,
    tips: `- Solve top row first, then second row
- Last two rows solved together with a different technique
- Keep completed sections intact while solving others`
  },
  {
    folder: 'Sixteen',
    title: 'Sixteen',
    icon: '🔢',
    description: 'A 16-tile sliding puzzle variant.',
    category: 'Tile & Spatial',
    rules: `1. Slide tiles to arrange them in order
2. The blank space allows movement
3. Arrange in numerical order
4. Use the optimal number of moves
5. Some configurations may vary from standard 15-puzzle`,
    tips: `- Similar strategies to 15-puzzle apply
- Build from one corner outward
- Maintain solved sections while working on others`
  },
  {
    folder: 'Twiddle',
    title: 'Twiddle',
    icon: '🌀',
    description: 'Rotate tiles to match a target arrangement.',
    category: 'Tile & Spatial',
    rules: `1. Rotate 2×2 groups of tiles
2. Match the target pattern
3. Rotations can be clockwise or counter-clockwise
4. Plan your rotations to minimize moves
5. All tiles must match the goal`,
    tips: `- Work on one section at a time
- Rotating affects 4 tiles - consider all their destinations
- Sometimes you need to temporarily mess up solved areas`
  },
  {
    folder: 'Netgame',
    title: 'Netgame',
    icon: '🕸️',
    description: 'Rotate tiles to connect the entire network.',
    category: 'Tile & Spatial',
    rules: `1. Rotate network tiles to connect all paths
2. Every tile must be part of the connected network
3. No loose ends or disconnections allowed
4. Click tiles to rotate them
5. Complete the network to win`,
    tips: `- Start from corner and edge pieces (more constrained)
- Dead ends must connect to their only neighbor
- Work from the outside in`
  },
  {
    folder: 'Netslide',
    title: 'Netslide',
    icon: '🧩',
    description: 'Slide tiles to connect the entire network.',
    category: 'Tile & Spatial',
    rules: `1. Slide rows and columns of network tiles
2. Create a fully connected network
3. Tiles wrap around when slid off the edge
4. All tiles must connect without loose ends
5. Solve by sliding only (no rotation)`,
    tips: `- Note which tiles need to connect to which
- Sliding affects an entire row or column
- The wrap-around can help or hinder`
  },
  {
    folder: 'Cube',
    title: 'Cube',
    icon: '🧊',
    description: 'Solve a cube puzzle by rotating faces.',
    category: 'Tile & Spatial',
    rules: `1. Manipulate the cube to solve it
2. Each face rotation affects multiple pieces
3. Restore the cube to its solved state
4. Standard notation applies for moves
5. Practice builds pattern recognition`,
    tips: `- Learn algorithms for common situations
- Solve layer by layer
- Focus on piece positions, not just colors`
  },
  {
    folder: 'Untangle',
    title: 'Untangle',
    icon: '🕸️',
    description: 'Move points so the lines stop crossing.',
    category: 'Tile & Spatial',
    rules: `1. Drag points to new positions
2. Lines connect fixed pairs of points
3. Eliminate all line crossings
4. Points can be moved anywhere on the canvas
5. Achieve a planar graph (no crossings)`,
    tips: `- Start by spreading points evenly
- Move points that have the most crossings first
- Some graphs have limited valid configurations`
  },
  {
    folder: 'Samegame',
    title: 'Samegame',
    icon: '🧩',
    description: 'Remove groups of adjacent tiles to clear the board efficiently.',
    category: 'Tile & Spatial',
    rules: `1. Click groups of 2+ adjacent same-colored tiles to remove them
2. Larger groups score more points
3. Tiles above fall down to fill gaps
4. Columns shift left when a column empties
5. Clear the board or maximize score`,
    tips: `- Bigger groups are worth exponentially more points
- Plan ahead to create large groups
- Watch how tiles will fall before clicking`
  },

  // Trivia & Knowledge
  {
    folder: 'FlagGuesser',
    title: 'Flag Guesser',
    icon: '🌍',
    description: 'Identify countries by their flags.',
    category: 'Trivia & Knowledge',
    rules: `1. A country's flag is displayed
2. Type or select the correct country name
3. Score points for correct answers
4. You may have limited lives or time
5. Learn all the world's flags!`,
    tips: `- Learn distinctive patterns (Nordic crosses, Pan-African colors)
- Group similar flags by region
- Some flags have unique features (Nepal, Switzerland)`
  },
  {
    folder: 'CapitalGuesser',
    title: 'Capital Guesser',
    icon: '🏛️',
    description: 'Name the capital city of each country.',
    category: 'Trivia & Knowledge',
    rules: `1. A country name is displayed
2. Enter its capital city
3. Spelling must be reasonably accurate
4. Score points for correct answers
5. Learn capital cities worldwide`,
    tips: `- Some countries have surprising capitals (not the largest city)
- Administrative vs. official capitals can differ
- Focus on one continent at a time to learn`
  },
  {
    folder: 'WorldMapFill',
    title: 'World Map Fill',
    icon: '🗺️',
    description: 'Name all the countries to fill in the world map.',
    category: 'Trivia & Knowledge',
    rules: `1. Type country names to fill them in on the map
2. Correctly named countries are highlighted
3. Try to fill in as many as possible
4. Some countries have alternate names that work
5. Challenge: complete the entire world`,
    tips: `- Start with larger, more familiar countries
- Work region by region
- Island nations and small countries are often missed`
  },
  {
    folder: 'ProvincialMapFill',
    title: 'Provincial Map Fill',
    icon: '🗺️',
    description: 'Fill in maps by region: US States, Canadian Provinces, and more!',
    category: 'Trivia & Knowledge',
    rules: `1. Choose a region (US States, Canadian Provinces, etc.)
2. Type division names to fill them in
3. Correctly named regions are highlighted
4. Try for 100% completion
5. Multiple region sets available`,
    tips: `- Start with your home region
- Work geographically (west to east, etc.)
- Some divisions have alternate spellings`
  },
  {
    folder: 'FamousPaintings',
    title: 'Famous Paintings',
    icon: '🖼️',
    description: 'Identify masterpieces by artist, title, or movement.',
    category: 'Trivia & Knowledge',
    rules: `1. A famous painting is displayed
2. Identify aspects like artist, title, or art movement
3. Multiple question types test different knowledge
4. Learn about art history
5. Hints may be available`,
    tips: `- Learn artist signatures and styles
- Recognize art movement characteristics
- Famous paintings often have distinctive features`
  },
  {
    folder: 'Trivia',
    title: 'Trivia',
    icon: '🧠',
    description: 'General knowledge quiz across many topics!',
    category: 'Trivia & Knowledge',
    rules: `1. Questions are presented from various categories
2. Select or type the correct answer
3. Categories include history, science, sports, and more
4. Score points for correct answers
5. Challenge yourself across all topics`,
    tips: `- Read questions carefully before answering
- Eliminate obviously wrong options first
- General knowledge builds over time`
  },
  {
    folder: 'AnatomyQuiz',
    title: 'Anatomy Quiz',
    icon: '🫀',
    description: 'Identify bones, muscles, and organs by clicking on the body diagram!',
    category: 'Trivia & Knowledge',
    rules: `1. Body diagrams display anatomical structures
2. Click on the correct location when prompted
3. Identify bones, muscles, organs, etc.
4. Learn human anatomy interactively
5. Different difficulty levels available`,
    tips: `- Learn anatomical position terminology
- Study major systems (skeletal, muscular, etc.)
- Regional anatomy groups related structures`
  },
  {
    folder: 'Constellations',
    title: 'Constellations',
    icon: '⭐',
    description: 'Identify star constellations! Learn the 88 IAU constellations.',
    category: 'Trivia & Knowledge',
    rules: `1. Star patterns are displayed
2. Identify the constellation name
3. Learn all 88 official IAU constellations
4. Both shapes and patterns are tested
5. Stars are shown as they appear in the night sky`,
    tips: `- Learn major constellations first (Orion, Big Dipper)
- Note distinctive star patterns and bright stars
- Constellation myths help with memory`
  },
  {
    folder: 'PokemonQuiz',
    title: 'Pokémon Quiz',
    icon: '📘',
    description: 'Identify the generation and type(s) for each Pokémon.',
    category: 'Trivia & Knowledge',
    rules: `1. A Pokémon name is displayed
2. Identify its generation and type(s)
3. Some Pokémon have dual types
4. Score for correct identification
5. All generations represented`,
    tips: `- Learn type patterns for each generation
- Evolution lines share generation
- Starter Pokémon help anchor generation knowledge`
  },
  {
    folder: 'PokemonGenBlitz',
    title: 'Pokémon Gen Blitz',
    icon: '⌛',
    description: 'Name as many Pokémon as you can from a chosen generation!',
    category: 'Trivia & Knowledge',
    rules: `1. Select a generation
2. Type Pokémon names as fast as possible
3. Only Pokémon from that generation count
4. Race against the clock
5. Try to name them all!`,
    tips: `- Start with easy-to-spell Pokémon
- Work through evolution lines
- Legendary Pokémon are often memorable`
  },
  {
    folder: 'PeriodicTableQuiz',
    title: 'Periodic Table Quiz',
    icon: '⚗️',
    description: 'Match element symbols to names and vice versa.',
    category: 'Trivia & Knowledge',
    rules: `1. Given element name or symbol
2. Provide the matching symbol or name
3. Learn all 118 elements
4. Atomic numbers may also be tested
5. Challenge yourself to memorize the table`,
    tips: `- Learn common elements first
- Note Latin-origin symbols (Fe, Au, Ag)
- Group elements by category (noble gases, halogens, etc.)`
  },
  {
    folder: 'LanguageQuiz',
    title: 'Language Quiz',
    icon: '🗣️',
    description: 'What languages are spoken in each country?',
    category: 'Trivia & Knowledge',
    rules: `1. A country name is displayed
2. Select its official/main language(s)
3. Some countries have multiple official languages
4. Learn about linguistic diversity
5. Regional and official languages may differ`,
    tips: `- Colonial history affects language distribution
- Some languages span many countries
- Note countries with multiple official languages`
  },
  {
    folder: 'CurrencyQuiz',
    title: 'Currency Quiz',
    icon: '💰',
    description: 'Match countries to their official currencies.',
    category: 'Trivia & Knowledge',
    rules: `1. Given a country, identify its currency
2. Or given a currency, identify countries using it
3. Learn about world currencies
4. Some currencies share names but differ
5. Currency unions (like Euro) are included`,
    tips: `- Many countries use dollar/peso variants
- Euro zone includes many European countries
- Some small nations use larger neighbors' currency`
  },
  {
    folder: 'GodsQuiz',
    title: 'Gods & Domains Quiz',
    icon: '⚡',
    description: 'Match deities to their domains across mythologies.',
    category: 'Trivia & Knowledge',
    rules: `1. Given a deity, identify their domain
2. Or given a domain, identify the deity
3. Covers Greek, Roman, Norse, Egyptian mythologies
4. Learn about mythological figures
5. Some deities have multiple domains`,
    tips: `- Greek and Roman gods often pair (Zeus/Jupiter)
- Norse gods have distinctive characteristics
- Domain associations vary by culture`
  },
  {
    folder: 'ClassicalMusicQuiz',
    title: 'Classical Music Quiz',
    icon: '🎼',
    description: 'Listen to classical masterpieces and guess the composer!',
    category: 'Trivia & Knowledge',
    rules: `1. An excerpt of classical music plays
2. Identify the composer
3. Learn famous works of classical music
4. Multiple eras represented
5. Some rounds may ask for piece title`,
    tips: `- Learn distinctive composer styles
- Era helps narrow down (Baroque, Classical, Romantic)
- Famous pieces are good starting points`
  },
  {
    folder: 'Map',
    title: 'Map',
    icon: '🗺️',
    description: 'Color regions so adjacent regions have different colors.',
    category: 'Trivia & Knowledge',
    rules: `1. A map with regions is displayed
2. Color each region
3. Adjacent regions cannot share the same color
4. Use the minimum number of colors
5. Complete the entire map`,
    tips: `- Four colors suffice for any map
- Start with the most connected regions
- Work outward from completed areas`
  },

  // Memory & Speed
  {
    folder: 'Sequence',
    title: 'Sequence',
    icon: '🔴',
    description: 'Watch, remember, repeat! How long a sequence can you memorize?',
    category: 'Memory & Speed',
    rules: `1. Watch the sequence of colored buttons
2. Repeat the sequence by pressing buttons in order
3. Each round adds one more to the sequence
4. Make a mistake and the game ends
5. How far can you go?`,
    tips: `- Create mental patterns (like a melody)
- Focus on the sequence, not individual colors
- Practice improves memory capacity`
  },
  {
    folder: 'MemoryMatch',
    title: 'Memory Match',
    icon: '🃏',
    description: 'Flip cards to find matching pairs. Test your memory!',
    category: 'Memory & Speed',
    rules: `1. Cards are face-down on the board
2. Flip two cards per turn
3. Matching pairs stay face-up
4. Non-matches flip back
5. Match all pairs to win`,
    tips: `- Remember card positions as you play
- Develop a systematic scanning pattern
- Focus on remembering recent card reveals`
  },

  // Classic Logic
  {
    folder: 'Einstein',
    title: 'Einstein Puzzle',
    icon: '🧠',
    description: 'Use logical clues to deduce which items belong in each house.',
    category: 'Classic Logic',
    rules: `1. Several houses each have multiple attributes
2. Clues relate attributes (e.g., "The red house is left of the blue house")
3. Use logic to deduce all attribute assignments
4. Each attribute appears in exactly one house
5. No guessing needed - pure deduction`,
    tips: `- Mark possibilities in a grid
- Eliminate options systematically
- Some clues are more restrictive - start there`
  },
  {
    folder: 'KnightsAndKnaves',
    title: 'Knights & Knaves',
    icon: '🤥',
    description: 'Decide who always tells the truth and who always lies.',
    category: 'Classic Logic',
    rules: `1. Knights always tell the truth
2. Knaves always lie
3. Characters make statements about themselves or others
4. Deduce who is a knight and who is a knave
5. All statements must be consistently true or false`,
    tips: `- If A says "I am a knave," A is lying (so A is a knave... but then A would be telling truth?)
- Self-referential statements are key
- Test assumptions by checking all statements`
  },
  {
    folder: 'CountdownMath',
    title: 'Countdown Math',
    icon: '🧮',
    description: 'Use six numbers and operations to reach the target.',
    category: 'Classic Logic',
    rules: `1. Six numbers are given (mix of small and large)
2. Use +, -, ×, ÷ to reach the target
3. Each number can only be used once
4. You don't have to use all numbers
5. Only whole positive numbers in intermediate steps`,
    tips: `- Start by estimating how to reach the target roughly
- Large numbers get you close, small numbers adjust
- Working backwards can help`
  },
  {
    folder: 'WaterPouring',
    title: 'Water Pouring',
    icon: '💧',
    description: 'Measure exact amounts by pouring water between jugs.',
    category: 'Classic Logic',
    rules: `1. You have jugs of different capacities
2. Pour water between jugs (fill completely or empty completely)
3. Measure a specific target amount
4. Jugs can be filled from a tap and emptied to a drain
5. No partial pours (only fill to full or pour until empty/full)`,
    tips: `- Think about what remainders you can create
- The GCD of capacities limits what's measurable
- Work backwards from the target`
  },
  {
    folder: 'Blackbox',
    title: 'Black Box',
    icon: '⬛',
    description: 'Shoot rays into a box to deduce where hidden atoms are.',
    category: 'Classic Logic',
    rules: `1. Hidden atoms are inside the black box
2. Fire rays from the edges and observe results
3. Rays can: go straight through, be absorbed, reflect, or deflect
4. Deduce atom positions from ray behavior
5. Minimize rays used for best score`,
    tips: `- A ray absorbed means it hit an atom
- Deflections at 90° indicate an atom to the side
- Double deflection (180°) means atoms on both sides`
  },
  {
    folder: 'Guess',
    title: 'Guess',
    icon: '❓',
    description: 'Make guesses and use clues to deduce the hidden answer.',
    category: 'Classic Logic',
    rules: `1. A hidden answer awaits
2. Make guesses to receive clues
3. Use feedback to narrow possibilities
4. Deduce the exact answer
5. Minimize guesses for best score`,
    tips: `- First guesses should gather maximum information
- Use process of elimination
- Pay attention to all feedback given`
  },
  {
    folder: 'Dominosa',
    title: 'Dominosa',
    icon: '🁢',
    description: 'Place dominoes to cover the grid so each pair appears exactly once.',
    category: 'Classic Logic',
    rules: `1. Numbers are arranged in a grid
2. Cover the grid with dominoes (pairs of adjacent numbers)
3. Each domino type (e.g., 2-3) appears exactly once
4. Dominoes cover exactly two adjacent cells
5. Find the unique valid placement`,
    tips: `- Mark impossible domino placements
- Unique number pairs can only go one place
- Cross off domino types as you place them`
  },
  {
    folder: 'Magnets',
    title: 'Magnets',
    icon: '🧲',
    description: 'Place magnets with + and − poles so rows/columns match counts.',
    category: 'Classic Logic',
    rules: `1. Domino-shaped spaces can be: +/-, -/+, or empty
2. Numbers outside show how many +/- in that row/column
3. Identical poles cannot be adjacent
4. Some spaces must remain empty
5. Satisfy all row and column counts`,
    tips: `- + and - alternate where magnets touch
- Empty spaces break the alternating pattern
- Row/column counts limit possibilities`
  },
  {
    folder: 'Range',
    title: 'Range',
    icon: '📏',
    description: 'Use row/column clues to determine visibility and placement.',
    category: 'Classic Logic',
    rules: `1. Place elements in the grid
2. Numbers indicate visibility or counts
3. Elements may block the view of others
4. Satisfy all row and column clues
5. Use logic to determine placements`,
    tips: `- Work from most constrained clues
- Visibility depends on element heights/positions
- Cross-reference row and column clues`
  },
  {
    folder: 'Undead',
    title: 'Undead',
    icon: '👻',
    description: 'Place ghosts, vampires, and zombies satisfying line-of-sight clues.',
    category: 'Classic Logic',
    rules: `1. Place three types of monsters in the grid
2. Ghosts are invisible in mirrors
3. Vampires don't appear in mirrors
4. Zombies are always visible
5. Edge numbers show how many monsters are seen looking in`,
    tips: `- Mirrors flip which monsters are visible
- Count both direct and mirror views
- Some cells may have only one valid monster type`
  },
  {
    folder: 'Shinro',
    title: 'Shinro',
    icon: '💎',
    description: 'Find hidden gems using arrow hints and row/column counts.',
    category: 'Classic Logic',
    rules: `1. Gems are hidden in the grid
2. Arrow clues point toward at least one gem
3. Row/column numbers show total gems in that line
4. Use clues to deduce gem locations
5. Find all gems to win`,
    tips: `- Arrows narrow down gem regions
- Row/column counts are exact
- Cross-reference multiple arrows pointing to the same area`
  },
  {
    folder: 'NavalBattle',
    title: 'Naval Battle',
    icon: '🚢',
    description: 'Place ships using row/column clues. Ships cannot touch!',
    category: 'Classic Logic',
    rules: `1. Place a fleet of ships of various sizes
2. Ships are horizontal or vertical only
3. Ships cannot touch (not even diagonally)
4. Row/column numbers show ship cells in that line
5. Find all ship positions`,
    tips: `- Mark water around confirmed ship cells
- Large ships are most constrained
- Use process of elimination for ship placement`
  },
];

function generateReadme(game) {
  return `# ${game.icon} ${game.title}

${game.description}

## Category

${game.category}

## How to Play

${game.rules}

## Tips & Strategy

${game.tips}

---

*Part of the [Enigma](https://github.com/ianfhunter/Enigma) puzzle collection*
`;
}

let created = 0;
let updated = 0;

for (const game of games) {
  const gamePath = join(pagesDir, game.folder);
  const readmePath = join(gamePath, 'README.md');

  if (!existsSync(gamePath)) {
    console.warn(`⚠️  Folder doesn't exist: ${game.folder}`);
    continue;
  }

  const content = generateReadme(game);
  writeFileSync(readmePath, content);

  if (existsSync(readmePath)) {
    updated++;
    console.log(`📝 Updated: ${game.folder}/README.md`);
  } else {
    created++;
    console.log(`✅ Created: ${game.folder}/README.md`);
  }
}

console.log(`\n📝 Summary: ${created + updated} READMEs written with full rules`);
