(function () {
  'use strict';

  /** Carousel Review Pelanggan */
  function initReviewCarousel() {
    var track = document.getElementById('review-track');
    var dotsWrap = document.getElementById('review-dots');
    if (!track || !dotsWrap) return;

    var slides = track.querySelectorAll('[data-review-slide]');
    var total = slides.length;
    if (total === 0) return;

    var dots = [];
    for (var i = 0; i < total; i++) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'h-2.5 w-2.5 rounded-full bg-neutral-300 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2';
      btn.setAttribute('aria-label', 'Slide ulasan ' + (i + 1));
      btn.addEventListener('click', function (index) {
        return function () {
          goTo(index);
        };
      }(i));
      dotsWrap.appendChild(btn);
      dots.push(btn);
    }

    var current = 0;

    function goTo(index) {
      current = ((index % total) + total) % total;
      var pct = total ? (current * 100) / total : 0;
      track.style.transform = 'translateX(-' + pct + '%)';
      dots.forEach(function (d, j) {
        if (j === current) {
          d.classList.remove('bg-neutral-300');
          d.classList.add('bg-brand-orange');
          d.setAttribute('aria-current', 'true');
        } else {
          d.classList.add('bg-neutral-300');
          d.classList.remove('bg-brand-orange');
          d.removeAttribute('aria-current');
        }
      });
    }

    goTo(0);

    var autoplay = setInterval(function () {
      goTo(current + 1);
    }, 5500);

    var viewport = track.parentElement;
    if (viewport) {
      viewport.addEventListener('mouseenter', function () {
        clearInterval(autoplay);
      });
      viewport.addEventListener('mouseleave', function () {
        autoplay = setInterval(function () {
          goTo(current + 1);
        }, 5500);
      });
    }
  }

  function inferDuration(title) {
    var t = (title || '').toLowerCase();
    if (t.indexOf('3d2n') !== -1 || t.indexOf('semeru') !== -1) return '3 Days';
    if (t.indexOf('ijen') !== -1 || t.indexOf('sewu') !== -1) return '2 Days';
    if (t.indexOf('14') !== -1) return '14 Days';
    return '1 Day';
  }

  function normalizePackageCards() {
    var cards = document.querySelectorAll('#paket-bromo-malang article, #paket-wisata article');
    if (!cards.length) return;

    cards.forEach(function (card) {
      var titleEl = card.querySelector('h3');
      if (!titleEl) return;

      var duration = card.querySelector('.pkg-duration');
      if (!duration) {
        duration = document.createElement('p');
        duration.className = 'pkg-duration mt-1 text-sm text-neutral-500';
        duration.textContent = inferDuration(titleEl.textContent);
        titleEl.insertAdjacentElement('afterend', duration);
      }

      var price = card.querySelector('p.text-lg.font-semibold.text-emerald-600');
      if (!price) return;
      var suffix = price.querySelector('span');
      if (!suffix) return;

      suffix.className = 'text-sm font-normal text-emerald-600';
      suffix.textContent = ' /person';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    normalizePackageCards();
    initReviewCarousel();
  });
})();
