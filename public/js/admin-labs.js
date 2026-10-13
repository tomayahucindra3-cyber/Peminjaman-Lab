// Halaman admin: tambah, ubah, hapus data lab.
(async function () {
  const user = await guardPage('admin', 'admin-labs');
  if (!user) return;

  const form = document.getElementById('lab-form');
  const rowsEl = document.getElementById('lab-rows');
  const emptyEl = document.getElementById('empty');
  const alertEl = document.getElementById('alert');
  const formTitle = document.getElementById('form-title');
  const btnSubmit = document.getElementById('btn-submit');
  const btnReset = document.getElementById('btn-reset');

  /** Muat semua lab dan render tabel. */
  async function load() {
    try {
      const data = await api('/api/labs');
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
          <td>
            <button class="btn btn-sm" data-edit="${lab.id}">Ubah</button>
            <button class="btn btn-danger btn-sm" data-delete="${lab.id}">Hapus</button>
          </td>
        </tr>`
      )
      .join('');
    emptyEl.hidden = labs.length > 0;
  }

  // Kosongkan isian form (pesan alert tidak dihapus agar pesan sukses tetap terbaca).
  function resetForm() {
    form.reset();
    form.labId.value = '';
    formTitle.textContent = 'Tambah Lab';
    btnSubmit.textContent = 'Simpan';
    btnReset.hidden = true;
  }

  // Simpan data lab (tambah bila id kosong, ubah bila ada id).
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showAlert(alertEl, '');

    const body = {
      name: form.name.value.trim(),
      location: form.location.value.trim(),
      capacity: Number(form.capacity.value),
    };

    try {
      const id = form.labId.value;
      const data = id
        ? await api(`/api/labs/${id}`, { method: 'PUT', body })
        : await api('/api/labs', { method: 'POST', body });
      showAlert(alertEl, data.message, 'success');
      resetForm();
      await load();
    } catch (err) {
      showAlert(alertEl, err.message);
    }
  });

  btnReset.addEventListener('click', resetForm);

  // Aksi ubah / hapus pada tabel.
  rowsEl.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('[data-edit]');
    const deleteBtn = e.target.closest('[data-delete]');

    if (editBtn) {
      try {
        const data = await api('/api/labs');
        const lab = data.labs.find((l) => l.id === Number(editBtn.dataset.edit));
        if (!lab) return;
        form.labId.value = lab.id;
        form.name.value = lab.name;
        form.location.value = lab.location;
        form.capacity.value = lab.capacity;
        formTitle.textContent = 'Ubah Lab';
        btnSubmit.textContent = 'Perbarui';
        btnReset.hidden = false;
        showAlert(alertEl, '');
        form.name.focus();
      } catch (err) {
        showAlert(alertEl, err.message);
      }
      return;
    }

    if (deleteBtn) {
      if (!confirm('Yakin ingin menghapus lab ini?')) return;
      try {
        const data = await api(`/api/labs/${deleteBtn.dataset.delete}`, { method: 'DELETE' });
        showAlert(alertEl, data.message, 'success');
        await load();
      } catch (err) {
        showAlert(alertEl, err.message);
      }
    }
  });

  await load();
})();
