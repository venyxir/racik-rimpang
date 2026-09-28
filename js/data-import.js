(() => {
  const dataUrl = new URL('../data/', document.currentScript.src);

  async function readJson(fileName) {
    const response = await fetch(new URL(fileName, dataUrl), { cache: 'no-store' });
    if (!response.ok) throw new Error(`Tidak dapat membaca data/${fileName}.`);
    return response.json();
  }

  function validateProducts(products) {
    if (!Array.isArray(products)) throw new Error('products.json harus berisi array "products".');
    for (const [index, product] of products.entries()) {
      const valid = product.id && product.name && product.category &&
        Number.isFinite(Number(product.price)) && Number(product.price) > 0 &&
        Number.isInteger(Number(product.stock)) && Number(product.stock) >= 0 &&
        Array.isArray(product.photos) && product.photos.length > 0 && product.photos.length <= 5;
      if (!valid) throw new Error(`Data produk ke-${index + 1} tidak valid.`);
      if (!String(product.id).startsWith('seed-')) throw new Error(`ID produk contoh harus diawali "seed-": ${product.id}`);
    }
  }

  function validateReviews(reviews) {
    if (!Array.isArray(reviews)) throw new Error('reviews.json harus berisi array "reviews".');
    for (const [index, review] of reviews.entries()) {
      const valid = review.id && review.author && review.sellerPhone &&
        Number.isInteger(Number(review.rating)) && Number(review.rating) >= 1 && Number(review.rating) <= 5 &&
        typeof review.comment === 'string';
      if (!valid) throw new Error(`Data ulasan ke-${index + 1} tidak valid.`);
      if (!/^review-\d+$/.test(String(review.id))) throw new Error(`ID ulasan contoh harus berupa "review-angka": ${review.id}`);
    }
  }

  async function syncSeedRecords(storeName, records, isSeedRecord) {
    const ids = new Set(records.map((record) => String(record.id)));
    const existing = await window.RuangStore.all(storeName);
    const existingById = new Map(existing.map((record) => [String(record.id), record]));
    const obsoleteIds = existing
      .filter((record) => isSeedRecord(record) && !ids.has(String(record.id)))
      .map((record) => record.id);
    await Promise.all(obsoleteIds.map((id) => window.RuangStore.remove(storeName, id)));

    // Seed data is the catalog's initial data. Do not overwrite changes made by a
    // seller in IndexedDB (especially uploaded/replaced photos) every time the
    // page loads. Static catalog fields are refreshed, while seller-editable
    // fields remain as saved locally.
    const sellerEditable = new Set(['name', 'category', 'price', 'stock', 'description', 'photos']);
    await Promise.all(records.map(async (record) => {
      const current = existingById.get(String(record.id));
      if (!current) return window.RuangStore.put(storeName, record);
      const merged = { ...record };
      for (const field of sellerEditable) {
        if (Object.prototype.hasOwnProperty.call(current, field)) merged[field] = current[field];
      }
      if (current.createdAt) merged.createdAt = current.createdAt;
      if (current.ownerEmail) merged.ownerEmail = current.ownerEmail;
      return window.RuangStore.put(storeName, merged);
    }));
  }

  async function importCatalog() {
    const [productData, reviewData] = await Promise.all([
      readJson('products.json'),
      readJson('reviews.json')
    ]);
    validateProducts(productData.products);
    validateReviews(reviewData.reviews);
    await Promise.all([
      syncSeedRecords('products', productData.products, (product) => /^seed-\d+$/.test(String(product.id))),
      syncSeedRecords('reviews', reviewData.reviews, (review) => /^review-\d+$/.test(String(review.id)))
    ]);

    const products = await window.RuangStore.all('products');
    const productsWithoutStock = products.filter((product) => !Number.isInteger(Number(product.stock)) || Number(product.stock) < 0);
    await Promise.all(productsWithoutStock.map((product) => window.RuangStore.put('products', { ...product, stock: 10 })));
  }

  async function loadDemoAccounts() {
    const accounts = await readJson('demo-accounts.json');
    if (!Array.isArray(accounts.admins) || !Array.isArray(accounts.sellers)) {
      throw new Error('demo-accounts.json harus memiliki array "admins" dan "sellers".');
    }
    return accounts;
  }

  window.RuangDataImporter = { importCatalog, loadDemoAccounts };
})();