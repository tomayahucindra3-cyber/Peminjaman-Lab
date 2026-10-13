// Halaman daftar lab untuk mahasiswa, lengkap dengan pencarian nama lab.
(async function () {
  const user = await guardPage(null, 'labs'); // wajib login (semua peran)
  if (!user) return;

  const rowsEl = document.getElementById('lab-rows');
  const emptyEl = document.getElementById('empty');
  const alertEl = document.getElementById('alert');
  const searchEl = document.getElementById('search');

  /** Muat lab dari server (dengan pencarian) lalu render tabel. */
  async function load() {
    showAlert(alertEl, '');
    try {
      const q = searchEl.value.trim();
      const data = await api(`/api/labs?q=${encodeURIComponent(q)}`);
      render(data.labs);
    } catch (err) {
      showAlert(alertEl, err.message);
    }
  }

  function render(labs) {
    rowsEl.innerHTML = labs
      .map(
        (lab, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${escapeHtml(lab.name)}</strong></td>
          <td>${escapeHtml(lab.location)}</td>
          <td>${escapeHtml(lab.capacity)} orang</td>
          <td><a class="btn btn-sm" href="/ajukan">Ajukan Peminjaman</a></td>
        </tr>`
      )
      .join('');
    emptyEl.hidden = labs.length > 0;
  }

  // Cari dengan jeda singkat agar tidak mengetik terlalu cepat ke server.
  let timer;
  searchEl.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(load, 250);
  });

  await load();
})();
