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
  setRandomMenuBackground();
  showScreen('menu-screen');
  initUnitsScreen();
  initMenuUnits();
});

function setRandomMenuBackground() {
  const menu = document.getElementById('menu-screen');
  const images = [];
  for (let i = 1; i <= 10; i++) {
    const num = String(i).padStart(2, '0');
    images.push(`images/fields/${num}.png`);
  }
  const img = images[Math.floor(Math.random() * images.length)];
  menu.style.backgroundImage = `url(${img})`;
}

async function initMenuUnits() {
  const res = await fetch('data/units.json');
  const data = await res.json();
  const units = data.units.filter(u => u.acquired);
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
    img.style.transform = dir === -1 ? 'scaleX(-1)' : 'scaleX(1)';
    const speed = 0.5 + Math.random();
    setInterval(() => {
      let pos = parseFloat(img.style.left);
      pos += dir * speed;
      if (pos < -50 || pos > width) {
        dir *= -1;
        img.style.transform = dir === -1 ? 'scaleX(-1)' : 'scaleX(1)';
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
  const countsDiv = document.getElementById('unit-counts');
  const sortSelect = document.getElementById('sort-select');
  const filterSelect = document.getElementById('filter-select');
  const pagination = document.getElementById('pagination');
  const footer = document.getElementById('units-footer');

  const itemsPerPage = 15;
  let currentPage = 1;
  let filteredUnits = [...units];

  populateFilterOptions();
  renderCounts();
  renderPage();

  sortSelect.addEventListener('change', applySortFilter);
  filterSelect.addEventListener('change', applySortFilter);

  function populateFilterOptions() {
    const elements = [...new Set(units.map(u => u.element))];
    elements.forEach(el => {
      const opt = document.createElement('option');
      opt.value = el;
      opt.textContent = el;
      filterSelect.appendChild(opt);
    });
  }

  function renderCounts() {
    const counts = {};
    units.forEach(u => {
      if (!counts[u.element]) counts[u.element] = { total: 0, acquired: 0 };
      counts[u.element].total++;
      if (u.acquired) counts[u.element].acquired++;
    });
    countsDiv.innerHTML = Object.entries(counts)
      .map(([el, c]) => `${el}: ${c.acquired}/${c.total}`)
      .join(' ');
  }

  function applySortFilter() {
    const sort = sortSelect.value;
    const filter = filterSelect.value;
    let list = [...units];
    if (filter !== 'all') {
      list = list.filter(u => u.element === filter);
    }
    list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'rank') return rankValue(b.rank) - rankValue(a.rank);
      return 0;
    });
    filteredUnits = list;
    currentPage = 1;
    renderPage();
  }

  function rankValue(rank) {
    const map = { S: 5, A: 4, B: 3, C: 2, D: 1 };
    return map[rank] || 0;
  }

  function renderPage() {
    grid.innerHTML = '';
    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = filteredUnits.slice(start, start + itemsPerPage);
    pageItems.forEach(unit => {
      grid.appendChild(createCard(unit));
    });
    updatePagination();
  }

  function updatePagination() {
    const totalPages = Math.max(1, Math.ceil(filteredUnits.length / itemsPerPage));
    pagination.innerHTML = '';
    const prev = document.createElement('button');
    prev.textContent = '〈';
    prev.disabled = currentPage === 1;
    prev.addEventListener('click', () => {
      currentPage--;
      renderPage();
    });
    const info = document.createElement('span');
    info.textContent = `${currentPage}/${totalPages}`;
    const next = document.createElement('button');
    next.textContent = '〉';
    next.disabled = currentPage === totalPages;
    next.addEventListener('click', () => {
      currentPage++;
      renderPage();
    });
    pagination.append(prev, info, next);
  }

  function createCard(unit) {
    const card = document.createElement('div');
    card.className = 'unit-card';
    const name = unit.acquired ? unit.name : '???';
    const stats = unit.acquired
      ? `HP:${unit.hp} MP:${unit.mp} 攻:${unit.attack} 防:${unit.defense} 速:${unit.speed}`
      : '';
    const stars = '★'.repeat(rankValue(unit.rank));
    card.innerHTML = `
      <img src="${unit.image}" alt="${unit.name}" class="unit-image">
      <div class="unit-info">
        <div class="unit-top">
          <div class="unit-rank">${stars}</div>
          <div class="unit-level">Lv.1 【+0】</div>
        </div>
        <div class="unit-name">${name}</div>
        <div class="unit-stats">${stats}</div>
      </div>`;
    card.addEventListener('click', () => showDetail(unit));
    return card;
  }

  function showDetail(unit) {
    grid.classList.add('hidden');
    footer.classList.add('hidden');
    if (unit.acquired) {
      const drops = unit.drops ? unit.drops.map(d => `${d.item}(${d.rate})`).join(', ') : 'なし';
      detail.innerHTML = `
        <img src="${unit.image}" alt="${unit.name}" class="unit-image">
        <h3>${unit.name}</h3>
        <p>ランク: ${unit.rank}</p>
        <p>HP: ${unit.hp}</p>
        <p>MP: ${unit.mp}</p>
        <p>攻撃: ${unit.attack}</p>
        <p>防御: ${unit.defense}</p>
        <p>速度: ${unit.speed}</p>
        <p>武器スロット: ${unit.weaponSlots}</p>
        <p>アーティファクトスロット: ${unit.artifactSlots}</p>
        <p>装備可能武器タイプ: ${unit.weaponTypes.join(', ')}</p>
        <p>ドロップ: ${drops}</p>
        <button id="back-to-list">一覧に戻る</button>`;
    } else {
      detail.innerHTML = `
        <h3>???</h3>
        <p>未取得のユニットです。</p>
        <button id="back-to-list">一覧に戻る</button>`;
    }
    detail.classList.remove('hidden');
    document.getElementById('back-to-list').addEventListener('click', () => {
      detail.classList.add('hidden');
      grid.classList.remove('hidden');
      footer.classList.remove('hidden');
    });
  }
}
