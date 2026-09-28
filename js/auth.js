(() => {
  const SESSION_KEY = 'ruang-lokal-auth';
  const encoder = new TextEncoder();

  async function hashPassword(password, salt) {
    if (!crypto.subtle) throw new Error('Login memerlukan browser modern melalui localhost atau HTTPS.');
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, key, 256);
    return [...new Uint8Array(bits)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  function bytesToHex(bytes) {
    return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  function saveSession(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email, role: user.role }));
  }

  function readSession() {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    try {
      const session = JSON.parse(stored);
      return { email: session.email, role: session.role || 'seller' };
    } catch {
      return { email: stored, role: 'seller' };
    }
  }

  async function saveDemoAccount(account, role) {
    const normalizedEmail = account.email.trim().toLowerCase();
    const storeName = role === 'admin' ? 'admins' : 'sellers';
    const otherStore = role === 'admin' ? 'sellers' : 'admins';
    if (await window.RuangStore.get(storeName, normalizedEmail) || await window.RuangStore.get(otherStore, normalizedEmail)) return;

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const record = {
      email: normalizedEmail,
      name: account.name.trim(),
      role,
      salt: bytesToHex(salt),
      passwordHash: await hashPassword(account.password, salt),
      createdAt: Date.now()
    };
    if (role === 'seller') record.phone = window.RuangUtils.normalizePhone(account.phone);
    await window.RuangStore.put(storeName, record);
  }

  async function seedDemoAccounts() {
    const accounts = await window.RuangDataImporter.loadDemoAccounts();
    await Promise.all([
      ...(accounts.admins || []).map((account) => saveDemoAccount(account, 'admin')),
      ...(accounts.sellers || []).map((account) => saveDemoAccount(account, 'seller'))
    ]);
  }

  async function register({ name, phone, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    if (await window.RuangStore.get('sellers', normalizedEmail) || await window.RuangStore.get('admins', normalizedEmail)) {
      throw new Error('Email sudah terdaftar. Silakan masuk.');
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const seller = {
      email: normalizedEmail,
      name: name.trim(),
      phone: window.RuangUtils.normalizePhone(phone),
      role: 'seller',
      salt: bytesToHex(salt),
      passwordHash: await hashPassword(password, salt),
      createdAt: Date.now()
    };
    await window.RuangStore.put('sellers', seller);
    saveSession(seller);
    return seller;
  }

  async function login(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    const seller = await window.RuangStore.get('sellers', normalizedEmail);
    const admin = await window.RuangStore.get('admins', normalizedEmail);
    const user = admin || seller;
    if (!user) throw new Error('Email atau kata sandi tidak cocok.');
    const salt = new Uint8Array(user.salt.match(/.{2}/g).map((byte) => parseInt(byte, 16)));
    const submittedHash = await hashPassword(password, salt);
    if (submittedHash !== user.passwordHash) throw new Error('Email atau kata sandi tidak cocok.');
    saveSession(user);
    return user;
  }

  async function currentUser() {
    const session = readSession();
    if (!session) return null;
    const storeName = session.role === 'admin' ? 'admins' : 'sellers';
    const user = await window.RuangStore.get(storeName, session.email);
    return user ? { ...user, role: session.role } : null;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  window.RuangAuth = { register, login, currentUser, logout, seedDemoAccounts };
})();