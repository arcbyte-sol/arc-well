# Arcwell Consulting — Website

Original frontend for a consulting firm, inspired by the structure of the "Thrown" Envato theme (Home Two). No theme code or images were used.

- `research.md`: niche and competitor research
- `site/`: the website (plain HTML/CSS/JS, no build step)
- `social/`: post images per platform + `captions.md`

## Run locally
python3 -m http.server 4173 --directory site   →  http://localhost:4173

## Deploy to Vercel
Option A: drag the `site` folder into https://vercel.com/new
Option B: `cd site && npx vercel --prod`

## Demo behavior
Everything is simulated in the browser (localStorage): contact form, booking, newsletter, client portal login, tasks and chat. Nothing is sent anywhere.
Portal: click "Use demo account". To reset, clear the site's data in the browser.
