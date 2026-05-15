# ThinkDelta — Application Write-Up

**What I built:** ThinkDelta is a cognitive diff tool. When you revise an essay, argument, or product pitch, `git diff` shows what *words* changed. ThinkDelta shows what *thinking* changed — the assumptions, blind spots, and synthesis that sit beneath the surface of any two versions of an idea.

**Why I built it:** I rewrite constantly. Essays, arguments, code — everything goes through multiple drafts. But I've never had a tool that shows me the *structure* of how my thinking evolved. I wanted something that treats AI not as a replacement for reasoning, but as a mirror for it. ThinkDelta takes two versions of an idea and surfaces three things: what beliefs shifted, what both versions miss, and a higher-order insight that transcends them both.

**What I used:** Vanilla HTML, CSS, and JavaScript — no build step, no frameworks. The AI layer uses MiniMax's M2.7 reasoning model. I built a Python script (`generate_examples.py`) that calls the MiniMax API to generate analyses, which are stored as static JSON. The frontend loads these curated examples for the live demo.

**The constraint I worked within:** GitHub Pages is static-only, and MiniMax doesn't support CORS for client-side API calls (which would expose the API key). Rather than abandon the project or over-engineer a backend, I made a deliberate product decision: pre-generate 6 high-quality, real MiniMax responses and serve them statically. The live API integration code is present in `app.js` and ready to connect to a backend proxy. This constraint actually improved the product — it forced me to curate deeply interesting examples instead of relying on generic prompt-and-pray outputs.

**What I'd do with another 10 hours:** Add user accounts with history persistence, a collaborative mode where two people compare their thinking in real-time, and knowledge-graph visualizations showing how ideas connect and evolve over time. I'd also deploy a Cloudflare Worker proxy to enable truly live API calls.

**What I chose to cut:** OAuth, a database, a backend server, and live API integration. These would have required infrastructure beyond the static-hosting constraint and weren't core to the experience. The core thing — seeing the cognitive delta — works without them.
