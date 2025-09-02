
let formations = { 1: {}, 2: {}, 3: {} };
let currentTeam = 1;
let selectingForFormation = false;
let formationSelectCell = null;
let currentField = null;
let currentStage = null;
let enemyFormation = [];
let unitsDataMap = {};
let player = {};
let battleEngine = null;
let currentAttacker = null;
let pendingSkill = null;
let battleResultInterval = null;

document.addEventListener('battle:end', e => {
  const victory = e.detail && e.detail.victory;
  if (battleEngine && typeof battleEngine.end_battle === 'function') {
    battleEngine.end_battle(victory);
  }
  endBattle(victory);
});

document.addEventListener('DOMContentLoaded', () => {
  const screens = document.querySelectorAll('.screen');

  function showScreen(id) {
    screens.forEach(screen => {
      screen.classList.toggle('active', screen.id === id);
    });
  }
  window.showScreen = showScreen;

  document.querySelectorAll('[data-target]').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-target');
      if (target !== 'units-screen') {
        selectingForFormation = false;
        formationSelectCell = null;
      } else if (window.unitsRenderPage) {
        window.unitsRenderPage();
      }
      showScreen(target);
    });
  });
  setRandomMenuBackground();
  showScreen('menu-screen');
  initUnitsScreen();
  initMenuUnits();
  initWorldScreen();

  const battleStart = document.getElementById('battle-start');
  if (battleStart) {
    battleStart.addEventListener('click', async () => {
      const num = String(currentStage).padStart(2, '0');
      const battleScreen = document.getElementById('battle-screen');
      if (battleScreen) {
        battleScreen.style.backgroundImage = `url(images/stages/stage_${num}.png)`;
      }
      await initBattle();
      window.showScreen('battle-screen');
    });
  }

  initFormationScreen();

  const formationBtn = document.getElementById('formation-button');
  const formationBack = document.getElementById('formation-back');
  if (formationBtn && formationBack) {
    formationBtn.addEventListener('click', () => {
      formationBack.setAttribute('data-target', 'units-screen');
    });
  }
});

