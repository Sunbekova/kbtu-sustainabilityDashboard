// defaultData.js — Initial dataset. Replace with real KBTU data.
// All data is stored in localStorage after first load, and can be
// updated via Excel/CSV upload or the inline editor.

export const DEFAULT_DATA = {
  meta: {
    university: "KBTU",
    lastUpdated: "2024-01-01",
    baseYear: 2020,
    targetYear: 2035
  },

  impactCategories: [
    { label: 'Energy',            value: 41, color: '#2d5a3d' },
    { label: 'Water',             value: 24, color: '#5a8a6a' },
    { label: 'Waste',             value: 19, color: '#8ab890' },
    { label: 'Green Initiatives', value: 16, color: '#b8d4bc' },
  ],
  
  // ── KPI Summary ──────────────────────────────────────────────
  kpi: {
    esgScore:   { value: 74,      unit: "/ 100",    delta: +6,   deltaLabel: "vs 2022" },
    energy:     { value: 42800,   unit: "MWh/year", delta: -8,   deltaLabel: "% vs 2022" },
    water:      { value: 182400,  unit: "m³/year",  delta: -12,  deltaLabel: "% vs 2022" },
    wasteDiv:   { value: 68,      unit: "% recycled", delta: +5, deltaLabel: "pp vs 2022" }
  },

  // ── Energy ───────────────────────────────────────────────────
  energy: {
    naturalGas:  { total: 18640, unit: "MWh", vsLastYear: -6,  baselinePct: 72, target: 60 },
    thermal:     { total: 12300, unit: "Gcal", vsLastYear: -9, renewablePct: 38, target: 60 },
    electricity: { total: 11860, unit: "MWh", vsLastYear: -11, solarMWh: 2140, renewablePct: 18, target: 50 }
  },

  // ── Energy trend by year ──────────────────────────────────────
  energyTrend: [
    { year: 2018, naturalGas: 22000, thermal: 15200, electricity: 14800 },
    { year: 2019, naturalGas: 21500, thermal: 14800, electricity: 14200 },
    { year: 2020, naturalGas: 20800, thermal: 14100, electricity: 13400 },
    { year: 2021, naturalGas: 20200, thermal: 13600, electricity: 13100 },
    { year: 2022, naturalGas: 19800, thermal: 13500, electricity: 13300 },
    { year: 2023, naturalGas: 18640, thermal: 12300, electricity: 11860 }
  ],

  // ── Top buildings energy ──────────────────────────────────────
  buildingsEnergy: [
    { name: "Research Hub",   mwh: 8420, kwh_m2: 210, delta: +2 },
    { name: "Main Building",  mwh: 7180, kwh_m2: 165, delta: -8 },
    { name: "Sports Complex", mwh: 5640, kwh_m2: 142, delta: -5 },
    { name: "Library",        mwh: 4290, kwh_m2: 118, delta: -12 },
    { name: "Dormitories",    mwh: 3870, kwh_m2: 95,  delta: -6 }
  ],

  // ── Emissions ─────────────────────────────────────────────────
  emissions: {
    scope1: 6840, scope2: 4210, total: 11050, perStudent: 1.24,
    bySource: [
      { source: "Gas Heating",   tco2e: 4200 },
      { source: "Vehicles",      tco2e: 1840 },
      { source: "Electricity",   tco2e: 3100 },
      { source: "Refrigerants",  tco2e: 620  },
      { source: "Waste",         tco2e: 480  },
      { source: "Other",         tco2e: 810  }
    ]
  },

  emissionsTrend: [
    { year: 2019, actual: 14200, target: 14200 },
    { year: 2020, actual: 13800, target: 13500 },
    { year: 2021, actual: 13100, target: 12800 },
    { year: 2022, actual: 12800, target: 12000 },
    { year: 2023, actual: 11050, target: 11000 },
    { year: 2025, actual: null,  target: 9500  },
    { year: 2030, actual: null,  target: 5000  },
    { year: 2035, actual: null,  target: 0     }
  ],

  // ── Water ─────────────────────────────────────────────────────
  water: {
    total: 182400, perStudent: 22, intensity: 3.8, recycledPct: 28, recycledTarget: 40,
    byType: [
      { type: "Drinking/Sanitation", m3: 68000 },
      { type: "Technical/HVAC",      m3: 52000 },
      { type: "Irrigation",          m3: 38000 },
      { type: "Grey water reuse",    m3: 18000 },
      { type: "Rainwater collected", m3: 6400  }
    ]
  },

  waterTrend: [
    { year: 2018, total: 224000, recycled: 12000 },
    { year: 2019, total: 218000, recycled: 16000 },
    { year: 2020, total: 207000, recycled: 22000 },
    { year: 2021, total: 196000, recycled: 28000 },
    { year: 2022, total: 190000, recycled: 38000 },
    { year: 2023, total: 182400, recycled: 51072 }
  ],

  buildingsWater: [
    { name: "Main Building",  drinking: 28000, technical: 18000, irrigation: 4000  },
    { name: "Research Hub",   drinking: 12000, technical: 22000, irrigation: 2000  },
    { name: "Sports Complex", drinking: 8000,  technical: 4000,  irrigation: 18000 },
    { name: "Library",        drinking: 6000,  technical: 3000,  irrigation: 1500  },
    { name: "Dormitories",    drinking: 14000, technical: 5000,  irrigation: 8000  }
  ],

  // ── Waste ─────────────────────────────────────────────────────
  waste: {
    total: 618, diversionRate: 68, composted: 12, hazardous: 4.2,
    byType: [
      { type: "Mixed / Residual",   tonnes: 198, color: "#c44444" },
      { type: "Paper & Cardboard",  tonnes: 154, color: "#5a8a6a" },
      { type: "Plastic",            tonnes: 112, color: "#8ab890" },
      { type: "Organic / Food",     tonnes: 74,  color: "#2d5a3d" },
      { type: "Glass & Metal",      tonnes: 54,  color: "#b8d4bc" },
      { type: "Hazardous",          tonnes: 4.2, color: "#aa4444" }
    ]
  },

  wasteTrend: [
    { year: 2019, actual: 48, target: 50 },
    { year: 2020, actual: 52, target: 55 },
    { year: 2021, actual: 58, target: 60 },
    { year: 2022, actual: 63, target: 65 },
    { year: 2023, actual: 68, target: 70 }
  ],

  // ── Environment / Green ───────────────────────────────────────
  environment: {
    greenProjects: 34, greenAreaM2: 42800, communityEngaged: 3640, greenRoofM2: 1800,
    sdgProgress: [
      { sdg: 6,  label: "Clean Water",          pct: 72, color: "#00a0d2" },
      { sdg: 7,  label: "Clean Energy",          pct: 48, color: "#fcc30b" },
      { sdg: 11, label: "Sustainable Cities",    pct: 65, color: "#fd9d24" },
      { sdg: 12, label: "Responsible Consumption", pct: 58, color: "#bf8b2e" },
      { sdg: 13, label: "Climate Action",        pct: 52, color: "#3f7e44" },
      { sdg: 15, label: "Life on Land",          pct: 61, color: "#0a97d9" }
    ],
    initiatives: [
      { category: "Landscaping",  count: 8 },
      { category: "LED Retrofit", count: 6 },
      { category: "Cycle Parks",  count: 4 },
      { category: "Eco Events",   count: 7 },
      { category: "Solar Install",count: 3 },
      { category: "Green Roof",   count: 2 },
      { category: "Composting",   count: 3 },
      { category: "EV Charging",  count: 1 }
    ],
    transport: [
      { mode: "Public Transit", pct: 38 },
      { mode: "Walking",        pct: 22 },
      { mode: "Cycling",        pct: 15 },
      { mode: "Private Car",    pct: 14 },
      { mode: "Carpool",        pct: 8  },
      { mode: "Other",          pct: 3  }
    ],
    procurement: [
      { label: "Eco-certified products", pct: 62 },
      { label: "Local suppliers (<200km)", pct: 45 },
      { label: "Plastic-free packaging",  pct: 38 }
    ]
  },

  // ── ESG Score trend ───────────────────────────────────────────
  esgTrend: [
    { year: 2019, score: 52 },
    { year: 2020, score: 56 },
    { year: 2021, score: 60 },
    { year: 2022, score: 68 },
    { year: 2023, score: 74 }
  ],
};
