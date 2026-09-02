/* Renders work.html case studies from content/work.json into #work-list */
(function () {
  const container = document.getElementById('work-list');
  if (!container) return;

  fetch('content/work.json', { cache: 'no-store' })
    .then((r) => r.json())
    .then((items) => {
      items.sort((a, b) => (a.order || 0) - (b.order || 0));
      container.innerHTML = items.map(renderCaseStudy).join('');
      // Re-run scroll reveal + word masks for newly injected content, if present
      if (window.reinitReveal) window.reinitReveal();
    })
    .catch((e) => {
      console.error('Could not load work content', e);
    });

  function renderCaseStudy(item) {
    const rows = (item.rows || [])
      .map(
        (row) => `
        <div class="info-row reveal">
          <p class="label">${escapeHtml(row.label)}</p>
          <p>${row.text}</p>
        </div>`
      )
      .join('');

    const quote = item.quote
      ? `
        <blockquote class="pullquote reveal">
          “${escapeHtml(item.quote.text)}”
          <cite>${escapeHtml(item.quote.citeText || '')} ${
          item.quote.citeLinkHref
            ? `<a href="${item.quote.citeLinkHref}">${escapeHtml(item.quote.citeLinkText || '')}</a>`
            : escapeHtml(item.quote.citeLinkText || '')
        }</cite>
        </blockquote>`
      : '';

    const gallery =
      item.images && item.images.length
        ? `
        <div class="case-gallery">
          ${item.images
            .map(
              (img) => `
            <figure class="reveal">
              <img src="${img.src}" alt="${escapeHtml(img.alt || '')}" loading="lazy" />
              <figcaption>${img.caption || ''}</figcaption>
            </figure>`
            )
            .join('')}
        </div>`
        : '';

    const download = item.download
      ? `
        <p class="reveal" style="margin-top:1.25rem">
          <a href="${item.download.href}" target="_blank" rel="noopener" style="color:var(--gold); font-size:0.85rem; letter-spacing:0.08em; text-transform:uppercase; font-weight:600; border-bottom:1px solid var(--gold); padding-bottom:2px;">
            ${escapeHtml(item.download.label || 'Download (PDF)')} ↓
          </a>
        </p>`
      : '';

    return `
      <article style="padding-bottom:3rem">
        <p class="eyebrow reveal">${escapeHtml(item.eyebrow || '')}</p>
        <h2 class="section-title reveal">${escapeHtml(item.title || '')}</h2>
        ${rows}
        ${quote}
        ${gallery}
        ${download}
      </article>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
})();
