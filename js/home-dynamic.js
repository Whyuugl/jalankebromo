(function () {
  'use strict';

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function packageCardHtml(pkg) {
    var img =
      pkg.mainImageUrl ||
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80';
    var href = './detail-paket.html?slug=' + encodeURIComponent(pkg.slug);
    var category = pkg.category || 'Wisata';
    var durationText = pkg.durationLabel || '';

    return (
      '<article class="overflow-hidden rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm transition hover:shadow-md">' +
      '<a href="' +
      href +
      '" class="block">' +
      '<div class="aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100">' +
      '<img src="' +
      escapeHtml(img) +
      '" alt="" class="h-full w-full object-cover" loading="lazy" />' +
      '</div>' +
      '<div class="px-1 pb-1 pt-2">' +
      '<p class="flex items-center gap-1.5 text-sm text-neutral-500">' +
      '<svg class="h-4 w-4 text-brand-orange" fill="currentColor" viewBox="0 0 20 20">' +
      '<path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />' +
      '</svg>' +
      escapeHtml(category) +
      '</p>' +
      '<h3 class="mt-1 font-semibold text-neutral-900">' +
      escapeHtml(pkg.title) +
      '</h3>' +
      (durationText
        ? '<p class="mt-1 text-sm text-neutral-500">' + escapeHtml(durationText) + '</p>'
        : '') +
      '<p class="mt-3 text-lg font-semibold text-emerald-600">' +
      escapeHtml(pkg.priceFormatted) +
      ' <span class="text-sm font-normal text-emerald-600">/person</span></p>' +
      '</div>' +
      '</a>' +
      '</article>'
    );
  }

  function articleCardHtml(article) {
    var img =
      article.coverImageUrl ||
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80';
    var href = './artikel-detail.html?slug=' + encodeURIComponent(article.slug);

    var dateStr = '';
    if (article.publishedAt) {
      try {
        dateStr = new Date(article.publishedAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      } catch (e) {
        dateStr = '';
      }
    }

    return (
      '<a href="' +
      href +
      '" class="group overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition hover:shadow-md">' +
      '<div class="aspect-[16/10] overflow-hidden bg-neutral-100">' +
      '<img src="' +
      escapeHtml(img) +
      '" alt="" class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" loading="lazy" />' +
      '</div>' +
      '<div class="p-5">' +
      '<h3 class="font-semibold leading-snug text-neutral-900 group-hover:text-brand-orange">' +
      escapeHtml(article.title) +
      '</h3>' +
      '<p class="mt-2 text-sm text-neutral-400">' +
      escapeHtml(dateStr) +
      '</p>' +
      '</div>' +
      '</a>'
    );
  }

  function setLoading(gridEl, message) {
    if (!gridEl) return;
    gridEl.innerHTML =
      '<p class="col-span-full py-12 text-center text-sm text-neutral-500">' +
      escapeHtml(message || 'Memuat...') +
      '</p>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.jkFetch) return;

    var populerGrid = document.getElementById('home-paket-populer-grid');
    var wisataGrid = document.getElementById('home-paket-wisata-grid');
    var artikelGrid = document.getElementById('home-artikel-grid');

    setLoading(populerGrid, 'Memuat paket populer...');
    setLoading(wisataGrid, 'Memuat paket wisata...');
    setLoading(artikelGrid, 'Memuat artikel...');

    window
      .jkFetch('/packages')
      .then(function (pkgs) {
        pkgs = Array.isArray(pkgs) ? pkgs : [];

        if (populerGrid) {
          var populer = pkgs.slice(0, 4);
          populerGrid.innerHTML = populer.length
            ? populer.map(packageCardHtml).join('')
            : '<p class="col-span-full py-12 text-center text-sm text-neutral-500">Belum ada paket populer.</p>';
        }

        if (wisataGrid) {
          var wisata = pkgs.slice(0, 12);
          wisataGrid.innerHTML = wisata.length
            ? wisata.map(packageCardHtml).join('')
            : '<p class="col-span-full py-12 text-center text-sm text-neutral-500">Belum ada paket wisata.</p>';
        }
      })
      .catch(function () {
        if (populerGrid)
          populerGrid.innerHTML =
            '<p class="col-span-full py-12 text-center text-sm text-red-600">Gagal memuat paket.</p>';
        if (wisataGrid)
          wisataGrid.innerHTML =
            '<p class="col-span-full py-12 text-center text-sm text-red-600">Gagal memuat paket.</p>';
      });

    window
      .jkFetch('/articles')
      .then(function (articles) {
        articles = Array.isArray(articles) ? articles : [];
        if (!artikelGrid) return;

        var shown = articles.slice(0, 6);
        artikelGrid.innerHTML = shown.length
          ? shown.map(articleCardHtml).join('')
          : '<p class="col-span-full py-12 text-center text-sm text-neutral-500">Belum ada artikel.</p>';
      })
      .catch(function () {
        if (!artikelGrid) return;
        artikelGrid.innerHTML =
          '<p class="col-span-full py-12 text-center text-sm text-red-600">Gagal memuat artikel.</p>';
      });
  });
})();

