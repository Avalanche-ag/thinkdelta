# ThinkDelta

**A cognitive diff tool for ideas.**

When you revise an essay, argument, or product pitch, `git diff` shows what *words* changed. ThinkDelta shows what *thinking* changed.

[Live Demo](https://avalanche-ag.github.io/thinkdelta/) | [Source Code](https://github.com/Avalanche-ag/thinkdelta)

---

## What It Does

Paste two versions of an idea. ThinkDelta surfaces three insights:

1. **🔄 Assumption Shift** — What underlying beliefs changed between the two versions?
2. **👁️ Hidden Blind Spot** — What critical angle does neither version address?
3. **💡 The Synthesis** — A higher-order insight that transcends both versions.

## Architecture

This is a **static frontend** built with vanilla HTML, CSS, and JavaScript. No build step, no dependencies, no backend server.

### Why Static?

- **GitHub Pages** only serves static files — no backend runtime.
- **MiniMax API** doesn't support CORS for client-side calls (API keys would be exposed in the browser).
- A backend proxy (Cloudflare Worker, etc.) would be needed for truly live AI calls.

### The Demo Strategy

The live demo uses **pre-generated responses** from MiniMax M2.7, stored in `examples.json`. Six curated examples cover essay revision, argument evolution, product pivots, personal growth, code explanation, and philosophical debate.

The frontend code supports an **optional live backend** — simply update `BACKEND_URL` in `app.js` and the app will call your proxy for custom inputs.

### Regenerating Examples

To replace the cached responses with fresh MiniMax outputs:

```bash
cd backend
export MINIMAX_API_KEY="your-key-here"
python3 generate_examples.py
```

This calls the MiniMax API for all 6 examples and writes the results to `examples.json`.

## Backend (Optional — For Live API Calls)

To enable real-time AI for custom user inputs, deploy the backend proxy in `/backend/`:

**Option A: Cloudflare Worker** (recommended, free tier)
- See `backend/README.md` for deployment instructions
- Stores your API key securely in Cloudflare secrets
- Global edge deployment, ~50ms latency

**Option B: Local Development**
```bash
cd backend
pip install -r requirements.txt
export MINIMAX_API_KEY="your-key-here"
python3 server.py
# Open http://localhost:5000
```

**Option C: Render / Railway / Fly.io**
- See `backend/README.md` for platform-specific instructions

## Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, ES6+ (no frameworks)
- **AI Model:** MiniMax M2.7 (via `api.minimax.io`)
- **Static Hosting:** GitHub Pages
- **Backend Proxy:** Cloudflare Worker (optional)
- **Local Dev:** Python Flask
- **Deployment:** GitHub Actions workflow (`.github/workflows/pages.yml`)

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main app UI |
| `style.css` | Brutalist dark theme, responsive design |
| `app.js` | Interactivity, example loader, analysis display, optional backend calls |
| `examples.json` | 6 curated MiniMax responses |
| `generate_examples.py` | Script to regenerate examples via MiniMax API |
| `backend/worker.js` | Cloudflare Worker proxy code |
| `backend/server.py` | Local Flask dev server |
| `backend/wrangler.toml` | Cloudflare Worker config |
| `backend/requirements.txt` | Python dependencies |
| `backend/README.md` | Backend deployment guide |
| `.github/workflows/pages.yml` | Auto-deploy to GitHub Pages on every push |

## Design Notes

- **Brutalist aesthetic:** Dark mode, minimal chrome, content-first.
- **Mobile-responsive:** Works on phones, tablets, and desktops.
- **Zero dependencies:** Loads in under 200KB total (mostly fonts).
- **Accessibility:** Semantic HTML, keyboard-navigable, focus states.
- **Progressive enhancement:** Works as static demo; live AI is an optional upgrade.

## About

Built in ~6 hours for the **Activate AI Fellows Summer 2026** application.

The core thesis: AI is most powerful not as a replacement for human thinking, but as a **mirror** for it — a way to see the structure of our own reasoning more clearly.

---

*ThinkDelta is not affiliated with MiniMax or Activate. MiniMax API usage is subject to their terms of service.*
