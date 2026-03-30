# 🌿 KBTU Sustainable Campus Dashboard

> ESG Analytics dashboard for monitoring KBTU campus sustainability metrics.
> Interactive charts for Energy, Water, Waste, Emissions, Environment, and a live campus map.

---

## Stack

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | 18.2 |
| Charts | Chart.js + react-chartjs-2 | 4.4 / 5.2 |
| Map | Leaflet + react-leaflet | 1.9 / 4.2 |
| Excel parsing | xlsx (SheetJS) | 0.18 |
| CSV parsing | PapaParse | 5.4 |
| PDF export | jsPDF + html2canvas | 4.2 / 1.4 |
| Serving (prod) | nginx | 1.27-alpine |
| Containerisation | Docker + Compose | 24+ |
| Languages | RU / KZ / EN | — |

**No backend. No database. No Redis. No external services required.**
State is stored in the user's browser `localStorage`. Optional live sync via Google Sheets API.

---

## Port

| Environment | Port |
|---|---|
| Local dev (`npm start`) | **3000** (CRA default, overridden by `PORT` in `.env`) |
| Docker / production | **3010** |

> This project is isolated on port **3010**. Change `PORT=3010` in `.env` if the port is already taken on your host.

---

## Healthcheck

```
GET http://localhost:3010/health
→ 200 {"status":"ok","service":"kbtu-dashboard"}
```

Nginx responds directly — no application code involved. Also wired into Docker healthcheck.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3010` | Host port for Docker |
| `PUBLIC_URL` | No | `` | Public URL for subdomain deploy (e.g. `https://sustainability.kbtu.kz`) |
| `REACT_APP_ADMIN_PASSWORD` | No | `kbtu2024` | Dashboard admin login password |
| `REACT_APP_GMAPS_KEY` | No | `` | Google Maps API key for campus map page |
| `REACT_APP_SHEETS_API_URL` | No | `` | Google Apps Script Web App URL for live data sync |

> ⚠️ `REACT_APP_*` variables are **baked into the build at compile time** by Create React App. They are not secret at runtime — do not put database passwords or private keys here.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env

# 3. Start dev server (hot reload)
npm start
# Opens http://localhost:3000
```

---

## Docker Deploy (Recommended for subdomain)

### First deploy

```bash
# 1. Clone repo
git clone https://github.com/Sunbekova/kbtu-sustainabilityDashboard.git
cd kbtu-sustainabilityDashboard

# 2. Configure environment
cp .env.example .env
# Edit .env — set PORT, PUBLIC_URL, REACT_APP_ADMIN_PASSWORD at minimum

# 3. Build and start
docker compose up -d --build

# 4. Verify it's running
curl http://localhost:3010/health
# → {"status":"ok","service":"kbtu-dashboard"}

docker compose ps
# → kbtu-dashboard   running (healthy)
```

### Update / redeploy

```bash
git pull
docker compose up -d --build
# Zero-downtime: old container keeps serving until new one is healthy
```

### Restart without rebuild

```bash
docker compose restart kbtu-dashboard
```

### Stop

```bash
docker compose down
```

### View logs

```bash
# Live tail
docker compose logs -f kbtu-dashboard

# Last 100 lines
docker compose logs --tail=100 kbtu-dashboard

