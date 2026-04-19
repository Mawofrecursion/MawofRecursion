# CLAUDE.md — Project Rules for Claude Code

## What this is

This repo is the source for **mawofrecursion.com** — a content site + small API, framed as a "cybernetic publishing organism." It is *not* a generic static site. Two surfaces coexist:

1. **Content tree** — HTML pages under `public/`, served verbatim.
2. **API surface** — serverless functions under `api/`, routed via `vercel.json` rewrites.

The site is live at `https://mawofrecursion.com`. Treat it as production.

## Deployment

- **Host: Vercel.** `vercel.json` is the source of truth: `outputDirectory` is `public`, with ~23 rewrites mapping user-facing paths to `api/*` functions and a catch-all (`/:path*` → `/api/resolve`) that powers dynamic routing (including phantom pages).
- No Cloudflare Pages, no Netlify, no wrangler. Any doc that says otherwise is stale — fix it or flag it.
- No build step for the content tree. `api/` functions are deployed as Vercel Node.js serverless functions.
- Local dev for content: `python -m http.server 8000 --directory public` (fast, but does **not** run the API — for full-stack local, use `vercel dev`).

## Required environment variables

- `ANTHROPIC_API_KEY` — powers the Ghost chatbot and any model-calling endpoints.
- `REDIS_URL` — backing store for relay transcripts, phantom pages, observatory state, ledger.

Never commit these. `api/_redis.js` is the shared client helper; reuse it rather than instantiating Redis ad hoc.

## `api/` — first-class, not an afterthought

Serverless functions in `api/` are part of the product. Key endpoints (see `vercel.json` for user-facing routes):

| File | Role |
|------|------|
| `ghost.js` | Ghost chatbot — POST `/api/ghost` with `{message, history[], visitor_type}`. Uses `@anthropic-ai/sdk`. Model defaults to Claude Opus 4.6. |
| `ghost-docs.js` | `/ghost/api` docs page for the Ghost endpoint. |
| `ghost-status.js` | Health/status for Ghost. |
| `relay.js`, `relay-view.js`, `relay-analysis.js` | AI-to-AI relay conversations. Persisted in Redis. `/relay`, `/relay/patterns`, `/relay/analysis/:id`. |
| `phantom.js`, `phantoms.js` | Dynamic pages generated from 404s. `/phantoms`. |
| `resolve.js` | Catch-all resolver — last-resort routing for any path not matched by static content. |
| `observatory.js` | Public observatory dashboard. `/observatory`. |
| `entity.js` | Entity resolver — `/entity/:id`, `/e/:id`. |
| `echoes.js`, `diary.js`, `pulse.js` | Ghost memory surfaces — `/ghost/echoes`, `/ghost/diary`, `/pulse`. |
| `aware.js`, `awareness` (js) | Awareness / meta-state endpoints. |
| `greet.js`, `greetings-log.js` | Model-aware greeting — tailored response by detected AI client. |
| `feed.js`, `guide.js`, `contact.js`, `ledger.js`, `route.js`, `qr.js`, `health.js`, `_redis.js` | Supporting endpoints + shared helpers. |

Before editing an endpoint, read the rewrite for its public path in `vercel.json` — the user-facing URL is often not the filename.

## Content tree rules (`public/`)

### Canonical script + stylesheet load order

Every canonical page loads these three CSS files in `<head>` in this order:

```html
<link rel="stylesheet" href="/assets/css/design-system.css">
<link rel="stylesheet" href="/assets/css/components.css">
<link rel="stylesheet" href="/assets/css/blackhole.css">
```

Every canonical page loads this standard JS set at the end of `<body>`, in this order:

```html
<script src="/assets/js/echofield-payload-v2.js"></script>
<script src="/assets/js/navigation-component.js"></script>
<script src="/assets/js/ghost_widget.js"></script>
<script src="/assets/js/whisper.js"></script>
<script src="/assets/js/awareness.js"></script>
<script src="/assets/js/metabolism.js"></script>
<script src="/assets/js/evidence.js"></script>
```

All other scripts in `/assets/js/` (`audio_engine.js`, `vortex.js`, `shadow_layer.js`, `heartbeat.js`, `glyph_forge.js`) are **page-specific opt-ins** — only include them where the page actually uses them.

`public/_template.html` is the starting point for new pages but may drift from the current standard set; trust this file for the load order, not the template.

### URL shape

- Prefer directory-with-`index.html` over flat `.html` files for new content (e.g. `public/protocols/new_thing/index.html`, not `public/new_thing.html`). Existing flat files are legacy, not the target pattern.
- User-facing paths are defined by `vercel.json` rewrites for anything dynamic; for purely static content, the filesystem path *is* the URL.

### Do not put new content at the repo root

Content files live under `public/`. The repo root is for meta-files only (docs, config, coordination scaffolding). If you find an HTML file at the repo root, it is either legacy or a mistake — move it into `public/` at the right path.

## Before committing

- `git status` and confirm your changes are scoped to what you intended.
- If you touched `api/*.js`, consider whether the endpoint needs `vercel dev` verification before push — syntax errors break production endpoints silently until traffic hits them.
- If you touched routing, re-read `vercel.json` end-to-end. The catch-all makes silent misroutes possible.
- Keep `CHANGELOG.md` updated for notable changes (it is the running log).

## Do not

- Do not reintroduce Cloudflare Pages / Netlify deployment claims. Vercel is canonical.
- Do not add top-level HTML files to the repo root.
- Do not hard-code `ANTHROPIC_API_KEY` or `REDIS_URL` — always read from `process.env`.
- Do not duplicate Anthropic or Redis client setup — use the shared helpers.
- Do not commit secrets, `.env` files, or Redis dumps.

## Coordination files worth reading

- `CHANGELOG.md` — running log of mutations.
- `STATE.md` — last-known field state (glyph densities, coherence).
- `SITE_MAP.md` — page recommendations keyed to agent intent.
- `DIRECTIVE.md` — current build directive (may be stale; cross-check against repo).
- `MUTATION_MANIFEST.md` — experimental specs; not always in the canonical tree yet.

🦷⟐
