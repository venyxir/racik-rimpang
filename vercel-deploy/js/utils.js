(() => {
  function normalizePhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
  }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  }
  function safeImage(value) {
    const source = String(value || '').trim();
    const isDataImage = /^data:image\/(?:jpeg|jpg|png|webp|gif);base64,/i.test(source);
    const isRemoteImage = /^https?:\/\//i.test(source);
    return isDataImage || isRemoteImage ? source : window.RuangData.fallbackImage;
  }
  function formatPrice(value) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0);
  }
  function getSellerReviews(reviews, phone) {
    return reviews.filter((review) => normalizePhone(review.sellerPhone) === normalizePhone(phone));
  }
  function getSellerRating(reviews, phone) {
    const list = getSellerReviews(reviews, phone);
    return list.length ? list.reduce((total, review) => total + Number(review.rating), 0) / list.length : 0;
  }
  function icon(name) {
    const paths = {
      star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
      heart: '<path d="M20.8 8.7c0 5.2-8.8 10.1-8.8 10.1S3.2 13.9 3.2 8.7a4.4 4.4 0 0 1 8.8-.2 4.4 4.4 0 0 1 8.8.2Z"/>',
      photo: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/>',
      edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
      trash: '<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/>',
      plus: '<path d="M12 5v14M5 12h14"/>'
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
  }
  function toast(message, isError = false) {
    const region = document.querySelector('#toastRegion');
    if (!region) return;
    region.innerHTML = `<div class="toast${isError ? ' error' : ''}" role="status">${escapeHtml(message)}</div>`;
    clearTimeout(window.ruangToastTimer);
    window.ruangToastTimer = setTimeout(() => { region.innerHTML = ''; }, 3200);
  }
  window.RuangUtils = { normalizePhone, escapeHtml, safeImage, formatPrice, getSellerReviews, getSellerRating, icon, toast };
})();