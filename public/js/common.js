// Fungsi bersama: helper API, sesi, navbar, badge status, dan util tampilan.

/** Kirim request JSON dan lempar error dengan pesan dari server. */
async function api(url, options = {}) {
  const init = {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
  };
  if (options.body !== undefined) init.body = JSON.stringify(options.body);

  const res = await fetch(url, init);
  let data = {};
  try {
    data = await res.json();
  } catch (_) {
    data = {};
  }
  if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan. Coba lagi.');
  return data;
}

/** Ambil pengguna yang sedang login, atau null bila belum login. */
async function currentUser() {
  try {
    const data = await api('/api/auth/me');
    return data.user;
  } catch (_) {
    return null;
  }
}

/** Sisipkan navbar sesuai peran dan tandai menu aktif. */
function renderNavbar(user, active) {
  const el = document.getElementById('navbar');
  if (!el) return;

  const links =
    user.role === 'admin'
      ? [
          { href: '/admin/labs', label: 'Kelola Lab', key: 'admin-labs' },
          { href: '/admin/loans', label: 'Pengajuan Peminjaman', key: 'admin-loans' },
        ]
      : [
          { href: '/labs', label: 'Daftar Lab', key: 'labs' },
          { href: '/ajukan', label: 'Ajukan Peminjaman', key: 'ajukan' },
          { href: '/riwayat', label: 'Riwayat Saya', key: 'riwayat' },
        ];

  el.innerHTML = `
    <nav class="navbar">
      <span class="brand">SI Peminjaman Lab</span>
      <div class="nav-links">
        ${links
          .map(
            (l) =>
              `<a href="${l.href}" class="${l.key === active ? 'active' : ''}">${l.label}</a>`
          )
          .join('')}
      </div>
      <div class="nav-user">
        <span>${escapeHtml(user.name)}</span>
        <span class="badge badge-role">${user.role === 'admin' ? 'Admin' : 'Mahasiswa'}</span>
        <button class="btn btn-secondary btn-sm" id="btn-logout">Logout</button>
      </div>
    </nav>`;

  document.getElementById('btn-logout').addEventListener('click', async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/';
    }
  });
}

/**
 * Penjaga halaman: pastikan sudah login dan peran sesuai.
 * Mengembalikan pengguna bila lolos, atau null (dan mengalihkan) bila tidak.
 */
async function guardPage(requiredRole, active) {
  const user = await currentUser();
  if (!user) {
    window.location.href = '/';
    return null;
  }
  if (requiredRole && user.role !== requiredRole) {
    window.location.href = user.role === 'admin' ? '/admin/labs' : '/labs';
    return null;
  }
  renderNavbar(user, active);
  return user;
}

/** Badge warna untuk status peminjaman. */
function statusBadge(status) {
  return `<span class="badge badge-${escapeHtml(status)}">${escapeHtml(
    STATUS_LABEL[status] || status
  )}</span>`;
}

const STATUS_LABEL = {
  menunggu: 'Menunggu',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
  dibatalkan: 'Dibatalkan',
};

/** Hindari XSS pada teks yang ditampilkan. */
function escapeHtml(value) {
  return String(value == null ? '' : value).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c)
  );
}

/** Tampilkan pesan pada elemen alert, sembunyikan bila kosong. */
function showAlert(el, message, type = 'error') {
  if (!el) return;
  if (!message) {
    el.className = 'alert';
    el.textContent = '';
    return;
  }
  el.className = `alert alert-${type} show`;
  el.textContent = message;
}
