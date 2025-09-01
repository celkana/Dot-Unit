const { ItemManager } = require('../items');
const { loadItems } = require('../loader');

async function createItemUI(state) {
  const data = await loadItems();
  const manager = new ItemManager(data.items, state.inventory);
  return {
    listItems() {
      return manager.items.map(it => ({
        id: it.id,
        name: it.name,
        owned: manager.inventory[it.id] || 0
      }));
    },
    useItem(itemId, unit) {
      manager.useItem(itemId, unit);
    },
    manager
  };
}

module.exports = { createItemUI };
