// Halaman pengajuan peminjaman lab oleh mahasiswa.
(async function () {
  const user = await guardPage('mahasiswa', 'ajukan');
  if (!user) return;

  const form = document.getElementById('loan-form');
  const alertEl = document.getElementById('alert');
  const submitBtn = form.querySelector('button[type="submit"]');

  // Isi dropdown lab.
  try {
    const data = await api('/api/labs');
    form.labId.innerHTML =
      '<option value="">-- Pilih laboratorium --</option>' +
      data.labs
        .map(
          (lab) =>
            `<option value="${lab.id}">${escapeHtml(lab.name)} (${escapeHtml(lab.location)})</option>`
        )
        .join('');
  } catch (err) {
    showAlert(alertEl, err.message);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showAlert(alertEl, '');

    const body = {
      labId: Number(form.labId.value),
      date: form.date.value,
      startTime: form.startTime.value,
      endTime: form.endTime.value,
      purpose: form.purpose.value.trim(),
    };

    // Validasi cepat di klien; validasi lengkap (termasuk bentrok) di server.
    if (!body.labId) return showAlert(alertEl, 'Lab harus dipilih terlebih dahulu.');
    if (!body.date) return showAlert(alertEl, 'Tanggal wajib diisi.');
    if (!body.startTime || !body.endTime)
      return showAlert(alertEl, 'Jam mulai dan jam selesai wajib diisi.');
    if (body.endTime <= body.startTime)
      return showAlert(alertEl, 'Jam selesai harus setelah jam mulai.');
    if (!body.purpose) return showAlert(alertEl, 'Keperluan wajib diisi.');

    submitBtn.disabled = true;
    try {
      const data = await api('/api/loans', { method: 'POST', body });
      showAlert(alertEl, data.message, 'success');
      form.reset();
    } catch (err) {
      showAlert(alertEl, err.message);
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
