(function () {
  'use strict';

  var SESSION_KEY = 'jk_admin_session';

  window.JKAdminAuth = {
    SESSION_KEY: SESSION_KEY,
    isLoggedIn: function () {
      return !!(window.JKAdminApi && window.JKAdminApi.getToken());
    },
    getSession: function () {
      try {
        var raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    setSession: function (user, token) {
      if (window.JKAdminApi) window.JKAdminApi.setToken(token);
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          email: user.email,
          name: user.name,
          role: user.role,
          loggedAt: new Date().toISOString(),
        })
      );
    },
    logout: function () {
      if (window.JKAdminApi) window.JKAdminApi.clearToken();
      localStorage.removeItem(SESSION_KEY);
      window.location.href = './login.html';
    },
    requireAuth: function () {
      if (!window.JKAdminAuth.isLoggedIn()) {
        window.location.href = './login.html';
        return false;
      }
      return true;
    },
  };

  document.addEventListener('DOMContentLoaded', function () {
    var loginForm = document.getElementById('admin-login-form');
    if (!loginForm) return;

    if (window.JKAdminAuth.isLoggedIn()) {
      window.location.href = './dashboard.html';
      return;
    }

    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = loginForm.querySelector('[name="email"]').value;
      var password = loginForm.querySelector('[name="password"]').value;
      var err = document.getElementById('login-error');

      window
        .jkFetch('/admin/login', {
          method: 'POST',
          body: { email: email, password: password },
        })
        .then(function (data) {
          window.JKAdminAuth.setSession(data.user, data.token);
          window.location.href = './dashboard.html';
        })
        .catch(function (error) {
          var msg = error.message || 'Login gagal';
          if (window.JKAdminToast) window.JKAdminToast.error(msg);
          if (err) {
            err.textContent = msg;
            err.classList.remove('hidden');
          }
        });
    });
  });
})();
