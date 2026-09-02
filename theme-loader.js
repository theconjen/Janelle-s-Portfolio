/* Applies content/theme.json as CSS custom properties. Include right after styles.css. */
(function () {
  fetch('content/theme.json', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((theme) => {
      if (!theme) return;
      const root = document.documentElement.style;
      if (theme.paper) root.setProperty('--paper', theme.paper);
      if (theme.ink) root.setProperty('--ink', theme.ink);
      if (theme.inkSoft) root.setProperty('--ink-soft', theme.inkSoft);
      if (theme.gold) root.setProperty('--gold', theme.gold);
      if (theme.sage) root.setProperty('--sage', theme.sage);
      if (theme.line) root.setProperty('--line', theme.line);
      if (theme.fontDisplay) root.setProperty('--font-display', `"${theme.fontDisplay}", Georgia, serif`);
      if (theme.fontBody) root.setProperty('--font-body', `"${theme.fontBody}", -apple-system, sans-serif`);

      // If a custom font family was chosen that isn't already loaded via the
      // Google Fonts <link> in <head>, pull it in dynamically.
      const loadedFonts = ['Playfair Display', 'Figtree'];
      [theme.fontDisplay, theme.fontBody].forEach((f) => {
        if (f && !loadedFonts.includes(f)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;600;700&display=swap`;
          document.head.appendChild(link);
        }
      });
    })
    .catch(() => {});
})();
