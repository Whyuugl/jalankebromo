(function () {
  'use strict';

  var TOKEN_KEY = 'jk_admin_token';

  window.JKAdminApi = {
    getToken: function () {
      try {
        return localStorage.getItem(TOKEN_KEY);
      } catch (e) {
        return null;
      }
    },
    setToken: function (token) {
      localStorage.setItem(TOKEN_KEY, token);
    },
    clearToken: function () {
      localStorage.removeItem(TOKEN_KEY);
    },
    fetch: function (path, options) {
      options = options || {};
      return window.jkFetch('/admin' + path, {
        method: options.method || 'GET',
        body: options.body,
        token: window.JKAdminApi.getToken(),
      });
    },
  };
})();
