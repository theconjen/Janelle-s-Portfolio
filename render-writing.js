/* Renders writing.html post cards from content/writing.json into #writing-list */
(function () {
  const container = document.getElementById('writing-list');
  if (!container) return;

  fetch('content/writing.json', { cache: 'no-store' })
    .then((r) => r.json())
    .then((posts) => {
      posts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      container.innerHTML = posts.map(renderCard).join('');
      if (window.reinitReveal) window.reinitReveal();
    })
    .catch((e) => console.error('Could not load writing content', e));

  function renderCard(post) {
    return `
      <a class="work-card reveal" href="post.html?slug=${encodeURIComponent(post.slug)}">
        <h3>${post.titleHtml || post.title} <span class="arrow">→</span></h3>
        <span class="tag">${escapeHtml(post.tag || '')}</span>
        <p>${escapeHtml(post.excerpt || '')}</p>
      </a>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
})();
