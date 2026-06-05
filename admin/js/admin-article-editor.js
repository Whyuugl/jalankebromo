(function () {
  'use strict';

  var container;
  var hiddenContent;

  function blockTemplate(block, index) {
    var type = block.type || 'paragraph';
    var move =
      '<div class="flex shrink-0 flex-col gap-1">' +
      '<button type="button" data-block-up="' +
      index +
      '" class="rounded border px-2 py-0.5 text-xs text-neutral-600 hover:bg-neutral-50" title="Naik">↑</button>' +
      '<button type="button" data-block-down="' +
      index +
      '" class="rounded border px-2 py-0.5 text-xs text-neutral-600 hover:bg-neutral-50" title="Turun">↓</button>' +
      '<button type="button" data-block-remove="' +
      index +
      '" class="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50" title="Hapus">×</button>' +
      '</div>';

    var label =
      type === 'image'
        ? 'Foto'
        : type === 'heading'
          ? 'Judul bagian'
          : 'Paragraf';

    var body = '';
    if (type === 'image') {
      body =
        '<label class="text-xs font-medium text-neutral-600">URL gambar</label>' +
        '<input data-block-field="url" type="url" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="https://..." value="' +
        JKArticleContent.escapeHtml(block.url || '') +
        '" />' +
        '<label class="mt-3 block text-xs font-medium text-neutral-600">Keterangan (opsional)</label>' +
        '<input data-block-field="caption" type="text" class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Sumber foto" value="' +
        JKArticleContent.escapeHtml(block.caption || '') +
        '" />';
      if (block.url) {
        body +=
          '<img src="' +
          JKArticleContent.escapeHtml(block.url) +
          '" alt="" class="mt-3 max-h-40 w-full rounded-lg object-cover" onerror="this.classList.add(\'hidden\')" />';
      }
    } else {
      var rows = type === 'heading' ? 2 : 5;
      body =
        '<textarea data-block-field="text" rows="' +
        rows +
        '" class="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Tulis teks...">' +
        JKArticleContent.escapeHtml(block.text || '') +
        '</textarea>';
    }

    return (
      '<div class="article-block flex gap-3 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4" data-block-index="' +
      index +
      '" data-block-type="' +
      type +
      '">' +
      move +
      '<div class="min-w-0 flex-1">' +
      '<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">' +
      label +
      '</p>' +
      body +
      '</div></div>'
    );
  }

  function readBlocksFromDom() {
    if (!container) return [];
    var nodes = container.querySelectorAll('.article-block');
    var blocks = [];
    nodes.forEach(function (node) {
      var type = node.getAttribute('data-block-type') || 'paragraph';
      if (type === 'image') {
        var urlEl = node.querySelector('[data-block-field="url"]');
        var capEl = node.querySelector('[data-block-field="caption"]');
        var url = urlEl ? urlEl.value.trim() : '';
        if (!url) return;
        blocks.push({
          type: 'image',
          url: url,
          caption: capEl ? capEl.value.trim() : '',
        });
        return;
      }
      var textEl = node.querySelector('[data-block-field="text"]');
      var text = textEl ? textEl.value.trim() : '';
      if (!text) return;
      blocks.push({ type: type, text: text });
    });
    return blocks;
  }

  function render(blocks) {
    if (!container) return;
    if (!blocks.length) {
      container.innerHTML =
        '<p class="rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-8 text-center text-sm text-neutral-500">Belum ada blok. Tambah paragraf atau foto di bawah.</p>';
      return;
    }
    container.innerHTML = blocks.map(blockTemplate).join('');
  }

  function syncHidden() {
    if (hiddenContent) {
      hiddenContent.value = JKArticleContent.serialize({ blocks: readBlocksFromDom() });
    }
  }

  function addBlock(type) {
    var blocks = readBlocksFromDom();
    if (type === 'image') blocks.push({ type: 'image', url: '', caption: '' });
    else if (type === 'heading') blocks.push({ type: 'heading', text: '' });
    else blocks.push({ type: 'paragraph', text: '' });
    render(blocks);
    syncHidden();
  }

  function moveBlock(index, dir) {
    var blocks = readBlocksFromDom();
    var next = index + dir;
    if (next < 0 || next >= blocks.length) return;
    var tmp = blocks[index];
    blocks[index] = blocks[next];
    blocks[next] = tmp;
    render(blocks);
    syncHidden();
  }

  function removeBlock(index) {
    var blocks = readBlocksFromDom();
    blocks.splice(index, 1);
    render(blocks);
    syncHidden();
  }

  window.JKArticleEditor = {
    init: function (form) {
      container = document.getElementById('article-blocks');
      hiddenContent = form.querySelector('[name="content"]');
      if (!container || !hiddenContent) return;

      document.querySelectorAll('[data-add-block]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          addBlock(btn.getAttribute('data-add-block'));
        });
      });

      container.addEventListener('input', syncHidden);
      container.addEventListener('click', function (e) {
        var t = e.target;
        if (!(t instanceof HTMLElement)) return;
        var up = t.getAttribute('data-block-up');
        var down = t.getAttribute('data-block-down');
        var rem = t.getAttribute('data-block-remove');
        if (up != null) moveBlock(Number(up), -1);
        if (down != null) moveBlock(Number(down), 1);
        if (rem != null) removeBlock(Number(rem));
      });

      render([]);
      syncHidden();
    },
    setFromRawContent: function (raw) {
      var data = JKArticleContent.parse(raw);
      render(data.blocks);
      syncHidden();
    },
    getSerializedContent: function () {
      syncHidden();
      return hiddenContent ? hiddenContent.value : '';
    },
    validate: function () {
      var blocks = readBlocksFromDom();
      if (!blocks.length) {
        return 'Tambah minimal satu paragraf atau foto.';
      }
      var ok = blocks.some(function (b) {
        if (b.type === 'image') return !!b.url;
        return (b.type === 'paragraph' || b.type === 'heading') && b.text;
      });
      if (!ok) {
        return 'Isi teks paragraf atau URL foto tidak boleh kosong.';
      }
      return null;
    },
  };
})();
