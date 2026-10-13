// API laboratorium: daftar (semua role login) + CRUD khusus admin.
const router = require('express').Router();
const db = require('../lib/db');
const { requireAuth, requireRole } = require('../middleware/auth');

// Ambil daftar lab, opsional pencarian ?q= berdasarkan nama.
router.get('/', requireAuth, (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  let labs = db.read('labs');
  if (q) labs = labs.filter((lab) => lab.name.toLowerCase().includes(q));
  res.json({ labs });
});

// Tambah lab (admin).
router.post('/', requireRole('admin'), (req, res) => {
  const { name, location, capacity } = req.body || {};
  const errors = [];
  if (!name || !String(name).trim()) errors.push('Nama lab wajib diisi.');
  if (!location || !String(location).trim()) errors.push('Lokasi wajib diisi.');
  const cap = Number(capacity);
  if (!Number.isInteger(cap) || cap <= 0) errors.push('Kapasitas harus berupa angka lebih dari 0.');
  if (errors.length) return res.status(400).json({ message: errors.join(' ') });

  const labs = db.read('labs');
  const lab = {
    id: db.nextId(labs),
    name: String(name).trim(),
    location: String(location).trim(),
    capacity: cap,
  };
  labs.push(lab);
  db.write('labs', labs);
  res.status(201).json({ message: 'Lab berhasil ditambahkan.', lab });
});

// Ubah lab (admin).
router.put('/:id', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  const labs = db.read('labs');
  const lab = labs.find((l) => l.id === id);
  if (!lab) return res.status(404).json({ message: 'Lab tidak ditemukan.' });

  const { name, location, capacity } = req.body || {};
  const errors = [];
  if (!name || !String(name).trim()) errors.push('Nama lab wajib diisi.');
  if (!location || !String(location).trim()) errors.push('Lokasi wajib diisi.');
  const cap = Number(capacity);
  if (!Number.isInteger(cap) || cap <= 0) errors.push('Kapasitas harus berupa angka lebih dari 0.');
  if (errors.length) return res.status(400).json({ message: errors.join(' ') });

  lab.name = String(name).trim();
  lab.location = String(location).trim();
  lab.capacity = cap;
  db.write('labs', labs);
  res.json({ message: 'Lab berhasil diperbarui.', lab });
});

// Hapus lab (admin).
router.delete('/:id', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  const labs = db.read('labs');
  const index = labs.findIndex((l) => l.id === id);
  if (index === -1) return res.status(404).json({ message: 'Lab tidak ditemukan.' });

  labs.splice(index, 1);
  db.write('labs', labs);
  res.json({ message: 'Lab berhasil dihapus.' });
});

module.exports = router;
