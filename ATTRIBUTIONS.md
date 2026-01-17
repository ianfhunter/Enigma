# Attributions

This document lists all third-party assets, resources, and attributions used in Enigma.

## Puzzle Datasets

### PuzzleKit Dataset (Janko.at)

The majority of puzzle datasets are sourced from:

- **Repository**: [puzzlekit-dataset](https://github.com/SmilingWayne/puzzlekit-dataset)
- **Original Source**: [Janko.at](https://www.janko.at/Raetsel/)
- **License**: MIT

| Puzzle | Total | Easy | Medium | Hard |
|--------|-------|------|--------|------|
| ABCEndView | 607 | 607 | - | - |
| Akari (Light Up) | 970 | 25 | 273 | 672 |
| Battleship | 858 | 17 | 841 | - |
| Binairo (Takuzu) | 380 | 26 | 354 | - |
| Corral | 419 | 52 | 362 | 5 |
| Creek | 440 | - | 290 | 150 |
| Fillomino | 840 | 35 | 450 | 355 |
| Galaxies | 580 | 6 | 321 | 253 |
| Gokigen Naname | 780 | 20 | 451 | 309 |
| Hidato | 510 | 259 | 251 | - |
| Hitori | 941 | 244 | 439 | 258 |
| Kakuro | 999 | 113 | 638 | 248 |
| KenKen (Calcudoku) | 430 | 229 | 201 | - |
| Killer Sudoku | 810 | 324 | 486 | - |
| Kurotto | 230 | 2 | 204 | 24 |
| LITS | 419 | 9 | 250 | 160 |
| Magnetic | 439 | 168 | 271 | - |
| Masyu (Pearl) | 828 | 23 | 301 | 504 |
| Minesweeper | 360 | 91 | 204 | 65 |
| Mosaic | 104 | - | - | 104 |
| Nonogram | 2337 | - | 320 | 2017 |
| Norinori | 289 | 4 | 207 | 78 |
| Numberlink | 580 | 16 | 371 | 193 |
| Nurikabe | 1130 | 92 | 590 | 448 |
| Shikaku | 500 | 1 | 183 | 316 |
| Skyscraper | 470 | 470 | - | - |
| Slitherlink (Loopy) | 1152 | 49 | 480 | 623 |
| Star Battle | 307 | 79 | 224 | 4 |
| Str8ts | 560 | 99 | 461 | - |
| Suguru | 200 | 130 | 70 | - |
| Tatamibari | 150 | 29 | 121 | - |
| Tents | 706 | - | 350 | 356 |
| Thermometer | 250 | 144 | 106 | - |
| Yajilin | 610 | 12 | 206 | 392 |
| Yin-Yang | 170 | 14 | 156 | - |

### Simon Tatham's Portable Puzzle Collection

Additional Galaxies puzzles are generated using Simon Tatham's puzzle generator:

- **Project**: Simon Tatham's Portable Puzzle Collection
- **Website**: https://www.chiark.greenend.org.uk/~sgtatham/puzzles/
- **Repository**: https://git.tartarus.org/?p=simon/puzzles.git
- **License**: MIT License

Generated puzzle distribution:
- 5×5: 200 puzzles
- 7×7: 300 puzzles
- 9×9: 200 puzzles
- 11×11: 200 puzzles

### Suguru (Curated)

Additional curated Suguru puzzles sourced from:

- **Website**: [janko.at](https://www.janko.at/Raetsel/Suguru/)
- **Author**: Otto Janko
- **License**: Creative Commons 3.0 BY-NC-SA (Attribution-NonCommercial-ShareAlike)
- **Sizes**: 6×6, 7×7, 8×8, 9×9, 10×10 (50 puzzles)

### Riddles Dataset

Riddles used in the Riddles game:

- **Repository**: [crawsome/riddles](https://github.com/crawsome/riddles)
- **Source**: CSV dataset from GitHub
- **Count**: 386 riddles
- **Format**: Question and answer pairs

### Crossword Clues Dataset

Crossword puzzle clues generated from:

#### MsFit Wordlist
- **Repository**: [crossword-dataset](https://github.com/nzfeng/crossword-dataset)
- **Author**: Nicole Feng
- **License**: GPL-3.0
- **Entries**: ~42,000 curated American English words and phrases
- **Note**: The crossword component (including this dataset) is licensed under GPL-3.0. See [LICENSE/GPL3-CROSSWORD.txt](../LICENSE/GPL3-CROSSWORD.txt) for details.

#### WordNet Definitions
- **Project**: [WordNet](https://wordnet.princeton.edu/)
- **Institution**: Princeton University
- **License**: WordNet License (BSD-style, permissive)
- **Usage**: Word definitions used as crossword clues
- **npm package**: [wordnet](https://www.npmjs.com/package/wordnet) (MIT)

Combined dataset: ~26,500 clue/answer pairs

## Images

### Nonogram Images

#### 1-bit Pixel Icons
- **Author**: Nikoichu
- **License**: CC0 (Public Domain)
- **Source**: https://nikoichu.itch.io/pixel-icons
- **Usage**: Used for nonogram puzzle images

#### Roguelike Tiles
- **Author**: Hexany Ives
- **License**: CC 1.0
- **Source**: https://hexany-ives.itch.io/hexanys-roguelike-tiles
- **Usage**: Used for nonogram puzzle images

### Famous Paintings

All painting images are sourced from **Wikimedia Commons** and are in the **Public Domain** or under appropriate Creative Commons licenses. Each painting includes attribution information in the game data.

**Sources**:
- Wikimedia Commons (https://commons.wikimedia.org/)
- Google Art Project
- Various museums and galleries

**License**: Public Domain (works whose copyright has expired) or Creative Commons licenses as specified in individual painting metadata.

## Audio

### Classical Music (27 pieces)

All classical music recordings are sourced from the **[Internet Archive](https://archive.org/)** with verified public domain or Creative Commons licenses.

**Licenses Used**:
- Public Domain (recordings of works by composers deceased > 70 years)
- CC0 (Creative Commons Zero - Public Domain Dedication)
- Public Domain Mark 1.0

**Format**: MP3

| # | Piece | Composer | License |
|---|-------|----------|---------|
| 1 | Symphony No. 5 (1st mvt) | Beethoven | Public Domain |
| 2 | Eine kleine Nachtmusik (1st mvt) | Mozart | PD Mark |
| 3 | Toccata and Fugue in D minor | Bach | Public Domain |
| 4 | Canon in D | Pachelbel | CC0 |
| 5 | Ride of the Valkyries | Wagner | Public Domain |
| 6 | The Blue Danube Waltz | Strauss II | PD Mark |
| 7 | Hungarian Rhapsody No. 2 | Liszt | PD Mark |
| 8 | Moonlight Sonata (1st mvt) | Beethoven | Public Domain |
| 9 | In the Hall of the Mountain King | Grieg | PD Mark |
| 10 | Morning Mood (Peer Gynt) | Grieg | PD Mark |
| 11 | Minute Waltz | Chopin | PD Mark |
| 12 | Clair de Lune | Debussy | PD Mark |
| 13 | Boléro | Ravel | PD Mark |
| 14 | Habanera (Carmen) | Bizet | PD Mark |
| 15 | Ave Maria | Schubert | PD Mark |
| 16 | Unfinished Symphony (1st mvt) | Schubert | CC0 |
| 17 | Piano Concerto No. 2 (1st mvt) | Rachmaninoff | PD Mark |
| 18 | Symphony No. 5 (Adagietto) | Mahler | PD Mark |
| 19 | La donna è mobile (Rigoletto) | Verdi | PD Mark |
| 20 | Nessun dorma (Turandot) | Puccini | PD Mark |
| 21 | Brandenburg Concerto No. 3 (1st mvt) | Bach | CC0 |
| 22 | Hallelujah Chorus (Messiah) | Handel | Public Domain |
| 23 | Hungarian Dance No. 5 | Brahms | CC0 |
| 24 | New World Symphony (Largo) | Dvořák | CC0 |
| 25 | The Moldau (Vltava) | Smetana | CC0 |
| 26 | The Bartered Bride Overture | Smetana | PD Mark |
| 27 | Romeo and Juliet - Dance of the Knights | Prokofiev | PD Mark |

See `public/audio/classical/ATTRIBUTIONS.md` for detailed source URLs and performer information.

## Word Lists

### Word Lists and Dictionaries

Word lists used in word games are compiled from:
- Public domain word lists
- ENABLE word list
- Various open-source dictionary sources

### Japanese Dictionary (Shiritori)

- **Source**: JMdict Japanese-English dictionary
- **License**: Creative Commons Attribution-ShareAlike License
- **Website**: https://www.edrdg.org/jmdict/j_jmdict.html

## Code and Libraries

### Open Source Libraries

Enigma is built using the following open-source libraries:

- **React** (MIT License) - https://react.dev/
- **Vite** (MIT License) - https://vitejs.dev/
- **React Router** (MIT License) - https://reactrouter.com/
- **Konva** (MIT License) - https://konvajs.org/
- **React Konva** (MIT License) - https://github.com/konvajs/react-konva

All dependencies are listed in `package.json` with their respective licenses.

## Credits

If you believe your work has been used without proper attribution, please contact us at ianfhunter@gmail.com and we will address it promptly.

---

**Last Updated**: January 2026

### Knights and Knaves Puzzles

- **Source**: [K-and-K/knights-and-knaves](https://huggingface.co/datasets/K-and-K/knights-and-knaves) on Hugging Face
- **License**: CC BY-NC-SA 4.0 (Creative Commons Attribution-NonCommercial-ShareAlike 4.0)
- **Usage**: Logic puzzles featuring Knights (truth-tellers) and Knaves (liars)
