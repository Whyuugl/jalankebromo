(function () {
  'use strict';

  function qsId() {
    var m = /[?&]id=(\d+)/.exec(window.location.search);
    return m ? m[1] : null;
  }

  function field(form, name) {
    return form.querySelector('[name="' + name + '"]');
  }

  function val(form, name) {
    var el = field(form, name);
    return el ? el.value.trim() : '';
  }

  function setVal(form, name, v) {
    var el = field(form, name);
    if (el) el.value = v == null ? '' : v;
  }

  function publishFromSelect(form, name) {
    var v = val(form, name).toLowerCase();
    if (['aktif', 'terbit', 'tersedia', 'published'].indexOf(v) >= 0) return 'published';
    return 'draft';
  }

  function loadPackage(form, id) {
    window.JKAdminApi.fetch('/packages/' + id).then(function (p) {
      setVal(form, 'title', p.title);
      setVal(form, 'duration_label', p.duration_label);
      setVal(form, 'price', p.price);
      setVal(form, 'category', p.category);
      setVal(form, 'short_description', p.short_description);
      setVal(form, 'main_image_url', p.main_image_url);
      setVal(
        form,
        'publish_status',
        p.publish_status === 'published' ? 'Aktif' : 'Draft'
      );
      if (p.itinerary && p.itinerary.length) {
        setVal(
          form,
          'itinerary',
          p.itinerary.map(function (i) {
            return i.description;
          }).join('\n')
        );
      }
    });
  }

  function loadCar(form, id) {
    window.JKAdminApi.fetch('/cars/' + id).then(function (c) {
      setVal(form, 'name', c.name);
      setVal(form, 'capacity_label', c.capacity_label);
      setVal(form, 'price_per_day', c.price_per_day);
      setVal(form, 'transmission', c.transmission || 'Manual');
      setVal(form, 'main_image_url', c.main_image_url);
      setVal(
        form,
        'publish_status',
        c.publish_status === 'published' ? 'Tersedia' : 'Nonaktif'
      );
    });
  }

  function loadArticle(form, id) {
    window.JKAdminApi.fetch('/articles/' + id).then(function (a) {
      setVal(form, 'title', a.title);
      setVal(form, 'cover_image_url', a.cover_image_url || '');
      setVal(form, 'tags', a.tagNames || '');
      setVal(
        form,
        'publish_status',
        a.publish_status === 'published' ? 'Terbit' : 'Draft'
      );
      if (a.published_at) {
        setVal(form, 'published_at', String(a.published_at).slice(0, 10));
      }
      if (window.JKArticleEditor) {
        window.JKArticleEditor.setFromRawContent(a.content || '');
      } else {
        setVal(form, 'content', a.content);
      }
    });
  }

  function loadSettings(form) {
    window.JKAdminApi.fetch('/settings').then(function (rows) {
      var map = {};
      rows.forEach(function (r) {
        map[r.key] = r.value;
      });
      setVal(form, 'brand_name', map.brand_name);
      setVal(form, 'footer_description', map.footer_description);
      setVal(form, 'contact_whatsapp', map.contact_whatsapp);
      setVal(form, 'contact_phone', map.contact_phone);
      setVal(form, 'contact_email', map.contact_email);
      setVal(form, 'instagram_url', map.instagram_url);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.JKAdminApi) return;

    var form = document.querySelector('[data-admin-entity]');
    if (!form) return;

    var entity = form.getAttribute('data-admin-entity');
    var id = qsId();
    var back = form.getAttribute('data-admin-form-back');

    if (entity === 'package' && id) loadPackage(form, id);
    if (entity === 'car' && id) loadCar(form, id);
    if (entity === 'article') {
      if (window.JKArticleEditor) {
        window.JKArticleEditor.init(form);
        if (id) {
          loadArticle(form, id);
        } else {
          window.JKArticleEditor.setFromRawContent(
            '{"version":1,"blocks":[{"type":"paragraph","text":""}]}'
          );
        }
      } else if (id) {
        loadArticle(form, id);
      }
    }
    if (entity === 'settings') loadSettings(form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Menyimpan...';
      }

      var done = function (msg) {
        if (window.JKAdminToast) window.JKAdminToast.success(msg || 'Data berhasil disimpan.');
        else alert(msg || 'Data berhasil disimpan.');
        if (back) window.location.href = back;
      };
      var fail = function (err) {
        if (window.JKAdminToast) window.JKAdminToast.error(err.message || 'Gagal menyimpan');
        else alert(err.message || 'Gagal menyimpan');
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Simpan';
        }
      };

      if (entity === 'package') {
        var body = {
          title: val(form, 'title'),
          durationLabel: val(form, 'duration_label'),
          price: Number(val(form, 'price')),
          category: val(form, 'category'),
          shortDescription: val(form, 'short_description'),
          itinerary: val(form, 'itinerary'),
          mainImageUrl: val(form, 'main_image_url'),
          publishStatus: publishFromSelect(form, 'publish_status'),
        };
        var req = id
          ? window.JKAdminApi.fetch('/packages/' + id, { method: 'PUT', body: body })
          : window.JKAdminApi.fetch('/packages', { method: 'POST', body: body });
        var pub = publishFromSelect(form, 'publish_status');
        req
          .then(function () {
            done(
              pub === 'published'
                ? 'Paket disimpan dan akan tampil di halaman Paket Wisata.'
                : 'Paket disimpan sebagai Draft — belum tampil di website. Ubah status ke Aktif lalu simpan lagi.'
            );
          })
          .catch(fail);
        return;
      }

      if (entity === 'car') {
        var carBody = {
          name: val(form, 'name'),
          capacityLabel: val(form, 'capacity_label'),
          pricePerDay: Number(val(form, 'price_per_day')),
          transmission: val(form, 'transmission'),
          mainImageUrl: val(form, 'main_image_url'),
          publishStatus: publishFromSelect(form, 'publish_status'),
        };
        var carReq = id
          ? window.JKAdminApi.fetch('/cars/' + id, { method: 'PUT', body: carBody })
          : window.JKAdminApi.fetch('/cars', { method: 'POST', body: carBody });
        carReq.then(done).catch(fail);
        return;
      }

      if (entity === 'article') {
        var contentErr =
          window.JKArticleEditor && window.JKArticleEditor.validate
            ? window.JKArticleEditor.validate()
            : null;
        if (contentErr) {
          if (window.JKAdminToast) window.JKAdminToast.warning(contentErr);
          else alert(contentErr);
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Simpan Artikel';
          }
          return;
        }
        var artContent =
          window.JKArticleEditor && window.JKArticleEditor.getSerializedContent
            ? window.JKArticleEditor.getSerializedContent()
            : val(form, 'content');
        var artBody = {
          title: val(form, 'title'),
          content: artContent,
          coverImageUrl: val(form, 'cover_image_url'),
          tags: val(form, 'tags'),
          publishedAt: val(form, 'published_at') || null,
          publishStatus: publishFromSelect(form, 'publish_status'),
        };
        var artReq = id
          ? window.JKAdminApi.fetch('/articles/' + id, { method: 'PUT', body: artBody })
          : window.JKAdminApi.fetch('/articles', { method: 'POST', body: artBody });
        artReq.then(done).catch(fail);
        return;
      }

      if (entity === 'settings') {
        window.JKAdminApi.fetch('/settings', {
          method: 'PUT',
          body: {
            brand_name: val(form, 'brand_name'),
            footer_description: val(form, 'footer_description'),
            contact_whatsapp: val(form, 'contact_whatsapp'),
            contact_phone: val(form, 'contact_phone'),
            contact_email: val(form, 'contact_email'),
            instagram_url: val(form, 'instagram_url'),
          },
        })
          .then(function () {
            if (window.JKAdminToast) window.JKAdminToast.success('Pengaturan berhasil disimpan.');
            else alert('Pengaturan berhasil disimpan.');
          })
          .catch(fail)
          .finally(function () {
            if (btn) {
              btn.disabled = false;
              btn.textContent = 'Simpan Pengaturan';
            }
          });
      }
    });
  });
})();
