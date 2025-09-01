const { UnitManager } = require('../units/UnitManager');

async function createUnitUI(state) {
  const manager = new UnitManager(state.unlockedUnits, state.gold);
  await manager.init();

  return {
    list() {
      return manager.listUnits();
    },
    details(id) {
      const unit = manager.getUnit(id);
      if (!unit) return null;
      if (!manager.unlocked.has(id)) {
        return { id, name: '???' };
      }
      return unit;
    },
    summon(id, cost = 100) {
      return manager.summon(id, cost);
    },
    manager
  };
}

module.exports = { createUnitUI };
