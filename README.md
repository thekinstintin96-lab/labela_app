## Overview

Private, embedded Shopify Admin app (Node.js + TypeScript + React + Polaris) that generates printable A4 PDF shelf labels from a Shopify Products CSV. Outputs PDF to `server/public/out` and optional overflow report CSV.

## Monorepo layout
- `server/`: Express + TypeScript backend (CSV parsing, PDF + QR generation, JSON settings)
- `client/`: Vite + React + Polaris frontend (Settings + Generate pages)
- `samples/`: Example `products.csv`

## Prerequisites
- Node.js 18+
- npm 9+
- A Shopify store where you can install a custom app
- One of:
  - ngrok (`ngrok http 3000`)
  - Shopify CLI (to start a tunnel to port 3000)

## Local development
### 1) Install and start
- Server
```bash
cd server
npm install
npm run dev
```
- Client (separate terminal)
```bash
cd client
npm install
npm run dev
```
- Client runs at `http://localhost:3000` and proxies `/api` and `/public` to server at `http://localhost:3001`.

### 2) Test without Shopify (direct)
- Open `http://localhost:3000`
- Go to Settings, adjust label sizes/captions, save
- Go to Generate, upload `samples/products.csv`, Generate PDF, then open links

## Embedding in Shopify Admin (private app)
You have two tunnel options to expose the client to Shopify Admin.

### Option A: ngrok
1. Start tunnel
```bash
ngrok http 3000
```
2. Copy the HTTPS URL shown by ngrok (example: `https://a1b2c3d4.ngrok.io`)

### Option B: Shopify CLI tunnel
1. Install and auth Shopify CLI
```bash
npm install -g @shopify/cli @shopify/theme # or per official docs
shopify login --store your-store.myshopify.com
```
2. Start a tunnel to port 3000
```bash
shopify app tunnel start --port=3000
```
3. Copy the HTTPS tunnel URL printed in the terminal

### Create and install a custom app in your store
1. In your Shopify Admin: Settings → Apps and sales channels → Develop apps → Create an app
2. App setup:
   - Enable "App embeds in Shopify admin"
   - App URL: paste your tunnel URL (from ngrok/CLI), e.g., `https://a1b2c3d4.ngrok.io`
   - Allowed redirection URLs: add the same root for now (no OAuth yet)
   - (Optional) API scopes: `read_products`, `write_files` (for future extensions)
3. Install the app to your store. It should appear in the Admin Apps list. Clicking it loads the UI from your tunnel.

Notes:
- This project doesn’t require OAuth for its core CSV→PDF features. It’s embedded in Admin for convenience and uses no Shopify APIs by default.
- If you later add App Bridge auth/session tokens or Shopify API calls, update App URL and Redirect URLs accordingly and implement auth flow on the server.

## Configuration
- Server port: `server/.env` supports `PORT` (defaults to 3001). See `server/.env.example`.
- Generated files: served at `/public/out/...` from the server.

## API summary
- `GET /api/settings` → current settings
- `POST /api/settings` → save settings
- `POST /api/upload-csv` (multipart `file`) → returns `{ count, sample }`
- `POST /api/generate` (JSON `{ settings, rows }`) → returns `{ pdfUrl, overflowCsvUrl }`

## CSV requirements
- Accepts Shopify Products CSV export
- Auto-detects delimiter among `,`, `;`, `\t`
- Handles multiline quoted fields; decimal comma or dot
- Skips rows without price

## PDF layout notes
- A4 grid; label size/margins/gutters configurable
- Title wraps max 2 lines; left column respects fixed QR width + gap; ellipsis applied
- QR at fixed physical size, quiet zone = 4, ≥300 DPI; top-aligned with brand line
- Unit price computed if size detected (ml/l/g/kg incl. Cyrillic)
- VAT share computed from gross (rate from settings)
- Overflow items logged to `overflow_*.csv`

## Troubleshooting
- If Polaris styles don’t load in Admin, ensure the tunnel URL is HTTPS and app is embedded
- If PDF links 404, confirm server is running (3001) and client proxy is forwarding `/public`

## Roadmap (optional)
- Add proper App Bridge provider + session token auth
- Column mapping UI for non-standard CSV headers
- Upload PDFs to Shopify Files for CDN URLs
