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

The frontend code includes a commented-out live API integration block. To enable live calls:

1. Deploy a backend proxy (e.g., Cloudflare Worker) that holds your MiniMax API key securely.
2. Uncomment the API block in `app.js` and point it to your proxy endpoint.
3. The proxy forwards requests to `https://api.minimax.io/v1/chat/completions` and returns responses.

### Regenerating Examples

To replace the cached responses with fresh MiniMax outputs:

```bash
export MINIMAX_API_KEY="your-key-here"
python3 generate_examples.py
```

This calls the MiniMax API for all 6 examples and writes the results to `examples.json`.

## Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, ES6+ (no frameworks)
- **AI Model:** MiniMax M2.7 (via `api.minimax.io`)
- **Hosting:** GitHub Pages
- **Deployment:** GitHub Actions workflow (`.github/workflows/pages.yml`)

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main app UI |
| `style.css` | Brutalist dark theme, responsive design |
| `app.js` | Interactivity, example loader, analysis display |
| `examples.json` | 6 curated MiniMax responses |
| `generate_examples.py` | Script to regenerate examples via MiniMax API |
| `.github/workflows/pages.yml` | Auto-deploy to GitHub Pages on every push |

## Design Notes

- **Brutalist aesthetic:** Dark mode, minimal chrome, content-first.
- **Mobile-responsive:** Works on phones, tablets, and desktops.
- **Zero dependencies:** Loads in under 200KB total (mostly fonts).
- **Accessibility:** Semantic HTML, keyboard-navigable, focus states.

## About

Built in ~6 hours for the **Activate AI Fellows Summer 2026** application.

The core thesis: AI is most powerful not as a replacement for human thinking, but as a **mirror** for it — a way to see the structure of our own reasoning more clearly.

---

*ThinkDelta is not affiliated with MiniMax or Activate. MiniMax API usage is subject to their terms of service.*
