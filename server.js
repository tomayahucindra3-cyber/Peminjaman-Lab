// Sistem Informasi Peminjaman Laboratorium - entry point aplikasi.
const path = require('path');
const express = require('express');
const session = require('express-session');

const { seedIfEmpty } = require('./lib/seed');
const {
  requireGuest,
  requireAuthPage,
  requireAdminPage,
  requireStudentPage,
  homePath,
} = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const labRoutes = require('./routes/labs');
const loanRoutes = require('./routes/loans');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Buat data awal bila folder database masih kosong.
seedIfEmpty();

// Middleware dasar: body JSON dan sesi login.
app.use(express.json());
app.use(
  session({
    secret: 'lab-loan-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 }, // sesi 8 jam
  })
);

// Aset statis (hanya css & js; halaman HTML dilindungi middleware peran).
app.use('/css', express.static(path.join(PUBLIC_DIR, 'css')));
app.use('/js', express.static(path.join(PUBLIC_DIR, 'js')));

// API.
app.use('/api/auth', authRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/loans', loanRoutes);

/** Kirim halaman HTML dengan proteksi peran. */
function sendPage(file) {
  return (req, res) => res.sendFile(path.join(PUBLIC_DIR, file));
}

// Halaman publik.
app.get('/', requireGuest, sendPage('index.html')); // login
app.get('/register', requireGuest, sendPage('register.html'));

// Halaman umum (wajib login).
app.get('/labs', requireAuthPage, sendPage('labs.html'));

// Halaman mahasiswa.
app.get('/ajukan', requireStudentPage, sendPage('ajukan.html'));
app.get('/riwayat', requireStudentPage, sendPage('riwayat.html'));

// Halaman admin.
app.get('/admin/labs', requireAdminPage, sendPage('admin-labs.html'));
app.get('/admin/loans', requireAdminPage, sendPage('admin-loans.html'));

// Redirect tujuan setelah login (dipakai tombol batal di halaman login).
app.get('/home', requireAuthPage, (req, res) => res.redirect(homePath(req.session.user)));

// 404 untuk API yang tidak dikenal.
app.use('/api', (req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan.' }));

// Penangan error global (termasuk body JSON rusak).
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Format data JSON tidak valid.' });
  }
  console.error(err);
  res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
});

app.listen(PORT, () => {
  console.log(`Sistem Informasi Peminjaman Laboratorium berjalan di http://localhost:${PORT}`);
});
