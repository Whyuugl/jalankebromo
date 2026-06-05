(function () {
  'use strict';

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var input =
      document.getElementById('order-search-input') ||
      document.querySelector('main input[type="text"], main input:not([type])');
    var btn = document.getElementById('order-search-btn') || document.querySelector('main button');
    var box = document.querySelector('main .max-w-3xl');

    if (!input || !btn || !box) return;

    var resultEl = document.getElementById('cek-pesanan-result');
    if (!resultEl) {
      resultEl = document.createElement('div');
      resultEl.id = 'cek-pesanan-result';
      resultEl.className = 'mt-6 space-y-3';
      box.appendChild(resultEl);
    }
    resultEl = document.getElementById('cek-pesanan-result');
    if (resultEl.tagName !== 'DIV') {
      var d = document.createElement('div');
      d.id = 'cek-pesanan-result';
      d.className = 'mt-6 space-y-3';
      resultEl.replaceWith(d);
      resultEl = d;
    }

    function doSearch() {
      var keyword = input.value.trim();
      if (!keyword) return;

      resultEl.innerHTML = '<p class="text-sm text-neutral-500">Mencari...</p>';
      var looksLikeOrderCode = /^JK-\d{4}-\d+/i.test(keyword);
      var query = looksLikeOrderCode
        ? '/orders/lookup?code=' + encodeURIComponent(keyword.toUpperCase())
        : '/orders/lookup?nama=' + encodeURIComponent(keyword);

      window
        .jkFetch(query)
        .then(function (rows) {
          if (!rows.length) {
            resultEl.innerHTML =
              '<p class="text-sm text-neutral-600">Pesanan tidak ditemukan. Cek lagi nama atau kode pesanan.</p>';
            return;
          }
          resultEl.innerHTML = rows
            .map(function (o) {
              return (
                '<div class="rounded-lg border border-neutral-200 p-4 text-sm">' +
                '<p class="font-semibold">' +
                escapeHtml(o.order_code) +
                ' — ' +
                escapeHtml(o.product_name) +
                '</p>' +
                '<p class="mt-1 text-neutral-600">Status: ' +
                escapeHtml(o.status) +
                ' · ' +
                escapeHtml(o.customer_name) +
                '</p>' +
                '<p class="mt-1 text-emerald-600">' +
                escapeHtml(window.jkFormatRp(o.subtotal)) +
                '</p>' +
                (o.pendingReschedule
                  ? '<p class="mt-2 text-xs font-medium text-amber-700">Reschedule menunggu persetujuan admin → ' +
                    escapeHtml(String(o.pendingReschedule.newTripDate).slice(0, 10)) +
                    '</p>'
                  : '') +
                '<a class="mt-2 inline-block text-xs text-brand-orange hover:underline" href="./reschedule.html?code=' +
                encodeURIComponent(o.order_code) +
                '&name=' +
                encodeURIComponent(o.customer_name || '') +
                '">Ajukan reschedule</a>' +
                '</div>'
              );
            })
            .join('');
        })
        .catch(function (err) {
          resultEl.innerHTML =
            '<p class="text-sm text-red-600">' + escapeHtml(err.message || 'Gagal mencari') + '</p>';
        });
    }

    btn.addEventListener('click', doSearch);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doSearch();
    });
  });
})();
