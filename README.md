# Little Sprouts — teacher voice integration

Preschool games with secure ElevenLabs American English teacher voice, Cloudflare edge caching, and browser speech fallback.

## Deploy to Cloudflare Workers
Cloudflare Workers builds this GitHub repository using Wrangler:
- Build command: `npx wrangler deploy` (in a Workers Builds project)
- Build output directory: not used; static files are in `public/`
- Config file: `wrangler.jsonc`
- Deploy command if prompted: `npx wrangler deploy`

### Required secret values
Cloudflare dashboard → Workers & Pages → little-sprouts-learning → Settings → Variables and Secrets → Add:
- `ELEVENLABS_API_KEY`: **Secret**, ElevenLabs API key
- `ELEVENLABS_VOICE_ID`: **Secret**, voice ID from ElevenLabs Voice Library (choose a cheerful American English woman)

Use Deploy after saving. Do not put the key in GitHub, source code, frontend JS, or public files.

The server only accepts fixed lesson sentences, caches generated MP3s at Cloudflare edge for a day, and falls back to built-in browser speech if the API fails. Cache is per Cloudflare data center, so ElevenLabs may be called again in other regions or on cache expiration. Voice settings are tuned for a playful teacher but final sound depends on selected ElevenLabs voice.

Note: If using Cloudflare Pages instead of Workers, convert the Worker handler to a Pages Function or migrate deployment to Workers; this repository targets Cloudflare Workers.
