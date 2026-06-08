(function () {
  'use strict';

  var state = {
    pkg: null,
    reviews: [],
    visibleCount: 4,
    slug: null,
  };

  var DEFAULT_INCLUDES = [
    'Transport PP sesuai paket',
    'Jeep / kendaraan wisata',
    'Tiket masuk objek wisata',
    'Driver & tour guide',
  ];

  var DEFAULT_EXCLUDES = [
    'Makan pribadi & minuman',
    'Asuransi perjalanan pribadi',
    'Pengeluaran personal',
    'Tip guide (opsional)',
  ];

  var DEFAULT_TERMS = [
    'DP minimal 30% untuk mengunci jadwal keberangkatan.',
    'Pelunasan maksimal H-1 sebelum trip.',
    'Reschedule mengikuti ketersediaan kuota dan kebijakan operator.',
    'Cuaca ekstrem dapat memengaruhi urutan atau rute perjalanan.',
    'Peserta wajib membawa identitas dan mengikuti instruksi guide.',
  ];

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getSlug() {
    try {
      return new URLSearchParams(window.location.search).get('slug');
    } catch (e) {
      return null;
    }
  }

  function todayIso() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function formatReviewDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return '';
    }
  }

  function starsHtml(rating, size) {
    var n = Math.round(Number(rating) || 0);
    var cls = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
    var out = '';
    for (var i = 1; i <= 5; i++) {
      var fill = i <= n ? 'currentColor' : 'none';
      var stroke = i <= n ? 'currentColor' : '#d4d4d4';
      out +=
        '<svg class="' +
        cls +
        '" viewBox="0 0 20 20" fill="' +
        fill +
        '" stroke="' +
        stroke +
        '"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
    }
    return out;
  }

  function avgRating(reviews) {
    if (!reviews.length) return 0;
    var sum = reviews.reduce(function (a, r) {
      return a + Number(r.rating || 0);
    }, 0);
    return sum / reviews.length;
  }

  function bindGallery(images, mainUrl) {
    var preview = document.getElementById('main-preview');
    var thumbContainer = document.getElementById('pkg-thumbs');
    if (!preview) return;

    var list = images && images.length ? images : [{ image_url: mainUrl }];
    var first = list[0].image_url || mainUrl;
    preview.src = first;
    preview.alt = document.getElementById('pkg-title')?.textContent || '';

    if (!thumbContainer) return;
    thumbContainer.innerHTML = list
      .slice(0, 5)
      .map(function (img, i) {
        var url = img.image_url;
        return (
          '<button type="button" class="thumb overflow-hidden rounded-lg' +
          (i === 0 ? ' ring-2 ring-brand-orange' : '') +
          '"><img src="' +
          escapeHtml(url) +
          '" data-full="' +
          escapeHtml(url) +
          '" class="h-14 w-full object-cover sm:h-16" alt="" /></button>'
        );
      })
      .join('');

    thumbContainer.querySelectorAll('.thumb').forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        thumbContainer.querySelectorAll('.thumb').forEach(function (btn) {
          btn.classList.remove('ring-2', 'ring-brand-orange');
        });
        thumb.classList.add('ring-2', 'ring-brand-orange');
        var img = thumb.querySelector('img');
        if (img) preview.src = img.getAttribute('data-full') || img.src;
      });
    });
  }

  function renderListItems(id, items) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = items.map(function (t) {
      return '<li>' + escapeHtml(t) + '</li>';
    }).join('');
  }

  function renderCategoryBars(avg) {
    var wrap = document.getElementById('review-category-bars');
    if (!wrap) return;
    var cats = [
      { label: 'Guide', pct: Math.min(100, Math.round((avg / 5) * 100 * 0.98)) },
      { label: 'Transportation', pct: Math.min(100, Math.round((avg / 5) * 100 * 1.02)) },
      { label: 'Value for Money', pct: Math.min(100, Math.round((avg / 5) * 100 * 0.96)) },
      { label: 'Safety', pct: Math.min(100, Math.round((avg / 5) * 100 * 1.0)) },
    ];
    if (!avg) {
      cats.forEach(function (c) {
        c.pct = 0;
      });
    }
    wrap.innerHTML = cats
      .map(function (c) {
        return (
          '<div class="flex items-center gap-3 text-sm">' +
          '<span class="w-32 shrink-0 text-neutral-600">' +
          escapeHtml(c.label) +
          '</span>' +
          '<div class="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">' +
          '<div class="h-full rounded-full bg-amber-400 transition-all" style="width:' +
          c.pct +
          '%"></div></div></div>'
        );
      })
      .join('');
  }

  function getFilteredReviews() {
    var sort = document.getElementById('review-sort')?.value || 'newest';
    var minRating = document.getElementById('review-rating-filter')?.value;
    var q = (document.getElementById('review-search')?.value || '').trim().toLowerCase();

    var list = state.reviews.slice();
    if (minRating) {
      var min = Number(minRating);
      list = list.filter(function (r) {
        return Number(r.rating) >= min;
      });
    }
    if (q) {
      list = list.filter(function (r) {
        return (
          (r.customer_name || '').toLowerCase().includes(q) ||
          (r.comment || '').toLowerCase().includes(q)
        );
      });
    }
    if (sort === 'highest') {
      list.sort(function (a, b) {
        return Number(b.rating) - Number(a.rating);
      });
    } else if (sort === 'lowest') {
      list.sort(function (a, b) {
        return Number(a.rating) - Number(b.rating);
      });
    }
    return list;
  }

  function renderReviews() {
    var listEl = document.getElementById('review-list');
    var emptyEl = document.getElementById('review-empty');
    var loadMore = document.getElementById('review-load-more');
    if (!listEl) return;

    var filtered = getFilteredReviews();
    var shown = filtered.slice(0, state.visibleCount);

    if (!filtered.length) {
      listEl.innerHTML = '';
      if (emptyEl) emptyEl.classList.remove('hidden');
      if (loadMore) loadMore.classList.add('hidden');
      return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');

    listEl.innerHTML = shown
      .map(function (r) {
        var initial = (r.customer_name || 'U').charAt(0).toUpperCase();
        return (
          '<article class="flex gap-4 py-6">' +
          '<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-bold text-neutral-500">' +
          escapeHtml(initial) +
          '</div>' +
          '<div class="min-w-0 flex-1">' +
          '<div class="flex flex-wrap items-start justify-between gap-2">' +
          '<div><p class="font-semibold text-neutral-900">' +
          escapeHtml(r.customer_name) +
          '</p><p class="text-xs text-neutral-400">' +
          escapeHtml(formatReviewDate(r.reviewed_at)) +
          '</p></div>' +
          '<div class="flex gap-0.5 text-brand-orange">' +
          starsHtml(r.rating, 'sm') +
          '</div></div>' +
          '<p class="mt-2 text-sm leading-relaxed text-neutral-600">' +
          escapeHtml(r.comment) +
          '</p></div></article>'
        );
      })
      .join('');

    if (loadMore) {
      if (filtered.length > state.visibleCount) {
        loadMore.classList.remove('hidden');
      } else {
        loadMore.classList.add('hidden');
      }
    }
  }

  function updateReviewSummary() {
    var avg = avgRating(state.reviews);
    var count = state.reviews.length;
    var avgBig = document.getElementById('review-avg-big');
    var countLabel = document.getElementById('review-count-label');
    var avgStars = document.getElementById('review-avg-stars');
    var headerRating = document.getElementById('pkg-header-rating');
    var headerScore = document.getElementById('pkg-header-score');
    var headerCount = document.getElementById('pkg-header-count');
    var headerStars = document.getElementById('pkg-header-stars');

    if (avgBig) avgBig.textContent = count ? avg.toFixed(2).replace('.', ',') : '—';
    if (countLabel) countLabel.textContent = count + ' Reviews';
    if (avgStars) avgStars.innerHTML = starsHtml(Math.round(avg));
    renderCategoryBars(avg);

    if (count && headerRating) {
      headerRating.classList.remove('hidden');
      if (headerScore) headerScore.textContent = avg.toFixed(1);
      if (headerCount) headerCount.textContent = count + ' Reviews';
      if (headerStars) headerStars.innerHTML = starsHtml(Math.round(avg), 'sm');
    }
  }

  function loadRelated(currentSlug) {
    window.jkFetch('/packages').then(function (list) {
      var others = (list || []).filter(function (p) {
        return p.slug !== currentSlug;
      }).slice(0, 8);
      var section = document.getElementById('related-tours-section');
      var track = document.getElementById('related-tours-track');
      if (!section || !track || !others.length) return;

      section.classList.remove('hidden');
      track.innerHTML = others
        .map(function (p) {
          return (
            '<a href="./detail-paket.html?slug=' +
            encodeURIComponent(p.slug) +
            '" class="pkg-related-card shrink-0">' +
            '<div class="overflow-hidden rounded-xl bg-neutral-100">' +
            '<img src="' +
            escapeHtml(p.mainImageUrl || '') +
            '" alt="" class="h-36 w-56 object-cover" loading="lazy" /></div>' +
            '<p class="mt-2 line-clamp-2 text-sm font-semibold text-neutral-900">' +
            escapeHtml(p.title) +
            '</p>' +
            '<p class="mt-1 text-sm font-medium text-emerald-600">' +
            escapeHtml(p.priceFormatted || '') +
            '</p></a>'
          );
        })
        .join('');

      var prev = document.getElementById('related-prev');
      var next = document.getElementById('related-next');
      if (prev) prev.onclick = function () {
        track.scrollBy({ left: -240, behavior: 'smooth' });
      };
      if (next) next.onclick = function () {
        track.scrollBy({ left: 240, behavior: 'smooth' });
      };
    });
  }

  function bindBooking(pkg) {
    var pricePerPerson = Number(pkg.price) || 0;
    var priceEl = document.getElementById('detail-price');
    var bookBtn = document.getElementById('detail-book-btn');
    var dateInput = document.getElementById('detail-trip-date');
    var peopleSelect = document.getElementById('detail-people');
    var waBtn = document.getElementById('detail-wa-btn');

    function updatePrice() {
      if (!priceEl) return;
      var people = Math.max(1, parseInt(peopleSelect?.value, 10) || 1);
      priceEl.textContent = window.jkFormatRp(pricePerPerson * people);
    }

    if (dateInput) dateInput.min = todayIso();
    updatePrice();
    if (peopleSelect) peopleSelect.addEventListener('change', updatePrice);

    var buildHref = function () {
      var href =
        './form-pemesanan-paket.html?slug=' +
        encodeURIComponent(pkg.slug) +
        '&packageId=' +
        pkg.id;
      if (dateInput?.value) href += '&tripDate=' + encodeURIComponent(dateInput.value);
      if (peopleSelect?.value) href += '&people=' + encodeURIComponent(peopleSelect.value);
      return href;
    };

    if (bookBtn) {
      bookBtn.href = buildHref();
      bookBtn.addEventListener('click', function () {
        bookBtn.href = buildHref();
      });
    }

    if (waBtn) {
      window.jkFetch('/settings')
        .then(function (s) {
          var phone = (s.contact_whatsapp || s.contact_phone || '').replace(/\D/g, '');
          if (!phone) return;
          var msg = encodeURIComponent('Halo, saya tertarik paket: ' + pkg.title);
          waBtn.href = 'https://wa.me/' + phone + '?text=' + msg;
        })
        .catch(function () {});
    }
  }

  function showReviewMsg(text, isError) {
    var hint = document.getElementById('review-form-hint');
    if (!hint) return;
    hint.textContent = text;
    hint.classList.remove('hidden', 'bg-amber-50', 'text-amber-800', 'bg-red-50', 'text-red-700');
    hint.classList.add(isError ? 'bg-red-50' : 'bg-amber-50', isError ? 'text-red-700' : 'text-amber-800');
  }

  function openReviewModal() {
    var modal = document.getElementById('review-modal');
    if (!modal) return;
    if (!state.slug) {
      showReviewMsg('Buka halaman ini dari daftar paket (butuh ?slug=... di URL).', true);
    } else {
      showReviewMsg('', false);
      var hint = document.getElementById('review-form-hint');
      if (hint) hint.classList.add('hidden');
    }
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('review-modal-open');
    var nameInput = document.querySelector('#review-form [name="customerName"]');
    if (nameInput) setTimeout(function () { nameInput.focus(); }, 100);
  }

  function closeReviewModal() {
    var modal = document.getElementById('review-modal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('review-modal-open');
  }

  function bindReviewFilters() {
    if (state.filtersBound) return;
    state.filtersBound = true;

    ['review-sort', 'review-rating-filter', 'review-search'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', function () {
        state.visibleCount = 4;
        renderReviews();
      });
      el.addEventListener('change', function () {
        state.visibleCount = 4;
        renderReviews();
      });
    });

    var loadMore = document.getElementById('review-load-more');
    if (loadMore) {
      loadMore.addEventListener('click', function () {
        state.visibleCount += 4;
        renderReviews();
      });
    }
  }

  function initReviewForm() {
    if (state.reviewFormBound) return;
    state.reviewFormBound = true;

    var toggle = document.getElementById('review-write-toggle');
    var form = document.getElementById('review-form');
    var modal = document.getElementById('review-modal');

    if (toggle) {
      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        openReviewModal();
      });
    }

    if (modal) {
      modal.querySelectorAll('[data-review-modal-close]').forEach(function (el) {
        el.addEventListener('click', closeReviewModal);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
        closeReviewModal();
      }
    });

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!state.slug) {
          showReviewMsg('Paket belum dimuat. Refresh halaman atau buka dari daftar paket.', true);
          return;
        }
        var fd = new FormData(form);
        var btn = document.getElementById('review-submit-btn');
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Mengirim…';
        }
        window
          .jkFetch('/packages/' + encodeURIComponent(state.slug) + '/reviews', {
            method: 'POST',
            body: {
              customerName: fd.get('customerName'),
              rating: Number(fd.get('rating')),
              comment: fd.get('comment'),
            },
          })
          .then(function () {
            form.reset();
            closeReviewModal();
            return window.jkFetch('/packages/' + encodeURIComponent(state.slug));
          })
          .then(function (pkg) {
            state.reviews = pkg.reviews || [];
            state.visibleCount = 4;
            updateReviewSummary();
            renderReviews();
            alert('Terima kasih! Ulasan Anda telah dikirim.');
          })
          .catch(function (err) {
            showReviewMsg(err.message || 'Gagal mengirim ulasan', true);
            openReviewModal();
          })
          .finally(function () {
            if (btn) {
              btn.disabled = false;
              btn.textContent = 'Kirim Ulasan';
            }
          });
      });
    }
  }

  function loadPackage() {
    state.slug = getSlug();
    if (!state.slug) return;

    window
      .jkFetch('/packages/' + encodeURIComponent(state.slug))
      .then(function (pkg) {
        state.pkg = pkg;
        state.reviews = pkg.reviews || [];

        var title = document.getElementById('pkg-title');
        var meta = document.getElementById('pkg-meta');
        var desc = document.getElementById('pkg-description');

        if (title) title.textContent = pkg.title;
        if (meta) meta.textContent = 'Kategori: ' + (pkg.category || '-') + ' • ' + (pkg.durationLabel || '-');
        if (desc) desc.textContent = pkg.description || pkg.shortDescription || '—';

        document.title = pkg.title + ' - Jalankebromo';

        bindGallery(pkg.images, pkg.mainImageUrl);

        var itinEl = document.getElementById('pkg-itinerary');
        if (itinEl) {
          if (pkg.itinerary && pkg.itinerary.length) {
            itinEl.innerHTML = pkg.itinerary
              .map(function (item) {
                var line =
                  (item.time_label ? '<span class="font-medium text-neutral-800">' + escapeHtml(item.time_label) + '</span> — ' : '') +
                  escapeHtml(item.title || item.description || '');
                return '<li class="flex gap-1">' + line + '</li>';
              })
              .join('');
          } else {
            itinEl.innerHTML = '<li class="text-neutral-400">Itinerary akan diinformasikan setelah booking.</li>';
          }
        }

        renderListItems('pkg-includes', DEFAULT_INCLUDES);
        renderListItems('pkg-excludes', DEFAULT_EXCLUDES);
        renderListItems('pkg-terms', DEFAULT_TERMS);

        bindBooking(pkg);
        updateReviewSummary();
        renderReviews();
        loadRelated(pkg.slug);
      })
      .catch(function (err) {
        console.error(err);
        var title = document.getElementById('pkg-title');
        if (title) title.textContent = 'Paket tidak ditemukan';
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    state.slug = getSlug();
    initReviewForm();
    bindReviewFilters();
    loadPackage();
  });
})();
