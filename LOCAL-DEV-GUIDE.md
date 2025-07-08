# Local Development Guide

## API Functions for Local Development

Since your OpenCage API key is now protected server-side, you have several options for local development:

## Option 1: Fallback to Free Services (Simplest)

**Just run `pnpm dev` as usual.** The application will automatically:
- Use free Nominatim for geocoding (no API key needed)
- Still get weather if you have `VITE_OWM_API_KEY` in `.env.local`
- Everything works, just slightly lower quality location results

## Option 2: Local Function Server (Recommended)

For full functionality with your API keys protected:

### Setup

1. **Create `.dev.vars` file** (gitignored):
   ```bash
   OWM_API_KEY=your_weather_api_key
   OPENCAGE_API_KEY=your_opencage_api_key
   ```

2. **Run local function server** (terminal 1):
   ```bash
   pnpm dev:functions
   ```
   
3. **Enable proxy in `vite.config.ts`** (uncomment these lines):
   ```typescript
   proxy: {
     '/weather': 'http://localhost:8787',
     '/geocode': 'http://localhost:8787',
   },
   ```

4. **Run Vite dev server** (terminal 2):
   ```bash
   pnpm dev
   ```

### How It Works

- `dev-functions.js` creates a local server that simulates Cloudflare Functions
- Runs on `http://localhost:8787` by default
- Vite proxies `/weather` and `/geocode` requests to this server
- API keys stay server-side, never exposed to browser

## Option 3: Environment Variables Only

If you prefer, you can set environment variables directly:

### Windows (PowerShell):
```powershell
$env:OWM_API_KEY="your_key_here"
$env:OPENCAGE_API_KEY="your_key_here"
pnpm dev:functions
```

### Linux/macOS:
```bash
export OWM_API_KEY="your_key_here"
export OPENCAGE_API_KEY="your_key_here"
pnpm dev:functions
```

## Testing Function Endpoints

Once `pnpm dev:functions` is running, you can test:

### Weather API:
```bash
curl "http://localhost:8787/weather?lat=40.7128&lon=-74.0060&units=metric"
```

### Geocoding API:
```bash
curl "http://localhost:8787/geocode?lat=40.7128&lon=-74.0060"
```

## Production Deployment

For production (Cloudflare Pages):
1. Set `OWM_API_KEY` in Pages environment variables
2. Set `OPENCAGE_API_KEY` in Pages environment variables (optional)
3. Deploy - functions in `functions/` directory are automatically served

## Comparison with Wrangler

| Method | Pros | Cons |
|--------|------|------|
| **dev-functions.js** | ✅ No CLI needed<br>✅ Simple Node.js<br>✅ Works with any host | ⚠️ Not 100% Cloudflare-identical |
| **Wrangler CLI** | ✅ Identical to production<br>✅ Official tool | ❌ Additional CLI dependency<br>❌ More complex setup |

The `dev-functions.js` approach is perfect for development and testing. Use Wrangler only if you need to test Cloudflare-specific features.

## Troubleshooting

### Function server won't start
- Check if port 8787 is available
- Set custom port: `FUNCTIONS_PORT=3001 pnpm dev:functions`

### API keys not working
- Verify `.dev.vars` file exists and has correct format
- Check console output for environment loading messages
- Ensure no extra spaces or quotes in `.dev.vars`

### Vite proxy not working
- Uncomment proxy lines in `vite.config.ts`
- Restart Vite dev server after config changes
- Check both servers are running (functions on 8787, Vite on 5173) 