# Nginx access log inside container
docker exec kbtu-dashboard tail -f /var/log/nginx/kbtu-dashboard-access.log
```

---

## Manual Build Deploy (Netlify / Vercel / IIS)

```bash
npm install
npm run build
# → Upload the /build folder
```

**Netlify drag & drop:** https://app.netlify.com/drop  
**Vercel:** `npx vercel --prod`

Routing: all paths must fall back to `index.html` (SPA). The included `netlify.toml` and `vercel.json` handle this automatically.

---

## Subdomain Config (nginx reverse proxy on host)

If you have a host nginx routing multiple projects to subdomains:

```nginx
# /etc/nginx/sites-available/sustainability.kbtu.kz
server {
    listen 80;
    server_name sustainability.kbtu.kz;

    location / {
        proxy_pass http://localhost:3010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/sustainability.kbtu.kz /etc/nginx/sites-enabled/
sudo nginx -s reload
```

---

## Updating Dashboard Data

### Option A — Global Excel import (fastest)

1. Log in as Admin (password in `.env` → `REACT_APP_ADMIN_PASSWORD`)
2. Click **📂 Import Excel** in the admin bar
3. Upload a `.xlsx` file with one sheet per data section
4. All charts update instantly

**Download the template** from the admin bar (📄 Template button) to get the exact column format.

| Sheet name | Required columns |
|---|---|
| `EsgTrend` | `year, score` |
| `EnergyTrend` | `year, naturalGas, thermal, electricity` |
| `BuildingsEnergy` | `name, mwh, kwh_m2, delta` |
| `EmissionsTrend` | `year, actual, target` |
| `EmissionsBySource` | `source, tco2e` |
| `WaterTrend` | `year, total, recycled` |
| `BuildingsWater` | `name, drinking, technical, irrigation` |
| `WasteTrend` | `year, actual, target` |
| `WasteByType` | `type, tonnes, color` |
| `SDGProgress` | `sdg, label, pct, color` |
| `Initiatives` | `category, count` |
| `Transport` | `mode, pct` |
| `Procurement` | `label, pct` |
| `MapPoints` | `id, lat, lng, category, title, building, year, note` |

### Option B — Per-chart inline editor

Admin login → click **✏️ Edit Data** on any card or chart → edit cells directly.

### Option C — Google Sheets live sync

1. Open `google-apps-script/Code.gs` → paste into a Google Apps Script project
2. Run **🌿 KBTU Dashboard → Setup all sheets**
3. Deploy as Web App (Execute as: Me, Access: Anyone)
4. Paste the Web App URL into **⚙️ Settings** → Google Sheets URL
5. Dashboard auto-refreshes on the configured interval

### Option D — Edit source data

Edit `/src/data/defaultData.js`, rebuild, and redeploy.

---

## Changing Admin Password

**Method 1 (no rebuild):** Log in as admin → ⚙️ Settings → Security → change password → Save.

**Method 2 (permanent, survives resets):**
```bash
# Edit .env
REACT_APP_ADMIN_PASSWORD=your_new_password

# Rebuild
docker compose up -d --build
```

Also update the password in `google-apps-script/Code.gs` if using Sheets sync.

---

## Dependencies

This is a **frontend-only** project. No external services are required to run it.

| Dependency | Type | Required? | Notes |
|---|---|---|---|
| Node.js 18+ | Build only | Yes | Not needed in production Docker image |
| nginx | Runtime | Yes (Docker) | Included in Docker image |
| Google Maps API | External | No | Only for the campus map page |
| Google Sheets | External | No | Only for live data sync |
| Redis | — | **No** | Not used |
| PostgreSQL / any DB | — | **No** | Not used — data in localStorage |

---

## Resource Estimates

| Resource | Dev (`npm start`) | Production (Docker) |
|---|---|---|
| RAM | ~150 MB (Node process) | **~25 MB** (nginx only) |
| CPU (idle) | ~5% | **< 1%** |
| CPU (peak, build) | ~80% for ~30s | — |
| Disk (image) | ~500 MB (node_modules) | **~25 MB** (nginx + static files) |
| Disk (build output) | ~5 MB | ~5 MB |

Docker resource limits are set in `docker-compose.yml`:
```yaml
limits:
  cpus: "0.25"
  memory: 128M
```

---

## Load Estimates

| Metric | Value |
|---|---|
| Expected concurrent users | 5–50 (university internal tool) |
| RPS (requests per second) | < 10 |
| Response time | < 50 ms (static files, local nginx) |
| Bandwidth | ~500 KB per full page load (JS + CSS + fonts) |

nginx serves static files directly from disk — no application processing per request. The service can handle 1000+ RPS on minimal hardware without modification.

---

## Logs

### Docker (production)

```bash
# Application logs (nginx access + error)
docker compose logs -f kbtu-dashboard

# Nginx access log
docker exec kbtu-dashboard tail -f /var/log/nginx/kbtu-dashboard-access.log

# Nginx error log
docker exec kbtu-dashboard tail -f /var/log/nginx/kbtu-dashboard-error.log
```

Logs are rotated automatically (max 10 MB × 3 files per `docker-compose.yml` logging config).

### Local dev

React dev server logs print directly to the terminal that ran `npm start`.

---

## Project Structure

```
kbtu-sustainabilityDashboard/
├── public/
│   └── index.html
├── src/
│   ├── data/
│   │   ├── defaultData.js        ← All default values (change data here)
│   │   └── fon.png               ← Hero background image
│   ├── translations/
│   │   ├── index.js              ← t() helper + re-exports
│   │   ├── ru.js                 ← Russian strings
│   │   ├── kz.js                 ← Kazakh strings
│   │   └── en.js                 ← English strings
│   ├── components/
│   │   ├── HomePage.js           ← Hero, KPIs, donut, ESG trend, equivalences
│   │   ├── EnergyPage.js         ← Gas, thermal, electricity, buildings
│   │   ├── EmissionsPage.js      ← Scope 1/2, GHG by source, pathway
│   │   ├── WaterPage.js          ← Consumption, pie, trend, heatmap
│   │   ├── WastePage.js          ← Types, diversion rate, zero waste goal
│   │   ├── EnvironmentPage.js    ← SDGs, initiatives, transport, procurement
│   │   ├── MapPage.js            ← Google Maps campus map with points
│   │   ├── UI.js                 ← Nav, AdminBar, KPICard, ChartCard, ExportBar
│   │   ├── TableEditor.js        ← Per-chart inline editor + CSV import
│   │   ├── CardEditModal.js      ← Single card value editor
│   │   ├── ChartEditModal.js     ← Table-based chart data editor
│   │   ├── KPIEditModal.js       ← KPI strip editor
│   │   ├── Tooltip.js            ← Hover tooltip component
│   │   └── SettingsPanel.js      ← Google Sheets config, password, reset
│   ├── DataContext.js            ← Global state, localStorage, Sheets sync
│   ├── LangContext.js            ← Language switcher context
│   ├── importUtils.js            ← Excel/CSV parse, export, PDF generation
│   ├── App.js                    ← Router, page switcher
│   └── index.js                  ← React entry point
├── google-apps-script/
│   └── Code.gs                   ← Paste into Google Apps Script for Sheets sync
├── .env.example                  ← Environment variable template
├── .gitignore
├── Dockerfile                    ← Multi-stage build → nginx
├── docker-compose.yml            ← Single-service compose for isolated deploy
├── nginx.conf                    ← SPA routing + healthcheck + compression
├── netlify.toml                  ← SPA redirect for Netlify
├── vercel.json                   ← SPA rewrite for Vercel
├── package.json
└── README.md
```

---

## Isolation Guarantees

- **Port:** unique port `3010` — no conflict with other services
- **Container name:** `kbtu-dashboard` — unique across compose projects
- **No shared database:** zero external data dependencies
- **No shared volumes:** each container instance is fully self-contained
- **No shared networks:** Docker Compose creates an isolated default network
- **No Redis / message queue:** not used
- **Environment variables:** all configuration via `.env`, no global system variables required

---

## Quick Reference

```bash
# Start
docker compose up -d --build

# Health
curl http://localhost:3010/health

# Logs
docker compose logs -f

# Restart
docker compose restart kbtu-dashboard

# Stop
docker compose down

# Rebuild after code change
docker compose up -d --build
```

---

*KBTU Sustainable Campus Dashboard — @KBTUINST | @ESGINST*
