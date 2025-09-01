const rules = [
  { a: 'hero', b: 'mage', result: 'goblin' },
  { a: 'hero', b: 'sword', result: 'orc' }
];

class ResearchManager {
  constructor(unitManager, itemManager) {
    this.unitManager = unitManager;
    this.itemManager = itemManager;
  }

  research(id1, id2) {
    const rule = rules.find(r =>
      (r.a === id1 && r.b === id2) || (r.a === id2 && r.b === id1)
    );
    if (rule) {
      this.unitManager.unlockUnit(rule.result);
      return rule.result;
    }
    return null;
  }
}

module.exports = { ResearchManager };
