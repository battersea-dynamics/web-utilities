# data-sources

Raw source data that the generator scripts read. **Not served to the web** —
nothing in this folder is copied into `dist/`. The scripts in `scripts/` turn
these files into the JSON under `public/data/`, and that generated output is
what actually ships.

These files are committed rather than gitignored, so regenerating the site's
data never depends on a download still being available years from now.

## Expected files

### `enable1.txt`

The ENABLE2K master word list — about 172,800 words, one per line, plain
ASCII. Used to build the Scrabble and Words With Friends dictionaries.

Download from <https://norvig.com/ngrams/enable1.txt> and save it here with
exactly that filename.

**Why ENABLE and not the official lists:** the tournament dictionaries —
Collins Scrabble Words (CSW/SOWPODS) and the NASPA Word List (TWL) — are
copyrighted and cannot be redistributed. ENABLE was explicitly released into
the public domain by its authors, who wrote:

> The ENABLE master word list, WORD.LST, is herewith formally released into
> the Public Domain. Anyone is free to use it or distribute it in any manner
> they see fit. […] This word list is our gift to the Scrabble community, as
> an alternate to "official" word lists. Game designers may feel free to
> incorporate the WORD.LST into their games.

They ask to be credited as originators. That credit appears on the word-game
tool pages and must stay there.

**Do not** swap this for a Collins or TWL list, and be wary of npm packages
that bundle "Scrabble dictionaries" — at least one popular MIT-licensed
package ships `sowpods.txt` and `twl.txt`, which the packager had no right to
relicense.
