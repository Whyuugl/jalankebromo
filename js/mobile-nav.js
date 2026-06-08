(function () {
  'use strict';

  var LOGO_MARK =
    '<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white shadow-sm ring-4 ring-orange-50">' +
    '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M12 4L4 20h16L12 4zm0 4.5l5.2 9.5H6.8L12 8.5z" fill="currentColor" opacity=".95"/>' +
    '</svg></span>';

  function homeHref() {
    var onIndex =
      /index\.html$/i.test(window.location.pathname) ||
      window.location.pathname === '/' ||
      /\/$/.test(window.location.pathname);
    return onIndex ? '#beranda' : './index.html';
  }

  function currentPageKey() {
    var file = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (!file || file === '') return 'index.html';
    return file;
  }

  function linkIsActive(href) {
    if (!href) return false;
    var page = currentPageKey();
    var raw = href;
    if (raw.indexOf('://') !== -1) {
      try {
        raw = new URL(raw).pathname.split('/').pop() || 'index.html';
      } catch (e) {
        return false;
      }
    }
    if (raw === '#beranda' || raw === './index.html' || raw === 'index.html' || raw === '/') {
      return page === 'index.html' || page === '';
    }
    var target = raw.replace(/^\.\//, '').split('#')[0].toLowerCase();
    return target && page === target;
  }

  function closeDrawer(root, toggle) {
    if (!root) return;
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('site-drawer-open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
    }
  }

  function openDrawer(root, toggle) {
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('site-drawer-open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true');
    }
  }

  function initHeader(header) {
    if (header.dataset.mobileNavReady) return;
    header.dataset.mobileNavReady = '1';

    var row = header.querySelector(':scope > .mx-auto') || header.querySelector(':scope > div');
    if (!row) return;

    var nav = row.querySelector('nav');
    var logo =
      row.querySelector('[data-site-logo]') ||
      row.querySelector('a[aria-label="Beranda"]') ||
      row.querySelector('a.flex.items-center');

    header.querySelectorAll(':scope > div').forEach(function (el) {
      if (el === row) return;
      if (el.className.indexOf('border-t') !== -1 && el.className.indexOf('md:hidden') !== -1) {
        el.remove();
      }
    });

    if (nav) {
      nav.classList.remove('md:flex');
      nav.classList.add('lg:flex');
      if (nav.className.indexOf('hidden') === -1) nav.classList.add('hidden');
    }

    if (logo) {
      logo.classList.add('hidden', 'lg:flex');
      if (!logo.getAttribute('href') || logo.getAttribute('href') === '#') {
        logo.setAttribute('href', homeHref());
      }
    }

    var existingToggle = row.querySelector('[data-mobile-nav-toggle]');
    var toggle = existingToggle;
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className =
        'site-menu-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:border-brand-orange hover:text-brand-orange lg:hidden';
      toggle.setAttribute('data-mobile-nav-toggle', '');
      toggle.setAttribute('aria-label', 'Buka menu navigasi');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', 'site-mobile-drawer');
      toggle.innerHTML =
        '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>' +
        '</svg>';
      row.insertBefore(toggle, row.firstChild);
    }

    var root = document.getElementById('site-mobile-drawer');
    if (!root) {
      root = document.createElement('div');
      root.id = 'site-mobile-drawer';
      root.className = 'site-drawer';
      root.setAttribute('aria-hidden', 'true');

      var backdrop = document.createElement('div');
      backdrop.className = 'site-drawer__backdrop';
      backdrop.setAttribute('data-mobile-nav-close', '');

      var panel = document.createElement('aside');
      panel.className = 'site-drawer__panel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-label', 'Menu navigasi');

      var panelHead = document.createElement('div');
      panelHead.className = 'site-drawer__head';
      panelHead.innerHTML =
        '<a href="' +
        homeHref() +
        '" class="site-drawer__brand">' +
        LOGO_MARK +
        '<span><span class="block text-sm font-bold text-neutral-900">Jalankebromo</span>' +
        '<span class="block text-xs text-neutral-500">Paling Hobby Traveling</span></span></a>' +
        '<button type="button" class="site-drawer__close" data-mobile-nav-close aria-label="Tutup menu">' +
        '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>' +
        '</svg></button>';

      var panelNav = document.createElement('nav');
      panelNav.className = 'site-drawer__nav';
      panelNav.setAttribute('aria-label', 'Menu utama');

      var panelExtra = document.createElement('div');
      panelExtra.className = 'site-drawer__extra';

      panel.appendChild(panelHead);
      panel.appendChild(panelNav);
      panel.appendChild(panelExtra);
      root.appendChild(backdrop);
      root.appendChild(panel);
      document.body.appendChild(root);
    }

    var panelNav = root.querySelector('.site-drawer__nav');
    var panelExtra = root.querySelector('.site-drawer__extra');
    panelNav.innerHTML = '';
    panelExtra.innerHTML = '';

    if (nav) {
      nav.querySelectorAll('a').forEach(function (link) {
        var a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = link.textContent.trim();
        a.className = 'site-drawer__link';
        if (linkIsActive(a.href) || linkIsActive(link.getAttribute('href'))) {
          a.classList.add('is-active');
        }
        panelNav.appendChild(a);
      });
    }

    var profilePanel = row.querySelector('[data-profile-menu-panel]');
    if (profilePanel) {
      profilePanel.querySelectorAll('a').forEach(function (link) {
        var a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = link.textContent.trim();
        a.className = 'site-drawer__link site-drawer__link--sub';
        if (linkIsActive(a.href) || linkIsActive(link.getAttribute('href'))) {
          a.classList.add('is-active');
        }
        panelExtra.appendChild(a);
      });
    } else {
      panelExtra.innerHTML =
        '<a href="./cek-pesanan.html" class="site-drawer__link site-drawer__link--sub">Pesanan Saya</a>' +
        '<a href="./reschedule.html" class="site-drawer__link site-drawer__link--sub">Reschedule</a>';
    }

    toggle.addEventListener('click', function () {
      if (root.classList.contains('is-open')) {
        closeDrawer(root, toggle);
      } else {
        document.querySelectorAll('[data-profile-menu-panel]').forEach(function (p) {
          p.classList.add('hidden');
        });
        openDrawer(root, toggle);
      }
    });

    root.querySelectorAll('[data-mobile-nav-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        closeDrawer(root, toggle);
      });
    });

    root.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        closeDrawer(root, toggle);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('header').forEach(function (header) {
      if (!header.querySelector('nav') && !header.querySelector('[data-profile-menu-wrap]')) return;
      initHeader(header);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var root = document.getElementById('site-mobile-drawer');
      var toggle = document.querySelector('[data-mobile-nav-toggle]');
      if (root && root.classList.contains('is-open')) {
        closeDrawer(root, toggle);
      }
    });
  });
})();
