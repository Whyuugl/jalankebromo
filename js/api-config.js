(function () {
  'use strict';

  function apiBase() {
    if (window.__JK_API_BASE__) {
      return String(window.__JK_API_BASE__).replace(/\/$/, '');
    }

    var meta = document.querySelector('meta[name="jk-api-base"]');
    if (meta && meta.content) {
      return meta.content.replace(/\/$/, '');
    }

    if (window.location.protocol === 'file:') {
      return 'http://localhost:3000/api';
    }

    var host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return window.location.origin + '/api';
    }

    // Vercel / production: same-origin /api (di-proxy lewat vercel.json ke Railway)
    return window.location.origin + '/api';
  }

  window.JK_API_BASE = apiBase();

  window.jkFetch = function (path, options) {
    options = options || {};
    var headers = Object.assign({ Accept: 'application/json' }, options.headers || {});

    if (options.token) {
      headers.Authorization = 'Bearer ' + options.token;
    }
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(window.JK_API_BASE + path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    }).then(function (res) {
      if (res.status === 204) return { success: true };
      return res.text().then(function (text) {
        var data = {};
        if (text) {
          try {
            data = JSON.parse(text);
          } catch (e) {
            data = { error: text };
          }
        }
        if (!res.ok) {
          var err = new Error(data.error || 'Request gagal');
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  };

  window.jkFormatRp = function (amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  };
})();
