(function () {
  'use strict';

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function qsId() {
    var m = /[?&]id=(\d+)/.exec(window.location.search);
    return m ? m[1] : null;
  }

  function statusBadge(status) {
    var map = {
      pending: 'admin-badge--pending',
      dp_paid: 'admin-badge--paid',
      paid: 'admin-badge--paid',
      completed: 'admin-badge--published',
      cancelled: 'admin-badge--cancelled',
      approved: 'admin-badge--paid',
      rejected: 'admin-badge--cancelled',
    };
    var cls = map[status] || 'admin-badge--draft';
    return '<span class="admin-badge ' + cls + '">' + esc(status) + '</span>';
  }

  function formatDateId(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return '—';
    }
  }

  function actionLinks(editHref, type, id, label) {
    return (
      '<a href="' +
      editHref +
      '" class="text-brand-orange hover:underline">Edit</a> · ' +
      '<button type="button" data-admin-delete-type="' +
      type +
      '" data-admin-delete-id="' +
      id +
      '" data-admin-delete="' +
      esc(label) +
      '" class="text-red-600 hover:underline">Hapus</button>'
    );
  }

  function loadDashboard() {
    if (document.body.getAttribute('data-admin-page') !== 'dashboard') return;

    window.JKAdminApi.fetch('/dashboard')
      .then(function (data) {
        var s = data.stats;
        var cards = document.querySelectorAll('#admin-page-content .grid.gap-4 > div');
        if (cards[0]) cards[0].querySelector('.text-3xl').textContent = s.ordersThisMonth;
        if (cards[1]) cards[1].querySelector('.text-3xl').textContent = s.revenueFormatted;
        if (cards[2]) cards[2].querySelector('.text-3xl').textContent = s.packagesActive;
        if (cards[3]) cards[3].querySelector('.text-3xl').textContent = s.articlesPublished;

        var pendingCountEl = document.getElementById('dash-pending-count');
        var cardCountEl = document.getElementById('dash-reschedule-card-count');
        var n = s.pendingReschedules || 0;
        if (pendingCountEl) pendingCountEl.textContent = n;
        if (cardCountEl) cardCountEl.textContent = n;

        var resTbody = document.getElementById('dash-reschedule-tbody');
        if (resTbody && data.pendingReschedules) {
          if (!data.pendingReschedules.length) {
            resTbody.innerHTML =
              '<tr><td colspan="4" class="px-5 py-6 text-center text-sm text-neutral-500">Tidak ada pengajuan menunggu.</td></tr>';
          } else {
            resTbody.innerHTML = data.pendingReschedules
              .map(function (r) {
                return (
                  '<tr><td class="px-5 py-3 font-medium">' +
                  esc(r.orderCode) +
                  '</td><td class="px-5 py-3">' +
                  esc(r.customerName) +
                  '</td><td class="px-5 py-3">' +
                  esc(formatDateId(r.newTripDate)) +
                  '</td><td class="px-5 py-3 text-right">' +
                  '<button type="button" data-reschedule-approve="' +
                  r.id +
                  '" class="mr-2 text-sm font-medium text-emerald-700 hover:underline">Setujui</button>' +
                  '<button type="button" data-reschedule-reject="' +
                  r.id +
                  '" class="text-sm font-medium text-red-600 hover:underline">Tolak</button>' +
                  '</td></tr>'
                );
              })
              .join('');
          }
        }

        var tbody = document.getElementById('dash-orders-tbody');
        if (tbody && data.recentOrders) {
          tbody.innerHTML = data.recentOrders
            .map(function (o) {
              return (
                '<tr><td class="px-5 py-3 font-medium">' +
                esc(o.order_code) +
                '</td><td class="px-5 py-3">' +
                esc(o.customer_name) +
                '</td><td class="px-5 py-3">' +
                esc(o.product_name) +
                '</td><td class="px-5 py-3">' +
                statusBadge(o.status) +
                '</td></tr>'
              );
            })
            .join('');
        }
      })
      .catch(console.error);
  }

  function handleAuthError(err) {
    if (err && err.status === 401 && window.JKAdminAuth) {
      window.JKAdminAuth.logout();
      return true;
    }
    return false;
  }

  function notify(msg, type) {
    if (window.JKAdminToast) {
      if (type === 'error') window.JKAdminToast.error(msg);
      else if (type === 'info') window.JKAdminToast.info(msg);
      else window.JKAdminToast.success(msg);
    } else {
      alert(msg);
    }
  }

  var ordersCache = [];
  var ordersFiltersBound = false;

  function orderTypeLabel(orderType) {
    return orderType === 'car_rental' ? 'Sewa Mobil' : 'Paket Wisata';
  }

  function renderOrdersRows(rows, tbody) {
    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="px-5 py-8 text-center text-sm text-neutral-500">Tidak ada pesanan yang cocok dengan filter.</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (o) {
        return (
          '<tr><td class="px-5 py-3 font-medium">' +
          esc(o.order_code) +
          '</td><td class="px-5 py-3">' +
          esc(o.booked_at ? new Date(o.booked_at).toLocaleDateString('id-ID') : '') +
          '</td><td class="px-5 py-3">' +
          esc(o.customer_name) +
          '</td><td class="px-5 py-3">' +
          esc(orderTypeLabel(o.order_type)) +
          '</td><td class="px-5 py-3">' +
          esc(window.jkFormatRp(o.subtotal)) +
          '</td><td class="px-5 py-3">' +
          statusBadge(o.status) +
          '</td><td class="px-5 py-3 text-right"><a href="./pesanan-detail.html?id=' +
          o.id +
          '" class="text-brand-orange hover:underline">Detail</a></td></tr>'
        );
      })
      .join('');
  }

  function applyOrdersFilters() {
    var tbody = tableBody();
    if (!tbody) return;

    var statusEl = document.getElementById('orders-filter-status');
    var typeEl = document.getElementById('orders-filter-type');
    var searchEl = document.getElementById('orders-filter-search');
    var status = statusEl ? statusEl.value : '';
    var type = typeEl ? typeEl.value : '';
    var q = searchEl ? searchEl.value.trim().toLowerCase() : '';

    var filtered = ordersCache.filter(function (o) {
      if (status && o.status !== status) return false;
      if (type && o.order_type !== type) return false;
      if (q) {
        var hay = (o.order_code + ' ' + (o.customer_name || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    renderOrdersRows(filtered, tbody);
  }

  function bindOrdersFilters() {
    if (ordersFiltersBound) return;
    var statusEl = document.getElementById('orders-filter-status');
    var typeEl = document.getElementById('orders-filter-type');
    var searchEl = document.getElementById('orders-filter-search');
    if (!statusEl && !typeEl && !searchEl) return;
    ordersFiltersBound = true;
    if (statusEl) statusEl.addEventListener('change', applyOrdersFilters);
    if (typeEl) typeEl.addEventListener('change', applyOrdersFilters);
    if (searchEl) searchEl.addEventListener('input', applyOrdersFilters);
  }

  function loadOrdersTable() {
    var tbody = tableBody();
    if (!tbody || document.body.getAttribute('data-admin-page') !== 'pesanan') return;
    if (qsId()) return;

    tbody.innerHTML =
      '<tr><td colspan="7" class="px-5 py-8 text-center text-sm text-neutral-500">Memuat...</td></tr>';

    window.JKAdminApi.fetch('/orders')
      .then(function (rows) {
        ordersCache = Array.isArray(rows) ? rows : [];
        bindOrdersFilters();
        if (!ordersCache.length) {
          tbody.innerHTML =
            '<tr><td colspan="7" class="px-5 py-8 text-center text-sm text-neutral-500">Belum ada pesanan.</td></tr>';
          return;
        }
        applyOrdersFilters();
      })
      .catch(function (err) {
        if (handleAuthError(err)) return;
        tbody.innerHTML =
          '<tr><td colspan="7" class="px-5 py-8 text-center text-sm text-red-600">Gagal memuat pesanan. Pastikan server API berjalan.</td></tr>';
      });
  }

  function loadOrderDetail() {
    var id = qsId();
    if (!id || !document.querySelector('[data-order-detail]')) return;

    window.JKAdminApi.fetch('/orders/' + id + '/full').then(function (o) {
      document.title = 'Detail Pesanan ' + o.orderCode;
      document.body.setAttribute('data-admin-title', 'Detail Pesanan ' + o.orderCode);

      var set = function (sel, text) {
        var el = document.querySelector(sel);
        if (el) el.textContent = text || '—';
      };

      set('[data-f="customer-name"]', (o.customerFirstName + ' ' + (o.customerLastName || '')).trim());
      set('[data-f="email"]', o.customerEmail);
      set('[data-f="phone"]', o.customerPhone);
      set('[data-f="city"]', o.customerCity);
      set('[data-f="product"]', o.productName);
      set('[data-f="trip-date"]', o.tripDate ? new Date(o.tripDate).toLocaleDateString('id-ID') : '—');
      set(
        '[data-f="participants"]',
        o.participantsCount ? o.participantsCount + ' orang' : o.rentalDays ? o.rentalDays + ' hari' : '—'
      );
      set('[data-f="subtotal"]', o.subtotalFormatted);
      set('[data-f="dp"]', o.dpAmountFormatted);
      set('[data-f="remaining"]', o.remainingFormatted);

      var statusSel = document.getElementById('order-status');
      if (statusSel) statusSel.value = o.status;

      var saveBtn = document.getElementById('save-order-status');
      if (saveBtn) {
        saveBtn.onclick = function () {
          window.JKAdminApi.fetch('/orders/' + id + '/status', {
            method: 'PATCH',
            body: { status: statusSel.value },
          })
            .then(function () {
              notify('Status pesanan berhasil diperbarui.');
            })
            .catch(function (err) {
              notify(err.message || 'Gagal memperbarui status', 'error');
            });
        };
      }
    });
  }

  function tableBody() {
    return (
      document.querySelector('#admin-page-content table tbody') ||
      document.querySelector('main table.admin-table tbody') ||
      document.querySelector('main table tbody')
    );
  }

  function loadPackagesTable() {
    var tbody = tableBody();
    if (!tbody || document.body.getAttribute('data-admin-page') !== 'paket') return;

    tbody.innerHTML =
      '<tr><td colspan="5" class="px-5 py-8 text-center text-sm text-neutral-500">Memuat...</td></tr>';

    window.JKAdminApi.fetch('/packages')
      .then(function (rows) {
      tbody.innerHTML = rows
        .map(function (p) {
          var st =
            p.publishStatus === 'published'
              ? '<span class="admin-badge admin-badge--published">Aktif</span>'
              : '<span class="admin-badge admin-badge--draft" title="Tidak tampil di website">Draft</span>';
          return (
            '<tr><td class="px-5 py-3 font-medium">' +
            esc(p.title) +
            '</td><td class="px-5 py-3">' +
            esc(p.durationLabel) +
            '</td><td class="px-5 py-3 text-emerald-600">' +
            esc(p.priceFormatted) +
            '</td><td class="px-5 py-3">' +
            st +
            '</td><td class="px-5 py-3 text-right">' +
            actionLinks('./paket-form.html?id=' + p.id, 'packages', p.id, p.title) +
            '</td></tr>'
          );
        })
        .join('');
      if (!rows.length) {
        tbody.innerHTML =
          '<tr><td colspan="5" class="px-5 py-8 text-center text-sm text-neutral-500">Belum ada paket. Klik + Tambah Paket.</td></tr>';
      }
    })
      .catch(function () {
        tbody.innerHTML =
          '<tr><td colspan="5" class="px-5 py-8 text-center text-sm text-red-600">Gagal memuat. Login ulang atau refresh halaman.</td></tr>';
      });
  }

  function loadCarsTable() {
    var tbody = tableBody();
    if (!tbody || document.body.getAttribute('data-admin-page') !== 'mobil') return;

    window.JKAdminApi.fetch('/cars').then(function (rows) {
      tbody.innerHTML = rows
        .map(function (c) {
          var st =
            c.publishStatus === 'published'
              ? '<span class="admin-badge admin-badge--published">Tersedia</span>'
              : '<span class="admin-badge admin-badge--draft">Nonaktif</span>';
          return (
            '<tr><td class="px-5 py-3 font-medium">' +
            esc(c.name) +
            '</td><td class="px-5 py-3">' +
            esc(c.capacityLabel) +
            '</td><td class="px-5 py-3 text-emerald-600">' +
            esc(c.priceFormatted) +
            '</td><td class="px-5 py-3">' +
            st +
            '</td><td class="px-5 py-3 text-right">' +
            actionLinks('./mobil-form.html?id=' + c.id, 'cars', c.id, c.name) +
            '</td></tr>'
          );
        })
        .join('');
    });
  }

  function loadArticlesTable() {
    var tbody = tableBody();
    if (!tbody || document.body.getAttribute('data-admin-page') !== 'artikel') return;

    window.JKAdminApi.fetch('/articles').then(function (rows) {
      tbody.innerHTML = rows
        .map(function (a) {
          var st =
            a.publish_status === 'published'
              ? '<span class="admin-badge admin-badge--published">Terbit</span>'
              : '<span class="admin-badge admin-badge--draft">Draft</span>';
          return (
            '<tr><td class="px-5 py-3 font-medium">' +
            esc(a.title) +
            '</td><td class="px-5 py-3">' +
            esc(a.published_at ? new Date(a.published_at).toLocaleDateString('id-ID') : '-') +
            '</td><td class="px-5 py-3">' +
            st +
            '</td><td class="px-5 py-3 text-right"><a href="../artikel-detail.html?slug=' +
            esc(a.slug) +
            '" target="_blank" class="text-neutral-600 hover:underline">Lihat</a> · ' +
            actionLinks('./artikel-form.html?id=' + a.id, 'articles', a.id, a.title) +
            '</td></tr>'
          );
        })
        .join('');
    });
  }

  function processReschedule(id, action) {
    var label = action === 'approve' ? 'Setujui' : 'Tolak';
    if (!confirm(label + ' pengajuan reschedule ini?')) return;

    window.JKAdminApi.fetch('/reschedules/' + id + '/' + action, { method: 'PATCH' })
      .then(function () {
        notify('Pengajuan reschedule berhasil ' + label.toLowerCase() + '.');
        loadReschedulesTable(currentRescheduleFilter);
        loadDashboard();
      })
      .catch(function (err) {
        notify(err.message || 'Gagal memproses', 'error');
      });
  }

  var currentRescheduleFilter = 'pending';

  function loadReschedulesTable(status) {
    var tbody = document.getElementById('reschedule-tbody');
    if (!tbody || document.body.getAttribute('data-admin-page') !== 'reschedule') return;

    currentRescheduleFilter = status || 'pending';
    tbody.innerHTML =
      '<tr><td colspan="7" class="px-5 py-8 text-center text-sm text-neutral-500">Memuat...</td></tr>';

    window.JKAdminApi.fetch('/reschedules?status=' + encodeURIComponent(currentRescheduleFilter))
      .then(function (rows) {
        if (!rows.length) {
          tbody.innerHTML =
            '<tr><td colspan="7" class="px-5 py-8 text-center text-sm text-neutral-500">Tidak ada data.</td></tr>';
          return;
        }

        tbody.innerHTML = rows
          .map(function (r) {
            var dates =
              formatDateId(r.old_trip_date) + ' → ' + formatDateId(r.new_trip_date);
            var actions = '';
            if (r.status === 'pending') {
              actions =
                '<button type="button" data-reschedule-approve="' +
                r.id +
                '" class="mr-2 font-medium text-emerald-700 hover:underline">Setujui</button>' +
                '<button type="button" data-reschedule-reject="' +
                r.id +
                '" class="font-medium text-red-600 hover:underline">Tolak</button>';
            } else {
              actions = '<span class="text-neutral-400">—</span>';
            }
            return (
              '<tr><td class="px-5 py-3 font-medium">' +
              esc(r.order_code) +
              '</td><td class="px-5 py-3">' +
              esc(r.customer_name) +
              '</td><td class="px-5 py-3">' +
              esc(r.product_name || '—') +
              '</td><td class="px-5 py-3">' +
              esc(dates) +
              '</td><td class="px-5 py-3">' +
              esc(formatDateId(r.requested_at)) +
              '</td><td class="px-5 py-3">' +
              statusBadge(r.status) +
              '</td><td class="px-5 py-3 text-right">' +
              actions +
              '</td></tr>'
            );
          })
          .join('');
      })
      .catch(function (err) {
        tbody.innerHTML =
          '<tr><td colspan="7" class="px-5 py-8 text-center text-sm text-red-600">' +
          esc(err.message) +
          '</td></tr>';
      });
  }

  function initRescheduleFilters() {
    document.querySelectorAll('[data-reschedule-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-reschedule-filter]').forEach(function (b) {
          b.classList.remove('bg-brand-orange', 'text-white', 'font-semibold');
          b.classList.add('border', 'font-medium', 'hover:bg-neutral-50');
        });
        btn.classList.add('bg-brand-orange', 'text-white', 'font-semibold');
        btn.classList.remove('border', 'font-medium', 'hover:bg-neutral-50');
        loadReschedulesTable(btn.getAttribute('data-reschedule-filter'));
      });
    });
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!(t instanceof HTMLElement)) return;
    var approve = t.getAttribute('data-reschedule-approve');
    var reject = t.getAttribute('data-reschedule-reject');
    if (approve) processReschedule(approve, 'approve');
    if (reject) processReschedule(reject, 'reject');
  });

  function initAdminPages() {
    if (!window.JKAdminApi) return;
    loadDashboard();
    loadOrdersTable();
    loadOrderDetail();
    loadPackagesTable();
    loadCarsTable();
    loadArticlesTable();
    initRescheduleFilters();
    loadReschedulesTable('pending');
  }

  document.addEventListener('jk-admin-ready', initAdminPages);
  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('admin-page-content') && !document.querySelector('.admin-sidebar-link')) {
      initAdminPages();
    }
  });
})();
