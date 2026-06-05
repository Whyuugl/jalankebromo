(function () {
  'use strict';

  var allCars = [];

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function initToggle() {
    var toggle = document.getElementById('capacity-toggle');
    var panel = document.getElementById('capacity-panel');
    if (!toggle || !panel) return;

    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      panel.classList.toggle('hidden', expanded);
    });
  }

  function cardHtml(car) {
    var img =
      car.mainImageUrl ||
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80';
    var cap = car.capacityKey || '6';
    var href =
      './form-sewa-mobil.html?mobil=' +
      encodeURIComponent(car.name) +
      '&carId=' +
      car.id +
      '&slug=' +
      encodeURIComponent(car.slug) +
      '&priceDay=' +
      car.pricePerDay +
      '&capacity=' +
      encodeURIComponent(car.capacityLabel || '');

    return (
      '<article class="car-card overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition hover:shadow-md" data-name="' +
      escapeHtml(car.name) +
      '" data-cap="' +
      cap +
      '">' +
      '<img src="' +
      escapeHtml(img) +
      '" alt="" class="aspect-[4/3] w-full object-cover" />' +
      '<div class="p-4">' +
      '<h3 class="font-semibold text-neutral-900">' +
      escapeHtml(car.name) +
      '</h3>' +
      '<p class="mt-1 text-sm text-neutral-500">' +
      escapeHtml(car.capacityLabel) +
      ' · ' +
      escapeHtml(car.transmission) +
      '</p>' +
      '<p class="mt-2 text-lg font-semibold text-emerald-600">' +
      escapeHtml(car.priceFormatted) +
      ' <span class="text-sm font-normal">/hari</span></p>' +
      '<a href="' +
      href +
      '" class="mt-4 flex w-full items-center justify-center rounded-lg bg-brand-orange py-2.5 text-sm font-semibold text-white hover:brightness-95">Book Now</a>' +
      '</div></article>'
    );
  }

  function renderGrid(list) {
    var grid = document.getElementById('car-grid');
    var empty = document.getElementById('car-empty');
    if (!grid) return;

    if (!list.length) {
      grid.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');
    grid.innerHTML = list.map(cardHtml).join('');
  }

  function initFilter() {
    var search = document.getElementById('car-search');
    var searchBtn = document.getElementById('car-search-btn');
    var checks = document.querySelectorAll('.cap-filter');

    function apply() {
      var q = search ? search.value.trim().toLowerCase() : '';
      var selected = [];
      checks.forEach(function (c) {
        if (c.checked) selected.push(c.value);
      });

      var filtered = allCars.filter(function (car) {
        var name = (car.name || '').toLowerCase();
        var okName = !q || name.indexOf(q) !== -1;
        var cap = car.capacityKey || '';
        var okCap = selected.length === 0 || selected.indexOf(cap) !== -1;
        return okName && okCap;
      });

      renderGrid(filtered);
    }

    if (searchBtn) searchBtn.addEventListener('click', apply);
    if (search) {
      search.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') apply();
      });
    }
    checks.forEach(function (c) {
      c.addEventListener('change', apply);
    });
  }

  function loadCars() {
    var grid = document.getElementById('car-grid');
    if (!grid) return;

    grid.innerHTML =
      '<p class="col-span-full py-12 text-center text-sm text-neutral-500">Memuat daftar mobil...</p>';

    window
      .jkFetch('/cars')
      .then(function (data) {
        allCars = data;
        renderGrid(allCars);
      })
      .catch(function (err) {
        grid.innerHTML =
          '<p class="col-span-full py-12 text-center text-sm text-red-600">Gagal memuat mobil. Jalankan server API.<br>' +
          escapeHtml(err.message) +
          '</p>';
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initToggle();
    initFilter();
    loadCars();
  });
})();
