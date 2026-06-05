(function () {
  'use strict';

  var NAV = [
    { id: 'dashboard', label: 'Dashboard', href: './dashboard.html', icon: 'home' },
    { id: 'pesanan', label: 'Pesanan', href: './pesanan.html', icon: 'cart' },
    { id: 'reschedule', label: 'Reschedule', href: './reschedule-requests.html', icon: 'calendar' },
    { id: 'laporan', label: 'Laporan', href: './laporan.html', icon: 'package' },
    { id: 'paket', label: 'Paket Wisata', href: './paket.html', icon: 'package' },
    { id: 'mobil', label: 'Sewa Mobil', href: './mobil.html', icon: 'car' },
    { id: 'artikel', label: 'Artikel', href: './artikel.html', icon: 'article' },
    { id: 'pengaturan', label: 'Pengaturan', href: './pengaturan.html', icon: 'settings' },
  ];

  var ICONS = {
    home: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/>',
    cart: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>',
    calendar:
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>',
    package: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>',
    car: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM5 11h14l-1-4H6l-1 4z"/>',
    article: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v10a2 2 0 01-2 2z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 4v6h6"/>',
    settings: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>',
    logout: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>',
  };

  function icon(name) {
    return (
      '<svg class="h-5 w-5 shrink-0 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">' +
      (ICONS[name] || '') +
      '</svg>'
    );
  }

  function navLink(item, activeId) {
    var active = item.id === activeId ? ' admin-sidebar-link active' : ' admin-sidebar-link';
    return (
      '<a href="' +
      item.href +
      '" class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900' +
      active +
      '">' +
      icon(item.icon) +
      '<span>' +
      item.label +
      '</span></a>'
    );
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.JKAdminAuth || !window.JKAdminAuth.requireAuth()) return;

    var pageId = document.body.getAttribute('data-admin-page') || 'dashboard';
    var pageTitle = document.body.getAttribute('data-admin-title') || 'Admin';
    var contentEl = document.getElementById('admin-page-content');
    if (!contentEl) return;

    var session = window.JKAdminAuth.getSession() || { name: 'Admin', email: 'admin@jalankebromo.com' };
    var contentHtml = contentEl.innerHTML;
    var navHtml = NAV.map(function (item) {
      return navLink(item, pageId);
    }).join('');

    var shell =
      '<div class="flex min-h-screen bg-neutral-100">' +
      '<aside id="admin-sidebar" class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r border-neutral-200 bg-white transition-transform lg:static lg:translate-x-0">' +
      '<div class="flex h-16 items-center gap-2 border-b border-neutral-100 px-5">' +
      '<span class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-orange text-white"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4L4 20h16L12 4z"/></svg></span>' +
      '<div><p class="text-sm font-bold text-neutral-900">Jalankebromo</p><p class="text-xs text-neutral-500">Panel Admin</p></div>' +
      '</div>' +
      '<nav class="flex-1 space-y-1 overflow-y-auto p-4">' +
      navHtml +
      '</nav>' +
      '<div class="border-t border-neutral-100 p-4">' +
      '<button type="button" id="admin-logout-btn" class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50">' +
      icon('logout') +
      '<span>Keluar</span></button>' +
      '<a href="../index.html" target="_blank" rel="noopener" class="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-500 transition hover:bg-neutral-50 hover:text-brand-orange">' +
      '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>' +
      '<span>Lihat Website</span></a>' +
      '</div>' +
      '</aside>' +
      '<div id="admin-sidebar-backdrop" class="fixed inset-0 z-30 hidden bg-black/40 lg:hidden"></div>' +
      '<div class="flex min-w-0 flex-1 flex-col">' +
      '<header class="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4 sm:px-6">' +
      '<div class="flex items-center gap-3">' +
      '<button type="button" id="admin-menu-toggle" class="rounded-lg border border-neutral-200 p-2 text-neutral-600 lg:hidden" aria-label="Menu">' +
      '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg></button>' +
      '<h1 class="text-lg font-semibold text-neutral-900">' +
      pageTitle +
      '</h1></div>' +
      '<div class="flex items-center gap-3">' +
      '<div class="hidden text-right sm:block"><p class="text-sm font-medium text-neutral-800">' +
      session.name +
      '</p><p class="text-xs text-neutral-500">' +
      session.email +
      '</p></div>' +
      '<span class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-orange/15 text-sm font-bold text-brand-orange">' +
      (session.name || 'A').charAt(0) +
      '</span></div></header>' +
      '<main class="flex-1 p-4 sm:p-6"><div id="admin-page-content">' +
      contentHtml +
      '</div></main></div></div>';


    document.body.className = 'font-sans text-neutral-800 antialiased';
    document.body.setAttribute('data-admin-page', pageId);
    document.body.setAttribute('data-admin-title', pageTitle);
    document.body.innerHTML = shell;

    document.getElementById('admin-logout-btn').addEventListener('click', function () {
      window.JKAdminAuth.logout();
    });

    var sidebar = document.getElementById('admin-sidebar');
    var backdrop = document.getElementById('admin-sidebar-backdrop');
    var toggle = document.getElementById('admin-menu-toggle');

    function closeSidebar() {
      sidebar.classList.add('-translate-x-full');
      backdrop.classList.add('hidden');
    }
    function openSidebar() {
      sidebar.classList.remove('-translate-x-full');
      backdrop.classList.remove('hidden');
    }

    toggle.addEventListener('click', function () {
      if (sidebar.classList.contains('-translate-x-full')) openSidebar();
      else closeSidebar();
    });
    backdrop.addEventListener('click', closeSidebar);

    if (window.JKAdminToast) window.JKAdminToast.mount();

    document.dispatchEvent(new CustomEvent('jk-admin-ready'));
  });
})();
