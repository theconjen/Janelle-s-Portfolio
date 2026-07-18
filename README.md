# Janelle Selou — Portfolio

Editorial portfolio site. Static HTML/CSS/JS — no build step required.

## Files
- `index.html`, `about.html`, `work.html`, `writing.html`, `contact.html` — pages
- `writing-brand.html`, `writing-connection.html` — essays
- `styles.css` — design system (emerald/ink/paper palette, Playfair + Figtree)
- `script.js` — word-reveal + scroll animations (no libraries)
- `img-*.jpg` — Work page gallery images (optimized for web)
- `headshot.jpg` — unused; available for the About page

## Deploy
Hosted on Vercel (project: janelle-selou-portfolio). Any push to the connected
Git repo redeploys automatically, or run `vercel --prod` from this folder.

## Connect the GitHub repo to Vercel
1. Push this folder to github.com/theconjen/Janelle-s-Portfolio
2. Vercel Dashboard → janelle-selou-portfolio → Settings → Git → Connect Git Repository
3. Select the repo; every push to main now deploys to production.
