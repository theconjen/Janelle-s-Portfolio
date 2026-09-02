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
      initCarousels(container);
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
        ? item.layout === 'carousel'
          ? renderCarousel(item)
          : `
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

  function renderCarousel(item) {
    const slides = item.images
      .map(
        (img, i) => `
      <div class="carousel-slide" data-slide="${i}">
        <div class="carousel-slide-media">
          <img src="${img.src}" alt="${escapeHtml(img.alt || '')}" loading="${i === 0 ? 'eager' : 'lazy'}" />
        </div>
        ${img.caption ? `<p class="carousel-caption">${escapeHtml(img.caption)}</p>` : ''}
      </div>`
      )
      .join('');
    const dots = item.images
      .map((_, i) => `<button class="dot${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="Go to slide ${i + 1}"></button>`)
      .join('');
    const controls =
      item.images.length > 1
        ? `
        <button class="carousel-btn prev" aria-label="Previous slide">‹</button>
        <button class="carousel-btn next" aria-label="Next slide">›</button>
        <div class="carousel-counter">1 / ${item.images.length}</div>
        <div class="carousel-dots">${dots}</div>`
        : '';
    return `
      <div class="carousel reveal" data-carousel>
        <div class="carousel-track">${slides}</div>
        ${controls}
      </div>`;
  }

  function initCarousels(root) {
    root.querySelectorAll('[data-carousel]').forEach((el) => {
      const track = el.querySelector('.carousel-track');
      const slides = el.querySelectorAll('.carousel-slide');
      const dots = el.querySelectorAll('.carousel-dots .dot');
      const counter = el.querySelector('.carousel-counter');
      let index = 0;

      function go(i) {
        index = (i + slides.length) % slides.length;
        track.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((d, di) => d.classList.toggle('active', di === index));
        if (counter) counter.textContent = `${index + 1} / ${slides.length}`;
      }

      el.querySelector('.carousel-btn.prev')?.addEventListener('click', () => go(index - 1));
      el.querySelector('.carousel-btn.next')?.addEventListener('click', () => go(index + 1));
      dots.forEach((d, di) => d.addEventListener('click', () => go(di)));

      let startX = null;
      track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
      track.addEventListener('touchend', (e) => {
        if (startX == null) return;
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        startX = null;
      });
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
})();