function setRandomMenuBackground() {
  const menu = document.getElementById('menu-screen');
  const candidates = [];
  const promises = [];

  for (let i = 1; i <= 10; i++) {
    const num = String(i).padStart(2, '0');
    const url = `images/stages/stage_${num}.png`;

    // 画像がロードできるかチェック
    const promise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(url);   // 読み込み成功
      img.onerror = () => resolve(null); // 失敗なら無視
      img.src = url;
    });

    promises.push(promise);
  }

  Promise.all(promises).then((results) => {
    // 存在するファイルだけ残す
    const validImages = results.filter((url) => url !== null);

    if (validImages.length > 0) {
      const img = validImages[Math.floor(Math.random() * validImages.length)];
      menu.style.backgroundImage = `url(${img})`;
    } else {
      console.warn("背景に使える画像が見つかりませんでした");
    }
  });
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
  const skillsData = await (await fetch('data/skills.json')).json();
  const bossSkillsData = await (await fetch('data/boss_skills.json')).json();
  const skillNames = {};
  skillsData.skills.forEach(s => (skillNames[s.id] = s.name));
  const bossSkillNames = {};
  bossSkillsData.skills.forEach(s => (bossSkillNames[s.id] = s.name));
  const unitLevels = {};
  const unitReinc = {};

  const grid = document.getElementById('unit-grid');
  const detail = document.getElementById('unit-detail');
  const countsDiv = document.getElementById('unit-counts');
  const sortSelect = document.getElementById('sort-select');
  const filterSelect = document.getElementById('filter-select');
  const raceFilter = document.getElementById('race-filter');
  const toggleUnacquired = document.getElementById('toggle-unacquired');
  const pagination = document.getElementById('pagination');
  const footer = document.getElementById('units-footer');

  const itemsPerPage = 15;
  let currentPage = 1;
  let filteredUnits = [...units];
  let showUnacquired = true;

  const elementNames = {
    none: '無',
    fire: '火',
    water: '水',
    wind: '風',
    earth: '土',
    light: '光',
    dark: '闇'
  };
  const raceNames = {
    human: '人間',
    beast: '獣',
    dragon: 'ドラゴン',
    undead: 'アンデッド',
    demon: '悪魔',
    machine: '機械',
    plant: '植物'
  };

  populateFilterOptions();
  renderCounts();
  renderPage();

  sortSelect.addEventListener('change', applySortFilter);
  filterSelect.addEventListener('change', applySortFilter);
  raceFilter.addEventListener('change', applySortFilter);
  toggleUnacquired.addEventListener('click', () => {
    showUnacquired = !showUnacquired;
    toggleUnacquired.textContent = showUnacquired ? '未取得非表示' : '未取得表示';
    applySortFilter();
  });

  window.enterFormationSelection = cell => {
    selectingForFormation = true;
    formationSelectCell = cell;
    detail.classList.add('hidden');
    grid.classList.remove('hidden');
    footer.classList.remove('hidden');
    renderPage();
  };

  function populateFilterOptions() {
    const elements = [...new Set(units.map(u => u.element))];
    elements.forEach(el => {
      const opt = document.createElement('option');
      opt.value = el;
      opt.textContent = elementNames[el] || el;
      filterSelect.appendChild(opt);
    });
    const races = [...new Set(units.map(u => u.race))];
    races.forEach(rc => {
      const opt = document.createElement('option');
      opt.value = rc;
      opt.textContent = raceNames[rc] || rc;
      raceFilter.appendChild(opt);
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
      .map(([el, c]) => `${elementNames[el] || el}: ${c.acquired}/${c.total}`)
      .join(' ');
  }

  function applySortFilter() {
    const sort = sortSelect.value;
    const elementFilter = filterSelect.value;
    const race = raceFilter.value;
    let list = [...units];
    if (elementFilter !== 'all') {
      list = list.filter(u => u.element === elementFilter);
    }
    if (race !== 'all') {
      list = list.filter(u => u.race === race);
    }
    if (!showUnacquired) {
      list = list.filter(u => u.acquired);
    }
    list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'rank') return rankValue(b.rank) - rankValue(a.rank);
      if (['hp', 'mp', 'attack', 'defense', 'speed'].includes(sort)) return b[sort] - a[sort];
      return 0;
    });
    filteredUnits = list;
    currentPage = 1;
    renderPage();
  }

  function rankValue(rank) {
    return parseInt(rank, 10) || 0;
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
  window.unitsRenderPage = renderPage;

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
    if (unit.acquired) {
      card.classList.add(`rank-${rankValue(unit.rank)}`);
    }
    const name = unit.acquired ? unit.name : '???';
    const stats = unit.acquired
      ? `HP:${unit.hp} MP:${unit.mp} <br>攻:${unit.attack} 防:${unit.defense} 速:${unit.speed}`
      : '';
    const stars = '★'.repeat(rankValue(unit.rank));
    const imgClass = unit.acquired ? 'unit-image' : 'unit-image silhouette';
    card.innerHTML = `
      <img src="${unit.image}" alt="${unit.name}" class="${imgClass}">
      <div class="unit-info">
        <div class="unit-top">
          <div class="unit-rank">${stars}</div>
          <div class="unit-level">Lv.1<small>+0</small></div>
        </div>
        <div class="unit-name">${name}</div>
        <div class="unit-stats">${stats}</div>
      </div>`;
    const alreadyPlaced = Object.values(formations[currentTeam]).some(u => u.id === unit.id);
    if (selectingForFormation) {
      if (alreadyPlaced) {
        card.classList.add('disabled');
      } else {
        card.addEventListener('click', () => {
          formations[currentTeam][formationSelectCell.dataset.index] = unit;
          selectingForFormation = false;
          formationSelectCell = null;
          if (window.loadFormationGrid) window.loadFormationGrid();
          renderPage();
          showScreen('formation-screen');
        });
      }
    } else {
      card.addEventListener('click', () => showDetail(unit));
    }
    return card;
  }

  function showDetail(unit, fromFormation = false, cellIndex = null) {
    grid.classList.add('hidden');
    footer.classList.add('hidden');
    if (!unitLevels[unit.id]) unitLevels[unit.id] = 1;
    if (!unitReinc[unit.id]) unitReinc[unit.id] = 0;
    if (unit.acquired) {
      const drops = unit.drops ? unit.drops.map(d => `${d.item}(${d.rate})`).join(', ') : 'なし';
      const skills = (unit.skills || []).map(id => skillNames[id] || id);
      const boss = unit.bossSkill ? (bossSkillNames[unit.bossSkill] || unit.bossSkill) : 'なし';
      detail.innerHTML = `
        <div class="detail-content">
          <div class="detail-left">
            <div class="unit-level">Lv.<span id="detail-level">${unitLevels[unit.id]}</span><small>+<span id="detail-reinc">${unitReinc[unit.id]}</span></small></div>
            <div class="unit-name">${unit.name}</div>
            <div>属性: ${elementNames[unit.element] || unit.element}</div>
            <div>種族: ${raceNames[unit.race] || unit.race}</div>
            <div class="unit-stats">
              <p>HP: ${unit.hp}</p>
              <p>MP: ${unit.mp}</p>
              <p>攻撃: ${unit.attack}</p>
              <p>防御: ${unit.defense}</p>
              <p>速度: ${unit.speed}</p>
            </div>
            <div class="unit-slots">
              <p>ウェポン枠: ${unit.weaponSlots}</p>
              <p>アーティファクト枠: ${unit.artifactSlots}</p>
              <p>ルーン枠: ${unit.runeSlots || 0}</p>
            </div>
          </div>
          <div class="detail-center">
            <img src="${unit.image}" alt="${unit.name}" class="unit-image">
          </div>
          <div class="detail-right">
            <div class="equip-effects">
              <h4>装備効果</h4>
              <p>なし</p>
            </div>
            <div class="unit-skills">
              <h4>スキル</h4>
              <ul>${skills.length ? skills.map(s => `<li>${s}</li>`).join('') : '<li>なし</li>'}</ul>
            </div>
            <div class="unit-boss-skill">
              <h4>ボススキル</h4>
              <p>${boss}</p>
            </div>
            <div class="unit-drops">
              <h4>ドロップ</h4>
              <p>${drops}</p>
            </div>
          </div>
        </div>
        <div class="detail-bottom">
          <button id="reset-equip" class="detail-button">装備をリセット</button>
          <button id="reincarnate" class="detail-button">転生</button>
          ${fromFormation ? '<button id="remove-from-formation" class="detail-button">編成からはずす</button>' : ''}
          <button id="back-to-list" class="detail-button">${fromFormation ? '戻る' : '一覧に戻る'}</button>
        </div>`;
    } else {
      detail.innerHTML = `
        <h3>???</h3>
        <p>未取得のユニットです。</p>
        <div class="detail-bottom"><button id="back-to-list" class="detail-button">${fromFormation ? '戻る' : '一覧に戻る'}</button></div>`;
    }
    detail.classList.remove('hidden');
    const backBtn = document.getElementById('back-to-list');
    if (fromFormation) {
      backBtn.addEventListener('click', () => {
        detail.classList.add('hidden');
        showScreen('formation-screen');
      });
      const removeBtn = document.getElementById('remove-from-formation');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          delete formations[currentTeam][cellIndex];
          if (window.loadFormationGrid) window.loadFormationGrid();
          detail.classList.add('hidden');
          showScreen('formation-screen');
        });
      }
    } else {
      backBtn.addEventListener('click', () => {
        detail.classList.add('hidden');
        grid.classList.remove('hidden');
        footer.classList.remove('hidden');
      });
    }
    const reincBtn = document.getElementById('reincarnate');
    if (reincBtn) {
      reincBtn.addEventListener('click', () => {
        if (unitReinc[unit.id] < 200) {
          unitReinc[unit.id] += 1;
          unitLevels[unit.id] = 1;
          document.getElementById('detail-level').textContent = unitLevels[unit.id];
          document.getElementById('detail-reinc').textContent = unitReinc[unit.id];
        }
      });
    }
    const resetBtn = document.getElementById('reset-equip');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      alert('装備をリセットしました');
    });
  }
  }
  window.showUnitDetail = showDetail;
}

