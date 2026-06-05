(function () {
  'use strict';

  function waDigits(phone) {
    var d = String(phone || '').replace(/\D/g, '');
    if (d.startsWith('0')) d = '62' + d.slice(1);
    if (!d.startsWith('62')) d = '62' + d;
    return d;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var qs = new URLSearchParams(window.location.search);
    var code = (qs.get('code') || '').trim();
    var name = (qs.get('name') || '').trim();
    var amount = qs.get('amount') || '';
    var pay = qs.get('pay') || 'dp';

    var codeEl = document.getElementById('order-code');
    var summaryEl = document.getElementById('payment-summary');
    var waBtn = document.getElementById('wa-pay-btn');

    if (codeEl && code) codeEl.textContent = code;

    var amountNum = Number(amount) || 0;
    var amountText = window.jkFormatRp ? window.jkFormatRp(amountNum) : amount;
    var payLabel = pay === 'full' ? 'Pelunasan penuh' : 'DP (30%)';

    if (summaryEl) {
      summaryEl.textContent = payLabel + ': ' + amountText;
    }

    var defaultWa = '6281323445911';
    var msgLines = [
      'Halo Jalankebromo, saya ingin konfirmasi pembayaran pesanan:',
      '',
      'Kode: ' + (code || '-'),
      'Nama: ' + (name || '-'),
      'Jenis bayar: ' + payLabel,
      'Nominal: ' + amountText,
      '',
      'Mohon info rekening / cara bayar. Terima kasih.',
    ];

    function setWaLink(phone) {
      if (!waBtn) return;
      var url =
        'https://wa.me/' +
        waDigits(phone) +
        '?text=' +
        encodeURIComponent(msgLines.join('\n'));
      waBtn.href = url;
    }

    setWaLink(defaultWa);

    if (window.jkFetch) {
      window
        .jkFetch('/contact')
        .then(function (c) {
          if (c && c.whatsapp) setWaLink(c.whatsapp);
        })
        .catch(function () {
          /* pakai default */
        });
    }
  });
})();
