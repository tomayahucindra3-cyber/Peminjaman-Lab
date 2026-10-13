// Data awal (seed): admin, mahasiswa, 3 lab, dan 3 pengajuan contoh.
// Seed hanya dibuat bila file entity bersangkutan masih kosong.
const bcrypt = require('bcryptjs');
const db = require('./db');

/** Tanggal relatif hari ini dalam format YYYY-MM-DD. */
function dayOffset(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

/** Buat seed untuk setiap entity yang masih kosong. */
function seedIfEmpty() {
  // 1. Pengguna
  if (db.read('users').length === 0) {
    db.write('users', [
      {
        id: 1,
        role: 'admin',
        username: 'admin',
        name: 'Administrator Laboratorium',
        passwordHash: bcrypt.hashSync('admin123', 10),
      },
      {
        id: 2,
        role: 'mahasiswa',
        name: 'Budi Santoso',
        nim: '2024001',
        passwordHash: bcrypt.hashSync('mhs123', 10),
      },
    ]);
  }

  // 2. Laboratorium
  if (db.read('labs').length === 0) {
    db.write('labs', [
      { id: 1, name: 'Lab Komputer A', location: 'Gedung Teknik Lantai 2', capacity: 40 },
      { id: 2, name: 'Lab Elektronika', location: 'Gedung Teknik Lantai 1', capacity: 24 },
      { id: 3, name: 'Lab Jaringan Komputer', location: 'Gedung Komputer Lantai 3', capacity: 32 },
    ]);
  }

  // 3. Pengajuan peminjaman (menunggu, disetujui, ditolak)
  if (db.read('loans').length === 0) {
    db.write('loans', [
      {
        id: 1,
        userId: 2,
        labId: 1,
        date: dayOffset(1),
        startTime: '08:00',
        endTime: '10:00',
        purpose: 'Praktikum Basis Data',
        status: 'menunggu',
        rejectReason: '',
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        userId: 2,
        labId: 2,
        date: dayOffset(2),
        startTime: '10:00',
        endTime: '12:00',
        purpose: 'Praktikum Rangkaian Digital',
        status: 'disetujui',
        rejectReason: '',
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        userId: 2,
        labId: 3,
        date: dayOffset(3),
        startTime: '13:00',
        endTime: '15:00',
        purpose: 'Latihan Konfigurasi Router',
        status: 'ditolak',
        rejectReason: 'Lab sedang dalam perawatan pada tanggal tersebut.',
        createdAt: new Date().toISOString(),
      },
    ]);
  }
}

module.exports = { seedIfEmpty };