async function initFormationScreen() {
  const grid = document.getElementById('formation-grid');
  const unitStats = document.getElementById('selected-unit-stats');
  const playerStatusDiv = document.getElementById('player-status');
  const synergyDiv = document.getElementById('synergy');
  const unitSlide = document.getElementById('unit-slide');
  const slideItemMap = {};

  const unitsData = await (await fetch('data/units.json')).json();
  unitsData.units.forEach(u => (unitsDataMap[u.id] = u));
  const slideUnits = unitsData.units.filter(u => u.acquired);
  slideUnits.forEach(u => {
    const item = document.createElement('div');
    item.className = 'unit-slide-item';
    item.draggable = true;
    item.dataset.unitId = u.id;
    const stars = '★'.repeat(Number(u.rank));
    const name = u.name.length > 6 ? u.name.slice(0, 6) : u.name;
    item.innerHTML = `
      <img src="${u.image}" alt="${u.name}">
      <div class="unit-level">Lv${u.level}</div>
      <div class="unit-stars">${stars}</div>
      <div class="unit-slide-name">${name}</div>
    `;
    item.addEventListener('dragstart', e => {
      e.dataTransfer.setData('unit', JSON.stringify(u));
    });
    slideItemMap[u.id] = item;
    unitSlide.appendChild(item);
  });

  function updateUnitSlide() {
    Object.values(slideItemMap).forEach(item => (item.style.display = ''));
    const placed = Object.values(formations[currentTeam] || {}).map(u => u.id);
    placed.forEach(id => {
      const item = slideItemMap[id];
      if (item) item.style.display = 'none';
    });
  }

  updateUnitSlide();

  player = JSON.parse(localStorage.getItem('playerData')) || {
    name: 'プレイヤー',
    level: 1,
    maxUnits: 5,
    bonuses: { hp: 10, mp: 10, attack: 10, defense: 10, speed: 10 },
    gold: 1000,
    exp: 0
  };
  localStorage.setItem('playerData', JSON.stringify(player));

  renderPlayerStatus();

  const rows = 4;
  const cols = 9;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      const idx = r * cols + c;
      cell.dataset.index = idx;
      if (c >= cols - 4) cell.classList.add('player-area');
      grid.appendChild(cell);
    }
  }

  updateTeamButtons();
  loadGrid();

  grid.addEventListener('click', e => {
    const cell = e.target.closest('.cell');
    if (!cell || !cell.classList.contains('player-area')) return;
    const index = cell.dataset.index;
    const unit = formations[currentTeam][index];
    if (unit) {
      showScreen('units-screen');
      showUnitDetail(unit, true, index);
    }
  });

  grid.addEventListener('dragover', e => {
    const cell = e.target.closest('.cell');
    if (!cell || !cell.classList.contains('player-area')) return;
    e.preventDefault();
  });

  grid.addEventListener('drop', e => {
    const cell = e.target.closest('.cell');
    if (!cell || !cell.classList.contains('player-area')) return;
    e.preventDefault();
    const data = e.dataTransfer.getData('unit');
    if (data) {
      const unit = JSON.parse(data);
      const index = cell.dataset.index;
      const alreadyPlaced = Object.values(formations[currentTeam]).some(u => u.id === unit.id);
      if (alreadyPlaced) {
        alert('このユニットは既に配置されています');
        return;
      }
      const placedCount = Object.keys(formations[currentTeam]).length;
      if (!formations[currentTeam][index] && placedCount >= player.maxUnits) {
        alert('これ以上配置できません');
        return;
      }
      formations[currentTeam][index] = unit;
      loadGrid();
    }
  });

  grid.addEventListener('dragstart', e => {
    const img = e.target.closest('.player-unit');
    if (!img) return;
    const cell = img.parentElement;
    e.dataTransfer.setData('from-grid', cell.dataset.index);
  });

  unitSlide.addEventListener('dragover', e => e.preventDefault());

  unitSlide.addEventListener('drop', e => {
    e.preventDefault();
    const index = e.dataTransfer.getData('from-grid');
    if (index) {
      delete formations[currentTeam][index];
      loadGrid();
    }
  });

  grid.addEventListener('mouseover', e => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    const unit = formations[currentTeam][cell.dataset.index];
    if (unit) {
      unitStats.innerHTML = `<h3>${unit.name}</h3><p>Lv:${unit.level}</p><p>HP:${unit.hp}</p><p>MP:${unit.mp}</p><p>攻:${unit.attack}</p><p>防:${unit.defense}</p><p>速:${unit.speed}</p>`;
    } else if (cell.dataset.enemy) {
      const enemy = JSON.parse(cell.dataset.enemy);
      unitStats.innerHTML = `<h3>${enemy.name}</h3><p>Lv:${enemy.level}</p><p>HP:${enemy.hp}</p><p>MP:${enemy.mp}</p><p>攻:${enemy.attack}</p><p>防:${enemy.defense}</p><p>速:${enemy.speed}</p>`;
    } else {
      unitStats.textContent = 'ユニット未選択';
    }
  });

  grid.addEventListener('mouseleave', () => {
    unitStats.textContent = 'ユニット未選択';
  });

  document.getElementById('save-formation').addEventListener('click', () => {
    localStorage.setItem('formations', JSON.stringify(formations));
    alert('保存しました');
  });

  document.getElementById('reset-formation').addEventListener('click', () => {
    formations[currentTeam] = {};
    loadGrid();
  });

  function updateTeamButtons() {
    document.querySelectorAll('.team-button').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.team) === currentTeam);
      btn.addEventListener('click', () => {
        currentTeam = Number(btn.dataset.team);
        loadGrid();
        updateTeamButtons();
      });
    });
  }

  function loadGrid() {
    grid.querySelectorAll('.player-area').forEach(cell => {
      const unit = formations[currentTeam][cell.dataset.index];
      cell.innerHTML = unit ? `<img src="${unit.image}" alt="${unit.name}" class="player-unit" draggable="true">` : '';
    });
    updateSynergy();
    updateUnitSlide();
  }

  function updateSynergy() {
    const count = Object.keys(formations[currentTeam]).length;
    synergyDiv.textContent = `シナジー: ${count}`;
  }

  function renderPlayerStatus() {
    playerStatusDiv.innerHTML = `
      <h4>${player.name}</h4>
      <p>Lv:${player.level}</p>
      <p>配置可能:${player.maxUnits}</p>
      <p>Gold:${player.gold}</p>
      <p>Exp:${player.exp || 0}</p>
      <p>ステ上昇 HP:${player.bonuses.hp}% MP:${player.bonuses.mp}%<br>攻:${player.bonuses.attack}% 防:${player.bonuses.defense}% 速:${player.bonuses.speed}%</p>`;
  }

  window.loadFormationGrid = loadGrid;
  window.renderPlayerStatus = renderPlayerStatus;
}

