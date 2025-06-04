// Gestione stato e rendering
let level, gridEl, rows, cols;
let mousePos, pushingDir = null;

// Carica livello JSON e avvia
fetch('level1.json').then(r => r.json()).then(data => { level = data; setup(); });

function setup() {
  gridEl = document.getElementById('grid');
  rows = level.rows; cols = level.cols;
  gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  gridEl.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  buildGrid();
}

// Crea celle
function buildGrid() {
  gridEl.innerHTML = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.r = r; cell.dataset.c = c;
      if (matchCell(level.rocks, r, c)) cell.classList.add('rock');
      if (matchCell(level.dynamites, r, c)) cell.classList.add('dynamite');
      if (r == level.start.r && c == level.start.c) {
        cell.classList.add('start');
        const m = document.createElement('div');
        m.className = 'mouse';
        cell.appendChild(m);
        mousePos = { r, c, el: m };
      }
      if (r == level.finish.r && c == level.finish.c) {
        cell.classList.add('finish');
        const f = document.createElement('div');
        f.className = 'flag';
        cell.appendChild(f);
      }
      cell.addEventListener('click', onCell);
      cell.addEventListener('touchstart', onCell);
      gridEl.appendChild(cell);
    }
  }
}

function matchCell(list, r, c) {
  return list.some(o => o.r === r && o.c === c);
}

function onCell(e) {
  const r = parseInt(this.dataset.r), c = parseInt(this.dataset.c);
  handleMove(r, c);
}

// Gestione movimento topo e dynamite
function handleMove(r, c) {
  if (pushingDir) { pushDynamite(r, c); return; }
  if (r !== mousePos.r && c !== mousePos.c) return; // non allineato
  const dir = r === mousePos.r ? (c > mousePos.c ? 1 : -1) : (r > mousePos.r ? cols : -cols);
  let cr = mousePos.r, cc = mousePos.c;
  while (true) {
    cr += dir === cols ? 1 : dir === -cols ? -1 : 0;
    cc += dir === 1 ? 1 : dir === -1 ? -1 : 0;
    if (cr === r && cc === c) { moveMouse(cr, cc); break; }
    if (matchCell(level.rocks, cr, cc)) {
      moveMouse(cr - (dir === cols ? 1 : dir === -cols ? -1 : 0), cc - (dir === 1 ? 1 : dir === -1 ? -1 : 0));
      break;
    }
    const dynIndex = level.dynamites.findIndex(o => o.r === cr && o.c === cc);
    if (dynIndex > -1) {
      moveMouse(cr - (dir === cols ? 1 : dir === -cols ? -1 : 0), cc - (dir === 1 ? 1 : dir === -1 ? -1 : 0));
      pushingDir = dir; mousePos.targetDyn = level.dynamites[dynIndex];
      break;
    }
  }
}

function moveMouse(r, c) {
  const target = document.querySelector(`.cell[data-r='${r}'][data-c='${c}']`);
  mousePos.el.parentNode.removeChild(mousePos.el);
  target.appendChild(mousePos.el);
  mousePos.r = r; mousePos.c = c;
  checkWin();
}

function pushDynamite(r, c) {
  const d = mousePos.targetDyn;
  if (d.r + (pushingDir === cols ? 1 : pushingDir === -cols ? -1 : 0) !== r ||
      d.c + (pushingDir === 1 ? 1 : pushingDir === -1 ? -1 : 0) !== c) return;
  const nextR = d.r + (pushingDir === cols ? 1 : pushingDir === -cols ? -1 : 0);
  const nextC = d.c + (pushingDir === 1 ? 1 : pushingDir === -1 ? -1 : 0);
  if (matchCell(level.rocks, nextR, nextC) || matchCell(level.dynamites, nextR, nextC) ||
      nextR < 0 || nextR >= rows || nextC < 0 || nextC >= cols) return;
  const cell = document.querySelector(`.cell[data-r='${d.r}'][data-c='${d.c}']`);
  const nextCell = document.querySelector(`.cell[data-r='${nextR}'][data-c='${nextC}']`);
  cell.classList.remove('dynamite');
  nextCell.classList.add('dynamite');
  d.r = nextR; d.c = nextC;
  pushingDir = null; mousePos.targetDyn = null;
  checkExplosion(d);
}

function checkExplosion(d) {
  const adj = [
    { r: d.r + 1, c: d.c },
    { r: d.r - 1, c: d.c },
    { r: d.r, c: d.c + 1 },
    { r: d.r, c: d.c - 1 }
  ];
  for (const a of adj) {
    const rockIndex = level.rocks.findIndex(o => o.r === a.r && o.c === a.c);
    if (rockIndex > -1) {
      const rockCell = document.querySelector(`.cell[data-r='${a.r}'][data-c='${a.c}']`);
      const dynCell = document.querySelector(`.cell[data-r='${d.r}'][data-c='${d.c}']`);
      rockCell.classList.add('hidden');
      dynCell.classList.add('hidden');
      setTimeout(() => {
        rockCell.className = 'cell';
        dynCell.className = 'cell';
      }, 300);
      level.rocks.splice(rockIndex, 1);
      const dynIndex = level.dynamites.indexOf(d);
      level.dynamites.splice(dynIndex, 1);
      break;
    }
  }
}

function checkWin() {
  if (mousePos.r === level.finish.r && mousePos.c === level.finish.c) {
    document.getElementById('message').textContent = 'Hai vinto!';
    gridEl.querySelectorAll('.cell').forEach(c => c.removeEventListener('click', onCell));
  }
}
