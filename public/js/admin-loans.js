// Halaman admin: setujui atau tolak pengajuan peminjaman (wajib isi alasan).
(async function () {
  const user = await guardPage('admin', 'admin-loans');
  if (!user) return;

  const rowsEl = document.getElementById('loan-rows');
  const emptyEl = document.getElementById('empty');
  const alertEl = document.getElementById('alert');
  const modal = document.getElementById('reject-modal');
  const modalAlert = document.getElementById('modal-alert');
  const reasonEl = document.getElementById('reject-reason');
  const btnConfirmReject = document.getElementById('btn-confirm-reject');
  const btnCancelReject = document.getElementById('btn-cancel-reject');

  let rejectId = null; // id pengajuan yang sedang ditolak

  /** Muat semua pengajuan dari server (pesan alert tidak dihapus agar sukses/gagal aksi tetap terbaca). */
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
          <td>${escapeHtml(loan.studentName)}</td>
          <td>${escapeHtml(loan.studentNim)}</td>
          <td>${escapeHtml(loan.labName)}</td>
          <td>${escapeHtml(loan.date)}</td>
          <td>${escapeHtml(loan.startTime)} - ${escapeHtml(loan.endTime)}</td>
          <td>${escapeHtml(loan.purpose)}</td>
          <td>${statusBadge(loan.status)}</td>
          <td class="reason-text">${loan.rejectReason ? escapeHtml(loan.rejectReason) : '-'}</td>
          <td>${
            loan.status === 'menunggu'
              ? `<button class="btn btn-success btn-sm" data-approve="${loan.id}">Setujui</button>
                 <button class="btn btn-danger btn-sm" data-reject="${loan.id}">Tolak</button>`
              : '-'
          }</td>
        </tr>`
      )
      .join('');
    emptyEl.hidden = loans.length > 0;
  }

  // Setujui pengajuan.
  rowsEl.addEventListener('click', async (e) => {
    const approveBtn = e.target.closest('[data-approve]');
    const rejectBtn = e.target.closest('[data-reject]');

    if (approveBtn) {
      if (!confirm('Setujui pengajuan ini?')) return;
      try {
        const data = await api(`/api/loans/${approveBtn.dataset.approve}/status`, {
          method: 'PATCH',
          body: { status: 'disetujui' },
        });
        showAlert(alertEl, data.message, 'success');
        await load();
      } catch (err) {
        showAlert(alertEl, err.message);
      }
      return;
    }

    if (rejectBtn) {
      rejectId = rejectBtn.dataset.reject;
      reasonEl.value = '';
      showAlert(modalAlert, '');
      modal.classList.add('show');
      reasonEl.focus();
    }
  });

  function closeModal() {
    modal.classList.remove('show');
    rejectId = null;
  }

  btnCancelReject.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Kirim penolakan beserta alasan wajib.
  btnConfirmReject.addEventListener('click', async () => {
    const reason = reasonEl.value.trim();
    if (!reason) {
      showAlert(modalAlert, 'Alasan penolakan wajib diisi.');
      return;
    }
    btnConfirmReject.disabled = true;
    try {
      const data = await api(`/api/loans/${rejectId}/status`, {
        method: 'PATCH',
        body: { status: 'ditolak', rejectReason: reason },
      });
      closeModal();
      showAlert(alertEl, data.message, 'success');
      await load();
    } catch (err) {
      showAlert(modalAlert, err.message);
    } finally {
      btnConfirmReject.disabled = false;
    }
  });

  await load();
})();
