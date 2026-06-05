(function () {
  'use strict';

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

  function showError(titleEl, metaEl, bodyEl, message) {
    if (titleEl) titleEl.textContent = 'Artikel tidak ditemukan';
    if (metaEl) metaEl.innerHTML = '';
    if (bodyEl) {
      bodyEl.innerHTML = '<p class="text-red-600">' + message + '</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var slug;
    try {
      slug = new URLSearchParams(window.location.search).get('slug');
    } catch (e) {
      slug = null;
    }

    var titleEl = document.getElementById('article-title');
    var metaEl = document.getElementById('article-meta');
    var coverEl = document.getElementById('article-cover');
    var bodyEl = document.querySelector('.article-body');

    if (!slug) {
      showError(
        titleEl,
        metaEl,
        bodyEl,
        'Pilih artikel dari <a href="./artikel.html" class="text-brand-orange underline">halaman Artikel</a>.'
      );
      return;
    }

    if (!window.JKArticleContent) {
      showError(titleEl, metaEl, bodyEl, 'Script artikel gagal dimuat. Refresh halaman (Ctrl+F5).');
      return;
    }

    window
      .jkFetch('/articles/' + encodeURIComponent(slug))
      .then(function (article) {
        document.title = article.title + ' - Jalankebromo';
        if (titleEl) titleEl.textContent = article.title;
        if (metaEl) {
          var dateStr = formatDate(article.publishedAt) || '—';
          metaEl.innerHTML =
            dateStr + ' <span class="mx-2 text-neutral-300">•</span> <span>0 Comment</span>';
        }

        var coverUrl = article.coverImageUrl;
        if (coverEl && coverUrl) {
          coverEl.classList.remove('hidden');
          coverEl.innerHTML =
            '<img src="' +
            JKArticleContent.escapeHtml(coverUrl) +
            '" alt="" class="w-full rounded-xl object-cover" loading="lazy" />';
        } else if (coverEl) {
          coverEl.classList.add('hidden');
          coverEl.innerHTML = '';
        }

        if (bodyEl) {
          var data = JKArticleContent.parse(article.content || '');
          bodyEl.innerHTML = JKArticleContent.renderHtml(data, {
            emptyMessage: 'Konten artikel kosong.',
          });
        }

        if (article.tags && article.tags.length) {
          var tagWrap = document.querySelector('.article-tags');
          if (tagWrap) {
            tagWrap.innerHTML = article.tags
              .map(function (t) {
                return (
                  '<a href="#" class="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">#' +
                  JKArticleContent.escapeHtml(t.name) +
                  '</a>'
                );
              })
              .join('');
          }
        }
      })
      .catch(function (err) {
        showError(
          titleEl,
          metaEl,
          bodyEl,
          'Artikel tidak ditemukan atau status masih Draft. Pastikan server API jalan di localhost:3000.'
        );
        console.error(err);
      });
  });
})();
