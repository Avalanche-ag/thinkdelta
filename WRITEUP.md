# ThinkDelta — Application Write-Up

**What I built:** ThinkDelta is a cognitive diff tool. `git diff` shows what *words* changed between two drafts. ThinkDelta shows what *thinking* changed — the assumptions, blind spots, and synthesis beneath the surface. Paste two versions of an idea; it returns three insights: what beliefs shifted, what both miss, and a higher-order frame that transcends them.

**Why:** I rewrite constantly — essays, arguments, code. Every draft improves, but I've never had a mirror that shows me *how* my reasoning evolved. Most AI tools replace thinking; I wanted one that reveals its structure. ThinkDelta treats AI as a mirror for human cognition, not a substitute.

**What I'd do with 10 more hours:** Deploy a Cloudflare Worker for live API calls (currently using cached responses), add persistent user history, build a real-time collaborative mode for two people to compare thinking, and add knowledge-graph visualizations showing how ideas connect and evolve over time.

**What I cut:** OAuth, a database, a backend server, and live API integration for the initial deploy. GitHub Pages is static-only and MiniMax doesn't support CORS, so I pre-generated 6 real MiniMax M2.7 responses rather than over-engineering infrastructure. The architecture is ready for a backend proxy; the core experience — seeing the cognitive delta — works without it.
