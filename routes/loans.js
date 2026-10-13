// API peminjaman lab: pengajuan mahasiswa, riwayat, dan persetujuan admin.
const router = require('express').Router();
const db = require('../lib/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Cek bentrok dengan peminjaman yang sudah disetujui di lab & tanggal sama. */
function hasConflict(loans, labId, date, startTime, endTime) {
  return loans.some(
    (l) =>
      l.labId === labId &&
      l.date === date &&
      l.status === 'disetujui' &&
      startTime < l.endTime && // jam mulai lebih awal dari jam selesai lain
      endTime > l.startTime // jam selesai lebih akhir dari jam mulai lain
  );
}

/** Gabungkan data loan dengan nama lab dan nama mahasiswa untuk tampilan. */
function decorate(loan, labs, users) {
  const lab = labs.find((l) => l.id === loan.labId);
  const user = users.find((u) => u.id === loan.userId);
  return {
    ...loan,
    labName: lab ? lab.name : '(lab tidak ditemukan)',
    studentName: user ? user.name : '(pengguna tidak ditemukan)',
    studentNim: user && user.nim ? user.nim : '',
  };
}

// Riwayat: mahasiswa hanya melihat miliknya, admin melihat semua.
router.get('/', requireAuth, (req, res) => {
  const user = req.session.user;
  const labs = db.read('labs');
  const users = db.read('users');
  let loans = db.read('loans');
  if (user.role !== 'admin') loans = loans.filter((l) => l.userId === user.id);
  loans.sort((a, b) => b.id - a.id);
  res.json({ loans: loans.map((l) => decorate(l, labs, users)) });
});

// Ajukan peminjaman (mahasiswa).
router.post('/', requireRole('mahasiswa'), (req, res) => {
  const { labId, date, startTime, endTime, purpose } = req.body || {};
  const errors = [];

  const labIdNum = Number(labId);
  const labs = db.read('labs');
  if (!Number.isInteger(labIdNum) || !labs.some((l) => l.id === labIdNum)) {
    errors.push('Lab harus dipilih terlebih dahulu.');
  }
  if (!date || !DATE_RE.test(String(date))) errors.push('Tanggal harus berformat YYYY-MM-DD.');
  if (!startTime || !TIME_RE.test(String(startTime))) errors.push('Jam mulai harus berformat HH:MM.');
  if (!endTime || !TIME_RE.test(String(endTime))) errors.push('Jam selesai harus berformat HH:MM.');
  if (!purpose || !String(purpose).trim()) errors.push('Keperluan wajib diisi.');
  if (errors.length) return res.status(400).json({ message: errors.join(' ') });

  // Jam selesai tidak boleh lebih awal (atau sama) dari jam mulai.
  if (endTime <= startTime) {
    return res.status(400).json({ message: 'Jam selesai harus setelah jam mulai.' });
  }

  const loans = db.read('loans');
  // Ditolak bila bentrok dengan peminjaman yang sudah disetujui.
  if (hasConflict(loans, labIdNum, date, startTime, endTime)) {
    return res.status(409).json({
      message: 'Jadwal bentrok dengan peminjaman yang sudah disetujui di lab yang sama.',
    });
  }

  const loan = {
    id: db.nextId(loans),
    userId: req.session.user.id,
    labId: labIdNum,
    date: String(date),
    startTime: String(startTime),
    endTime: String(endTime),
    purpose: String(purpose).trim(),
    status: 'menunggu',
    rejectReason: '',
    createdAt: new Date().toISOString(),
  };
  loans.push(loan);
  db.write('loans', loans);

  res.status(201).json({ message: 'Pengajuan peminjaman berhasil dikirim.', loan });
});

// Batalkan pengajuan milik sendiri yang masih menunggu (mahasiswa).
router.patch('/:id/cancel', requireRole('mahasiswa'), (req, res) => {
  const id = Number(req.params.id);
  const loans = db.read('loans');
  const loan = loans.find((l) => l.id === id);

  if (!loan || loan.userId !== req.session.user.id) {
    return res.status(404).json({ message: 'Pengajuan tidak ditemukan.' });
  }
  if (loan.status !== 'menunggu') {
    return res.status(400).json({ message: 'Hanya pengajuan berstatus menunggu yang bisa dibatalkan.' });
  }

  loan.status = 'dibatalkan';
  db.write('loans', loans);
  res.json({ message: 'Pengajuan berhasil dibatalkan.', loan });
});

// Setujui atau tolak pengajuan (admin). Penolakan wajib mencantumkan alasan.
router.patch('/:id/status', requireRole('admin'), (req, res) => {
  const { status, rejectReason } = req.body || {};
  if (status !== 'disetujui' && status !== 'ditolak') {
    return res.status(400).json({ message: 'Status harus "disetujui" atau "ditolak".' });
  }

  const loans = db.read('loans');
  const loan = loans.find((l) => l.id === Number(req.params.id));
  if (!loan) return res.status(404).json({ message: 'Pengajuan tidak ditemukan.' });
  if (loan.status !== 'menunggu') {
    return res.status(400).json({ message: 'Hanya pengajuan berstatus menunggu yang bisa diproses.' });
  }

  if (status === 'ditolak') {
    const reason = String(rejectReason || '').trim();
    if (!reason) return res.status(400).json({ message: 'Alasan penolakan wajib diisi.' });
    loan.rejectReason = reason;
  } else {
    // Saat disetujui, cek lagi bentrok dengan persetujuan lain.
    if (hasConflict(loans, loan.labId, loan.date, loan.startTime, loan.endTime)) {
      return res.status(409).json({
        message: 'Tidak bisa menyetujui: jadwal bentrok dengan peminjaman disetujui lain di lab ini.',
      });
    }
    loan.rejectReason = '';
  }

  loan.status = status;
  db.write('loans', loans);
  res.json({ message: `Pengajuan berhasil ${status}.`, loan });
});

module.exports = router;
