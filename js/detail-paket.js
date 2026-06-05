(function () {
  'use strict';

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

  function bindGallery(images, mainUrl) {
    var preview = document.getElementById('main-preview');
    var thumbContainer = document.querySelector('.mt-3.grid');
    if (!preview) return;

    var list = images && images.length ? images : [{ image_url: mainUrl }];
    preview.src = list[0].image_url || mainUrl;
    preview.alt = document.querySelector('h1')?.textContent || '';

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
          '" class="h-16 w-full object-cover" alt="" /></button>'
        );
      })
      .join('');

    var thumbs = document.querySelectorAll('.thumb');
    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        thumbs.forEach(function (btn) {
          btn.classList.remove('ring-2', 'ring-brand-orange');
        });
        thumb.classList.add('ring-2', 'ring-brand-orange');
        var img = thumb.querySelector('img');
        if (img) preview.src = img.getAttribute('data-full') || img.src;
      });
    });
  }

  function renderReviews(reviews) {
    var section = document.querySelector('section.mt-12.border-t');
    if (!section || !reviews.length) return;

    var list = section.querySelector('.mt-5.space-y-4') || section.querySelector('.mt-5');
    if (!list) return;

    list.innerHTML = reviews
      .map(function (r) {
        return (
          '<article class="rounded-xl border border-neutral-200 p-4">' +
          '<p class="font-medium text-neutral-800">“' +
          escapeHtml(r.comment) +
          '”</p>' +
          '<p class="mt-1 text-xs text-neutral-500">' +
          escapeHtml(r.customer_name) +
          '</p></article>'
        );
      })
      .join('');
  }

  function loadPackage() {
    var slug = getSlug();
    if (!slug) return;

    window
      .jkFetch('/packages/' + encodeURIComponent(slug))
      .then(function (pkg) {
        var h1 = document.querySelector('main h1');
        var meta = document.querySelector('main section p.text-sm.text-neutral-500');
        var descBlocks = document.querySelectorAll('main section p.leading-relaxed');
        var priceEl = document.getElementById('detail-price');
        var bookBtn = document.querySelector('aside a[href*="form-pemesanan"]');
        var dateInput = document.getElementById('detail-trip-date');
        var peopleSelect = document.getElementById('detail-people');
        var pricePerPerson = Number(pkg.price) || 0;

        function todayIso() {
          var d = new Date();
          var m = String(d.getMonth() + 1).padStart(2, '0');
          var day = String(d.getDate()).padStart(2, '0');
          return d.getFullYear() + '-' + m + '-' + day;
        }

        function updatePrice() {
          if (!priceEl) return;
          var people = 1;
          if (peopleSelect) {
            people = Math.max(1, parseInt(peopleSelect.value, 10) || 1);
          }
          var total = pricePerPerson * people;
          priceEl.textContent = window.jkFormatRp ? window.jkFormatRp(total) : total;
        }

        if (h1) h1.textContent = pkg.title;
        if (meta) meta.textContent = 'Kategori: ' + (pkg.category || '-') + ' • ' + (pkg.durationLabel || '');
        if (descBlocks[0]) descBlocks[0].textContent = pkg.description || pkg.shortDescription || '';
        if (dateInput) dateInput.min = todayIso();
        updatePrice();
        if (peopleSelect) peopleSelect.addEventListener('change', updatePrice);
        if (bookBtn) {
          var buildHref = function () {
            var href =
              './form-pemesanan-paket.html?slug=' +
              encodeURIComponent(pkg.slug) +
              '&packageId=' +
              pkg.id;
            if (dateInput && dateInput.value) {
              href += '&tripDate=' + encodeURIComponent(dateInput.value);
            }
            if (peopleSelect && peopleSelect.value) {
              href += '&people=' + encodeURIComponent(peopleSelect.value);
            }
            return href;
          };
          bookBtn.href = buildHref();
          bookBtn.addEventListener('click', function () {
            bookBtn.href = buildHref();
          });
        }

        document.title = pkg.title + ' - Jalankebromo';

        bindGallery(pkg.images, pkg.mainImageUrl);

        var itineraryUl = document.querySelector('main ul.list-disc');
        if (itineraryUl && pkg.itinerary && pkg.itinerary.length) {
          itineraryUl.innerHTML = pkg.itinerary
            .map(function (item) {
              var line = (item.time_label ? item.time_label + ' - ' : '') + (item.title || item.description || '');
              return '<li>' + escapeHtml(line) + '</li>';
            })
            .join('');
        }

        renderReviews(pkg.reviews || []);
      })
      .catch(function (err) {
        console.error(err);
      });
  }

  document.addEventListener('DOMContentLoaded', loadPackage);
})();
