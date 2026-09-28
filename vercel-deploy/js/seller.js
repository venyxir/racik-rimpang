(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const { escapeHtml, safeImage, formatPrice, normalizePhone, getSellerRating, icon, toast } = window.RuangUtils;
  let seller;
  let products = [];
  let reviews = [];
  let editorPhotos = [];
  let editingId = null;

  async function init() {
    try {
      await window.RuangStore.init();
      seller = await window.RuangAuth.currentUser();
      if (!seller || seller.role !== 'seller') { location.replace('../login/'); return; }
      await reloadDashboardData();
      renderInventory();
      bindEvents();
    } catch (error) { location.replace('../login/'); }
  }

  async function reloadDashboardData() {
    const data = await window.RuangSellerDashboardData.load(seller.email);
    seller = data.seller;
    products = data.products;
    reviews = data.reviews;
  }

  function mine() { return products; }

  function renderInventory() {
    const items = mine().sort((a, b) => b.createdAt - a.createdAt);
    const score = getSellerRating(reviews, seller.phone);
    $('#sellerAvatar').textContent = (seller.name || 'S')[0].toUpperCase();
    $('#sellerDisplayName').textContent = seller.name;
    $('#sellerDisplayEmail').textContent = seller.email;
    $('#sellerTitle').textContent = seller.name;
    $('#sellerStats').textContent = `${items.length} produk · ${score ? `rating ${score.toFixed(1)}` : 'belum ada rating'}`;
    $('#sellerName').value = seller.name || '';
    $('#sellerPhone').value = seller.phone || '';
    $('#inventoryList').innerHTML = items.length ? items.map((product) => `<article class="inventory-item"><img src="${escapeHtml(safeImage(product.photos?.[0]))}" alt=""><div><h3>${escapeHtml(product.name)}</h3><p>${formatPrice(product.price)} · Stok ${Number(product.stock) || 0}</p></div><div class="inventory-actions"><button class="icon-button" type="button" data-edit="${escapeHtml(product.id)}" aria-label="Edit ${escapeHtml(product.name)}" title="Edit">${icon('edit')}</button><button class="icon-button" type="button" data-delete="${escapeHtml(product.id)}" aria-label="Hapus ${escapeHtml(product.name)}" title="Hapus">${icon('trash')}</button></div></article>`).join('') : '<div class="dashboard-empty">Belum ada produk di toko ini. Tambahkan produk pertama Anda.</div>';
  }

  function renderEditor(product = null) {
    editingId = product?.id || null;
    editorPhotos = product?.photos ? [...product.photos] : [];
    $('#editorPanel').hidden = false;
    $('#editorTitle').textContent = product ? 'Edit produk' : 'Tambah produk';
    $('#productName').value = product?.name || '';
    $('#productPrice').value = product?.price || '';
    $('#productStock').value = product?.stock ?? '';
    $('#productCategory').value = product?.category || 'Jamu siap minum';
    $('#productDescription').value = product?.description || '';
    $('#saveProduct').textContent = product ? 'Simpan perubahan' : 'Terbitkan produk';
    renderPreviews();
    $('#productName').focus();
  }

  function renderPreviews() {
    $('#photoPreviews').innerHTML = editorPhotos.map((photo, index) => `<div class="photo-preview"><img src="${escapeHtml(safeImage(photo))}" alt="Foto produk ${index + 1}"><button class="photo-remove" type="button" data-remove-photo="${index}" aria-label="Hapus foto">×</button></div>`).join('');
    $('#photoCount').textContent = `${editorPhotos.length} / 5 foto`;
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) { reject(new Error('Pilih file gambar yang valid.')); return; }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Foto tidak dapat dibaca.'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('Foto tidak dapat diproses.'));
        image.onload = () => {
          const scale = Math.min(1, 1440 / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', .8));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (!editorPhotos.length) { toast('Tambahkan minimal satu foto produk.', true); return; }
    const data = new FormData(event.target);
    const existing = mine().find((product) => String(product.id) === String(editingId));
    const values = {
      name: String(data.get('name')).trim(),
      category: String(data.get('category')),
      price: Number(data.get('price')),
      stock: Math.max(0, Math.floor(Number(data.get('stock')))),
      description: String(data.get('description')).trim()
    };
    const button = $('#saveProduct');
    button.disabled = true;
    try {
      await window.RuangSellerDashboardData.saveProduct(seller, values, editorPhotos, existing?.id);
      await reloadDashboardData();
      $('#editorPanel').hidden = true;
      renderInventory();
      toast(existing ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.');
    } catch (error) { toast('Penyimpanan penuh. Coba gunakan foto yang lebih kecil.', true); }
    finally { button.disabled = false; }
  }

  function bindEvents() {
    $('#logoutButton').addEventListener('click', () => { window.RuangAuth.logout(); location.replace('../login/'); });
    $('#sellerProfileForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(event.target);
      const phone = normalizePhone(data.get('phone'));
      if (phone.length < 8 || phone.length > 15) { toast('Masukkan nomor WhatsApp yang valid.', true); return; }
      seller = await window.RuangSellerDashboardData.updateProfile(seller, { name: String(data.get('name')).trim(), phone });
      await reloadDashboardData();
      toast('Profil toko tersimpan.');
      renderInventory();
    });
    $('#addProductButton').addEventListener('click', () => renderEditor());
    $('#cancelProduct').addEventListener('click', () => { $('#editorPanel').hidden = true; });
    $('#productForm').addEventListener('submit', saveProduct);
    $('#photoInput').addEventListener('change', async (event) => {
      const files = [...event.target.files];
      const available = Math.max(0, 5 - editorPhotos.length);
      if (files.length > available) toast('Maksimal 5 foto per produk.', true);
      try {
        editorPhotos.push(...await Promise.all(files.slice(0, available).map(compressImage)));
        renderPreviews();
      } catch (error) { toast(error.message, true); }
      event.target.value = '';
    });
    $('#photoPreviews').addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove-photo]');
      if (button) { editorPhotos.splice(Number(button.dataset.removePhoto), 1); renderPreviews(); }
    });
    $('#inventoryList').addEventListener('click', async (event) => {
      const edit = event.target.closest('[data-edit]');
      if (edit) { renderEditor(mine().find((product) => String(product.id) === edit.dataset.edit)); return; }
      const remove = event.target.closest('[data-delete]');
      if (!remove) return;
      const product = mine().find((item) => String(item.id) === remove.dataset.delete);
      if (product && confirm(`Hapus produk "${product.name}"?`)) {
        await window.RuangSellerDashboardData.deleteProduct(seller, product.id);
        await reloadDashboardData();
        renderInventory();
        toast('Produk dihapus.');
      }
    });
  }

  init();
})();