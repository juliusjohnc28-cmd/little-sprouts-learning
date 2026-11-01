# 🌼 Little Sprouts — Preschool Learning Games

A bright, responsive preschool educational web app for ages 3–6, made with HTML, CSS and JavaScript. No installation or API key needed.

## Features
- 🔤 Alphabet Garden: letters A–Z, cute example words and emoji characters, three-answer challenges
- 🔢 Counting Meadow: count objects from 1 to 10
- ⭐ Star Challenge: mixed alphabet and counting questions
- 🔊 Spoken English prompts and encouragement using the browser Speech Synthesis API
- 🎵 Gentle generated success sounds via Web Audio API
- 🐰 Animated playful characters and responsive pastel design
- 👧 Multiple local learner profiles, progress indicators, stars and browser localStorage saving
- 📴 Core app works offline once downloaded (fonts use online fallback; no service worker required)

## Run locally
Open `index.html` in a modern browser. Alternatively, serve the directory with `python -m http.server 8000` and visit http://localhost:8000.

## Deploy
- **GitHub Pages:** Upload the files to a GitHub repository, go to Settings → Pages → Deploy from a branch → main / (root).
- **Cloudflare Pages:** Connect the repo. Framework preset: None; build command: empty; output directory: `/`.
- **Vercel:** Import the repo as an Other/static project, no build command needed.

## Privacy and limitations
Progress is stored **only on each device** using localStorage. This app does not transmit personal learner details to a server. Voice support and available accents depend on browser and device; some devices may need a language voice installed. This is a front-end MVP, not a cloud-synced parent/teacher dashboard.
