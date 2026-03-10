# 🌿 KBTU Sustainable Campus Dashboard

> ESG Analytics dashboard for KBTU campus sustainability monitoring.  
> Designed to match your visual mockups — deploys as a live website in minutes.

---

## Quick Deploy [Recommended: Netlify — Free]

### Option A: Drag & Drop (fastest, no code)
1. Run: `npm install && npm run build`
2. Go to **https://app.netlify.com/drop**
3. Drag the generated `/build` folder onto the page
4. ✅ Your dashboard is live at a Netlify URL instantly

### Option B: GitHub + Netlify (best for ongoing updates)
1. Push this folder to a GitHub repository
2. Go to **https://app.netlify.com** → "New site from Git"
3. Connect your repo, set:
   - Build command: `npm run build`
   - Publish directory: `build`
4. Click Deploy — auto-deploys on every push

### Option C: Vercel
```bash
npm install -g vercel
vercel --prod
```

### Option D: Any static hosting (IIS, Apache, Nginx)
```bash
npm run build
# Upload the /build folder to your server's web root
```

---

## 🖥️ Local Development

```bash
npm install
npm start
# Opens http://localhost:3000
```

---

## ✏️ Updating Data

### Method 1: Excel / CSV Upload (recommended)
1. Open the dashboard in browser
2. Click **"🔒 Admin Login"** (top bar) → password: `kbtu2024`
3. Navigate to any chart — click **"✏️ Edit Data"** button on its card
4. In the editor popup: click **"📂 Import Excel / CSV"**
5. Select your `.xlsx` or `.csv` file
6. Preview the imported rows, click **"💾 Save Changes"**
7. Charts update instantly — data saved in browser storage

### Method 2: Inline Table Editor
Same as above, but edit cells directly in the table instead of importing a file.

### Method 3: Edit source code (for developers)
Edit `/src/data/defaultData.js` → rebuild and redeploy.

### Excel Template Format
Each section expects specific column names. Match these exactly:

| Section | Required columns |
|---------|-----------------|
| energyTrend | `year, naturalGas, thermal, electricity` |
| buildingsEnergy | `name, mwh, kwh_m2, delta` |
| emissionsTrend | `year, actual, target` |
| waterTrend | `year, total, recycled` |
| buildingsWater | `name, drinking, technical, irrigation` |
| wasteTrend | `year, actual, target` |
| esgTrend | `year, score` |

---

## 🔐 Changing the Admin Password

In `/src/data/defaultData.js`, change:
```js
adminPassword: "kbtu2024"  // ← change this
```
Then rebuild and redeploy.

---

## 📊 Data Storage

- All edits are saved in **browser localStorage** (no server needed)
- Data persists across browser sessions on the same device
- To reset to defaults: Admin Login → click "🔄 Reset Data"
- For multi-user shared editing, consider upgrading to a backend (Firebase, Supabase)

---

## 📁 Project Structure

```
kbtu-dashboard/
├── public/
│   └── index.html
├── src/
│   ├── data/
│   │   └── defaultData.js    ← All default values here
│   ├── components/
│   │   ├── HomePage.js
│   │   ├── EnergyPage.js
│   │   ├── OtherPages.js     ← Emissions, Water, Waste, Environment
│   │   ├── TableEditor.js    ← Excel/CSV import + inline editor
│   │   └── UI.js             ← Shared components
│   ├── DataContext.js        ← Global state management
│   ├── importUtils.js        ← Excel/CSV parsing & export
│   └── App.js                ← Root component
├── netlify.toml
├── vercel.json
└── package.json
```

---

## 🔧 Adding New Charts / Sections

1. Add your data to `defaultData.js`
2. Add chart code in the relevant page component
3. Add the section key to `TABLE_TITLES` in `App.js`
4. Add column schema to `SCHEMA` in `TableEditor.js`

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| react, react-dom | UI framework |
| chart.js + react-chartjs-2 | All charts |
| xlsx | Excel file parsing |
| papaparse | CSV parsing |
| lucide-react | Icons |

---

*Dashboard designed to match KBTU brand visual mockups.*  
*For questions: @KBTUINST | @ESGINST*
