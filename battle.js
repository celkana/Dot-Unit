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
