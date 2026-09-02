(function () {
  const profileEl = document.getElementById('about-profile');
  if (!profileEl) return;

  fetch('content/about.json', { cache: 'no-store' })
    .then((r) => r.json())
    .then((data) => {
      setText('about-profile', data.profile);
      setText('about-focus', data.focus);
      setText('about-languages', data.languages);
      setText('about-learning', data.learning);
      setText('about-based', data.based);

      const skillsGrid = document.getElementById('skills-grid');
      if (skillsGrid && data.skills) {
        skillsGrid.innerHTML = data.skills
          .map(
            (col) => `
          <div class="skill-col reveal">
            <h4>${escapeHtml(col.title)}</h4>
            <ul>${col.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
          </div>`
          )
          .join('');
      }
      if (window.reinitReveal) window.reinitReveal();
    })
    .catch((e) => console.error('Could not load about content', e));

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el && text != null) el.textContent = text;
  }
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
})();
