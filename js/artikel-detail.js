(function () {
  'use strict';

  var articleSlug = null;

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

  function esc(str) {
    if (window.JKArticleContent && window.JKArticleContent.escapeHtml) {
      return window.JKArticleContent.escapeHtml(str);
    }
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function showError(titleEl, metaEl, bodyEl, message) {
    if (titleEl) titleEl.textContent = 'Artikel tidak ditemukan';
    if (metaEl) metaEl.innerHTML = '';
    if (bodyEl) {
      bodyEl.innerHTML = '<p class="text-red-600">' + message + '</p>';
    }
  }

  function updateCommentCount(count) {
    var metaEl = document.getElementById('article-meta');
    if (!metaEl) return;
    var datePart = metaEl.querySelector('[data-article-date]');
    var dateStr = datePart ? datePart.textContent : '—';
    metaEl.innerHTML =
      '<span data-article-date>' +
      esc(dateStr) +
      '</span> <span class="mx-2 text-neutral-300">•</span> <span>' +
      count +
      ' Komentar</span>';
  }

  function renderComments(comments) {
    var list = document.getElementById('article-comments-list');
    var empty = document.getElementById('article-comments-empty');
    if (!list) return;

    if (!comments || !comments.length) {
      list.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    list.innerHTML = comments
      .map(function (c) {
        var initial = (c.author_name || 'U').charAt(0).toUpperCase();
        return (
          '<article class="flex gap-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">' +
          '<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-bold text-neutral-500">' +
          esc(initial) +
          '</div>' +
          '<div class="min-w-0 flex-1">' +
          '<p class="font-semibold text-neutral-900">' +
          esc(c.author_name) +
          '</p>' +
          '<p class="text-xs text-neutral-400">' +
          esc(formatDate(c.created_at)) +
          '</p>' +
          '<p class="mt-2 text-sm leading-relaxed text-neutral-700">' +
          esc(c.body) +
          '</p></div></article>'
        );
      })
      .join('');
  }

  function loadComments(slug) {
    return window
      .jkFetch('/articles/' + encodeURIComponent(slug) + '/comments')
      .then(function (comments) {
        renderComments(comments);
        updateCommentCount((comments && comments.length) || 0);
        return comments;
      })
      .catch(function () {
        renderComments([]);
        return [];
      });
  }

  function bindCommentForm(slug) {
    var form = document.getElementById('article-comment-form');
    if (!form || form.dataset.bound) return;
    form.dataset.bound = '1';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.getElementById('article-comment-msg');
      var btn = document.getElementById('article-comment-submit');
      var fd = new FormData(form);

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Mengirim…';
      }

      window
        .jkFetch('/articles/' + encodeURIComponent(slug) + '/comments', {
          method: 'POST',
          body: {
            authorName: fd.get('authorName'),
            authorEmail: fd.get('authorEmail') || undefined,
            body: fd.get('body'),
          },
        })
        .then(function () {
          form.reset();
          if (msg) {
            msg.textContent = 'Komentar berhasil dikirim. Terima kasih!';
            msg.className = 'rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800';
            msg.classList.remove('hidden');
          }
          return loadComments(slug);
        })
        .catch(function (err) {
          if (msg) {
            msg.textContent = err.message || 'Gagal mengirim komentar';
            msg.className = 'rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700';
            msg.classList.remove('hidden');
          }
        })
        .finally(function () {
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Kirim Komentar';
          }
        });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    try {
      articleSlug = new URLSearchParams(window.location.search).get('slug');
    } catch (e) {
      articleSlug = null;
    }

    var titleEl = document.getElementById('article-title');
    var metaEl = document.getElementById('article-meta');
    var coverEl = document.getElementById('article-cover');
    var bodyEl = document.querySelector('.article-body');

    if (!articleSlug) {
      showError(
        titleEl,
        metaEl,
        bodyEl,
        'Pilih artikel dari <a href="./artikel.html" class="text-brand-orange underline">halaman Artikel</a>.'
      );
      var section = document.getElementById('article-comments-section');
      if (section) section.classList.add('hidden');
      return;
    }

    if (!window.JKArticleContent) {
      showError(titleEl, metaEl, bodyEl, 'Script artikel gagal dimuat. Refresh halaman (Ctrl+F5).');
      return;
    }

    bindCommentForm(articleSlug);

    window
      .jkFetch('/articles/' + encodeURIComponent(articleSlug))
      .then(function (article) {
        document.title = article.title + ' - Jalankebromo';
        if (titleEl) titleEl.textContent = article.title;
        if (metaEl) {
          var dateStr = formatDate(article.publishedAt) || '—';
          var count = article.commentCount || 0;
          metaEl.innerHTML =
            '<span data-article-date>' +
            esc(dateStr) +
            '</span> <span class="mx-2 text-neutral-300">•</span> <span>' +
            count +
            ' Komentar</span>';
        }

        var coverUrl = article.coverImageUrl;
        if (coverEl && coverUrl) {
          coverEl.classList.remove('hidden');
          coverEl.innerHTML =
            '<img src="' +
            esc(coverUrl) +
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
                  '<span class="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">#' +
                  esc(t.name) +
                  '</span>'
                );
              })
              .join('');
          }
        }

        return loadComments(articleSlug);
      })
      .catch(function (err) {
        showError(
          titleEl,
          metaEl,
          bodyEl,
          'Artikel tidak ditemukan atau status masih Draft. Pastikan server API jalan.'
        );
        console.error(err);
      });
  });
})();