function initWorldScreen() {
  const defaultAccess = { 1: true, 2: false };
  const access = JSON.parse(localStorage.getItem('fieldAccess')) || defaultAccess;
  if (!localStorage.getItem('fieldAccess')) {
    localStorage.setItem('fieldAccess', JSON.stringify(access));
  }
  const buttons = document.querySelectorAll('#world-map-container .field-button');
  buttons.forEach(btn => {
    const id = btn.dataset.field;
    if (!access[id]) {
      btn.classList.add('locked');
    }
    btn.addEventListener('click', () => {
      if (!access[id]) return;
      selectField(id, btn.textContent);
    });
  });
}

function selectField(id, name) {
  currentField = Number(id);
  currentStage = null;
  const num = String(id).padStart(2, '0');
  const fieldScreen = document.getElementById('field-screen');
  const title = document.getElementById('field-name');
  if (fieldScreen) {
    fieldScreen.style.backgroundImage = `url(images/stages/field_${num}.png)`;
    fieldScreen.style.backgroundSize = '100% 100%';
  }
  if (title) title.textContent = name;
  const islandBtn = document.getElementById('field-image-button');
  if (islandBtn) islandBtn.onclick = () => selectStage(currentField, 1);
  renderStageButtons(currentField);
  window.showScreen('field-screen');
}

