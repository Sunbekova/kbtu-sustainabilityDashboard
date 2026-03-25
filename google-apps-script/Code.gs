/**
 * ═══════════════════════════════════════════════════════════
 *  KBTU Sustainable Campus Dashboard — Google Apps Script
 * ═══════════════════════════════════════════════════════════
 *
 *  SETUP INSTRUCTIONS:
 *  1. Open your Google Sheet
 *  2. Extensions → Apps Script
 *  3. Paste this entire file, click Save
 *  4. Click "Deploy" → "New deployment" → Type: Web App
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  5. Copy the Web App URL → paste into dashboard config
 *
 *  SHEET STRUCTURE (create these exact tab names):
 *  - KPI
 *  - EnergyTrend
 *  - BuildingsEnergy
 *  - EmissionsTrend
 *  - EmissionsBySource
 *  - WaterByType
 *  - WaterTrend
 *  - BuildingsWater
 *  - WasteByType
 *  - WasteTrend
 *  - SDGProgress
 *  - Initiatives
 *  - Transport
 *  - Procurement
 *  - EsgTrend
 *  - Meta
 * ═══════════════════════════════════════════════════════════
 */

const ADMIN_PASSWORD = "kbtu2025";

// ── Main entry point ─────────────────────────────────────
function doGet(e) {
  const action = e.parameter.action || "getData";
  const password = e.parameter.password || "";

  let result;

  if (action === "getData") {
    result = getAllData();
  } else if (action === "writeRow") {
    if (password !== ADMIN_PASSWORD) {
      result = { error: "Unauthorized" };
    } else {
      result = writeRow(
        e.parameter.sheet,
        JSON.parse(e.parameter.row || "[]")
      );
    }
  } else if (action === "replaceSheet") {
    if (password !== ADMIN_PASSWORD) {
      result = { error: "Unauthorized" };
    } else {
      result = replaceSheet(
        e.parameter.sheet,
        JSON.parse(e.parameter.data || "[]")
      );
    }
  } else {
    result = { error: "Unknown action" };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({ "Access-Control-Allow-Origin": "*" });
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch { return err("Invalid JSON"); }

  const { action, password, sheet, data } = body;

  if (password !== ADMIN_PASSWORD) return err("Unauthorized");

  if (action === "replaceSheet") return ok(replaceSheet(sheet, data));
  if (action === "appendRow")    return ok(writeRow(sheet, data));

  return err("Unknown action");
}

function err(msg) {
  return ContentService.createTextOutput(JSON.stringify({ error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
function ok(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Read all sheets into one JSON object ─────────────────
function getAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  function sheetToObjects(name) {
    try {
      const sheet = ss.getSheetByName(name);
      if (!sheet) return [];
      const [headers, ...rows] = sheet.getDataRange().getValues();
      return rows
        .filter(r => r.some(v => v !== "" && v !== null))
        .map(r => {
          const obj = {};
          headers.forEach((h, i) => { 
            if (h) obj[String(h).trim()] = r[i]; 
          });
          return obj;
        });
    } catch(e) { 
      return []; 
    }
  }

  function sheetToKV(name) {
    try {
      const sheet = ss.getSheetByName(name);
      if (!sheet) return {};
      const rows = sheet.getDataRange().getValues();
      const obj = {};
      rows.forEach(([key, value]) => { 
        if (key) obj[String(key).trim()] = value; 
      });
      return obj;
    } catch(e) { 
      return {}; 
    }
  }

  const meta = sheetToKV("Meta");
  const kpiRaw = sheetToObjects("KPI");

  const kpi = {};
  kpiRaw.forEach(r => {
    kpi[r.key] = {
      value: r.value,
      unit: r.unit,
      delta: r.delta,
      deltaLabel: r.deltaLabel
    };
  });

  return {
    meta,
    kpi,
    jsmapPoints: sheetToObjects("MapPoints")
  };
}
  const energy = sheetToKV("Energy");

  return {
    meta,
    kpi,
    energy: {
      naturalGas:  { total: energy.gasTotal, unit: energy.gasUnit, vsLastYear: energy.gasVsLastYear, baselinePct: energy.gasBaselinePct, target: energy.gasTarget },
      thermal:     { total: energy.thermalTotal, unit: energy.thermalUnit, vsLastYear: energy.thermalVsLastYear, renewablePct: energy.thermalRenewablePct, target: energy.thermalTarget },
      electricity: { total: energy.elecTotal, unit: energy.elecUnit, vsLastYear: energy.elecVsLastYear, solarMWh: energy.elecSolarMWh, renewablePct: energy.elecRenewablePct, target: energy.elecTarget }
    },
    energyTrend:      sheetToObjects("EnergyTrend"),
    buildingsEnergy:  sheetToObjects("BuildingsEnergy"),
    emissions:        buildEmissions(sheetToObjects("EmissionsBySource"), sheetToKV("Emissions")),
    emissionsTrend:   sheetToObjects("EmissionsTrend"),
    water:            buildWater(sheetToKV("WaterMeta"), sheetToObjects("WaterByType")),
    waterTrend:       sheetToObjects("WaterTrend"),
    buildingsWater:   sheetToObjects("BuildingsWater"),
    waste:            buildWaste(sheetToKV("WasteMeta"), sheetToObjects("WasteByType")),
    wasteTrend:       sheetToObjects("WasteTrend"),
    environment:      buildEnvironment(ss),
    esgTrend:         sheetToObjects("EsgTrend"),
    _timestamp:       new Date().toISOString()
  };
}

function buildEmissions(bySource, kv) {
  return { scope1: kv.scope1, scope2: kv.scope2, total: kv.total, perStudent: kv.perStudent, bySource };
}
function buildWater(kv, byType) {
  return { total: kv.total, perStudent: kv.perStudent, intensity: kv.intensity, recycledPct: kv.recycledPct, recycledTarget: kv.recycledTarget, byType };
}
function buildWaste(kv, byType) {
  return { total: kv.total, diversionRate: kv.diversionRate, composted: kv.composted, hazardous: kv.hazardous, byType };
}
function buildEnvironment(ss) {
  function get(name) {
    try {
      const sheet = ss.getSheetByName(name);
      if (!sheet) return [];
      const [headers, ...rows] = sheet.getDataRange().getValues();
      return rows.filter(r => r.some(v => v !== "")).map(r => {
        const obj = {};
        headers.forEach((h, i) => { if (h) obj[String(h).trim()] = r[i]; });
        return obj;
      });
    } catch(e) { return []; }
  }
  const kv = {};
  try {
    const sheet = ss.getSheetByName("EnvironmentMeta");
    if (sheet) sheet.getDataRange().getValues().forEach(([k,v]) => { if(k) kv[k] = v; });
  } catch(e) {}

  return {
    greenProjects: kv.greenProjects || 0,
    greenAreaM2: kv.greenAreaM2 || 0,
    communityEngaged: kv.communityEngaged || 0,
    greenRoofM2: kv.greenRoofM2 || 0,
    sdgProgress:  get("SDGProgress"),
    initiatives:  get("Initiatives"),
    transport:    get("Transport"),
    procurement:  get("Procurement")
  };
}

// ── Write helpers ─────────────────────────────────────────
function writeRow(sheetName, rowArray) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { error: `Sheet "${sheetName}" not found` };
  sheet.appendRow(rowArray);
  return { success: true, sheet: sheetName };
}

function replaceSheet(sheetName, dataArray) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  sheet.clearContents();
  if (!dataArray || !dataArray.length) return { success: true };
  const headers = Object.keys(dataArray[0]);
  sheet.appendRow(headers);
  dataArray.forEach(row => sheet.appendRow(headers.map(h => row[h] ?? "")));
  return { success: true, rows: dataArray.length };
}

// ── Setup: create all sheets with headers ─────────────────
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheets = {
    "Meta":           [["key","value"],["university","KBTU"],["lastUpdated","2024-01-01"],["baseYear","2020"],["targetYear","2035"]],
    "KPI":            [["key","value","unit","delta","deltaLabel"],["esgScore",74,"/100",6,"vs 2022"],["energy",42800,"MWh/year",-8,"% vs 2022"],["water",182400,"m³/year",-12,"% vs 2022"],["wasteDiv",68,"% recycled",5,"pp vs 2022"]],
    "Energy":         [["key","value"],["gasTotal",18640],["gasUnit","MWh"],["gasVsLastYear",-6],["gasBaselinePct",72],["gasTarget",60],["thermalTotal",12300],["thermalUnit","Gcal"],["thermalVsLastYear",-9],["thermalRenewablePct",38],["thermalTarget",60],["elecTotal",11860],["elecUnit","MWh"],["elecVsLastYear",-11],["elecSolarMWh",2140],["elecRenewablePct",18],["elecTarget",50]],
    "EnergyTrend":    [["year","naturalGas","thermal","electricity"],[2018,22000,15200,14800],[2019,21500,14800,14200],[2020,20800,14100,13400],[2021,20200,13600,13100],[2022,19800,13500,13300],[2023,18640,12300,11860]],
    "BuildingsEnergy":[["name","mwh","kwh_m2","delta"],["Research Hub",8420,210,2],["Main Building",7180,165,-8],["Sports Complex",5640,142,-5],["Library",4290,118,-12],["Dormitories",3870,95,-6]],
    "Emissions":      [["key","value"],["scope1",6840],["scope2",4210],["total",11050],["perStudent",1.24]],
    "EmissionsBySource":[["source","tco2e"],["Gas Heating",4200],["Vehicles",1840],["Electricity",3100],["Refrigerants",620],["Waste",480],["Other",810]],
    "EmissionsTrend": [["year","actual","target"],[2019,14200,14200],[2020,13800,13500],[2021,13100,12800],[2022,12800,12000],[2023,11050,11000],[2025,"",9500],[2030,"",5000],[2035,"",0]],
    "WaterMeta":      [["key","value"],["total",182400],["perStudent",22],["intensity",3.8],["recycledPct",28],["recycledTarget",40]],
    "WaterByType":    [["type","m3"],["Drinking/Sanitation",68000],["Technical/HVAC",52000],["Irrigation",38000],["Grey water reuse",18000],["Rainwater collected",6400]],
    "WaterTrend":     [["year","total","recycled"],[2018,224000,12000],[2019,218000,16000],[2020,207000,22000],[2021,196000,28000],[2022,190000,38000],[2023,182400,51072]],
    "BuildingsWater": [["name","drinking","technical","irrigation"],["Main Building",28000,18000,4000],["Research Hub",12000,22000,2000],["Sports Complex",8000,4000,18000],["Library",6000,3000,1500],["Dormitories",14000,5000,8000]],
    "WasteMeta":      [["key","value"],["total",618],["diversionRate",68],["composted",12],["hazardous",4.2]],
    "WasteByType":    [["type","tonnes","color"],["Mixed / Residual",198,"#c44444"],["Paper & Cardboard",154,"#5a8a6a"],["Plastic",112,"#8ab890"],["Organic / Food",74,"#2d5a3d"],["Glass & Metal",54,"#b8d4bc"],["Hazardous",4.2,"#aa4444"]],
    "WasteTrend":     [["year","actual","target"],[2019,48,50],[2020,52,55],[2021,58,60],[2022,63,65],[2023,68,70]],
    "EnvironmentMeta":[["key","value"],["greenProjects",34],["greenAreaM2",42800],["communityEngaged",3640],["greenRoofM2",1800]],
    "SDGProgress":    [["sdg","label","pct","color"],[6,"Clean Water",72,"#00a0d2"],[7,"Clean Energy",48,"#fcc30b"],[11,"Sustainable Cities",65,"#fd9d24"],[12,"Responsible Consumption",58,"#bf8b2e"],[13,"Climate Action",52,"#3f7e44"],[15,"Life on Land",61,"#0a97d9"]],
    "Initiatives":    [["category","count"],["Landscaping",8],["LED Retrofit",6],["Cycle Parks",4],["Eco Events",7],["Solar Install",3],["Green Roof",2],["Composting",3],["EV Charging",1]],
    "Transport":      [["mode","pct"],["Public Transit",38],["Walking",22],["Cycling",15],["Private Car",14],["Carpool",8],["Other",3]],
    "Procurement":    [["label","pct"],["Eco-certified products",62],["Local suppliers (<200km)",45],["Plastic-free packaging",38]],
    "EsgTrend":       [["year","score"],[2019,52],[2020,56],[2021,60],[2022,68],[2023,74]]
    "MapPoints": [
      ["id","lat","lng","category","title","building","year","note"],
      [1, 51.1801, 71.4460, "tree",      "Oak grove",           "Main Building",  2021, ""],
      [2, 51.1798, 71.4455, "recycling", "Paper recycling bin", "Library",        2022, "Near entrance"],
    ],
  };

  Object.entries(sheets).forEach(([name, rows]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    sheet.clearContents();
    rows.forEach(r => sheet.appendRow(r));
  });

  SpreadsheetApp.getUi().alert("All sheets created with sample data!");
}

// ── Menu ──────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🌿 KBTU Dashboard")
    .addItem("Setup all sheets", "setupSheets")
    .addToUi();
}
