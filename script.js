// Split headline words into masked spans for staggered reveal
document.querySelectorAll("[data-split]").forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words
    .map((w, i) => `<span class="mask"><span style="transition-delay:${i * 70}ms">${w}</span></span>`)
    .join(" ");
});

requestAnimationFrame(() => {
  requestAnimationFrame(() => document.body.classList.add("loaded"));
});

// Scroll reveals
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// Called by render-*.js after injecting dynamic content, so newly added
// .reveal elements (case studies, post cards, etc.) get observed too.
window.reinitReveal = function () {
  document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
};
