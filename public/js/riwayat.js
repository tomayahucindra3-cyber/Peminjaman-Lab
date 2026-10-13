// Halaman riwayat pengajuan milik mahasiswa + batalkan pengajuan menunggu.
(async function () {
  const user = await guardPage('mahasiswa', 'riwayat');
  if (!user) return;

  const rowsEl = document.getElementById('loan-rows');
  const emptyEl = document.getElementById('empty');
  const alertEl = document.getElementById('alert');

  /** Muat riwayat milik sendiri dari server (pesan alert dibiarkan agar hasil aksi terbaca). */
  async function load() {
    try {
      const data = await api('/api/loans');
      render(data.loans);
    } catch (err) {
      showAlert(alertEl, err.message);
    }
  }

  function render(loans) {
    rowsEl.innerHTML = loans
      .map(
        (loan, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(loan.labName)}</td>
          <td>${escapeHtml(loan.date)}</td>
          <td>${escapeHtml(loan.startTime)} - ${escapeHtml(loan.endTime)}</td>
          <td>${escapeHtml(loan.purpose)}</td>
          <td>${statusBadge(loan.status)}</td>
          <td class="reason-text">${loan.rejectReason ? escapeHtml(loan.rejectReason) : '-'}</td>
          <td>${
            loan.status === 'menunggu'
              ? `<button class="btn btn-danger btn-sm" data-cancel="${loan.id}">Batalkan</button>`
              : '-'
          }</td>
        </tr>`
      )
      .join('');
    emptyEl.hidden = loans.length > 0;
  }

  // Aksi batalkan (hanya status menunggu).
  rowsEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-cancel]');
    if (!btn) return;
    if (!confirm('Yakin ingin membatalkan pengajuan ini?')) return;

    try {
      const data = await api(`/api/loans/${btn.dataset.cancel}/cancel`, { method: 'PATCH' });
      showAlert(alertEl, data.message, 'success');
      await load();
    } catch (err) {
      showAlert(alertEl, err.message);
    }
  });

  await load();
})();
