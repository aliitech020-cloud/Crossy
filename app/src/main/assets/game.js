(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var MAX_LEVEL = Puzzle.MAX_LEVEL;
  var STORE = 'crossy.en.v1';
  var DISTRACT = 'EEEEEAAAAIIIOOONNNRRRTTTSSSLLDDUCMPHGBFYWKV';

  // ---------------- storage ----------------
  function loadStore() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE));
      if (s && s.unlocked) { s.stars = s.stars || {}; if (s.sound === undefined) s.sound = true; return s; }
    } catch (e) { /* ignore */ }
    return { unlocked: 1, stars: {}, sound: true };
  }
  var store = loadStore();
  function save() { try { localStorage.setItem(STORE, JSON.stringify(store)); } catch (e) { /* ignore */ } }

  // ---------------- sounds ----------------
  var actx = null;
  function tone(freqs, dur, type) {
    if (!store.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime;
      freqs.forEach(function (f, i) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = type || 'sine';
        o.frequency.value = f;
        var st = t + i * dur;
        g.gain.setValueAtTime(0.0001, st);
        g.gain.exponentialRampToValueAtTime(0.18, st + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
        o.connect(g); g.connect(actx.destination);
        o.start(st); o.stop(st + dur + 0.05);
      });
    } catch (e) { /* ignore */ }
  }
  var SFX = {
    click: function () { tone([520], 0.04); },
    place: function () { tone([660, 880], 0.07); },
    wrong: function () { tone([220, 150], 0.16, 'square'); },
    word: function () { tone([523, 659, 784, 1046], 0.09, 'triangle'); },
    cpu: function () { tone([392, 494], 0.07, 'triangle'); },
    win: function () { tone([523, 659, 784, 1046, 1318], 0.12, 'triangle'); },
    lose: function () { tone([392, 330, 262], 0.2, 'sawtooth'); }
  };

  // ---------------- utils ----------------
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  var SPEED = 1;
  function later(fn, ms) { return setTimeout(fn, ms * SPEED); }
  var tileSeq = 0;
  function mkTile(ch) { return { ch: ch, id: ++tileSeq }; }
  function starsText(n) {
    var s = '';
    for (var i = 0; i < 3; i++) s += i < n ? '★' : '☆';
    return s;
  }

  var toastTimer = null;
  function toast(msg, ms) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, ms || 1800);
  }

  // ---------------- screens ----------------
  var current = 'home';
  function show(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('active', s.id === id); });
    current = id;
    if (id === 'levels') renderLevels();
    if (id === 'game') layout();
  }

  function renderLevels() {
    var g = $('levelGrid');
    g.innerHTML = '';
    for (var L = 1; L <= MAX_LEVEL; L++) {
      var b = document.createElement('button');
      var locked = L > store.unlocked;
      b.className = 'lv' + (locked ? ' locked' : '') + (L === store.unlocked ? ' current' : '');
      b.innerHTML = (locked ? '🔒' : L) + '<small>' + (store.stars[L] ? starsText(store.stars[L]) : '') + '</small>';
      (function (lv, lk) {
        b.onclick = function () {
          if (lk) { toast('Finish the previous levels first 🔒'); return; }
          SFX.click();
          startLevel(lv);
        };
      })(L, locked);
      g.appendChild(b);
    }
    var cur = g.querySelector('.current');
    if (cur) setTimeout(function () { cur.scrollIntoView({ block: 'center' }); }, 30);
  }

  // ---------------- modal ----------------
  function showModal(o) {
    $('mEmoji').textContent = o.emoji || '';
    $('mTitle').textContent = o.title || '';
    var st = $('mStars');
    st.innerHTML = '';
    if (o.stars !== undefined) {
      for (var i = 0; i < 3; i++) {
        var sp = document.createElement('span');
        sp.textContent = '⭐';
        if (i >= o.stars) sp.className = 'off';
        st.appendChild(sp);
      }
    }
    $('mText').innerHTML = o.text || '';
    var bx = $('mBtns');
    bx.innerHTML = '';
    o.buttons.forEach(function (bt) {
      var b = document.createElement('button');
      b.className = 'btn' + (bt.primary ? ' primary' : '');
      b.textContent = bt.label;
      b.onclick = function () { SFX.click(); closeModal(); bt.fn(); };
      bx.appendChild(b);
    });
    $('modal').classList.add('show');
  }
  function closeModal() { $('modal').classList.remove('show'); }
  function modalOpen() { return $('modal').classList.contains('show'); }

  // ---------------- game state ----------------
  var G = null;

  function startLevel(level) {
    closeModal();
    var pz = Puzzle.generate(level, WORD_DATA);
    var p = pz.params;
    G = {
      level: level, pz: pz, p: p, cells: pz.cells, words: pz.words,
      bag: [], rackP: [], rackC: [],
      score: { p: 0, c: 0 },
      turn: 'p', placed: 0, passes: 0,
      aids: { reveal: p.aids, hint: p.aids }, aidsUsed: 0,
      selTile: -1, selCell: null, mode: null, busy: false, over: false,
      cpuKnows: pz.words.map(function () { return Math.random() < p.cpuKnow; }),
      hint: null, hlWords: [], seen: {}, els: []
    };
    var needed = 0;
    eachCell(function (cell) { G.bag.push(cell.letter); needed++; });
    var extra = Math.round(needed * p.distractRatio);
    for (var i = 0; i < extra; i++) G.bag.push(DISTRACT[Math.floor(Math.random() * DISTRACT.length)]);
    shuffle(G.bag);
    refill(G.rackP);
    refill(G.rackC);
    buildBoard();
    show('game');
    renderAll();
    setStatus();
    toast('Level ' + level + ' – you start!');
  }

  function eachCell(fn) {
    for (var r = 0; r < G.pz.rows; r++)
      for (var c = 0; c < G.pz.cols; c++)
        if (G.cells[r][c]) fn(G.cells[r][c], r, c);
  }
  function refill(rack) {
    var max = rack === G.rackC ? G.p.cpuRack : G.p.rack;
    while (rack.length < max && G.bag.length) rack.push(mkTile(G.bag.pop()));
  }
  function returnToBag(ch) {
    G.bag.splice(Math.floor(Math.random() * (G.bag.length + 1)), 0, ch);
  }
  function isFull() {
    var full = true;
    eachCell(function (cell) { if (!cell.owner) full = false; });
    return full;
  }
  function wordCells(wi) {
    var w = G.words[wi], out = [];
    for (var k = 0; k < w.letters.length; k++) {
      out.push(w.dir === 'd' ? [w.r + k, w.c] : [w.r, w.c + k]);
    }
    return out;
  }
  function fillRatio(wi) {
    var cs = wordCells(wi), f = 0;
    cs.forEach(function (rc) { if (G.cells[rc[0]][rc[1]].owner) f++; });
    return f / cs.length;
  }

  // ---------------- rendering ----------------
  function buildBoard() {
    var b = $('board'), R = G.pz.rows, C = G.pz.cols;
    b.innerHTML = '';
    b.style.gridTemplateColumns = 'repeat(' + (C + 1) + ', var(--cellsize))';
    G.colClue = []; G.rowClue = []; G.els = [];
    var corner = document.createElement('div');
    corner.className = 'corner';
    corner.textContent = '🧩';
    b.appendChild(corner);
    var c, r;
    for (c = 0; c < C; c++) b.appendChild(makeClue('d', c));
    for (r = 0; r < R; r++) {
      b.appendChild(makeClue('a', r));
      G.els.push([]);
      for (c = 0; c < C; c++) {
        var el = document.createElement('div');
        var cell = G.cells[r][c];
        el.className = 'cell ' + (cell ? 'open' : 'block');
        el.dataset.r = r;
        el.dataset.c = c;
        if (cell) {
          (function (rr, cc) { el.onclick = function () { onCell(rr, cc); }; })(r, c);
        }
        b.appendChild(el);
        G.els[r].push(el);
      }
    }
  }

  function makeClue(dir, idx) {
    var el = document.createElement('div');
    var wi = -1;
    G.words.forEach(function (w, i) { if (w.dir === dir && (dir === 'd' ? w.c : w.r) === idx) wi = i; });
    if (wi < 0) {
      el.className = 'clue empty';
    } else {
      var w = G.words[wi];
      el.className = 'clue' + (w.mode === 'text' ? ' text' : '');
      el.innerHTML = '';
      var span = document.createElement('span');
      span.textContent = w.mode === 'text' ? w.clue : w.emoji;
      el.appendChild(span);
      var n = document.createElement('span');
      n.className = 'n';
      n.textContent = w.letters.length;
      el.appendChild(n);
      el.onclick = function () { SFX.click(); selectWords([wi]); };
      w.el = el;
    }
    (dir === 'd' ? G.colClue : G.rowClue).push(el);
    return el;
  }

  function layout() {
    if (!G || current !== 'game') return;
    var wrap = document.querySelector('.board-wrap');
    var W = wrap.clientWidth - 12, H = wrap.clientHeight - 8;
    var C = G.pz.cols + 1, R = G.pz.rows + 1, gap = 3;
    var s = Math.floor(Math.min((W - gap * (C - 1)) / C, (H - gap * (R - 1)) / R, 62));
    s = Math.max(s, 24);
    document.documentElement.style.setProperty('--cellsize', s + 'px');
    fitClues(s);
  }

  // shrink each text clue until it fits its square without splitting words
  function fitClues(cell) {
    G.words.forEach(function (w) {
      if (!w.el || w.mode !== 'text') return;
      var span = w.el.firstChild;
      var size = cell * 0.3;
      span.style.fontSize = size + 'px';
      var maxW = cell - 4, maxH = cell - 4;
      while (size > 7 && (span.scrollWidth > maxW || span.offsetHeight > maxH)) {
        size -= 0.5;
        span.style.fontSize = size + 'px';
      }
    });
  }
  window.addEventListener('resize', layout);

  function renderAll() { renderBoard(); renderRack(); renderScores(); renderActions(); }

  function renderBoard() {
    var hl = {};
    G.hlWords.forEach(function (wi) { wordCells(wi).forEach(function (rc) { hl[rc[0] + ',' + rc[1]] = 1; }); });
    eachCell(function (cell, r, c) {
      var el = G.els[r][c];
      var cls = 'cell open';
      if (cell.owner) cls += ' ' + cell.owner;
      if (hl[r + ',' + c] && !cell.owner) cls += ' hl';
      if (G.selCell && G.selCell.r === r && G.selCell.c === c) cls += ' sel';
      if (G.hint && G.hint.r === r && G.hint.c === c && !cell.owner) cls += ' pulse';
      if (el._extra) cls += ' ' + el._extra;
      el.className = cls;
      el.textContent = cell.owner ? cell.letter : (el._temp || '');
    });
    G.words.forEach(function (w, i) {
      if (!w.el) return;
      w.el.classList.toggle('done', w.done);
      w.el.classList.toggle('sel', G.hlWords.indexOf(i) >= 0);
    });
    $('board').classList.toggle('pick', G.mode === 'reveal');
  }

  function flash(r, c, cls, ms) {
    var el = G.els[r][c];
    el._extra = cls;
    renderBoard();
    later(function () { if (el._extra === cls) { el._extra = ''; if (G) renderBoard(); } }, ms || 450);
  }

  function renderRack() {
    var rk = $('rack');
    rk.innerHTML = '';
    G.rackP.forEach(function (t, i) {
      var b = document.createElement('button');
      var cls = 'tile';
      if (G.seen[t.id]) b.style.animation = 'none';
      G.seen[t.id] = 1;
      if (i === G.selTile) cls += ' sel';
      if (G.hint && G.hint.tile === t.id) cls += ' pulse';
      if (G.turn !== 'p' || G.over) cls += ' disabled';
      b.className = cls;
      b.textContent = t.ch;
      b.addEventListener('pointerdown', function (e) { tileDown(e, i); });
      rk.appendChild(b);
    });
    $('bagCount').textContent = '🎒 ' + G.bag.length;
  }

  function renderScores() {
    $('ptsP').textContent = G.score.p;
    $('ptsC').textContent = G.score.c;
    $('scoreP').classList.toggle('turn', G.turn === 'p' && !G.over);
    $('scoreC').classList.toggle('turn', G.turn === 'c' && !G.over);
    $('levelTag').textContent = 'Level ' + G.level;
  }

  function renderActions() {
    var myTurn = G.turn === 'p' && !G.busy && !G.over;
    $('cntReveal').textContent = G.aids.reveal;
    $('cntHint').textContent = G.aids.hint;
    $('aidReveal').disabled = !myTurn || G.aids.reveal <= 0;
    $('aidHint').disabled = !myTurn || G.aids.hint <= 0;
    $('aidReveal').classList.toggle('active', G.mode === 'reveal');
    $('btnPass').disabled = !myTurn;
    var end = G.placed > 0;
    $('btnPass').classList.toggle('end', end);
    $('btnPass').querySelector('.ic').textContent = end ? '✅' : '⏭️';
    $('passLabel').textContent = end ? 'End turn' : 'Pass';
  }

  function bump(who) {
    var el = $(who === 'p' ? 'ptsP' : 'ptsC');
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }

  function setStatus(msg) {
    if (msg) { $('status').textContent = msg; return; }
    if (G.over) $('status').textContent = 'Round over';
    else if (G.turn === 'c') $('status').textContent = '🤖 Computer is playing...';
    else if (G.mode === 'reveal') $('status').textContent = '💡 Tap an empty square to reveal it';
    else $('status').textContent = '🙂 Your turn – drag a letter';
  }

  function clueLabel(wi) {
    var w = G.words[wi];
    var d = w.dir === 'a' ? 'Across' : 'Down';
    var c = w.mode === 'text' ? '“<b>' + w.clue + '</b>”' : '<b style="font-size:20px">' + w.emoji + '</b>';
    return d + ': ' + c + ' – ' + w.letters.length + ' letters' + (w.done ? ' ✔' : '');
  }

  function selectWords(list) {
    G.hlWords = list;
    $('clueInfo').innerHTML = list.map(clueLabel).join(' &nbsp;|&nbsp; ');
    renderBoard();
  }

  // ---------------- player input ----------------
  function onCell(r, c) {
    if (!G || G.over) return;
    var cell = G.cells[r][c];
    var ws = [cell.a, cell.d].filter(function (x) { return x >= 0; });
    if (cell.owner || G.turn !== 'p' || G.busy) { selectWords(ws); return; }
    if (G.mode === 'reveal') { doReveal(r, c); return; }
    if (G.selTile >= 0) { place(G.selTile, r, c); return; }
    SFX.click();
    G.selCell = (G.selCell && G.selCell.r === r && G.selCell.c === c) ? null : { r: r, c: c };
    selectWords(ws);
  }

  function onTile(i) {
    if (!G || G.turn !== 'p' || G.busy || G.over) return;
    if (G.mode === 'reveal') { G.mode = null; setStatus(); renderActions(); }
    if (G.selCell) { place(i, G.selCell.r, G.selCell.c); return; }
    SFX.click();
    G.selTile = G.selTile === i ? -1 : i;
    renderRack();
    renderBoard();
  }

  function addScore(who, d) {
    G.score[who] = Math.max(0, G.score[who] + d);
    renderScores();
    bump(who);
  }

  function checkWords(r, c, who) {
    var cell = G.cells[r][c], got = 0;
    [cell.a, cell.d].forEach(function (wi) {
      if (wi < 0 || G.words[wi].done) return;
      if (fillRatio(wi) < 1) return;
      var w = G.words[wi];
      w.done = true;
      wordCells(wi).forEach(function (rc) { flash(rc[0], rc[1], 'win', 650); });
      // word bonus goes to whoever placed most of its letters (tie: whoever completed it)
      var np = 0, nc = 0;
      wordCells(wi).forEach(function (rc) {
        var o = G.cells[rc[0]][rc[1]].owner;
        if (o === 'p') np++; else if (o === 'c') nc++;
      });
      var to = np > nc ? 'p' : nc > np ? 'c' : (who === 'h' ? null : who);
      if (to) {
        addScore(to, w.letters.length);
        got += w.letters.length;
        toast(w.text + ' complete! ' + (to === 'p' ? '👏 +' + w.letters.length + ' for you' : '🤖 +' + w.letters.length + ' for the computer'));
      } else {
        toast(w.text + ' complete!');
      }
      SFX.word();
    });
    return got;
  }

  function place(i, r, c) {
    var t = G.rackP[i], cell = G.cells[r][c];
    G.selTile = -1; G.selCell = null;
    if (cell.letter === t.ch) {
      if (G.hint && G.hint.tile === t.id) G.hint = null;
      G.rackP.splice(i, 1);
      cell.owner = 'p';
      G.placed++;
      SFX.place();
      addScore('p', 1);
      flash(r, c, 'pop', 380);
      checkWords(r, c, 'p');
      renderAll();
      if (isFull()) { finish(); return; }
      if (!G.rackP.length) {
        G.busy = true;
        renderActions();
        later(function () { G.busy = false; endPlayerTurn(); }, 600);
      }
    } else {
      G.busy = true;
      G.rackP.splice(i, 1);
      if (G.hint && G.hint.tile === t.id) G.hint = null;
      returnToBag(t.ch);
      SFX.wrong();
      addScore('p', -1);
      var el = G.els[r][c];
      el._temp = t.ch;
      flash(r, c, 'wrong', 850);
      renderRack(); renderActions();
      toast('❌ Wrong letter! −1 point, your turn is over');
      later(function () {
        el._temp = '';
        G.busy = false;
        endPlayerTurn();
      }, 950);
    }
  }

  function endPlayerTurn() {
    if (!G || G.over) return;
    G.mode = null; G.selTile = -1; G.selCell = null; G.hint = null;
    if (G.placed === 0) G.passes++; else G.passes = 0;
    G.placed = 0;
    refill(G.rackP);
    if (checkStall()) return;
    G.turn = 'c';
    renderAll();
    setStatus();
    later(cpuTurn, 800);
  }

  function checkStall() {
    if (G.passes >= 10) {
      toast('Nobody can move – round over');
      later(finish, 1200);
      G.over = true;
      return true;
    }
    return false;
  }

  function doPass() {
    if (!G || G.turn !== 'p' || G.busy || G.over) return;
    SFX.click();
    if (G.placed > 0) { endPlayerTurn(); return; }
    // pass: skip the turn and swap letters
    var old = G.rackP;
    G.rackP = [];
    refill(G.rackP);
    old.forEach(function (t) { returnToBag(t.ch); });
    toast('⏭️ Pass! You skipped your turn and got new letters');
    endPlayerTurn();
  }

  function onReveal() {
    if (!G || G.turn !== 'p' || G.busy || G.over || G.aids.reveal <= 0) return;
    SFX.click();
    if (G.selCell) { doReveal(G.selCell.r, G.selCell.c); return; }
    G.mode = G.mode === 'reveal' ? null : 'reveal';
    G.selTile = -1;
    if (G.mode) toast('💡 Tap an empty square');
    setStatus(); renderAll();
  }

  function consumeLetter(ch) {
    var i = G.bag.indexOf(ch);
    if (i >= 0) { G.bag.splice(i, 1); return; }
    for (i = 0; i < G.rackC.length; i++) if (G.rackC[i].ch === ch) { G.rackC.splice(i, 1); refill(G.rackC); return; }
    for (i = 0; i < G.rackP.length; i++) if (G.rackP[i].ch === ch) { G.rackP.splice(i, 1); refill(G.rackP); return; }
  }

  function doReveal(r, c) {
    var cell = G.cells[r][c];
    if (cell.owner) return;
    G.aids.reveal--; G.aidsUsed++;
    G.mode = null; G.selCell = null; G.hint = null;
    cell.owner = 'h';
    consumeLetter(cell.letter);
    SFX.word();
    flash(r, c, 'pop', 380);
    checkWords(r, c, 'h');
    setStatus(); renderAll();
    if (isFull()) finish();
  }

  function onHint() {
    if (!G || G.turn !== 'p' || G.busy || G.over || G.aids.hint <= 0) return;
    SFX.click();
    var pairs = [];
    G.rackP.forEach(function (t, ti) {
      eachCell(function (cell, r, c) { if (!cell.owner && cell.letter === t.ch) pairs.push({ ti: ti, tile: t.id, r: r, c: c }); });
    });
    if (!pairs.length) {
      toast('None of your letters fit right now – try Pass to get new ones', 2600);
      return;
    }
    var pk = pairs[Math.floor(Math.random() * pairs.length)];
    G.aids.hint--; G.aidsUsed++;
    G.hint = pk;
    G.selTile = pk.ti; G.selCell = null; G.mode = null;
    var cell = G.cells[pk.r][pk.c];
    selectWords([cell.a, cell.d].filter(function (x) { return x >= 0; }));
    toast('🎯 Drag the glowing letter to the glowing square');
    renderAll();
  }

  // ---------------- drag & drop ----------------
  var drag = null;
  function canPlay() { return !!G && G.turn === 'p' && !G.busy && !G.over; }

  function tileDown(e, i) {
    if (!canPlay() || drag) return;
    if (e.button !== undefined && e.button > 0) return;
    e.preventDefault();
    drag = { i: i, x0: e.clientX, y0: e.clientY, src: e.currentTarget, ghost: null, target: null, id: e.pointerId };
  }

  function cellFromPoint(x, y) {
    var el = document.elementFromPoint(x, y);
    var ce = el && el.closest ? el.closest('.cell.open') : null;
    if (!ce) return null;
    var r = +ce.dataset.r, c = +ce.dataset.c;
    if (!G.cells[r] || !G.cells[r][c] || G.cells[r][c].owner) return null;
    return { r: r, c: c, el: ce };
  }

  function setDropTarget(t) {
    if (drag.target && (!t || drag.target.el !== t.el)) drag.target.el.classList.remove('drop');
    if (t) t.el.classList.add('drop');
    drag.target = t;
  }

  window.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.ghost) {
      if (dx * dx + dy * dy < 64) return;
      var g = document.createElement('div');
      g.className = 'tile drag-ghost';
      g.textContent = G.rackP[drag.i].ch;
      document.body.appendChild(g);
      drag.ghost = g;
      drag.src.classList.add('dragging');
      G.selTile = -1; G.selCell = null;
      if (G.mode) { G.mode = null; setStatus(); renderActions(); }
      renderBoard();
    }
    // the tile floats a little above the finger so you can see where it lands
    var gx = e.clientX, gy = e.clientY - 44;
    drag.ghost.style.transform = 'translate(' + (gx - 25) + 'px,' + (gy - 28) + 'px) scale(1.12)';
    setDropTarget(cellFromPoint(gx, gy));
  });

  function endDrag(e, cancel) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var d = drag;
    drag = null;
    if (d.target) d.target.el.classList.remove('drop');
    d.src.classList.remove('dragging');
    if (!d.ghost) { if (!cancel) onTile(d.i); return; }
    d.ghost.remove();
    if (!cancel && d.target && canPlay()) place(d.i, d.target.r, d.target.c);
    else if (G) renderRack();
  }
  window.addEventListener('pointerup', function (e) { endDrag(e, false); });
  window.addEventListener('pointercancel', function (e) { endDrag(e, true); });

  // ---------------- computer turn ----------------
  function cpuKnowsCell(cell) {
    return [cell.a, cell.d].some(function (wi) {
      return wi >= 0 && (G.cpuKnows[wi] || fillRatio(wi) >= 0.6);
    });
  }

  function cpuTurn() {
    if (!G || G.over) return;
    var me = G;
    G.busy = true;
    renderActions();
    // the longer nobody moves, the faster the computer learns (prevents stalls)
    var learn = G.p.cpuLearn + 0.2 * G.passes;
    G.words.forEach(function (w, i) { if (!G.cpuKnows[i] && Math.random() < learn) G.cpuKnows[i] = true; });

    var cands = [];
    G.rackC.forEach(function (t) {
      eachCell(function (cell, r, c) {
        if (!cell.owner && cell.letter === t.ch && cpuKnowsCell(cell)) cands.push({ t: t, r: r, c: c, ok: true });
      });
    });
    shuffle(cands);
    var moves = [], usedT = {}, usedC = {};
    cands.forEach(function (m) {
      if (moves.length >= G.p.cpuMax || usedT[m.t.id] || usedC[m.r + ',' + m.c]) return;
      usedT[m.t.id] = 1; usedC[m.r + ',' + m.c] = 1;
      moves.push(m);
    });
    if (Math.random() < G.p.cpuMistake) {
      var spare = G.rackC.filter(function (t) { return !usedT[t.id]; });
      var empties = [];
      eachCell(function (cell, r, c) { if (!cell.owner && !usedC[r + ',' + c]) empties.push({ r: r, c: c, cell: cell }); });
      shuffle(empties);
      for (var s = 0; s < spare.length && moves.length < G.p.cpuMax + 1; s++) {
        var e = empties.filter(function (x) { return x.cell.letter !== spare[s].ch; })[0];
        if (e) { moves.push({ t: spare[s], r: e.r, c: e.c, ok: false }); break; }
      }
    }

    var step = 0;
    function next() {
      if (G !== me || G.over) return;
      if (step >= moves.length) { cpuEnd(moves.length > 0); return; }
      var m = moves[step++];
      var el = G.els[m.r][m.c];
      el._extra = 'cpu-target';
      renderBoard();
      later(function () {
        if (G !== me) return;
        el._extra = '';
        var idx = G.rackC.indexOf(m.t);
        if (idx >= 0) G.rackC.splice(idx, 1);
        if (m.ok && !G.cells[m.r][m.c].owner) {
          G.cells[m.r][m.c].owner = 'c';
          SFX.cpu();
          addScore('c', 1);
          flash(m.r, m.c, 'pop', 380);
          checkWords(m.r, m.c, 'c');
          renderAll();
          if (isFull()) { G.busy = false; finish(); return; }
          later(next, 450);
        } else {
          returnToBag(m.t.ch);
          el._temp = m.t.ch;
          flash(m.r, m.c, 'wrong', 800);
          SFX.wrong();
          addScore('c', -1);
          toast('🤖 The computer made a mistake! −1 point');
          later(function () { el._temp = ''; renderBoard(); cpuEnd(true); }, 900);
        }
      }, 450);
    }
    if (!moves.length) {
      // computer passes and swaps its letters
      var old = G.rackC;
      G.rackC = [];
      refill(G.rackC);
      old.forEach(function (t) { returnToBag(t.ch); });
      toast('🤖 The computer passed');
      later(function () { if (G === me) cpuEnd(false); }, 900);
    } else {
      later(next, 300);
    }
  }

  function cpuEnd(played) {
    if (G.over) return;
    if (played) G.passes = 0; else G.passes++;
    refill(G.rackC);
    if (checkStall()) return;
    G.turn = 'p';
    G.busy = false;
    renderAll();
    setStatus();
  }

  // ---------------- end of round ----------------
  function finish() {
    if (!G) return;
    G.over = true;
    G.busy = false;
    var me = G;
    // reveal the remaining letters
    eachCell(function (cell) { if (!cell.owner) cell.owner = 'h'; });
    renderAll();
    setStatus();
    var ps = G.score.p, cs = G.score.c, L = G.level;
    later(function () {
      if (G !== me) return;
      if (ps > cs) {
        var stars = 1 + (ps - cs >= 5 ? 1 : 0) + (G.aidsUsed === 0 ? 1 : 0);
        store.stars[L] = Math.max(store.stars[L] || 0, stars);
        store.unlocked = Math.min(MAX_LEVEL, Math.max(store.unlocked, L + 1));
        save();
        SFX.win();
        var btns = [];
        if (L < MAX_LEVEL) btns.push({ label: '⏭️ Next level', primary: true, fn: function () { startLevel(L + 1); } });
        btns.push({ label: '🔁 Replay level', fn: function () { startLevel(L); } });
        btns.push({ label: '🗺️ Levels', fn: function () { show('levels'); } });
        showModal({
          emoji: L >= MAX_LEVEL ? '👑' : '🏆', title: 'You win!', stars: stars,
          text: 'You <b>' + ps + '</b> – <b>' + cs + '</b> Computer' + (L >= MAX_LEVEL ? '<br>You finished every level! 🎉' : ''),
          buttons: btns
        });
      } else {
        SFX.lose();
        showModal({
          emoji: ps === cs ? '🤝' : '😢', title: ps === cs ? 'Draw' : 'Computer wins',
          text: 'You <b>' + ps + '</b> – <b>' + cs + '</b> Computer<br>Beat the computer to unlock the next level',
          buttons: [
            { label: '🔁 Try again', primary: true, fn: function () { startLevel(L); } },
            { label: '🗺️ Levels', fn: function () { show('levels'); } }
          ]
        });
      }
    }, 1300);
  }

  function openMenu() {
    if (!G) { show('home'); return; }
    var L = G.level;
    showModal({
      emoji: '⏸️', title: 'Paused',
      buttons: [
        { label: '▶ Resume', primary: true, fn: function () {} },
        { label: '🔁 Replay level', fn: function () { startLevel(L); } },
        { label: '🗺️ Levels', fn: function () { G = null; show('levels'); } },
        { label: '🏠 Home', fn: function () { G = null; show('home'); } }
      ]
    });
  }

  // ---------------- buttons ----------------
  function soundLabel() { $('btnSound').textContent = store.sound ? '🔊 Sound: on' : '🔇 Sound: off'; }
  $('btnPlay').onclick = function () { SFX.click(); startLevel(Math.min(store.unlocked, MAX_LEVEL)); };
  $('btnLevels').onclick = function () { SFX.click(); show('levels'); };
  $('btnHelp').onclick = function () { SFX.click(); show('help'); };
  $('btnSound').onclick = function () { store.sound = !store.sound; save(); soundLabel(); SFX.click(); };
  document.querySelectorAll('[data-back]').forEach(function (b) { b.onclick = function () { SFX.click(); show('home'); }; });
  $('btnMenu').onclick = function () { SFX.click(); openMenu(); };
  $('btnPass').onclick = doPass;
  $('aidReveal').onclick = onReveal;
  $('aidHint').onclick = onHint;
  soundLabel();

  // Android back button
  window.androidBack = function () {
    if (modalOpen()) {
      if (G && !G.over) closeModal();
      else { closeModal(); G = null; show('levels'); }
      return true;
    }
    if (current === 'game') { openMenu(); return true; }
    if (current !== 'home') { show('home'); return true; }
    return false;
  };

  // test hooks
  window.__crossy = { get state() { return G; }, startLevel: startLevel, store: store, setSpeed: function (x) { SPEED = x; } };
})();
