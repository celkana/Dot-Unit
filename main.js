document.addEventListener('DOMContentLoaded', () => {
  const screens = document.querySelectorAll('.screen');

  function showScreen(id) {
    screens.forEach(screen => {
      screen.classList.toggle('active', screen.id === id);
    });
  }

  document.querySelectorAll('[data-target]').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-target');
      showScreen(target);
    });
  });

  showScreen('menu-screen');
  initUnitsScreen();
  initMenuUnits();
});

async function initMenuUnits() {
  const res = await fetch('data/units.json');
  const data = await res.json();
  const units = data.units;
  const container = document.getElementById('menu-moving-units');
  const width = container.clientWidth || 960;

  units.forEach(u => {
    const img = document.createElement('img');
    img.src = u.image;
    img.alt = u.name;
    const x = Math.random() * (width - 48);
    img.style.left = x + 'px';
    container.appendChild(img);
    let dir = Math.random() < 0.5 ? -1 : 1;
    const speed = 0.5 + Math.random();
    setInterval(() => {
      let pos = parseFloat(img.style.left);
      pos += dir * speed;
      if (pos < -50 || pos > width) {
        dir *= -1;
      }
      img.style.left = pos + 'px';
    }, 20);
  });
}

async function initUnitsScreen() {
  const res = await fetch('data/units.json');
  const units = (await res.json()).units;
  const grid = document.getElementById('unit-grid');
  const detail = document.getElementById('unit-detail');

  const displayUnits = units.slice();
  while (displayUnits.length < 12) {
    displayUnits.push(units[displayUnits.length % units.length]);
  }

  displayUnits.slice(0, 12).forEach(unit => {
    const card = document.createElement('div');
    card.className = 'unit-card';
    card.innerHTML = `
      <img src="${unit.image}" alt="${unit.name}" class="unit-image">
      <strong>${unit.name}</strong>`;
    card.addEventListener('click', () => showDetail(unit));
    grid.appendChild(card);
  });

  function showDetail(unit) {
    grid.classList.add('hidden');
    detail.innerHTML = `
      <img src="${unit.image}" alt="${unit.name}" class="unit-image">
      <h3>${unit.name}</h3>
      <p>HP: ${unit.hp}</p>
      <p>MP: ${unit.mp}</p>
      <p>攻撃: ${unit.attack}</p>
      <p>防御: ${unit.defense}</p>
      <p>速度: ${unit.speed}</p>
      <button id="back-to-list">一覧に戻る</button>`;
    detail.classList.remove('hidden');
    document.getElementById('back-to-list').addEventListener('click', () => {
      detail.classList.add('hidden');
      grid.classList.remove('hidden');
    });
  }
}
