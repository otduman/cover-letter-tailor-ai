# Project Tailor — Firefox Extension

AI-generated cover letters built strictly from your real career history.
MV3 Firefox add-on: TypeScript + React + Vite + vite-plugin-web-extension + Tailwind + LangChain.js (Gemini).

## Develop

```bash
cd extension
npm install
npm run dev
```

`npm run dev` builds the add-on, **launches a fresh Firefox window with it already
installed**, and opens LinkedIn jobs. Edit a file and it reloads automatically.
You do not need to touch `about:debugging`.

To build a distributable bundle:

```bash
npm run build      # outputs to dist/
```

## Manual loading (if you ever need it)

1. Go to `about:debugging#/runtime/this-firefox`
2. **Load Temporary Add-on…**
3. Select `extension/dist/manifest.json`

## Project layout

```
src/
  popup/       React popup (toolbar action)
  options/     React settings page (API key, master doc URL, template)
  content/     LinkedIn job-page content script
  background/  MV3 background event page
  lib/         config + storage (Phase 3 adds LangChain chains)
  styles/      global Tailwind CSS
manifest.config.ts   Firefox MV3 manifest (gecko id pinned for stable OAuth)
```

## Roadmap

- **Phase 1 — scaffold** ✅
- **Phase 2 — Google OAuth (launchWebAuthFlow) + Docs API** ← current
- **Phase 3 — port core logic** (skill extraction, prompt building, gap + buzzword checks)
- **Phase 4 — LinkedIn flow** (extract job → generate → copy)
- **Phase 5 — polish + addons.mozilla.org submission**
