function renderUnits() {
  const grid = document.getElementById('battle-grid');
  if (!grid) return;
  // clear existing units
  const cells = Array.from(grid.querySelectorAll('.cell'));
  cells.forEach(cell => {
    cell.innerHTML = '';
  });
  if (!battleEngine || !battleEngine.field || typeof battleEngine.field.all_units !== 'function') return;
  const units = battleEngine.field.all_units();
  units.forEach(unit => {
    if (!unit || !unit.position) return;
    const [x, y] = unit.position;
    const cell = cells.find(c => Number(c.dataset.x) === x && Number(c.dataset.y) === y);
    if (!cell) return;
    const img = document.createElement('img');
    if (unit.image) {
      img.src = unit.image;
    }
    const ownerClass = unit.owner === 'player' ? 'player-unit' : 'enemy-unit';
    img.classList.add(ownerClass);
    cell.appendChild(img);
  });
}
window.renderUnits = renderUnits;

function enemyTurn(unit) {
  if (!battleEngine || !unit) return;
  if (!battleEngine.field || typeof battleEngine.field.all_units !== 'function') {
    return;
  }
  const units = battleEngine.field.all_units();
  const players = units.filter(u => u.owner === 'player');
  if (players.length === 0) {
    if (typeof battleEngine.pass_turn === 'function') {
      battleEngine.pass_turn(unit);
    }
    return;
  }
  let target = players[0];
  let minDist =
    Math.abs(target.position[0] - unit.position[0]) +
    Math.abs(target.position[1] - unit.position[1]);
  for (let i = 1; i < players.length; i++) {
    const p = players[i];
    const dist =
      Math.abs(p.position[0] - unit.position[0]) +
      Math.abs(p.position[1] - unit.position[1]);
    if (dist < minDist) {
      minDist = dist;
      target = p;
    }
  }
  const skill = unit.skills && unit.skills[0];
  if (skill && minDist <= skill.range) {
    if (typeof battleEngine.attack === 'function') {
      battleEngine.attack(unit, target, skill);
    }
  } else {
    let dx = 0;
    let dy = 0;
    if (target.position[0] !== unit.position[0]) {
      dx = target.position[0] > unit.position[0] ? 1 : -1;
    } else if (target.position[1] !== unit.position[1]) {
      dy = target.position[1] > unit.position[1] ? 1 : -1;
    }
    try {
      if (typeof battleEngine.move === 'function') {
        battleEngine.move(unit, dx, dy);
      }
    } catch (e) {
      if (typeof battleEngine.pass_turn === 'function') {
        battleEngine.pass_turn(unit);
      }
    }
  }
  renderUnits();
}

function processTurn() {
  if (!battleEngine || typeof battleEngine.next_unit !== 'function') return;
  currentAttacker = battleEngine.next_unit();
  renderUnits();
  if (currentAttacker && currentAttacker.owner === 'enemy') {
    enemyTurn(currentAttacker);
    processTurn();
  }
}
window.processTurn = processTurn;
