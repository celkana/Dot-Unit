const SAVE_KEY = 'dot-unit-save';

function getStorage() {
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  // Fallback for non-browser (e.g., Node.js tests)
  let store = {};
  return {
    getItem: key => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = value;
    },
    removeItem: key => {
      delete store[key];
    }
  };
}

const storage = getStorage();

function load() {
  const data = storage.getItem(SAVE_KEY);
  if (!data) {
    return { stage: 0, resources: { gold: 0, items: {} } };
  }
  try {
    return JSON.parse(data);
  } catch (err) {
    return { stage: 0, resources: { gold: 0, items: {} } };
  }
}

function save(progress) {
  storage.setItem(SAVE_KEY, JSON.stringify(progress));
}

function clear() {
  storage.removeItem(SAVE_KEY);
}

module.exports = {
  load,
  save,
  clear
};
