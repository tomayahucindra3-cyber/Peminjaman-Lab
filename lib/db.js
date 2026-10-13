// Helper penyimpanan sederhana: satu file JSON per entity di folder "database".
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'database');

/** Pastikan folder database ada. */
function ensureDir() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}

/** Baca satu entity (users/labs/loans) menjadi array objek. */
function read(entity) {
  ensureDir();
  const file = path.join(DB_DIR, `${entity}.json`);
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf8').trim();
  if (!raw) return [];
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : [];
}

/** Tulis seluruh isi satu entity ke file JSON-nya (tulis-pindah agar aman). */
function write(entity, rows) {
  ensureDir();
  const file = path.join(DB_DIR, `${entity}.json`);
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

/** ID berikutnya = nilai id terbesar + 1. */
function nextId(rows) {
  return rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;
}

module.exports = { read, write, nextId, DB_DIR };
