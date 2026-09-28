(() => {
  const $ = (selector) => document.querySelector(selector);
  const form = $('#authForm');
  const message = $('#authMessage');
  let mode = 'login';

  function setMode(nextMode) {
    mode = nextMode;
    const registering = mode === 'register';
    $('#loginTab').classList.toggle('active', !registering);
    $('#registerTab').classList.toggle('active', registering);
    $('#registerFields').hidden = !registering;
    $('#sellerName').required = registering;
    $('#sellerPhone').required = registering;
    $('#authTitle').textContent = registering ? 'Buat akun toko' : 'Selamat datang kembali';
    $('#authSubtitle').textContent = registering ? 'Daftarkan usaha jamu Anda untuk mulai menambahkan racikan.' : 'Masuk untuk mengelola produk dan toko jamu Anda.';
    $('#submitAuth').textContent = registering ? 'Daftarkan usaha' : 'Masuk ke studio';
    message.textContent = '';
  }

  async function init() {
    try {
      await window.RuangStore.init();
      await window.RuangAuth.seedDemoAccounts();
      $('#submitAuth').disabled = false;
      const currentUser = await window.RuangAuth.currentUser();
      if (currentUser) location.replace(currentUser.role === 'admin' ? '../admin/' : '../seller/');
    } catch (error) {
      message.textContent = 'Database lokal tidak tersedia. Jalankan melalui localhost atau HTTPS.';
    }
  }

  $('#loginTab').addEventListener('click', () => setMode('login'));
  $('#registerTab').addEventListener('click', () => setMode('register'));
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';
    const button = $('#submitAuth');
    button.disabled = true;
    const data = new FormData(form);
    try {
      if (mode === 'register') {
        const phone = window.RuangUtils.normalizePhone(data.get('phone'));
        if (phone.length < 8 || phone.length > 15) throw new Error('Masukkan nomor WhatsApp yang valid.');
        await window.RuangAuth.register({ name: data.get('name'), phone, email: data.get('email'), password: data.get('password') });
      } else {
        const user = await window.RuangAuth.login(data.get('email'), data.get('password'));
        location.replace(user.role === 'admin' ? '../admin/' : '../seller/');
        return;
      }
      location.replace('../seller/');
    } catch (error) {
      message.textContent = error.message || 'Tidak dapat masuk. Coba lagi.';
    } finally {
      button.disabled = false;
    }
  });

  init();
})();