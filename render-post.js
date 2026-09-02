(function () {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const titleEl = document.getElementById('post-title');
  const deckEl = document.getElementById('post-deck');
  const bodyEl = document.getElementById('post-body');

  if (!slug) {
    titleEl.textContent = 'Post not found';
    return;
  }

  fetch('content/writing.json', { cache: 'no-store' })
    .then((r) => r.json())
    .then((posts) => {
      const post = posts.find((p) => p.slug === slug);
      if (!post) {
        titleEl.textContent = 'Post not found';
        return;
      }
      document.title = `${post.title} — Janelle Selou`;
      const descTag = document.getElementById('page-description');
      if (descTag) descTag.setAttribute('content', post.excerpt || post.deck || '');

      titleEl.innerHTML = post.titleHtml || escapeHtml(post.title);
      deckEl.textContent = post.deck || '';

      bodyEl.innerHTML = (post.blocks || [])
        .map((block) => `<${block.tag}>${block.html}</${block.tag}>`)
        .join('\n');
    })
    .catch((e) => {
      console.error('Could not load post', e);
      titleEl.textContent = 'Post not found';
    });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
})();