function renderStageButtons(fieldId) {
  const container = document.getElementById('stage-buttons');
  if (!container) return;
  container.innerHTML = '';
  const stageClear = JSON.parse(localStorage.getItem('stageClear') || '{}');
  const cleared = stageClear[fieldId] || 0;
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.dataset.stage = i;
    if (i > cleared + 1) {
      btn.disabled = true;
    }
    btn.addEventListener('click', () => selectStage(fieldId, i));
    container.appendChild(btn);
  }
}

function selectStage(fieldId, stageNumber) {
  currentStage = stageNumber;
  const num = String(stageNumber).padStart(2, '0');
  const formationField = document.getElementById('formation-field');
  if (formationField) {
    formationField.style.backgroundImage = `url(images/stages/stage_${num}.png)`;
  }
  const backBtn = document.getElementById('formation-back');
  if (backBtn) backBtn.setAttribute('data-target', 'field-screen');
  if (window.loadFormationGrid) window.loadFormationGrid();
  loadEnemyFormation(stageNumber);
  window.showScreen('formation-screen');
}

async function loadEnemyFormation(stageNumber) {
  const num = String(stageNumber).padStart(2, '0');
  if (Object.keys(unitsDataMap).length === 0) {
    const unitsData = await (await fetch('data/units.json')).json();
    unitsData.units.forEach(u => (unitsDataMap[u.id] = u));
  }
  try {
    const res = await fetch(`data/enemies/stage_${num}.json`);
    const data = await res.json();
    enemyFormation = data.enemies || [];
  } catch (e) {
    enemyFormation = [];
  }
  renderEnemyFormation();
}

