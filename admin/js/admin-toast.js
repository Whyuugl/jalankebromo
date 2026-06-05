(function () {
  'use strict';

  var ICONS = {
    success:
      '<svg class="h-5 w-5 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
    error:
      '<svg class="h-5 w-5 shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
    info: '<svg class="h-5 w-5 shrink-0 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/></svg>',
    warning:
      '<svg class="h-5 w-5 shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>',
  };

  function mount() {
    if (document.getElementById('jk-admin-toast-root')) return;
    var root = document.createElement('div');
    root.id = 'jk-admin-toast-root';
    root.className = 'jk-toast-root';
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('aria-relevant', 'additions');
    document.body.appendChild(root);
  }

  function show(message, type, duration) {
    type = type || 'success';
    duration = duration == null ? 4200 : duration;
    mount();
    var root = document.getElementById('jk-admin-toast-root');
    var el = document.createElement('div');
    el.className = 'jk-toast jk-toast--' + type;
    el.setAttribute('role', 'status');
    el.innerHTML =
      (ICONS[type] || ICONS.info) +
      '<div class="jk-toast__body"><p class="jk-toast__title">' +
      (type === 'success' ? 'Berhasil' : type === 'error' ? 'Gagal' : type === 'warning' ? 'Perhatian' : 'Info') +
      '</p><p class="jk-toast__msg"></p></div>' +
      '<button type="button" class="jk-toast__close" aria-label="Tutup">&times;</button>';
    el.querySelector('.jk-toast__msg').textContent = message || '';

    function remove() {
      el.classList.add('jk-toast--out');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 280);
    }

    el.querySelector('.jk-toast__close').addEventListener('click', remove);
    root.appendChild(el);
    requestAnimationFrame(function () {
      el.classList.add('jk-toast--in');
    });
    if (duration > 0) setTimeout(remove, duration);
  }

  window.JKAdminToast = {
    mount: mount,
    show: show,
    success: function (msg, d) {
      show(msg, 'success', d);
    },
    error: function (msg, d) {
      show(msg, 'error', d);
    },
    info: function (msg, d) {
      show(msg, 'info', d);
    },
    warning: function (msg, d) {
      show(msg, 'warning', d);
    },
  };
})();
