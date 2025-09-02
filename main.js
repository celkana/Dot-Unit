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
});

async function initUnitsScreen() {
  const res = await fetch('data/units.json');
  const data = await res.json();
  const units = data.units;

  const grid = document.getElementById('unit-grid');
  const sidebarCount = document.getElementById('owned-count');
  const sortSelect = document.getElementById('sort-select');
  const filterElement = document.getElementById('filter-element');
  const filterRace = document.getElementById('filter-race');
  const prevPageBtn = document.getElementById('prev-page');
  const nextPageBtn = document.getElementById('next-page');
  const pageInfo = document.getElementById('page-info');
  const detail = document.getElementById('unit-detail');

  sidebarCount.textContent = units.length;

  const perPage = 12;
  let currentPage = 1;
  let filtered = units.slice();

  function sortUnits(list) {
    const key = sortSelect.value;
    return list.slice().sort((a, b) => {
      if (key === 'name') return a.name.localeCompare(b.name);
      return b[key] - a[key];
    });
  }

  function applyFilters() {
    filtered = units.filter(u => {
      const el = filterElement.value;
      const race = filterRace.value;
      if (el && u.element !== el) return false;
      if (race && u.race !== race) return false;
      return true;
    });
    currentPage = 1;
    render();
  }

  function render() {
    const sorted = sortUnits(filtered);
    const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
    if (currentPage > totalPages) currentPage = totalPages;
    pageInfo.textContent = `${currentPage}/${totalPages}`;
    const start = (currentPage - 1) * perPage;
    const pageUnits = sorted.slice(start, start + perPage);
    grid.innerHTML = '';
    pageUnits.forEach(u => {
      const card = document.createElement('div');
      card.className = 'unit-card';
      card.innerHTML = `<strong>${u.name}</strong><br>HP: ${u.hp} MP: ${u.mp}`;
      card.addEventListener('click', () => showDetails(u));
      grid.appendChild(card);
    });
  }

  function showDetails(unit) {
    detail.innerHTML = `
      <h3>${unit.name}</h3>
      <p>HP: ${unit.hp}</p>
      <p>MP: ${unit.mp}</p>
      <p>Attack: ${unit.attack}</p>
      <p>Defense: ${unit.defense}</p>
      <p>Speed: ${unit.speed}</p>
      <p>Race: ${unit.race}</p>
      <p>Element: ${unit.element}</p>`;
    detail.classList.remove('hidden');
  }

  sortSelect.addEventListener('change', render);
  filterElement.addEventListener('change', applyFilters);
  filterRace.addEventListener('change', applyFilters);
  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      render();
    }
  });
  nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    if (currentPage < totalPages) {
      currentPage++;
      render();
    }
  });

  applyFilters();
}
