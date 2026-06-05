(function (global) {
  'use strict';

  function parseContent(raw) {
    if (!raw) return { version: 1, blocks: [] };
    var t = String(raw).trim();
    if (!t) return { version: 1, blocks: [] };

    if (t.charAt(0) === '{' || t.charAt(0) === '[') {
      try {
        var j = JSON.parse(t);
        if (Array.isArray(j)) return { version: 1, blocks: j };
        if (j && Array.isArray(j.blocks)) return { version: j.version || 1, blocks: j.blocks };
      } catch (e) {
        /* legacy plain text */
      }
    }

    return {
      version: 1,
      blocks: t
        .split(/\n\n+/)
        .map(function (p) {
          return p.trim();
        })
        .filter(Boolean)
        .map(function (text) {
          return { type: 'paragraph', text: text };
        }),
    };
  }

  function serializeContent(data) {
    return JSON.stringify({
      version: 1,
      blocks: (data && data.blocks) || [],
    });
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderBlocksHtml(data, opts) {
    opts = opts || {};
    var blocks = (data && data.blocks) || [];
    var html = [];

    blocks.forEach(function (block) {
      if (!block || !block.type) return;

      if (block.type === 'heading') {
        html.push(
          '<h2 class="!mt-10 text-xl font-bold text-neutral-900">' +
            escapeHtml(block.text) +
            '</h2>'
        );
        return;
      }

      if (block.type === 'paragraph') {
        html.push(
          '<p>' + escapeHtml(block.text).replace(/\n/g, '<br>') + '</p>'
        );
        return;
      }

      if (block.type === 'image' && block.url) {
        var cap = block.caption
          ? '<figcaption class="px-4 py-2 text-center text-xs text-neutral-500">' +
            escapeHtml(block.caption) +
            '</figcaption>'
          : '';
        html.push(
          '<figure class="!my-6 overflow-hidden rounded-xl bg-neutral-100">' +
            '<img src="' +
            escapeHtml(block.url) +
            '" alt="" class="w-full object-cover" loading="lazy" />' +
            cap +
            '</figure>'
        );
      }
    });

    if (!html.length && opts.emptyMessage) {
      return '<p class="text-neutral-500">' + escapeHtml(opts.emptyMessage) + '</p>';
    }

    return html.join('');
  }

  global.JKArticleContent = {
    parse: parseContent,
    serialize: serializeContent,
    renderHtml: renderBlocksHtml,
    escapeHtml: escapeHtml,
  };
})(typeof window !== 'undefined' ? window : this);
