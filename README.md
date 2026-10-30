# Tsukuyomi Watch — The Samurai's Celestial Guide

A multi-page full-stack astronomy web app with a Japanese-inspired dark observatory theme and a cinematic, forward-moving four-chapter Three.js journey through meteor showers, Earth and Luna, a spiral galaxy, and a nebula field with Jupiter and Saturn. Scroll swaps in real space photography from NASA APOD, Hubble, Cassini, and Giotto, alongside JPL planetary maps. The app also includes live Open-Meteo weather, NASA APOD and Near-Earth Object data, a SQLite observing journal, and image upload/inspection. The four chapters lead to Watchtower, Celestial Scroll, Spirit Lens, and Dojo Dashboard.

## Pages
- **Sanctuary** — landing dashboard, weather-derived Night Honor Score, NASA Astronomy Picture of the Day.
- **Watchtower** — real OpenStreetMap view, place-name search, device location, coordinate lookup, and weather metrics.
- **Celestial Scroll** — event filters, lunar calendar strip, NASA NEO feed, persistent observing journal.
- **Spirit Lens** — OpenAI cloud image restoration, original/restored comparison, preview download, and optional original upload.
- **Dojo Dashboard** — API/database status, APOD, recent observations and integration status.

## Run locally
Requires Node.js 20+ (Node 22 LTS recommended).

```bash
npm install
cp .env.example .env
# Add your OpenAI API key to OPENAI_API_KEY in .env.
# Optional: add your NASA API key to NASA_API_KEY (DEMO_KEY has strict shared limits).
npm run dev
```

Restart the server after changing `.env`.

Frontend: http://localhost:5173  
Backend health: http://localhost:8787/api/health

Production frontend build: `npm run build`

## Data and API notes
- Open-Meteo weather API is public and called by the browser.
- NASA APOD and NEO APIs are called by Express. Set `NASA_API_KEY` in `.env` for better quota.
- Keep your OpenAI API key in the server-side `.env` as `OPENAI_API_KEY`; do not add it to frontend code or commit `.env`.
- SQLite database and uploaded image originals are saved under `server/data/` (created automatically).
- Spirit Lens uses OpenAI's `gpt-image-1` image edits for cloud restoration. It accepts JPG, PNG, and WEBP up to 12 MB; images are sent to OpenAI for processing and are not stored by this app. Image edits are generative and can alter or invent astronomical details, so do not use the output for scientific measurements. Requests are limited to 10 per client IP per 10 minutes.
- The image upload endpoint accepts JPG, PNG, WEBP, and TIFF up to 12 MB. Uploaded originals are saved under `server/data/uploads/` only when you choose “Save original.”
- The original image remains unchanged in the browser while OpenAI processes a separate copy.
- The Honor Score is an approximate weather indicator based on cloud cover, humidity and visibility. It does not include light pollution, astronomical twilight, terrain, or verified site access.
- The Watchtower map shows the searched or entered coordinates using OpenStreetMap. It does not identify verified dark-sky sites or guarantee public access.
- Watchtower place-name search uses the Open-Meteo Geocoding API, based on GeoNames location data.
- Meteor shower dates are curated annual windows, not a live event feed. Verify exact timing with a trusted astronomy calendar.

## Important production work still needed
1. Evaluate OpenAI image edits with calibrated astronomical images. Preserve scientific metadata and measure star flux before relying on restored details.
2. Add a validated star/galaxy detection pipeline (e.g. source extraction with calibrated metadata); current UI explicitly reports that object detection is not connected.
3. Add user authentication, authorization, rate limiting, upload malware checks, CSRF strategy if using cookies, and retention limits before public deployment. Current journal API is intentionally a local demo and is not multi-user secured.
4. Add a verified dark-sky provider and light-pollution dataset before advertising real nearby spots. The current map finds places and fetches their weather but does not score light pollution or verify site access.
5. Replace DEMO_KEY with a NASA API key; handle quotas and upstream outages.
6. For deployment, use a persistent disk for SQLite/uploads or migrate to a managed database/object store.

## Suggested next integrations
- Open-Meteo hourly cloud cover forecasts and sunrise/sunset data for planning windows.
- A proper astronomy ephemeris (e.g. astronomy-engine) for local Moon rise/set, phase and planet positions.
- NASA SkyView for retrieving sky survey imagery.
- Astrometry.net/source extraction for star identification and measured source properties.
