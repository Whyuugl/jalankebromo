(function () {
  'use strict';

  function yyyyMmDd(d) {
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd;
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.jkFetch) return;
    if (window.location.protocol === 'file:') return;

    var path = window.location.pathname + window.location.search;
    var today = new Date();
    var key = 'jk_pv_' + path + '_' + yyyyMmDd(today);

    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch (e) {
      // ignore storage errors
    }

    window
      .jkFetch('/pageviews', {
        method: 'POST',
        body: { path: path },
      })
      .catch(function () {
        // ignore tracking errors
      });
  });
})();

