const isBrowser = typeof window !== 'undefined' && typeof window.fetch === 'function';

async function loadJSON(file) {
  if (isBrowser) {
    const res = await fetch(`data/${file}`);
    return res.json();
  } else {
    const fs = require('fs').promises;
    const path = require('path');
    const dataDir = path.resolve(__dirname, '../../data');
    const data = await fs.readFile(path.join(dataDir, file), 'utf8');
    return JSON.parse(data);
  }
}

async function loadUnits() {
  return loadJSON('units.json');
}

async function loadSkills() {
  return loadJSON('skills.json');
}

async function loadItems() {
  return loadJSON('items.json');
}

async function loadAll() {
  const [units, skills, items] = await Promise.all([
    loadUnits(),
    loadSkills(),
    loadItems()
  ]);
  return { units, skills, items };
}

module.exports = {
  loadUnits,
  loadSkills,
  loadItems,
  loadAll
};