function renderEnemyFormation() {
  const grid = document.getElementById('formation-grid');
  if (!grid) return;
  grid.querySelectorAll('.enemy-unit').forEach(el => el.remove());
  grid.querySelectorAll('.enemy-cell').forEach(cell => {
    cell.classList.remove('enemy-cell');
    delete cell.dataset.enemy;
  });
  enemyFormation.forEach(info => {
    const cell = grid.querySelector(`.cell[data-index='${info.position}']`);
    const unit = unitsDataMap[info.id];
    if (!cell || !unit) return;
    const img = document.createElement('img');
    img.src = unit.image;
    img.alt = unit.name;
    img.className = 'enemy-unit';
    cell.appendChild(img);
    const stats = calcEnemyStats(unit, info.level);
    cell.dataset.enemy = JSON.stringify({ name: unit.name, level: info.level, ...stats });
    cell.classList.add('enemy-cell');
  });
}

function calcEnemyStats(unit, level) {
  const ratio = level / unit.level;
  return {
    hp: Math.round(unit.hp * ratio),
    mp: Math.round(unit.mp * ratio),
    attack: Math.round(unit.attack * ratio),
    defense: Math.round(unit.defense * ratio),
    speed: Math.round(unit.speed * ratio)
  };
}

function markStageCleared(fieldId, stageNumber) {
  const stageClear = JSON.parse(localStorage.getItem('stageClear') || '{}');
  if (!stageClear[fieldId] || stageClear[fieldId] < stageNumber) {
    stageClear[fieldId] = stageNumber;
    localStorage.setItem('stageClear', JSON.stringify(stageClear));
  }
  if (currentField === fieldId) {
    renderStageButtons(fieldId);
  }
}

window.markStageCleared = markStageCleared;

function unlockField(fieldId) {
  const access = JSON.parse(localStorage.getItem('fieldAccess') || '{}');
  if (!access[fieldId]) {
    access[fieldId] = true;
    localStorage.setItem('fieldAccess', JSON.stringify(access));
  }
}

function calculateRewards() {
  let gold = 0;
  let exp = 0;
  enemyFormation.forEach(info => {
    const level = info.level || 1;
    gold += level * 10;
    exp += level * 20;
  });
  return { gold, exp };
}

function startBattleListener() {
  if (battleResultInterval) clearInterval(battleResultInterval);
  battleResultInterval = setInterval(() => {
    if (!battleEngine || typeof battleEngine.check_victory !== 'function') return;
    const winner = battleEngine.check_victory();
    if (winner === 'player' || winner === 'enemy') {
      const victory = winner === 'player';
      document.dispatchEvent(
        new CustomEvent('battle:end', { detail: { victory } })
      );
      clearInterval(battleResultInterval);
      battleResultInterval = null;
    }
  }, 500);
}

function initBattle() {
  const grid = document.getElementById('battle-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 9; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.addEventListener('click', () => handleTargetSelect(x, y));
      grid.appendChild(cell);
    }
  }
  battleEngine = window.battleEngine || battleEngine;
  if (typeof processTurn === 'function') {
    processTurn();
  }
  const attackBtn = document.getElementById('attack-button');
  if (attackBtn) attackBtn.onclick = showSkillModal;
  const passBtn = document.getElementById('pass-button');
  if (passBtn)
    passBtn.onclick = () => {
      if (!currentAttacker) return;
      if (battleEngine && typeof battleEngine.pass_turn === 'function') {
        battleEngine.pass_turn(currentAttacker);
      }
      if (typeof processTurn === 'function') {
        processTurn();
      }
    };
  const surrenderBtn = document.getElementById('surrender-button');
  if (surrenderBtn)
    surrenderBtn.onclick = () => {
      if (battleEngine && typeof battleEngine.end_battle === 'function') {
        battleEngine.end_battle(false);
      }
      endBattle(false);
    };
  startBattleListener();
}

