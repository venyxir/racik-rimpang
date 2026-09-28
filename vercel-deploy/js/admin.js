(() => {
  const $ = (selector) => document.querySelector(selector);
  const { escapeHtml, formatPrice } = window.RuangUtils;

  async function init() {
    try {
      await window.RuangStore.init();
      const admin = await window.RuangAuth.currentUser();
      if (!admin || admin.role !== 'admin') { location.replace('../login/'); return; }
      $('#adminName').textContent = admin.name;
      $('#adminAvatar').textContent = (admin.name || 'A')[0].toUpperCase();

      const overview = await window.RuangAdminDashboardData.loadOverview();
      $('#adminSellerCount').textContent = overview.totals.sellers;
      $('#adminProductCount').textContent = overview.totals.products;
      $('#adminReviewCount').textContent = overview.totals.reviews;
      $('#adminSellerRows').innerHTML = overview.sellers.length
        ? overview.sellers.map((seller) => `<tr><td>${escapeHtml(seller.name)}</td><td>${escapeHtml(seller.email)}</td><td>${seller.productCount}</td><td>${seller.reviewCount}</td><td>${seller.rating ? seller.rating.toFixed(1) : 'Baru'}</td></tr>`).join('')
        : '<tr><td colspan="5">Belum ada seller terdaftar.</td></tr>';
      $('#adminProductRows').innerHTML = overview.products.length
        ? overview.products.map((product) => `<tr><td>${escapeHtml(product.name)}</td><td>${escapeHtml(product.sellerName || 'Toko demo')}</td><td>${escapeHtml(product.category)}</td><td>${formatPrice(product.price)}</td><td>${Math.max(0, Number(product.stock) || 0)}</td></tr>`).join('')
        : '<tr><td colspan="5">Belum ada produk.</td></tr>';
    } catch (error) {
      console.error(error);
      location.replace('../login/');
    }
  }

  $('#adminLogout').addEventListener('click', () => {
    window.RuangAuth.logout();
    location.replace('../login/');
  });

  init();
})();