# Janelle Selou — Portfolio

Editorial portfolio site. Static HTML/CSS/JS — no build step required.

## Content lives in JSON, not HTML

The Work page, Writing page, and About page pull their content from
`content/*.json` at runtime. This is what makes the `/admin.html` panel
possible — editing those files (by hand or via admin) updates the site
without touching HTML.

- `content/theme.json` — colors and fonts (applied site-wide)
- `content/work.json` — case studies on the Work page
- `content/writing.json` — blog posts / essays
- `content/about.json` — About page text and skills grid

## Editing without code: `/admin.html`

Visit `https://janelle-selou-portfolio-janelles-projects-2197be4f.vercel.app/admin.html`,
paste a GitHub fine-grained personal access token scoped to this repo
(Contents: Read and write), and edit Theme, Work, Writing, and About
directly. Saving commits straight to `main` on GitHub, which triggers
an automatic Vercel deploy (usually live within 30-60 seconds).

The token is stored only in that browser's localStorage — regenerate or
revoke it any time from GitHub → Settings → Developer settings →
Personal access tokens.

## Files
- `index.html`, `about.html`, `work.html`, `writing.html`, `contact.html`, `post.html` — pages
- `writing-brand.html`, `writing-connection.html` — legacy essay URLs, now redirect to `post.html?slug=...` so old links don't break
- `styles.css` — design system (colors/fonts overridable via theme.json)
- `script.js` — word-reveal + scroll animations (no libraries)
- `theme-loader.js` — applies `content/theme.json` as CSS variables on every page
- `render-work.js`, `render-writing.js`, `render-about.js`, `render-post.js` — pull content from JSON into each page
- `admin.js`, `admin.css` — the CMS panel logic and styling
- `images/` — uploads made through the admin panel land here
- `img-*.jpg`, `headshot.jpg` — original site images

## Deploy
Hosted on Vercel (project: janelle-selou-portfolio). Any push to the connected
Git repo redeploys automatically, or run `vercel --prod` from this folder.

## Connect the GitHub repo to Vercel
1. Push this folder to github.com/theconjen/Janelle-s-Portfolio
2. Vercel Dashboard → janelle-selou-portfolio → Settings → Git → Connect Git Repository
3. Select the repo; every push to main now deploys to production.
