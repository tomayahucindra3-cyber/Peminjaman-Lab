// Halaman registrasi mahasiswa (nama, NIM, password).
(function () {
  const form = document.getElementById('register-form');
  const alertEl = document.getElementById('alert');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showAlert(alertEl, '');

    const name = form.name.value.trim();
    const nim = form.nim.value.trim();
    const password = form.password.value;

    // Validasi singkat di sisi klien (validasi utama ada di server).
    if (!name) return showAlert(alertEl, 'Nama wajib diisi.');
    if (!nim) return showAlert(alertEl, 'NIM wajib diisi.');
    if (password.length < 6) return showAlert(alertEl, 'Password minimal 6 karakter.');

    submitBtn.disabled = true;
    try {
      const data = await api('/api/auth/register', {
        method: 'POST',
        body: { name, nim, password },
      });
      showAlert(alertEl, data.message, 'success');
      form.reset();
      setTimeout(() => (window.location.href = '/'), 1200);
    } catch (err) {
      showAlert(alertEl, err.message);
      submitBtn.disabled = false;
    }
  });
})();
