(() => {
  const { categories, fallbackImage } = window.RuangData;
  const { normalizePhone, escapeHtml, safeImage, formatPrice, getSellerReviews, getSellerRating, icon, toast } = window.RuangUtils;
  let products = [];
  let reviews = [];
  let activeCategory = 'Semua';
  let selectedProductId = null;
  let selectedRating = 5;
  let cart = [];
  let wishlist = [];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function isWished(productId) {
    return wishlist.some((item) => String(item.productId) === String(productId));
  }

  function renderCategories() {
    $('#categoryRow').innerHTML = categories.map((category) => `<button class="category-chip${category === activeCategory ? ' active' : ''}" type="button" data-category="${escapeHtml(category)}" aria-pressed="${category === activeCategory}">${escapeHtml(category)}</button>`).join('');
  }

  function getMatchingProducts() {
    const query = $('#searchInput').value.trim().toLocaleLowerCase('id-ID');
    const result = products.filter((product) => {
      const search = `${product.name} ${product.description} ${product.category} ${product.sellerName} ${product.groupName || ''} ${(product.members || []).join(' ')}`.toLocaleLowerCase('id-ID');
      return (activeCategory === 'Semua' || product.category === activeCategory) && (!query || search.includes(query));
    });
    const sort = $('#sortSelect').value;
    if (sort === 'newest') result.sort((a, b) => b.createdAt - a.createdAt);
    if (sort === 'price-low') result.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') result.sort((a, b) => b.price - a.price);
    if (sort === 'rating') result.sort((a, b) => getSellerRating(reviews, b.sellerPhone) - getSellerRating(reviews, a.sellerPhone));
    return result;
  }

  function ratingMarkup(rating) {
    return `<span class="rating-inline">${icon('star')} ${rating ? Number(rating).toFixed(1) : 'Baru'}</span>`;
  }

  function renderProducts() {
    const result = getMatchingProducts();
    $('#resultCount').innerHTML = `<strong>${result.length}</strong> produk ditemukan`;
    $('#productGrid').innerHTML = result.length ? result.map((product, index) => `
      <article class="product-card" style="animation-delay:${Math.min(index * 30, 240)}ms">
        <button class="product-open" type="button" data-product="${escapeHtml(product.id)}" aria-label="Lihat ${escapeHtml(product.name)}">
          <div class="product-image"><img src="${escapeHtml(safeImage(product.photos?.[0]))}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackImage}'"><span class="image-tag">${escapeHtml(product.category)}</span></div>
          <div class="product-info"><div class="product-name">${escapeHtml(product.name)}</div><div class="product-price">${formatPrice(product.price)}</div><div class="product-meta"><span class="seller-name">${escapeHtml(product.sellerName || 'Toko lokal')} · Stok ${Math.max(0, Number(product.stock) || 0)}</span>${ratingMarkup(getSellerRating(reviews, product.sellerPhone))}</div></div>
        </button>
        <div class="product-actions"><button class="add-cart" type="button" data-add-cart="${escapeHtml(product.id)}" ${Number(product.stock) < 1 ? 'disabled' : ''}>${Number(product.stock) < 1 ? 'Stok habis' : 'Tambah ke keranjang'}</button><button class="wish-toggle${isWished(product.id) ? ' active' : ''}" type="button" data-toggle-wish="${escapeHtml(product.id)}" aria-label="${isWished(product.id) ? 'Hapus dari' : 'Tambah ke'} wishlist" aria-pressed="${isWished(product.id)}">${icon('heart')}</button></div>
      </article>`).join('') : '<div class="empty-state"><h3>Belum ada produk yang cocok</h3><p>Coba kata kunci atau kategori lain.</p></div>';
  }

  function refreshCounts() {
    $('#cartCount').textContent = String(cart.reduce((total, item) => total + item.quantity, 0));
    $('#wishlistCount').textContent = String(wishlist.length);
  }

  function openOverlay(id) {
    document.getElementById(id).classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeOverlay(id) {
    document.getElementById(id).classList.remove('open');
    if (!$('.overlay.open')) document.body.style.overflow = '';
  }

  function orderUrl(product, quantity = 1) {
    const phone = normalizePhone(product.sellerPhone);
    const text = `Halo ${product.sellerName}, saya ingin memesan ${product.name} (${quantity} item) seharga ${formatPrice(product.price * quantity)}. Apakah tersedia?`;
    return phone.length >= 8 ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : '#';
  }

  function renderDetail(product) {
    const photos = product.photos?.length ? product.photos : [fallbackImage];
    const sellerReviews = getSellerReviews(reviews, product.sellerPhone).sort((a, b) => b.createdAt - a.createdAt);
    const average = getSellerRating(reviews, product.sellerPhone);
    const url = orderUrl(product);
    const orderButton = Number(product.stock) < 1
      ? '<button class="primary-button buy-button" type="button" disabled>Stok habis</button>'
      : url === '#'
      ? '<button class="primary-button buy-button" type="button" disabled>Nomor WhatsApp belum tersedia</button>'
      : `<a class="primary-button buy-button" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Pesan langsung via WhatsApp</a>`;
    $('#detailContent').innerHTML = `
      <div class="detail-layout">
        <div><div class="detail-photo"><img id="activeDetailPhoto" src="${escapeHtml(safeImage(photos[0]))}" alt="${escapeHtml(product.name)}"><span class="photo-count">1 / ${photos.length} foto</span></div>
          ${photos.length > 1 ? `<div class="thumb-row">${photos.map((photo, index) => `<button class="thumb${index === 0 ? ' active' : ''}" type="button" data-photo-index="${index}" aria-label="Lihat foto ${index + 1}"><img src="${escapeHtml(safeImage(photo))}" alt=""></button>`).join('')}</div>` : ''}
        </div>
        <div><div class="detail-category">${escapeHtml(product.category)}</div><h2 class="detail-title">${escapeHtml(product.name)}</h2><div class="detail-price">${formatPrice(product.price)}</div><p class="seller-score">Stok tersedia: ${Math.max(0, Number(product.stock) || 0)}</p>
          <div class="detail-seller"><span class="avatar">${escapeHtml((product.sellerName || 'T')[0].toUpperCase())}</span><span><strong>${escapeHtml(product.sellerName || 'Toko lokal')}</strong><span class="seller-score">${average ? `★ ${average.toFixed(1)} · ${sellerReviews.length} ulasan` : 'Belum ada ulasan'}</span></span></div>
          <p class="detail-description">${escapeHtml(product.description || 'Belum ada deskripsi produk.')}</p>
          <div class="product-extra" style="margin-top:16px;padding:14px;border:1px solid rgba(127,127,127,.18);border-radius:14px">
            <div style="font-weight:700;margin-bottom:8px">Toko / Kelompok</div>
            <div>${escapeHtml(product.groupName || product.sellerName || 'Belum ada nama kelompok')}</div>
            <div style="margin-top:8px;font-weight:700">Seller / Perwakilan</div>
            <div>${escapeHtml(product.sellerContactName || product.sellerName || 'Belum ada nama seller')}</div>
            ${product.sellerPhone ? `<div style="margin-top:3px">${escapeHtml(product.sellerPhone)}</div>` : ''}
            <div style="margin-top:8px;font-weight:700">Komposisi</div>
            <ul style="margin:6px 0 0 18px;padding:0">${(product.composition || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
            <div style="margin-top:8px;font-weight:700">Anggota</div>
            <ol style="margin:6px 0 0 18px;padding:0">${(product.members || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
          </div>
          <div class="detail-actions"><button class="primary-button" type="button" data-add-cart="${escapeHtml(product.id)}" ${Number(product.stock) < 1 ? 'disabled' : ''}>${Number(product.stock) < 1 ? 'Stok habis' : 'Tambah ke keranjang'}</button><button class="secondary-button" type="button" data-toggle-wish="${escapeHtml(product.id)}">${isWished(product.id) ? 'Hapus wishlist' : 'Simpan wishlist'}</button></div>
          <div style="margin-top:8px">${orderButton}</div>
        </div>
      </div>
      <section class="reviews-section"><div class="reviews-title"><h3>Rating & komentar toko</h3><span>${average ? `★ ${average.toFixed(1)} dari 5` : 'Jadilah yang pertama memberi ulasan'}</span></div>
        <div class="review-list">${sellerReviews.length ? sellerReviews.map((review) => `<article class="review-item"><div class="review-top"><strong>${escapeHtml(review.author)}</strong><time class="review-date">${new Intl.DateTimeFormat('id-ID', {day:'numeric',month:'short',year:'numeric'}).format(new Date(review.createdAt))}</time></div><div class="review-stars">${'★'.repeat(Number(review.rating))}${'☆'.repeat(5 - Number(review.rating))}</div><p>${escapeHtml(review.comment)}</p></article>`).join('') : '<p class="seller-score">Belum ada rating untuk toko ini.</p>'}</div>
        <form class="review-form" id="reviewForm"><h4>Tulis ulasan untuk penjual</h4><div class="star-picker" role="radiogroup" aria-label="Rating penjual">${[1,2,3,4,5].map((rating) => `<button class="star-choice${rating <= selectedRating ? ' selected' : ''}" type="button" data-rating="${rating}" role="radio" aria-checked="${rating === selectedRating}" aria-label="${rating} bintang">★</button>`).join('')}</div><div class="form-grid"><div class="field"><label for="reviewAuthor">Nama</label><input id="reviewAuthor" name="author" maxlength="40" required placeholder="Nama Anda"></div><div class="field"><label for="reviewComment">Komentar</label><input id="reviewComment" name="comment" maxlength="280" required placeholder="Bagaimana pengalaman Anda?"></div></div><button class="primary-button" type="submit">Kirim ulasan</button></form>
      </section>`;
  }

  function openProduct(id) {
    const product = products.find((item) => String(item.id) === String(id));
    if (!product) return;
    selectedProductId = product.id;
    selectedRating = 5;
    renderDetail(product);
    openOverlay('detailOverlay');
  }

  async function addToCart(id) {
    const product = await window.RuangStore.get('products', id) || products.find((item) => String(item.id) === String(id));
    if (!product) return;
    const available = Math.max(0, Number(product.stock) || 0);
    if (!available) { toast('Stok produk sedang habis.', true); return; }
    const key = String(product.id);
    const existing = await window.RuangStore.get('cart', key);
    if ((existing?.quantity || 0) >= available) { toast(`Stok tersedia hanya ${available} item.`, true); return; }
    await window.RuangStore.put('cart', { productId: key, quantity: (existing?.quantity || 0) + 1 });
    cart = await window.RuangStore.all('cart');
    refreshCounts();
    if ($('#cartOverlay').classList.contains('open')) renderCart();
    toast('Produk ditambahkan ke keranjang.');
  }

  async function toggleWishlist(id) {
    const key = String(id);
    const existing = await window.RuangStore.get('wishlist', key);
    if (existing) await window.RuangStore.remove('wishlist', key);
    else await window.RuangStore.put('wishlist', { productId: key });
    wishlist = await window.RuangStore.all('wishlist');
    renderProducts();
    refreshCounts();
    if (selectedProductId && String(selectedProductId) === key) renderDetail(products.find((product) => String(product.id) === key));
    if ($('#wishlistOverlay').classList.contains('open')) renderWishlist();
    toast(existing ? 'Produk dihapus dari wishlist.' : 'Produk disimpan ke wishlist.');
  }

  function renderCart() {
    const items = cart.map((entry) => ({ ...entry, product: products.find((product) => String(product.id) === String(entry.productId)) })).filter((entry) => entry.product);
    if (!items.length) { $('#cartContent').innerHTML = '<div class="empty-state compact"><h3>Keranjang masih kosong</h3><p>Pilih produk untuk mulai berbelanja.</p></div>'; return; }
    const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const groups = new Map();
    items.forEach((item) => { const key = normalizePhone(item.product.sellerPhone); groups.set(key, [...(groups.get(key) || []), item]); });
    const rows = items.map(({product, quantity}) => `<article class="cart-item"><img src="${escapeHtml(safeImage(product.photos?.[0]))}" alt=""><div><h3>${escapeHtml(product.name)}</h3><p>${formatPrice(product.price)} · Stok ${Math.max(0, Number(product.stock) || 0)}</p><div class="cart-controls"><button class="qty-button" type="button" data-quantity="-1" data-product-id="${escapeHtml(product.id)}" aria-label="Kurangi jumlah">−</button><span class="qty-value">${quantity}</span><button class="qty-button" type="button" data-quantity="1" data-product-id="${escapeHtml(product.id)}" aria-label="Tambah jumlah" ${quantity >= Number(product.stock) ? 'disabled' : ''}>+</button></div></div><div class="line-actions"><button class="secondary-button" type="button" data-remove-cart="${escapeHtml(product.id)}">Hapus</button></div></article>`).join('');
    const checkouts = [...groups.entries()].map(([phone, group]) => {
      const seller = group[0].product;
      const lines = group.map(({product, quantity}) => `- ${product.name} x${quantity}: ${formatPrice(product.price * quantity)}`).join('\n');
      const amount = group.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const text = `Halo ${seller.sellerName}, saya ingin memesan:\n${lines}\nTotal: ${formatPrice(amount)}`;
      const url = phone.length >= 8 ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : '#';
      return `<div class="checkout-group"><span>${escapeHtml(seller.sellerName)} · ${formatPrice(amount)}</span>${url === '#' ? '<button class="secondary-button" disabled>WhatsApp tidak tersedia</button>' : `<a class="primary-button" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Pesan toko ini</a>`}</div>`;
    }).join('');
    $('#cartContent').innerHTML = `<div class="cart-list">${rows}</div><div class="cart-summary"><span>Total belanja</span><strong>${formatPrice(total)}</strong></div><div class="checkout-groups">${checkouts}</div>`;
  }

  function renderWishlist() {
    const items = wishlist.map((entry) => products.find((product) => String(product.id) === String(entry.productId))).filter(Boolean);
    $('#wishlistContent').innerHTML = items.length ? `<div class="wish-list">${items.map((product) => `<article class="wish-item"><img src="${escapeHtml(safeImage(product.photos?.[0]))}" alt=""><div><h3>${escapeHtml(product.name)}</h3><p>${formatPrice(product.price)}</p></div><div class="line-actions"><button class="secondary-button" type="button" data-add-cart="${escapeHtml(product.id)}">Ke keranjang</button><button class="danger-button" type="button" data-toggle-wish="${escapeHtml(product.id)}">Hapus</button></div></article>`).join('')}</div>` : '<div class="empty-state compact"><h3>Wishlist masih kosong</h3><p>Simpan produk yang ingin dilihat lagi.</p></div>';
  }

  async function refreshCollections() {
    [products, cart, wishlist] = await Promise.all([window.RuangStore.all('products'), window.RuangStore.all('cart'), window.RuangStore.all('wishlist')]);
    for (const item of cart) {
      const product = products.find((entry) => String(entry.id) === String(item.productId));
      const available = Math.max(0, Number(product?.stock) || 0);
      if (!available) await window.RuangStore.remove('cart', item.productId);
      else if (item.quantity > available) await window.RuangStore.put('cart', { ...item, quantity: available });
    }
    cart = await window.RuangStore.all('cart');
    refreshCounts();
  }

  function bindEvents() {
    $('#searchInput').addEventListener('input', renderProducts);
    $('#sortSelect').addEventListener('change', renderProducts);
    $('#categoryRow').addEventListener('click', (event) => {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      activeCategory = button.dataset.category;
      renderCategories();
      renderProducts();
    });
    $('#openCart').addEventListener('click', async () => { await refreshCollections(); renderCart(); openOverlay('cartOverlay'); });
    $('#openWishlist').addEventListener('click', () => { renderWishlist(); openOverlay('wishlistOverlay'); });
    document.addEventListener('click', async (event) => {
      const close = event.target.closest('[data-close]');
      if (close) closeOverlay(close.dataset.close);
      if (event.target.classList.contains('overlay')) closeOverlay(event.target.id);
      const add = event.target.closest('[data-add-cart]');
      if (add) { await addToCart(add.dataset.addCart); return; }
      const wish = event.target.closest('[data-toggle-wish]');
      if (wish) { await toggleWishlist(wish.dataset.toggleWish); return; }
      const product = event.target.closest('[data-product]');
      if (product) { openProduct(product.dataset.product); return; }
      const quantity = event.target.closest('[data-quantity]');
      if (quantity) {
        const id = quantity.dataset.productId;
        const entry = await window.RuangStore.get('cart', id);
        const product = await window.RuangStore.get('products', id);
        const available = Math.max(0, Number(product?.stock) || 0);
        const next = Math.min(available, (entry?.quantity || 0) + Number(quantity.dataset.quantity));
        if (next < 1) await window.RuangStore.remove('cart', id);
        else await window.RuangStore.put('cart', { productId: id, quantity: next });
        if (next === available && Number(quantity.dataset.quantity) > 0) toast(`Stok tersedia hanya ${available} item.`, true);
        await refreshCollections();
        renderCart();
        return;
      }
      const remove = event.target.closest('[data-remove-cart]');
      if (remove) {
        await window.RuangStore.remove('cart', String(remove.dataset.removeCart));
        await refreshCollections();
        renderCart();
        return;
      }
      const photo = event.target.closest('[data-photo-index]');
      if (photo && selectedProductId) {
        const selected = products.find((item) => String(item.id) === String(selectedProductId));
        $('#activeDetailPhoto').src = safeImage(selected.photos[Number(photo.dataset.photoIndex)]);
        $('.photo-count', $('#detailContent')).textContent = `${Number(photo.dataset.photoIndex) + 1} / ${selected.photos.length} foto`;
        $$('.thumb', $('#detailContent')).forEach((thumb) => thumb.classList.toggle('active', thumb === photo));
      }
      const rating = event.target.closest('[data-rating]');
      if (rating) {
        selectedRating = Number(rating.dataset.rating);
        $$('.star-choice', $('#detailContent')).forEach((star) => {
          star.classList.toggle('selected', Number(star.dataset.rating) <= selectedRating);
          star.setAttribute('aria-checked', String(Number(star.dataset.rating) === selectedRating));
        });
      }
    });
    $('#detailContent').addEventListener('submit', async (event) => {
      if (event.target.id !== 'reviewForm') return;
      event.preventDefault();
      const product = products.find((item) => String(item.id) === String(selectedProductId));
      if (!product) return;
      const data = new FormData(event.target);
      const review = { id: `review-${crypto.randomUUID()}`, sellerPhone: normalizePhone(product.sellerPhone), author: String(data.get('author')).trim(), rating: selectedRating, comment: String(data.get('comment')).trim(), createdAt: Date.now() };
      try {
        await window.RuangStore.put('reviews', review);
        reviews = await window.RuangStore.all('reviews');
        renderDetail(product);
        renderProducts();
        toast('Terima kasih, ulasan Anda sudah tersimpan.');
      } catch { toast('Ulasan belum dapat disimpan.', true); }
    });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') $$('.overlay.open').forEach((overlay) => closeOverlay(overlay.id)); });
  }

  async function init() {
    try {
      await window.RuangStore.init();
      [products, reviews] = await Promise.all([window.RuangStore.all('products'), window.RuangStore.all('reviews')]);
      await refreshCollections();
      renderCategories();
      renderProducts();
      bindEvents();
    } catch (error) {
      console.error(error);
      $('#productGrid').innerHTML = `<div class="empty-state"><h3>Katalog belum dapat dibuka</h3><p>Data katalog gagal dimuat. Pastikan server dijalankan dengan <code>npm start</code>, lalu muat ulang halaman.</p><p class="error-detail">${escapeHtml(error?.message || 'Kesalahan tidak diketahui')}</p></div>`;
    }
  }

  init();
})();