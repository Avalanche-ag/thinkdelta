# ThinkDelta Backend

This directory contains the backend proxy for ThinkDelta, which securely forwards requests to the MiniMax API without exposing your API key in the browser.

## Why a Backend?

- **MiniMax API does not support CORS** for client-side browser requests.
- **Your API key must never be exposed in frontend code** — it would be visible to anyone who views the page source.
- **GitHub Pages is static-only** and cannot run server-side code.

## Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌──────────────┐
│  GitHub     │ ──►  │  Cloudflare      │ ──►  │  MiniMax     │
│  Pages      │      │  Worker (Proxy)  │      │  API         │
│  (Frontend) │      │  (Your Key Here) │      │  (AI Model)  │
└─────────────┘      └──────────────────┘      └──────────────┘
```

## Option 1: Cloudflare Worker (Recommended for Production)

**Prerequisites:** Free Cloudflare account

### Step 1: Install Wrangler CLI
```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare
```bash
wrangler login
```

### Step 3: Deploy the Worker
```bash
cd backend
wrangler deploy
```

### Step 4: Set Your MiniMax API Key as a Secret
```bash
wrangler secret put MINIMAX_API_KEY
```
When prompted, paste your MiniMax API key.

### Step 5: Update the Frontend
After deployment, Wrangler will print your worker URL:
```
https://thinkdelta-api.YOUR_SUBDOMAIN.workers.dev
```

Open `app.js` in the root directory and update:
```javascript
const BACKEND_URL = 'https://thinkdelta-api.YOUR_SUBDOMAIN.workers.dev';
```

Commit and push:
```bash
git add app.js
git commit -m "Connect frontend to live backend"
git push
```

Your GitHub Pages site will now make **live API calls** to MiniMax through the secure Cloudflare Worker proxy!

---

## Option 2: Local Development Server (For Testing)

**Prerequisites:** Python 3.9+ and `flask` + `flask-cors`

### Step 1: Install Dependencies
```bash
cd backend
pip install flask flask-cors
```

### Step 2: Set Your API Key
```bash
export MINIMAX_API_KEY="your-key-here"
```

### Step 3: Run the Server
```bash
python3 server.py
```

### Step 4: Open in Browser
```
http://localhost:5000
```

This serves the frontend AND handles live MiniMax API calls locally.

---

## Option 3: Deploy to Render / Railway / Fly.io

You can also deploy the `server.py` Flask app to any platform that supports Python:

- **Render:** Create a Web Service, point to this repo, set start command to `python backend/server.py`
- **Railway:** Create a project from this repo, add `MINIMAX_API_KEY` as an environment variable
- **Fly.io:** Use `fly deploy` with a `fly.toml` config

After deploying, update `BACKEND_URL` in `app.js` to your platform's URL.

---

## Security Notes

- ✅ The API key lives ONLY in the worker/platform secrets — never in the repo
- ✅ The frontend makes requests to YOUR backend, not directly to MiniMax
- ✅ The backend is stateless — it doesn't store any user data
- ⚠️  The worker currently allows `*` for CORS origin. For production, restrict this to your GitHub Pages domain
