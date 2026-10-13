// Middleware proteksi halaman & API berdasarkan sesi dan peran.

/** Wajib login (admin atau mahasiswa). */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Silakan login terlebih dahulu.' });
  }
  next();
}

/** Hanya tamu (belum login) yang boleh membuka halaman login/registrasi. */
function requireGuest(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect(homePath(req.session.user));
  }
  next();
}

/** Hanya admin yang boleh (untuk halaman HTML admin). */
function requireAdminPage(req, res, next) {
  if (!req.session || !req.session.user) return res.redirect('/');
  if (req.session.user.role !== 'admin') return res.redirect('/labs');
  next();
}

/** Hanya mahasiswa yang boleh membuka halaman mahasiswa. */
function requireStudentPage(req, res, next) {
  if (!req.session || !req.session.user) return res.redirect('/');
  if (req.session.user.role !== 'mahasiswa') return res.redirect('/admin/labs');
  next();
}

/** Wajib login untuk halaman biasa. */
function requireAuthPage(req, res, next) {
  if (!req.session || !req.session.user) return res.redirect('/');
  next();
}

/** API: hanya peran tertentu. */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ message: 'Silakan login terlebih dahulu.' });
    }
    if (req.session.user.role !== role) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses ke fitur ini.' });
    }
    next();
  };
}

/** Halaman tujuan setelah login sesuai peran. */
function homePath(user) {
  return user.role === 'admin' ? '/admin/labs' : '/labs';
}

module.exports = {
  requireAuth,
  requireGuest,
  requireRole,
  requireAuthPage,
  requireAdminPage,
  requireStudentPage,
  homePath,
};
