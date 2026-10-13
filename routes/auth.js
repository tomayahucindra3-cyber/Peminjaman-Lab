// API autentikasi: registrasi, login, logout, dan info sesi.
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../lib/db');

/** Bentuk aman pengguna untuk dikirim ke klien (tanpa hash password). */
function publicUser(user) {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    nim: user.nim || null,
    username: user.username || null,
  };
}

// Registrasi akun mahasiswa (nama, NIM, password).
router.post('/register', (req, res) => {
  const { name, nim, password } = req.body || {};
  const errors = [];

  if (!name || !String(name).trim()) errors.push('Nama wajib diisi.');
  if (!nim || !/^[0-9A-Za-z-]{3,20}$/.test(String(nim).trim())) {
    errors.push('NIM wajib diisi (3-20 karakter, huruf/angka/dash).');
  }
  if (!password || String(password).length < 6) errors.push('Password minimal 6 karakter.');
  if (errors.length) return res.status(400).json({ message: errors.join(' ') });

  const users = db.read('users');
  const nimValue = String(nim).trim();
  if (users.some((u) => u.nim && u.nim.toLowerCase() === nimValue.toLowerCase())) {
    return res.status(409).json({ message: 'NIM sudah terdaftar, silakan gunakan NIM lain.' });
  }

  const user = {
    id: db.nextId(users),
    role: 'mahasiswa',
    name: String(name).trim(),
    nim: nimValue,
    passwordHash: bcrypt.hashSync(String(password), 10), // password disimpan sebagai hash
  };
  users.push(user);
  db.write('users', users);

  res.status(201).json({ message: 'Registrasi berhasil. Silakan login.' });
});

// Login: admin memakai username, mahasiswa memakai NIM.
router.post('/login', (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Username/NIM dan password wajib diisi.' });
  }

  const idn = String(identifier).trim().toLowerCase();
  const users = db.read('users');
  const user = users.find(
    (u) =>
      (u.role === 'admin' && u.username && u.username.toLowerCase() === idn) ||
      (u.role === 'mahasiswa' && u.nim && u.nim.toLowerCase() === idn)
  );

  if (!user || !bcrypt.compareSync(String(password), user.passwordHash)) {
    return res.status(401).json({ message: 'Username/NIM atau password salah.' });
  }

  req.session.user = publicUser(user);
  res.json({ message: 'Login berhasil.', user: req.session.user });
});

// Logout: hapus sesi.
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Berhasil logout.' });
  });
});

// Info sesi berjalan (dipakai navbar & penjaga halaman di sisi klien).
router.get('/me', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Belum login.' });
  }
  res.json({ user: req.session.user });
});

module.exports = router;
