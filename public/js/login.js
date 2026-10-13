// Halaman login: kirim identifier (username/NIM) dan password ke server.
(async function () {
  // Sudah login? langsung ke halaman sesuai peran.
  const user = await currentUser();
  if (user) {
    window.location.href = user.role === 'admin' ? '/admin/labs' : '/labs';
    return;
  }

  const form = document.getElementById('login-form');
  const alertEl = document.getElementById('alert');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showAlert(alertEl, '');

    const identifier = form.identifier.value.trim();
    const password = form.password.value;
    if (!identifier || !password) {
      showAlert(alertEl, 'Username/NIM dan password wajib diisi.');
      return;
    }

    submitBtn.disabled = true;
    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: { identifier, password },
      });
      showAlert(alertEl, data.message, 'success');
      window.location.href = data.user.role === 'admin' ? '/admin/labs' : '/labs';
    } catch (err) {
      showAlert(alertEl, err.message);
      submitBtn.disabled = false;
    }
  });
})();
