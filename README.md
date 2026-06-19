# Project Tailor

A Firefox extension that writes tailored cover letters from a LinkedIn job
posting — grounded **only** in your real career history, so it never fabricates
experience. Output lands in a formatted Google Doc.

Built with TypeScript, React, Vite, LangChain.js, and Google's Gemini.

## Why it's different from "just use ChatGPT"

- **No fabrication.** The model may only use facts from your *master document*
  (a Google Doc you own). Skills the job needs that aren't in your history are
  surfaced as a **gap warning** instead of being invented.
- **Anti-AI-slop.** A banned-words filter and a tuned prompt (punchy, "complement
  the CV — don't restate it") keep letters human, not corporate filler.
- **In context.** A sidebar reads the LinkedIn job you're viewing in one click —
  no copy-paste — and exports a ready, styled Google Doc.

## How it works

1. **Master document** — your career history lives in a Google Doc; the extension
   reads it via the Google Docs API as the single source of truth.
2. **Read the job** — a content script extracts the title/company/description from
   the LinkedIn page (handles both of LinkedIn's current layouts).
3. **Generate** — LangChain + Gemini extract the job's required skills, diff them
   against your history (gap detection), then write the letter to a strict
   4-paragraph blueprint with style guardrails.
4. **Export** — creates a new Google Doc (Calibri, right-aligned date, bold name +
   subject line) and offers copy-to-clipboard.

## Tech

`TypeScript` · `React` · `Vite` · `vite-plugin-web-extension` (Firefox MV3) ·
`Tailwind` · `LangChain.js` (`@langchain/google-genai`, Gemini 2.5 Flash) ·
Google OAuth (`identity.launchWebAuthFlow`) + Google Docs API.

## Run it

```bash
cd extension
npm install
npm run dev
```

See [extension/README.md](extension/README.md) for full setup (Gemini key, Google
OAuth, master doc) and [HANDOFF.md](HANDOFF.md) for architecture and decisions.

## Status

Working end-to-end. Single-user (bring-your-own API keys) today; a public,
multi-user version would add a backend to broker Google OAuth. See HANDOFF.md.
