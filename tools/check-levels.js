// يتحقق من أن كل المستويات تولّد شبكات صحيحة
const words = require('../app/src/main/assets/words.js');
const P = require('../app/src/main/assets/puzzle.js');
let bad = 0;
const seen = {};
for (const w of words) { if (seen[w.w]) console.log('duplicate', w.w); seen[w.w] = 1; }
for (let L = 1; L <= P.MAX_LEVEL; L++) {
  const t = Date.now();
  const g = P.generate(L, words);
  const ms = Date.now() - t;
  // تحقق: كل كلمة تطابق الخلايا
  for (const w of g.words) {
    w.letters.forEach((ch, k) => {
      const r = w.dir === 'd' ? w.r + k : w.r, c = w.dir === 'a' ? w.c + k : w.c;
      if (!g.cells[r][c] || g.cells[r][c].letter !== ch) { bad++; console.log('mismatch', L, w.text); }
    });
  }
  const rowsA = new Set(g.words.filter(w => w.dir === 'a').map(w => w.r));
  const colsD = new Set(g.words.filter(w => w.dir === 'd').map(w => w.c));
  if (rowsA.size !== g.words.filter(w => w.dir === 'a').length || colsD.size !== g.words.filter(w => w.dir === 'd').length) { bad++; console.log('dup row/col', L); }
  const n = g.cells.flat().filter(Boolean).length;
  if (L % 1 === 0) console.log(`L${L} ${g.rows}x${g.cols} words=${g.words.length}/${g.params.target} cells=${n} ${ms}ms :: ` + g.words.map(w => w.dir + ':' + w.text + (w.mode === 'text' ? '(' + w.clue + ')' : w.emoji)).join(' '));
  if (g.words.length < 3) { bad++; console.log('too few words', L); }
}
console.log(bad ? 'FAIL ' + bad : 'OK');
process.exit(bad ? 1 : 0);
