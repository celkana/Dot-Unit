const { loadUnits } = require('../loader');

class UnitManager {
  constructor(unlocked = [], gold = 0) {
    this.unlocked = new Set(unlocked);
    this.gold = gold;
    this.units = [];
  }

  async init() {
    const data = await loadUnits();
    this.units = data.units;
    if (this.unlocked.size === 0) {
      this.units.filter(u => u.acquired).forEach(u => this.unlocked.add(u.id));
    }
  }

  listUnits() {
    return this.units.map(u => ({
      id: u.id,
      name: this.unlocked.has(u.id) ? u.name : '???',
      unlocked: this.unlocked.has(u.id)
    }));
  }

  getUnit(id) {
    return this.units.find(u => u.id === id);
  }

  unlockUnit(id) {
    this.unlocked.add(id);
  }

  canSummon(id, cost = 100) {
    return this.unlocked.has(id) && this.gold >= cost;
  }

  summon(id, cost = 100) {
    if (!this.canSummon(id, cost)) {
      throw new Error('Cannot summon');
    }
    this.gold -= cost;
    return Object.assign({}, this.getUnit(id));
  }
}

module.exports = { UnitManager };
