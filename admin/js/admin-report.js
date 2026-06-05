(function () {
  'use strict';

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function pctText(pct) {
    if (pct === null || pct === undefined || Number.isNaN(Number(pct))) return '—';
    var v = Number(pct);
    var sign = v > 0 ? '+' : '';
    return sign + v.toFixed(2) + '%';
  }

  function monthKey(d) {
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    return yyyy + '-' + mm;
  }

  function setText(id, v) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = v == null ? '—' : String(v);
  }

  function setTextRp(id, amount) {
    var el = document.getElementById(id);
    if (!el) return;
    if (window.jkFormatRp) el.textContent = window.jkFormatRp(amount);
    else el.textContent = String(amount);
  }

  document.addEventListener('jk-admin-ready', function () {
    if (document.body.getAttribute('data-admin-page') !== 'laporan') return;
    if (!window.JKAdminApi) return;

    var monthInput = document.getElementById('report-month');
    var refreshBtn = document.getElementById('report-refresh');
    if (!monthInput || !refreshBtn) return;

    var now = new Date();
    monthInput.value = monthKey(now);

    function load() {
      var m = monthInput.value;
      if (!m) return;

      refreshBtn.disabled = true;
      refreshBtn.textContent = 'Memuat...';

      window.JKAdminApi.fetch('/report?month=' + encodeURIComponent(m))
        .then(function (data) {
          setText('rep-visits-current', data.current.visits);
          setText('rep-visits-pct', pctText(data.growth.visitsPct));

          setText('rep-orders-current', data.current.ordersCount);
          setText('rep-orders-pct', pctText(data.growth.ordersPct));

          setTextRp('rep-revenue-current', data.current.revenuePaid);
          setText('rep-revenue-pct', pctText(data.growth.revenuePct));

          setText(
            'rep-pending-reschedule-current',
            data.current.pendingRescheduleRequests
          );

          var tbody = document.getElementById('rep-trend-tbody');
          if (!tbody) return;

          if (!data.trend || !data.trend.length) {
            tbody.innerHTML =
              '<tr><td colspan="4" class="px-5 py-8 text-center text-sm text-neutral-500">Belum ada data.</td></tr>';
            return;
          }

          tbody.innerHTML = data.trend
            .map(function (t) {
              return (
                '<tr>' +
                '<td class="px-5 py-3 font-medium">' +
                escapeHtml(t.label) +
                '</td>' +
                '<td class="px-5 py-3">' +
                escapeHtml(t.visits) +
                '</td>' +
                '<td class="px-5 py-3">' +
                escapeHtml(t.ordersCount) +
                '</td>' +
                '<td class="px-5 py-3 text-emerald-700">' +
                escapeHtml(window.jkFormatRp ? window.jkFormatRp(t.revenuePaid) : t.revenuePaid) +
                '</td>' +
                '</tr>'
              );
            })
            .join('');
        })
        .catch(function (err) {
          if (window.JKAdminToast) window.JKAdminToast.error(err.message || 'Gagal memuat laporan');
          else alert(err.message || 'Gagal memuat laporan');
        })
        .finally(function () {
          refreshBtn.disabled = false;
          refreshBtn.textContent = 'Muat laporan';
        });
    }

    refreshBtn.addEventListener('click', load);
    monthInput.addEventListener('change', load);

    load();
  });
})();

