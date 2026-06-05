(function () {
  'use strict';

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-admin-delete-type]');
    if (!btn || !window.JKAdminApi) return;

    e.preventDefault();
    var type = btn.getAttribute('data-admin-delete-type');
    var id = btn.getAttribute('data-admin-delete-id');
    var label = btn.getAttribute('data-admin-delete') || 'item ini';
    if (!type || !id) return;

    if (!window.confirm('Hapus ' + label + '? Tindakan ini tidak dapat dibatalkan.')) return;

    window.JKAdminApi.fetch('/' + type + '/' + id, { method: 'DELETE' })
      .then(function () {
        var row = btn.closest('tr');
        if (row) row.remove();
        if (window.JKAdminToast) window.JKAdminToast.success('Data berhasil dihapus.');
      })
      .catch(function (err) {
        if (window.JKAdminToast) window.JKAdminToast.error(err.message || 'Gagal menghapus');
        else alert(err.message || 'Gagal menghapus');
      });
  });
})();
