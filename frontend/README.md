# FoodLink AI Frontend

This is the existing React/Vite operations console for FoodLink AI. It connects to the FastAPI backend through `src/services/api.js`.

## Run locally

```powershell
npm install --legacy-peer-deps
Copy-Item .env.example .env.local
npm run dev
```

Configure `.env.local` with:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_API=false
```

Gemini credentials are server-side only. Do not add `GEMINI_API_KEY` to frontend environment files.

## Checks

```powershell
npm run lint
npm run build
```

For the full integration contract, see [FRONTEND_BACKEND_INTEGRATION.md](FRONTEND_BACKEND_INTEGRATION.md).
