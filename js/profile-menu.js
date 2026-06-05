(function () {
  'use strict';

  function closeAll() {
    document.querySelectorAll('[data-profile-menu-panel]').forEach(function (p) {
      p.classList.add('hidden');
    });
    document.querySelectorAll('[data-profile-menu-trigger]').forEach(function (t) {
      t.setAttribute('aria-expanded', 'false');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-profile-menu-wrap]').forEach(function (wrap) {
      var trigger = wrap.querySelector('[data-profile-menu-trigger]');
      var panel = wrap.querySelector('[data-profile-menu-panel]');
      if (!trigger || !panel) return;

      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var wasOpen = !panel.classList.contains('hidden');
        closeAll();
        if (!wasOpen) {
          panel.classList.remove('hidden');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });

      panel.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    });

    document.addEventListener('click', closeAll);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll();
    });
  });
})();
