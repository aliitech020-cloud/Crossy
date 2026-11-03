// Crossword grid generator.
// Each row holds at most one ACROSS word and each column at most one DOWN word,
// so every row has one clue at its start and every column one clue on top.
// A clue can be a picture or a word, in rows and columns alike.
(function (global) {
  'use strict';

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var MAX_LEVEL = 100;

  function levelParams(level) {
    var size = level <= 3 ? 5 : level <= 8 ? 6 : level <= 16 ? 7 : level <= 30 ? 8 : 9;
    var maxBySize = { 5: 4, 6: 5, 7: 7, 8: 8, 9: 10 };
    return {
      level: level,
      size: size,
      target: Math.min(3 + Math.floor((level - 1) / 2), maxBySize[size]),
      maxTier: level <= 4 ? 1 : level <= 12 ? 2 : 3,
      minLen: level <= 20 ? 3 : 4,
      // chance that a clue is a word (synonym) instead of a picture
      textClueProb: level <= 3 ? 0.2 : level <= 8 ? 0.35 : level <= 18 ? 0.5 : 0.6,
      // higher levels prefer longer and harder words
      hardBias: level <= 6 ? 0 : Math.min(1.5, (level - 6) / 15),
      // computer opponent strength
      cpuKnow: Math.min(0.7, 0.25 + level * 0.015),
      cpuLearn: Math.min(0.35, 0.1 + level * 0.008),
      cpuMax: Math.min(3, 1 + Math.floor(level / 8)),
      cpuRack: level <= 4 ? 3 : size <= 7 ? 4 : 5,
      cpuMistake: Math.max(0.04, 0.22 - level * 0.006),
      distractRatio: Math.min(0.45, 0.12 + level * 0.012),
      rack: size <= 5 ? 4 : size <= 7 ? 5 : 6,
      aids: level <= 10 ? 2 : 1
    };
  }

  function buildPool(words, p) {
    var across = [], down = [];
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      var len = w.l.length;
      if (len < p.minLen || len > p.size || w.t > p.maxTier) continue;
      var weight = (1 + p.hardBias * (w.t - 1)) * (1 + p.hardBias * 0.35 * (len - 3));
      var item = { word: w, weight: weight, idx: i };
      across.push(item);
      down.push(item);
    }
    return { across: across, down: down };
  }

  function tryBuild(p, rng, pool) {
    var n = p.size;
    var grid = [], cellA = [], cellD = [];
    for (var r = 0; r < n; r++) {
      grid.push(new Array(n).fill(null));
      cellA.push(new Array(n).fill(-1));
      cellD.push(new Array(n).fill(-1));
    }
    var rowUsed = new Array(n).fill(false), colUsed = new Array(n).fill(false);
    var placed = [], used = {};

    function inB(r, c) { return r >= 0 && c >= 0 && r < n && c < n; }

    function fit(letters, r0, c0, dir) {
      var dr = dir === 'd' ? 1 : 0, dc = dir === 'a' ? 1 : 0, len = letters.length;
      var er = r0 + dr * (len - 1), ec = c0 + dc * (len - 1);
      if (!inB(r0, c0) || !inB(er, ec)) return -1;
      if (dir === 'a' && rowUsed[r0]) return -1;
      if (dir === 'd' && colUsed[c0]) return -1;
      if (inB(r0 - dr, c0 - dc) && grid[r0 - dr][c0 - dc]) return -1;
      if (inB(er + dr, ec + dc) && grid[er + dr][ec + dc]) return -1;
      var cross = 0;
      for (var k = 0; k < len; k++) {
        var r = r0 + dr * k, c = c0 + dc * k, g = grid[r][c];
        if (g) {
          if (g !== letters[k]) return -1;
          cross++;
        } else {
          if (inB(r + dc, c + dr) && grid[r + dc][c + dr]) return -1;
          if (inB(r - dc, c - dr) && grid[r - dc][c - dr]) return -1;
        }
      }
      if (placed.length && (cross === 0 || cross === len)) return -1;
      return cross;
    }

    function put(item, r0, c0, dir) {
      var letters = item.word.l, dr = dir === 'd' ? 1 : 0, dc = dir === 'a' ? 1 : 0;
      var wi = placed.length;
      for (var k = 0; k < letters.length; k++) {
        var r = r0 + dr * k, c = c0 + dc * k;
        grid[r][c] = letters[k];
        if (dir === 'a') cellA[r][c] = wi; else cellD[r][c] = wi;
      }
      if (dir === 'a') rowUsed[r0] = true; else colUsed[c0] = true;
      used[item.word.w] = true;
      placed.push({ item: item, r: r0, c: c0, dir: dir });
    }

    function pickWeighted(list) {
      var tot = 0, i;
      for (i = 0; i < list.length; i++) tot += list[i].weight;
      var x = rng() * tot;
      for (i = 0; i < list.length; i++) { x -= list[i].weight; if (x <= 0) return list[i]; }
      return list[list.length - 1];
    }

    // first word goes across in a random row
    var firstList = pool.across.filter(function (it) { return it.word.l.length >= Math.min(n, 4) || n <= 5; });
    if (!firstList.length) firstList = pool.across;
    var first = pickWeighted(firstList);
    var fr = Math.floor(rng() * n);
    var fc = Math.floor(rng() * (n - first.word.l.length + 1));
    put(first, fr, fc, 'a');

    while (placed.length < p.target) {
      var cands = [];
      for (var r2 = 0; r2 < n; r2++) {
        for (var c2 = 0; c2 < n; c2++) {
          var L = grid[r2][c2];
          if (!L) continue;
          var dirs = [];
          if (cellA[r2][c2] < 0 && !rowUsed[r2]) dirs.push('a');
          if (cellD[r2][c2] < 0 && !colUsed[c2]) dirs.push('d');
          for (var di = 0; di < dirs.length; di++) {
            var dir = dirs[di];
            var list = dir === 'a' ? pool.across : pool.down;
            for (var wi = 0; wi < list.length; wi++) {
              var it = list[wi];
              if (used[it.word.w]) continue;
              var ls = it.word.l;
              for (var j = 0; j < ls.length; j++) {
                if (ls[j] !== L) continue;
                var r0 = dir === 'd' ? r2 - j : r2;
                var c0 = dir === 'a' ? c2 - j : c2;
                var cr = fit(ls, r0, c0, dir);
                if (cr > 0) cands.push({ item: it, r: r0, c: c0, dir: dir, score: it.weight * (1 + cr * 0.8) * (0.5 + rng()) });
              }
            }
          }
        }
      }
      if (!cands.length) break;
      cands.sort(function (a, b) { return b.score - a.score; });
      var top = cands.slice(0, 4);
      var ch = top[Math.floor(rng() * top.length)];
      put(ch.item, ch.r, ch.c, ch.dir);
    }
    return placed;
  }

  function generate(level, words, seedExtra) {
    var p = levelParams(level);
    var rng = mulberry32(level * 7919 + (seedExtra || 0) * 104729 + 13);
    var pool = buildPool(words, p);
    var best = null;
    for (var attempt = 0; attempt < 60; attempt++) {
      var res = tryBuild(p, rng, pool);
      if (!best || res.length > best.length) best = res;
      if (best.length >= p.target) break;
    }
    // crop the grid to the words' bounding box
    var minR = 99, minC = 99, maxR = -1, maxC = -1;
    best.forEach(function (pl) {
      var len = pl.item.word.l.length;
      var er = pl.dir === 'd' ? pl.r + len - 1 : pl.r, ec = pl.dir === 'a' ? pl.c + len - 1 : pl.c;
      minR = Math.min(minR, pl.r); minC = Math.min(minC, pl.c);
      maxR = Math.max(maxR, er); maxC = Math.max(maxC, ec);
    });
    var rows = maxR - minR + 1, cols = maxC - minC + 1;
    var cells = [];
    for (var r = 0; r < rows; r++) {
      var row = [];
      for (var c = 0; c < cols; c++) row.push(null);
      cells.push(row);
    }
    var out = best.map(function (pl, wi) {
      var w = pl.item.word, r0 = pl.r - minR, c0 = pl.c - minC;
      var mode = 'emoji';
      if (!w.e || rng() < p.textClueProb) mode = 'text';
      for (var k = 0; k < w.l.length; k++) {
        var r = pl.dir === 'd' ? r0 + k : r0, c = pl.dir === 'a' ? c0 + k : c0;
        if (!cells[r][c]) cells[r][c] = { letter: w.l[k], a: -1, d: -1, owner: null };
        if (pl.dir === 'a') cells[r][c].a = wi; else cells[r][c].d = wi;
      }
      return { text: w.w, letters: w.l, emoji: w.e, clue: w.d, dir: pl.dir, r: r0, c: c0, mode: mode, done: false };
    });
    return { level: level, params: p, rows: rows, cols: cols, cells: cells, words: out };
  }

  var api = { generate: generate, levelParams: levelParams, mulberry32: mulberry32, MAX_LEVEL: MAX_LEVEL };
  if (typeof module !== 'undefined') module.exports = api; else global.Puzzle = api;
})(this);
