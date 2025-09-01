class ItemManager {
  constructor(items = [], inventory = {}) {
    this.items = items;
    // inventory is mapping itemId -> quantity
    this.inventory = Object.assign({}, inventory);
  }

  getItem(itemId) {
    return this.items.find(i => i.id === itemId);
  }

  addItem(itemId, qty = 1) {
    if (!this.inventory[itemId]) {
      this.inventory[itemId] = 0;
    }
    this.inventory[itemId] += qty;
  }

  useItem(itemId, unit) {
    const item = this.getItem(itemId);
    if (!item) throw new Error('Unknown item: ' + itemId);
    if (!this.inventory[itemId]) throw new Error('Item not owned');

    switch (item.type) {
      case 'consumable':
        this.applyConsumable(item, unit);
        this.inventory[itemId] -= 1;
        if (this.inventory[itemId] <= 0) delete this.inventory[itemId];
        break;
      case 'passive':
        this.applyPassive(item, unit);
        // passive items stack; keep in inventory if stackable
        if (!item.stackable) this.inventory[itemId] -= 1;
        break;
      case 'equipment':
        this.applyEquipment(item, unit);
        this.inventory[itemId] -= 1;
        break;
      default:
        throw new Error('Unknown item type: ' + item.type);
    }
  }

  applyConsumable(item, unit) {
    if (item.id === 'potion') {
      unit.hp = Math.min(unit.maxHp || unit.hp, unit.hp + 20);
    }
  }

  applyPassive(item, unit) {
    if (item.id === 'amulet') {
      unit.speed = (unit.speed || 0) + 1;
    }
  }

  applyEquipment(item, unit) {
    if (!unit.equipment) unit.equipment = {};
    unit.equipment[item.id] = item;
    if (item.id === 'sword') {
      unit.attack = (unit.attack || 0) + 5;
    }
  }
}

module.exports = { ItemManager };
