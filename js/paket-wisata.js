(function () {
  'use strict';

  var allPackages = [];

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function initDurationToggle() {
    var toggle = document.getElementById('duration-toggle');
    var panel = document.getElementById('duration-panel');
    if (!toggle || !panel) return;

    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      panel.classList.toggle('hidden', expanded);
    });
  }

  function cardHtml(pkg) {
    var img =
      pkg.mainImageUrl ||
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80';
    var days = pkg.durationDays || 0;
    var href = './detail-paket.html?slug=' + encodeURIComponent(pkg.slug);
    return (
      '<article class="paket-card overflow-hidden rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm transition hover:shadow-md" data-duration="' +
      days +
      '" data-title="' +
      escapeHtml(pkg.title) +
      '"><a href="' +
      href +
      '" class="block"><img src="' +
      escapeHtml(img) +
      '" alt="" class="aspect-[4/3] w-full rounded-xl object-cover" /><div class="px-1 pb-1 pt-2"><p class="text-sm text-neutral-500">● ' +
      escapeHtml(pkg.category || 'Wisata') +
      '</p><h3 class="mt-1 font-semibold text-neutral-900">' +
      escapeHtml(pkg.title) +
      '</h3><p class="mt-1 text-sm text-neutral-500">' +
      escapeHtml(pkg.durationLabel || (days ? days + ' Hari' : '')) +
      '</p><p class="mt-3 text-lg font-semibold text-emerald-600">' +
      escapeHtml(pkg.priceFormatted) +
      ' <span class="text-sm font-normal text-emerald-600">/person</span></p></div></a></article>'
    );
  }

  function updateCount(shown, total) {
    var el = document.getElementById('paket-count');
    if (!el) return;
    if (total === 0) {
      el.classList.add('hidden');
      return;
    }
    el.classList.remove('hidden');
    if (shown === total) {
      el.textContent = 'Menampilkan ' + total + ' paket';
    } else {
      el.textContent = 'Menampilkan ' + shown + ' dari ' + total + ' paket (filter aktif)';
    }
  }

  function renderGrid(list) {
    var grid = document.getElementById('paket-grid');
    var emptyState = document.getElementById('empty-state');
    if (!grid) return;

    if (!list.length) {
      grid.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      updateCount(0, allPackages.length);
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    grid.innerHTML = list.map(cardHtml).join('');
    updateCount(list.length, allPackages.length);
  }

  function resetFilters() {
    var checkboxes = document.querySelectorAll('.duration-filter');
    var searchInput = document.getElementById('search-input');
    checkboxes.forEach(function (box) {
      box.checked = false;
    });
    if (searchInput) searchInput.value = '';
    renderGrid(allPackages);
  }

  function initFilter() {
    var checkboxes = document.querySelectorAll('.duration-filter');
    var searchInput = document.getElementById('search-input');
    var searchButton = document.getElementById('search-button');
    var resetBtn = document.getElementById('reset-filters');

    function applyFilter() {
      var keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
      var selectedDurations = [];
      checkboxes.forEach(function (box) {
        if (box.checked) selectedDurations.push(box.value);
      });

      var filtered = allPackages.filter(function (pkg) {
        var title = (pkg.title || '').toLowerCase();
        var matchesKeyword = !keyword || title.indexOf(keyword) !== -1;
        var days = pkg.durationDays;
        var matchesDuration =
          selectedDurations.length === 0 ||
          !days ||
          selectedDurations.indexOf(String(days)) !== -1;
        return matchesKeyword && matchesDuration;
      });

      renderGrid(filtered);
    }

    if (searchButton) searchButton.addEventListener('click', applyFilter);
    if (searchInput) {
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') applyFilter();
      });
    }
    checkboxes.forEach(function (box) {
      box.addEventListener('change', applyFilter);
    });
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
  }

  function loadPackages() {
    var grid = document.getElementById('paket-grid');
    if (!grid) return;

    grid.innerHTML =
      '<p class="col-span-full py-12 text-center text-sm text-neutral-500">Memuat paket wisata...</p>';

    window
      .jkFetch('/packages')
      .then(function (data) {
        allPackages = data;
        renderGrid(allPackages);
      })
      .catch(function (err) {
        grid.innerHTML =
          '<p class="col-span-full py-12 text-center text-sm text-red-600">Gagal memuat data. Buka lewat <strong>http://localhost:3000/paket-wisata.html</strong> dan pastikan backend jalan.<br><span class="text-neutral-500">' +
          escapeHtml(err.message) +
          '</span></p>';
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initDurationToggle();
    initFilter();
    loadPackages();
  });
})();
