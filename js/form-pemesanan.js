(function () {
  'use strict';

  function formatRp(n) {
    return window.jkFormatRp(n);
  }

  function qs(name) {
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch (e) {
      return null;
    }
  }

  function sameId(a, b) {
    return Number(a) === Number(b);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var isCar = /form-sewa-mobil/i.test(window.location.pathname);
    var packageId = qs('packageId');
    var carId = qs('carId');
    var slug = qs('slug');
    var carSlug = isCar ? slug : null;
    var tripDateParam = qs('tripDate');
    var peopleParam = qs('people');
    var daysParam = qs('days');
    var priceDayParam = qs('priceDay');
    var capacityParam = qs('capacity');

    var daysEl = document.getElementById('days');
    var peopleEl = document.getElementById('people');
    var peopleWrap = document.getElementById('people-wrap');
    var subtotalEl = document.getElementById('subtotal');
    var payFull = document.getElementById('pay-full');
    var payDp = document.getElementById('pay-dp');
    var tripDateEl = document.getElementById('trip-date');
    var confirmBtn = document.getElementById('confirm-booking');
    var productTitleEl = document.getElementById('product-title');
    var mobilSummary = document.getElementById('mobil-summary');
    var carCapacityEl = document.getElementById('car-capacity');
    var pricePerDayEl = document.getElementById('price-per-day');
    var priceFormulaEl = document.getElementById('price-formula');

    var state = {
      orderType: isCar ? 'car_rental' : 'package',
      packageId: packageId ? parseInt(packageId, 10) : null,
      carId: carId ? parseInt(carId, 10) : null,
      pricePerUnit: isCar ? Number(priceDayParam) || 0 : 780000,
      isCar: isCar,
      durationDays: null,
      capacityLabel: capacityParam ? decodeURIComponent(capacityParam) : '',
      carName: qs('mobil') ? decodeURIComponent(qs('mobil')) : '',
    };

    function todayIso() {
      var d = new Date();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      return d.getFullYear() + '-' + m + '-' + day;
    }

    if (tripDateEl) tripDateEl.min = todayIso();
    if (tripDateParam && tripDateEl) tripDateEl.value = tripDateParam;
    if (peopleParam && peopleEl) peopleEl.value = String(Math.max(1, parseInt(peopleParam, 10) || 1));
    if (daysParam && daysEl) daysEl.value = String(Math.max(1, parseInt(daysParam, 10) || 1));

    if (isCar) {
      if (peopleWrap) peopleWrap.classList.add('hidden');
      if (peopleEl) peopleEl.disabled = true;
      if (carCapacityEl && state.capacityLabel) carCapacityEl.textContent = state.capacityLabel;
      if (mobilSummary && state.carName) {
        mobilSummary.textContent = state.carName;
        mobilSummary.classList.remove('hidden');
      }
      if (productTitleEl && state.carName) {
        productTitleEl.textContent = state.carName + (state.capacityLabel ? ' · ' + state.capacityLabel : '');
        productTitleEl.classList.remove('hidden');
      }
    }

    function updateCarPriceDisplay() {
      if (!isCar) return;
      if (pricePerDayEl) pricePerDayEl.textContent = formatRp(state.pricePerUnit);
      if (carCapacityEl && state.capacityLabel) carCapacityEl.textContent = state.capacityLabel;
    }

    function calc() {
      var days = Math.max(1, parseInt(daysEl && daysEl.value, 10) || 1);
      var people = Math.max(1, parseInt(peopleEl && peopleEl.value, 10) || 1);
      var total;
      if (state.isCar) {
        total = days * state.pricePerUnit;
        if (priceFormulaEl && state.pricePerUnit) {
          priceFormulaEl.textContent =
            formatRp(state.pricePerUnit) + ' × ' + days + ' hari';
        }
      } else {
        total = people * state.pricePerUnit;
        if (priceFormulaEl) priceFormulaEl.textContent = '';
      }
      if (payDp && payDp.checked) total = Math.round(total * 0.3);
      if (subtotalEl) subtotalEl.textContent = formatRp(total);
      return total;
    }

    function applyCar(car) {
      if (!car) return;
      state.carId = Number(car.id);
      state.pricePerUnit = Number(car.pricePerDay);
      state.capacityLabel = car.capacityLabel || state.capacityLabel;
      state.carName = car.name || state.carName;
      if (mobilSummary) {
        mobilSummary.textContent = car.name;
        mobilSummary.classList.remove('hidden');
      }
      if (productTitleEl) {
        productTitleEl.textContent =
          car.name + (car.capacityLabel ? ' · Kapasitas ' + car.capacityLabel : '');
        productTitleEl.classList.remove('hidden');
      }
      updateCarPriceDisplay();
      calc();
    }

    function loadProduct() {
      if (state.isCar) {
        var carPath = carSlug ? '/cars/' + encodeURIComponent(carSlug) : null;
        var loadList = function () {
          window.jkFetch('/cars').then(function (list) {
            var car = list.find(function (c) {
              return sameId(c.id, state.carId) || (carSlug && c.slug === carSlug);
            });
            if (car) applyCar(car);
            else calc();
          });
        };
        if (carPath) {
          window
            .jkFetch(carPath)
            .then(function (car) {
              applyCar(car);
            })
            .catch(loadList);
        } else if (state.carId) {
          loadList();
        } else {
          calc();
        }
        return;
      }

      if (!state.isCar && slug) {
        window.jkFetch('/packages/' + encodeURIComponent(slug)).then(function (pkg) {
          state.packageId = pkg.id;
          state.pricePerUnit = pkg.price;
          state.durationDays = pkg.durationDays || null;
          if (productTitleEl) productTitleEl.textContent = pkg.title;
          if (daysEl && state.durationDays) {
            daysEl.value = String(state.durationDays);
            daysEl.readOnly = true;
          }
          calc();
        });
      } else if (state.packageId) {
        window.jkFetch('/packages').then(function (list) {
          var pkg = list.find(function (p) {
            return sameId(p.id, state.packageId);
          });
          if (pkg) {
            state.pricePerUnit = pkg.price;
            state.durationDays = pkg.durationDays || null;
            if (productTitleEl) productTitleEl.textContent = pkg.title;
            if (daysEl && state.durationDays) {
              daysEl.value = String(state.durationDays);
              daysEl.readOnly = true;
            }
          }
          calc();
        });
      } else {
        calc();
      }
    }

    ['input', 'change'].forEach(function (evt) {
      if (daysEl) daysEl.addEventListener(evt, calc);
      if (peopleEl && !isCar) peopleEl.addEventListener(evt, calc);
      if (payFull) payFull.addEventListener(evt, calc);
      if (payDp) payDp.addEventListener(evt, calc);
    });

    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        var inputs = document.querySelectorAll('main section input');
        var first = inputs[0] ? inputs[0].value.trim() : '';
        var last = inputs[1] ? inputs[1].value.trim() : '';
        var email = inputs[2] ? inputs[2].value.trim() : '';
        var city = inputs[3] ? inputs[3].value.trim() : '';
        var phone = inputs[4] ? inputs[4].value.trim() : '';
        var notes = document.querySelector('main textarea')
          ? document.querySelector('main textarea').value.trim()
          : '';

        if (!first || !phone) {
          alert('Nama depan dan no telepon wajib diisi.');
          return;
        }
        if (tripDateEl && !tripDateEl.value) {
          alert('Tanggal sewa/trip wajib dipilih.');
          return;
        }
        if (state.orderType === 'package' && !state.packageId) {
          alert('Paket tidak valid. Buka dari halaman paket wisata.');
          return;
        }
        if (state.orderType === 'car_rental' && !state.carId) {
          alert('Mobil tidak valid. Buka dari halaman sewa mobil.');
          return;
        }
        if (state.isCar && !state.pricePerUnit) {
          alert('Harga mobil belum termuat. Refresh halaman atau pilih mobil lagi dari daftar.');
          return;
        }

        var days = Math.max(1, parseInt(daysEl && daysEl.value, 10) || 1);
        var people = Math.max(1, parseInt(peopleEl && peopleEl.value, 10) || 1);
        var rawTotal = state.isCar ? days * state.pricePerUnit : people * state.pricePerUnit;
        var payFullSelected = payFull && payFull.checked;
        var payAmount = payFullSelected ? rawTotal : Math.round(rawTotal * 0.3);
        var customerLabel = (first + (last ? ' ' + last : '')).trim();

        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Memproses...';

        window
          .jkFetch('/orders', {
            method: 'POST',
            body: {
              orderType: state.orderType,
              packageId: state.packageId,
              carId: state.carId,
              firstName: first,
              lastName: last,
              email: email,
              phone: phone,
              city: city,
              tripDate: tripDateEl ? tripDateEl.value : null,
              participants: state.isCar ? null : people,
              rentalDays: state.isCar ? days : null,
              subtotal: rawTotal,
              dpPercent: 30,
              payFull: payFullSelected,
              notes: notes,
            },
          })
          .then(function (result) {
            var params = new URLSearchParams({
              code: result.orderCode,
              name: customerLabel,
              amount: String(payAmount),
              pay: payFullSelected ? 'full' : 'dp',
            });
            window.location.href = './booking-success.html?' + params.toString();
          })
          .catch(function (err) {
            alert(err.message || 'Gagal menyimpan pesanan');
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Booking';
          });
      });
    }

    if (isCar && state.pricePerUnit) updateCarPriceDisplay();
    loadProduct();
    calc();
  });
})();
