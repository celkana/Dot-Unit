function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomUnit() {
  const id = `unit_${Math.random().toString(36).slice(2, 8)}`;
  const name = `ユニット${randBetween(1, 9999)}`;
  const imageNum = String(randBetween(1, 50)).padStart(3, '0');
  const weaponTypesAll = ['melee', 'mid', 'ranged'];
  const weaponTypes = weaponTypesAll.filter(() => Math.random() < 0.5);
  return {
    id,
    name,
    level: 1,
    maxLevel: 20,
    reincarnationLevel: 20,
    growPoint: [{ hp: 1 }, { mp: 1 }, { attack: 1 }, { defense: 1 }, { speed: 1 }, { maxBonus: 5 }],
    image: `images/units/mon_${imageNum}.gif`,
    hp: randBetween(10, 100),
    maxHp: randBetween(100, 500),
    mp: randBetween(0, 100),
    maxMp: randBetween(100, 500),
    attack: randBetween(1, 50),
    maxAttack: randBetween(50, 200),
    defense: randBetween(1, 50),
    maxDefense: randBetween(50, 200),
    speed: randBetween(1, 50),
    maxSpeed: randBetween(50, 200),
    race: randomChoice(['human', 'beast', 'dragon', 'undead', 'demon', 'machine', 'plant']),
    element: randomChoice(['none', 'fire', 'water', 'wind', 'earth', 'light', 'dark']),
    rank: randBetween(1, 5),
    weaponSlots: randBetween(0, 2),
    artifactSlots: randBetween(0, 2),
    weaponTypes,
    acquired: true,
    skills: [],
    bossSkills: [],
    drops: [],
    reward: { gold: 0, exp: 0 },
    description: ''
  };
}

function generateRandomUnits(count) {
  return Array.from({ length: count }, generateRandomUnit);
}

module.exports = { generateRandomUnit, generateRandomUnits };
