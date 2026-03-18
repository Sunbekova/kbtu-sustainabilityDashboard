import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { useData } from "../DataContext";
import { useLang } from "../LangContext";
import "leaflet/dist/leaflet.css";
import { t } from "../translations";

// Fix default marker icons
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

// ─── Categories (keys only) ───────────────────
const CATEGORIES = [
  "tree",
  "recycling",
  "waste_bin",
  "water",
  "solar",
  "ev_charger",
  "bike_rack",
  "green_roof",
  "composting",
];

// Colors per category
const CATEGORY_COLORS = {
  tree: "#2d5a3d",
  recycling: "#5a8a6a",
  waste_bin: "#c44444",
  water: "#00a0d2",
  solar: "#e8a000",
  ev_charger: "#7b61ff",
  bike_rack: "#fd9d24",
  green_roof: "#3f7e44",
  composting: "#6aa84f",
};

// Emoji per category (for marker)
const CATEGORY_EMOJI = {
  tree: "🌳",
  recycling: "♻️",
  waste_bin: "🗑️",
  water: "💧",
  solar: "☀️",
  ev_charger: "⚡",
  bike_rack: "🚲",
  green_roof: "🏢",
  composting: "🌱",
};

// Create custom icon
const createIcon = (cat) =>
  L.divIcon({
    html: `
      <div style="
        background:${CATEGORY_COLORS[cat]};
        width:32px;height:32px;
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        color:white;
        font-size:16px;
        box-shadow:0 2px 6px rgba(0,0,0,.3);
      ">
        ${CATEGORY_EMOJI[cat]}
      </div>
    `,
    className: "",
    iconSize: [32, 32],
  });

// ─── Empty point ─────────────────────────────
const EMPTY_POINT = {
  lat: "",
  lng: "",
  category: "tree",
  title: "",
  building: "",
  year: new Date().getFullYear(),
  note: "",
};

// ─── Map click handler ───────────────────────
function MapClickHandler({ isAdmin, setShowModal, setFormData }) {
  useMapEvents({
    click(e) {
      if (!isAdmin) return;

      setFormData({
        ...EMPTY_POINT,
        lat: e.latlng.lat.toFixed(6),
        lng: e.latlng.lng.toFixed(6),
      });

      setShowModal(true);
    },
  });

  return null;
}

// ─── Component ───────────────────────────────
export default function MapPage() {
  const { data, isAdmin, importTable, pushToSheets, config } = useData();
  const { lang } = useLang();

  const points = data.mapPoints || [];

  const [filterCats, setFilterCats] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_POINT);
  const [editingPoint, setEditingPoint] = useState(null);

  // Toggle multi-filter
  const toggleCat = (cat) => {
    setFilterCats((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  };

  const filtered = points.filter((p) => {
    if (filterCats.length && !filterCats.includes(p.category)) return false;
    return true;
  });

  // Save
  const savePoint = () => {
    if (!formData.title) return;

    let updated;

    if (editingPoint !== null) {
      updated = points.map((p) =>
        p.id === editingPoint
          ? { ...formData, id: editingPoint }
          : p
      );
    } else {
      const newId = Math.max(0, ...points.map((p) => p.id || 0)) + 1;
      updated = [...points, { ...formData, id: newId }];
    }

    importTable("mapPoints", updated);

    if (config?.dataSource === "sheets") {
      pushToSheets("MapPoints", updated);
    }

    setShowModal(false);
    setEditingPoint(null);
    setFormData(EMPTY_POINT);
  };

  const deletePoint = (id) => {
    const updated = points.filter((p) => p.id !== id);
    importTable("mapPoints", updated);
  };

  return (
    <div style={{ display: "flex", height: "90vh" }}>
      {/* MAP */}
      <div style={{ flex: 1 }}>
        <MapContainer
          center={[43.25566, 76.94326]}
          zoom={16}
          style={{ height: "100%" }}
        >
          <TileLayer
            attribution="© OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler
            isAdmin={isAdmin}
            setShowModal={setShowModal}
            setFormData={setFormData}
          />

          {filtered.map((p) => (
            <Marker
              key={p.id}
              position={[Number(p.lat), Number(p.lng)]}
              icon={createIcon(p.category)}
            >
              <Popup>
                <b>{p.title}</b>
                <div>{t(`cat_${p.category}`, lang)}</div>
                <div>🏢 {p.building || "-"}</div>
                <div>📅 {p.year}</div>
                {p.note && <div>{p.note}</div>}

                {isAdmin && (
                  <>
                    <button
                      onClick={() => {
                        setEditingPoint(p.id);
                        setFormData(p);
                        setShowModal(true);
                      }}
                    >
                      ✏️ {t("map_edit_point", lang)}
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(t("map_delete_confirm", lang))) {
                          deletePoint(p.id);
                        }
                      }}
                    >
                      🗑 {t("map_delete_point", lang)}
                    </button>
                  </>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* SIDEBAR */}
      <div style={{ width: 220, padding: 12, background: "#eef5ee" }}>
        <h3>{t("map_legend", lang)}</h3>

        {CATEGORIES.map((cat) => (
          <div
            key={cat}
            onClick={() => toggleCat(cat)}
            style={{
              cursor: "pointer",
              padding: 6,
              borderRadius: 6,
              marginBottom: 4,
              background: filterCats.includes(cat)
                ? "#cfe3cf"
                : "transparent",
            }}
          >
            {t(`cat_${cat}`, lang)}
          </div>
        ))}

        <hr />

        <div>
          {t("map_total_points", lang)}: {filtered.length}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 12,
              width: 400,
            }}
          >
            <h3>
              {editingPoint !== null
                ? t("map_edit_point", lang)
                : t("map_add_point", lang)}
            </h3>

            <input
              placeholder={t("map_point_title", lang)}
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />

            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`cat_${cat}`, lang)}
                </option>
              ))}
            </select>

            <input
              placeholder={t("map_point_building", lang)}
              value={formData.building}
              onChange={(e) =>
                setFormData({ ...formData, building: e.target.value })
              }
            />

            <input
              type="number"
              value={formData.year}
              onChange={(e) =>
                setFormData({ ...formData, year: e.target.value })
              }
            />

            <textarea
              placeholder={t("map_point_note", lang)}
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
            />

            <div>
              📍 {formData.lat}, {formData.lng}
            </div>

            <button onClick={savePoint}>
              💾 {t("map_save_point", lang)}
            </button>

            <button onClick={() => setShowModal(false)}>
              {t("cancel", lang)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}