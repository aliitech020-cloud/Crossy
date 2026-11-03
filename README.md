# Crossy Words 🧩

A picture crossword game for Android where you play against the computer.

- Every **column** has a clue on top and every **row** has a clue at its start.
  A clue can be a **picture** or a **word** (synonym), in rows and columns alike.
- Each turn you get a set of letters: **drag** them onto the squares. Then the computer plays.
- **Pass** skips your turn and swaps your letters.
- Two helpers: 💡 **Reveal** a square and 🎯 **Hint**.
- 100 levels that get harder: bigger grids, longer and harder words, more word clues
  instead of pictures, and a smarter computer.

## Download & install

1. Open the **Releases** page of this repository on your phone.
2. Download the latest `crossy-XX.apk`.
3. Open it and allow installing from unknown sources if asked.

The APK is built automatically by GitHub Actions on every push (`.github/workflows/build-apk.yml`).

## Project layout

- `app/src/main/assets/` – the game (HTML/CSS/JS), works offline.
  - `words.js` – word list (`WORD|emoji|clue|tier`); add your own words here.
  - `puzzle.js` – grid generator and per-level difficulty settings.
  - `game.js` – gameplay, drag & drop and the computer opponent.
- `app/src/main/java/.../MainActivity.java` – Android WebView wrapper.
- `tools/check-levels.js` – checks every level generates correctly: `node tools/check-levels.js`.

## Build locally

Requires the Android SDK and JDK 17:

```
./gradlew assembleRelease
```