function showSkillModal() {
  if (!currentAttacker) return;
  const modal = document.getElementById('skill-modal');
  const list = document.getElementById('skill-list');
  if (!modal || !list) return;
  list.innerHTML = '';
  currentAttacker.skills.forEach(skill => {
    const btn = document.createElement('button');
    btn.textContent = skill.name;
    btn.addEventListener('click', () => {
      pendingSkill = skill;
      modal.classList.add('hidden');
      showBattleMessage('対象マスを選択してください');
    });
    list.appendChild(btn);
  });
  modal.classList.remove('hidden');
}

function handleTargetSelect(x, y) {
  if (!pendingSkill || !currentAttacker) return;
  let target = null;
  if (
    battleEngine &&
    battleEngine.field &&
    typeof battleEngine.field.unit_at === 'function'
  ) {
    target = battleEngine.field.unit_at([x, y]);
  }
  if (!target) {
    showBattleMessage('対象がいません');
    if (battleEngine && battleEngine.turn_logs) {
      battleEngine.turn_logs.push(`${currentAttacker.name} failed to attack`);
    }
    pendingSkill = null;
    return;
  }
  const distance =
    Math.abs(currentAttacker.position[0] - x) +
    Math.abs(currentAttacker.position[1] - y);
  if (distance > pendingSkill.range) {
    showBattleMessage('射程外です');
    if (battleEngine && battleEngine.turn_logs) {
      battleEngine.turn_logs.push(`${currentAttacker.name} failed to attack`);
    }
    pendingSkill = null;
    return;
  }
  clearBattleMessage();
  if (battleEngine && typeof battleEngine.attack === 'function') {
    battleEngine.attack(currentAttacker, target, pendingSkill);
  }
  pendingSkill = null;
  if (typeof processTurn === 'function') {
    processTurn();
  }
}

function showBattleMessage(msg) {
  const div = document.getElementById('battle-message');
  if (!div) return;
  div.textContent = msg;
  div.classList.remove('hidden');
}

function clearBattleMessage() {
  const div = document.getElementById('battle-message');
  if (!div) return;
  div.textContent = '';
  div.classList.add('hidden');
}

function endBattle(victory) {
  if (battleResultInterval) {
    clearInterval(battleResultInterval);
    battleResultInterval = null;
  }
  const title = document.getElementById('result-title');
  const summary = document.getElementById('result-summary');
  const retryBtn = document.getElementById('retry-button');
  const fieldBtn = document.getElementById('field-button');
  const nextBtn = document.getElementById('next-stage-button');

  retryBtn.onclick = () => {
    const backBtn = document.getElementById('formation-back');
    if (backBtn) backBtn.setAttribute('data-target', 'field-screen');
    window.showScreen('formation-screen');
  };
  fieldBtn.onclick = () => {
    window.showScreen('field-screen');
  };

  if (victory) {
    const rewards = calculateRewards();
    player.gold += rewards.gold;
    player.exp = (player.exp || 0) + rewards.exp;
    localStorage.setItem('playerData', JSON.stringify(player));
    if (window.renderPlayerStatus) window.renderPlayerStatus();
    title.textContent = '勝利';
    summary.innerHTML = `ゴールド +${rewards.gold}<br>経験値 +${rewards.exp}`;
    markStageCleared(currentField, currentStage);
    if (currentStage === 10) {
      unlockField(currentField + 1);
      nextBtn.textContent = '次のフィールドへ';
      nextBtn.onclick = () => {
        const nextFieldBtn = document.querySelector(`#world-map-container .field-button[data-field='${currentField + 1}']`);
        const name = nextFieldBtn ? nextFieldBtn.textContent : '';
        selectField(currentField + 1, name);
      };
    } else {
      nextBtn.textContent = '次のステージへ';
      nextBtn.onclick = () => {
        if (currentStage != null) {
          selectStage(currentField, currentStage + 1);
        }
      };
    }
    nextBtn.style.display = '';
  } else {
    title.textContent = '敗北';
    summary.textContent = 'もう一度挑戦しよう！';
    nextBtn.style.display = 'none';
  }
  window.showScreen('result-screen');
}

window.endBattle = endBattle;
