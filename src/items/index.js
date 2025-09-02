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
    if (!unit.equipment) unit.equipment = { weapons: [], artifacts: [], others: {} };
    const slot = item.slot;
    if (slot === 'weapon') {
      unit.equipment.weapons = unit.equipment.weapons || [];
      const max = unit.weaponSlots || 0;
      if (unit.equipment.weapons.length >= max) {
        throw new Error('No weapon slots left');
      }
      unit.equipment.weapons.push(item);
      if (item.id === 'sword') {
        unit.attack = (unit.attack || 0) + 5;
      }
    } else if (slot === 'artifact') {
      unit.equipment.artifacts = unit.equipment.artifacts || [];
      const max = unit.artifactSlots || 0;
      if (unit.equipment.artifacts.length >= max) {
        throw new Error('No artifact slots left');
      }
      unit.equipment.artifacts.push(item);
      if (item.id === 'amulet') {
        unit.speed = (unit.speed || 0) + 1;
      }
    } else {
      unit.equipment.others[item.id] = item;
    }
  }
}

module.exports = { ItemManager };
