(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var newDateEl = document.getElementById('new-trip-date');
    var orderCodeEl = document.getElementById('order-code');
    var firstNameEl = document.getElementById('first-name');
    var lastNameEl = document.getElementById('last-name');
    var oldTripDateEl = document.getElementById('old-trip-date');
    var subtotalEl = document.getElementById('order-subtotal');
    var productEl = document.getElementById('order-product');
    var metaEl = document.getElementById('order-meta');
    var btn = document.getElementById('reschedule-submit');
    if (!btn || !newDateEl) return;

    var currentTripDateIso = null;

    function todayIso() {
      var d = new Date();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      return d.getFullYear() + '-' + m + '-' + day;
    }

    function applyMinDate() {
      var min = todayIso();
      if (currentTripDateIso && currentTripDateIso > min) {
        min = currentTripDateIso;
      }
      newDateEl.min = min;
    }

    var qs = new URLSearchParams(window.location.search);
    var codeFromUrl = (qs.get('code') || '').trim();
    var nameFromUrl = (qs.get('name') || '').trim();
    if (orderCodeEl && codeFromUrl) orderCodeEl.value = codeFromUrl;
    if (nameFromUrl && firstNameEl && !firstNameEl.value) {
      var parts = nameFromUrl.split(' ');
      firstNameEl.value = parts.shift() || '';
      if (lastNameEl) lastNameEl.value = parts.join(' ');
    }

    function setOldDate(text) {
      if (oldTripDateEl) oldTripDateEl.textContent = text || '-';
    }

    function clearOrderPanel() {
      setOldDate('-');
      if (subtotalEl) subtotalEl.textContent = '—';
      if (productEl) productEl.textContent = '—';
      if (metaEl) metaEl.textContent = 'Isi kode pesanan untuk memuat detail';
      currentTripDateIso = null;
      applyMinDate();
    }

    function renderOrder(row) {
      if (row.trip_date) {
        currentTripDateIso = String(row.trip_date).slice(0, 10);
      } else {
        currentTripDateIso = null;
      }
      var d = row.trip_date ? new Date(row.trip_date) : null;
      setOldDate(d && !isNaN(d) ? d.toLocaleDateString('id-ID') : '-');
      if (productEl) {
        productEl.textContent = (row.order_code || '') + ' — ' + (row.product_name || 'Pesanan');
      }
      if (subtotalEl) {
        subtotalEl.textContent =
          row.subtotalFormatted || (window.jkFormatRp ? window.jkFormatRp(row.subtotal) : row.subtotal);
      }
      if (metaEl) {
        var parts = [];
        if (row.participants_count) parts.push(row.participants_count + ' orang');
        if (row.rental_days) parts.push(row.rental_days + ' hari');
        if (row.status) parts.push('Status: ' + row.status);
        if (row.pendingReschedule && row.pendingReschedule.newTripDate) {
          parts.push(
            'Pengajuan reschedule menunggu admin → ' +
              new Date(row.pendingReschedule.newTripDate + 'T12:00:00').toLocaleDateString('id-ID')
          );
        }
        metaEl.textContent = parts.length ? parts.join(' · ') : 'Detail pesanan';
      }
      applyMinDate();
    }

    function loadOrderSummary() {
      var code = orderCodeEl ? orderCodeEl.value.trim() : '';
      var first = firstNameEl ? firstNameEl.value.trim() : '';
      var last = lastNameEl ? lastNameEl.value.trim() : '';
      var customerName = (first + ' ' + last).trim();

      if (!code && !customerName) {
        clearOrderPanel();
        return;
      }

      var path = code
        ? '/orders/lookup?code=' + encodeURIComponent(code)
        : '/orders/lookup?nama=' + encodeURIComponent(customerName);

      window
        .jkFetch(path)
        .then(function (rows) {
          if (!rows.length) {
            clearOrderPanel();
            if (metaEl) metaEl.textContent = 'Pesanan tidak ditemukan';
            return;
          }
          renderOrder(rows[0]);
        })
        .catch(function () {
          clearOrderPanel();
          if (metaEl) metaEl.textContent = 'Gagal memuat data pesanan';
        });
    }

    applyMinDate();
    loadOrderSummary();
    if (orderCodeEl) orderCodeEl.addEventListener('blur', loadOrderSummary);
    if (firstNameEl) firstNameEl.addEventListener('blur', loadOrderSummary);
    if (lastNameEl) lastNameEl.addEventListener('blur', loadOrderSummary);

    btn.addEventListener('click', function () {
      var first = firstNameEl ? firstNameEl.value.trim() : '';
      var last = lastNameEl ? lastNameEl.value.trim() : '';
      var customerName = (first + ' ' + last).trim();
      var newDate = newDateEl.value;

      if (!newDate) {
        alert('Pilih tanggal reschedule.');
        return;
      }
      if (!orderCodeEl.value.trim() && !customerName) {
        alert('Isi kode pesanan atau nama pemesan.');
        return;
      }
      if (newDate < todayIso()) {
        alert('Tanggal baru tidak boleh di masa lalu.');
        return;
      }
      if (currentTripDateIso && newDate < currentTripDateIso) {
        alert(
          'Tanggal baru tidak boleh sebelum tanggal trip saat ini (' +
            new Date(currentTripDateIso + 'T12:00:00').toLocaleDateString('id-ID') +
            ').'
        );
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Memproses...';

      window
        .jkFetch('/reschedule', {
          method: 'POST',
          body: {
            orderCode: orderCodeEl ? orderCodeEl.value.trim() : '',
            customerName: customerName,
            newTripDate: newDate,
            reason: document.querySelector('main textarea')
              ? document.querySelector('main textarea').value.trim()
              : '',
          },
        })
        .then(function (res) {
          alert(
            (res && res.message) ||
              'Pengajuan reschedule terkirim. Tanggal trip akan berubah setelah disetujui admin.'
          );
          window.location.href = './cek-pesanan.html';
        })
        .catch(function (err) {
          alert(err.message || 'Gagal mengajukan reschedule');
          btn.disabled = false;
          btn.textContent = 'Ajukan Reschedule';
        });
    });
  });
})();
