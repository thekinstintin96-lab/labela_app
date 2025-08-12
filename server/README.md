## Server

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build && npm start`

Static files served at `/public`. Generated outputs go into `public/out`.

### API
- GET `/api/settings` → returns settings JSON
- POST `/api/settings` → save settings JSON
- POST `/api/upload-csv` (multipart, field `file`) → returns `{ count, sample }`
- POST `/api/generate` (JSON) → `{ pdfUrl, overflowCsvUrl }`

`POST /api/generate` body:
```json
{
  "settings": { /* AppSettings */ },
  "rows": [ /* array of CSV rows as objects */ ]
}
```