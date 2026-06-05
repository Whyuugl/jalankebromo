(function () {
  'use strict';

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (e) {
      return '';
    }
  }

  function cardHtml(article) {
    var img =
      article.coverImageUrl ||
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80';
    var href = './artikel-detail.html?slug=' + encodeURIComponent(article.slug);

    return (
      '<a href="' +
      href +
      '" class="group block overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition hover:shadow-md">' +
      '<div class="aspect-[16/10] overflow-hidden bg-neutral-100">' +
      '<img src="' +
      escapeHtml(img) +
      '" alt="" class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />' +
      '</div><div class="p-5"><h3 class="font-semibold leading-snug text-neutral-900 group-hover:text-brand-orange">' +
      escapeHtml(article.title) +
      '</h3><p class="mt-2 text-sm text-neutral-400">' +
      escapeHtml(formatDate(article.publishedAt)) +
      '</p></div></a>'
    );
  }

  document.addEventListener('DOMContentLoaded', function () {
    var grid = document.querySelector('#artikel .mt-10.grid') || document.querySelector('main .mt-10.grid');
    if (!grid) return;

    grid.innerHTML =
      '<p class="col-span-full py-12 text-center text-sm text-neutral-500">Memuat artikel...</p>';

    window
      .jkFetch('/articles')
      .then(function (articles) {
        if (!articles.length) {
          grid.innerHTML =
            '<p class="col-span-full py-12 text-center text-sm text-neutral-500">Belum ada artikel.</p>';
          return;
        }
        grid.innerHTML = articles.map(cardHtml).join('');
      })
      .catch(function (err) {
        grid.innerHTML =
          '<p class="col-span-full text-center text-sm text-red-600">Gagal memuat artikel. ' +
          escapeHtml(err.message) +
          '</p>';
      });
  });
})();
