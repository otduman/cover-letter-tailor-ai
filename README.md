# Project Tailor

A Firefox extension that drafts a cover letter from the LinkedIn job you're viewing,
based on your own career history, and saves it to a formatted Google Doc.

## What it does

- Reads the job title, company, and description from a LinkedIn job page.
- Generates a one-page cover letter from your master document (a Google Doc you own),
  so it only uses facts that are actually in your history.
- Flags required skills that aren't in your history instead of making them up.
- Writes in English or German.
- Creates a formatted Google Doc and offers copy-to-clipboard.

## Tech

TypeScript · React · Vite · vite-plugin-web-extension (Firefox MV3) · Tailwind ·
LangChain.js with Google Gemini · Google Docs API.

## Run it

```bash
cd extension
npm install
npm run dev
```

See [extension/README.md](extension/README.md) for setup (Gemini API key, Google
OAuth, and linking your master document).

## Status

Working. Single-user — you bring your own API keys.
