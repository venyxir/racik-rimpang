(() => {
  const { normalizePhone } = window.RuangUtils;

  async function load(email) {
    const seller = await window.RuangStore.get('sellers', email);
    if (!seller) return { seller: null, products: [], reviews: [] };
    const [allProducts, allReviews] = await Promise.all([
      window.RuangStore.all('products'),
      window.RuangStore.all('reviews')
    ]);
    return {
      seller,
      products: allProducts.filter((product) => product.ownerEmail === seller.email),
      reviews: allReviews.filter((review) => normalizePhone(review.sellerPhone) === normalizePhone(seller.phone))
    };
  }

  async function updateProfile(seller, changes) {
    const updatedSeller = { ...seller, ...changes };
    await window.RuangStore.put('sellers', updatedSeller);

    const [allProducts, allReviews] = await Promise.all([
      window.RuangStore.all('products'),
      window.RuangStore.all('reviews')
    ]);
    const sellerProducts = allProducts.filter((product) => product.ownerEmail === seller.email);
    await Promise.all(sellerProducts.map((product) => window.RuangStore.put('products', {
      ...product,
      sellerName: updatedSeller.name,
      sellerPhone: updatedSeller.phone
    })));

    if (normalizePhone(seller.phone) !== normalizePhone(updatedSeller.phone)) {
      const sellerReviews = allReviews.filter((review) => normalizePhone(review.sellerPhone) === normalizePhone(seller.phone));
      await Promise.all(sellerReviews.map((review) => window.RuangStore.put('reviews', {
        ...review,
        sellerPhone: updatedSeller.phone
      })));
    }

    return updatedSeller;
  }

  async function saveProduct(seller, values, photos, productId) {
    const existing = productId ? await window.RuangStore.get('products', productId) : null;
    if (existing && existing.ownerEmail !== seller.email) {
      throw new Error('Produk ini bukan milik akun seller yang sedang masuk.');
    }

    const product = {
      id: existing?.id || `product-${crypto.randomUUID()}`,
      ownerEmail: seller.email,
      name: values.name,
      category: values.category,
      price: values.price,
      stock: values.stock,
      description: values.description,
      sellerName: seller.name,
      sellerPhone: seller.phone,
      photos,
      createdAt: existing?.createdAt || Date.now()
    };
    await window.RuangStore.put('products', product);
    return product;
  }

  async function deleteProduct(seller, productId) {
    const product = await window.RuangStore.get('products', productId);
    if (!product || product.ownerEmail !== seller.email) {
      throw new Error('Produk ini bukan milik akun seller yang sedang masuk.');
    }
    await window.RuangStore.remove('products', productId);
  }

  window.RuangSellerDashboardData = { load, updateProfile, saveProduct, deleteProduct };
})();