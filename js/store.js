(() => {
  const DB_NAME = 'ruang-lokal-db';
  const DB_VERSION = 3;
  const storeNames = ['products', 'reviews', 'sellers', 'admins', 'cart', 'wishlist'];
  let database;

  function open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        for (const name of storeNames) {
          if (request.result.objectStoreNames.contains(name)) continue;
          const keyPath = name === 'cart' || name === 'wishlist' ? 'productId' : ['sellers', 'admins'].includes(name) ? 'email' : 'id';
          request.result.createObjectStore(name, { keyPath });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function all(storeName) {
    return new Promise((resolve, reject) => {
      const request = database.transaction(storeName, 'readonly').objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function get(storeName, id) {
    return new Promise((resolve, reject) => {
      const request = database.transaction(storeName, 'readonly').objectStore(storeName).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  function put(storeName, record) {
    return new Promise((resolve, reject) => {
      const request = database.transaction(storeName, 'readwrite').objectStore(storeName).put(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function remove(storeName, id) {
    return new Promise((resolve, reject) => {
      const request = database.transaction(storeName, 'readwrite').objectStore(storeName).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async function init() {
    if (!database) database = await open();
    await window.RuangDataImporter.importCatalog();
  }

  window.RuangStore = { all, get, put, remove, init };
})();