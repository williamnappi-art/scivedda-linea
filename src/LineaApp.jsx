import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://gzqkzognzapilpvduelj.supabase.co",
  "sb_publishable_CoJ9ZnMUNwQb57UzAWKJMQ_N9LHylV0"
);

const DASHBOARD_URL = "https://scivedda-bowl-order.vercel.app/";
// ID sessione univoco per evitare loop Realtime
const SESSION_ID = Math.random().toString(36).slice(2);

// ─── Ingredienti ────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "basi",
    label: "BASI",
    icon: "🫙",
    items: [
      { id: "fregola", name: "Fregula Sarda" },
      { id: "riso-bianco", name: "Riso Bianco" },
      { id: "riso-rosso", name: "Riso Rosso" },
      { id: "riso-nero", name: "Riso Nero" },
      { id: "farro", name: "Farro" },
      { id: "insalata", name: "Insalata" },
    ],
  },
  {
    id: "proteine",
    label: "PROTEINE",
    icon: "🐟",
    items: [
      { id: "salmone-crudo", name: "Salmone Crudo" },
      { id: "salmone-cotto", name: "Salmone Cotto" },
      { id: "tonno-crudo", name: "Tonno Crudo" },
      { id: "tonno-cotto", name: "Tonno Cotto" },
      { id: "gambero-cotto", name: "Gambero Cotto" },
      { id: "polpo", name: "Polpo" },
      { id: "uovo-pula", name: "Uovo di Pula" },
      { id: "maiale-sfilacciato", name: "Maiale Sfilacciato" },
      { id: "polletto", name: "Polletto" },
      { id: "tofu-naturale", name: "Tofu Naturale" },
      { id: "legumi", name: "Legumi" },
    ],
  },
  {
    id: "verdure",
    label: "VERDURE",
    icon: "🥗",
    items: [
      { id: "avocado", name: "Avocado" },
      { id: "cipolla-rossa", name: "Cipolla Rossa" },
      { id: "olive-parteolla", name: "Olive" },
      { id: "cetriolo", name: "Cetriolo" },
      { id: "pomodorini-pula", name: "Pomodorini" },
      { id: "edamame", name: "Edamame" },
      { id: "mais", name: "Mais" },
      { id: "mango", name: "Mango" },
      { id: "carote", name: "Carote" },
      { id: "ceci", name: "Ceci" },
      { id: "zucchina-fritta", name: "Zucchina Fritta" },
      { id: "cavolo-viola", name: "Cavolo Viola" },
      { id: "finocchio", name: "Finocchio" },
      { id: "verdura-stagione", name: "Verdura di Stagione" },
      { id: "pomodoro-secco", name: "Pomodoro Secco" },
      { id: "ananas", name: "Ananas" },
      { id: "frutta-stagione", name: "Frutta di Stagione" },
      { id: "jalapeno", name: "Jalapeño" },
    ],
  },
  {
    id: "croccanti",
    label: "CROCCANTI",
    icon: "✨",
    items: [
      { id: "chips-cipolla", name: "Chips di Cipolla" },
      { id: "semi-zucca", name: "Semi di Zucca" },
      { id: "sesamo", name: "Sesamo" },
      { id: "zenzero-rosa", name: "Zenzero Rosa" },
      { id: "noci", name: "Noci" },
      { id: "mandorle", name: "Mandorle" },
      { id: "semi-canapa", name: "Semi di Canapa" },
      { id: "anacardi", name: "Anacardi" },
      { id: "pistacchio", name: "Pistacchio" },
      { id: "kataifi", name: "Kataifi" },
      { id: "pane-guttiau", name: "Pane Guttiau" },
    ],
  },
  {
    id: "salse",
    label: "SALSE",
    icon: "🫗",
    items: [
      { id: "soia", name: "Soia" },
      { id: "wasabi-maio", name: "Wasabi Maio" },
      { id: "teriyaki", name: "Teriyaki" },
      { id: "zenzero-maio", name: "Zenzero Maio" },
      { id: "spicy-maio", name: "Spicy Maio" },
      { id: "yogurt-dressing", name: "Yogurt Dressing" },
      { id: "maio-tartufo", name: "Maio Tartufo" },
      { id: "olio-evo", name: "Olio EVO" },
      { id: "wasabi", name: "Wasabi" },
    ],
  },
  {
    id: "special",
    label: "SPECIAL",
    icon: "⭐",
    items: [
      { id: "caprino", name: "Caprino Fresco" },
      { id: "cipolla-cara", name: "Cipolla Caramellata" },
      { id: "ricotta-mustia", name: "Ricotta Mustia" },
      { id: "philadelphia", name: "Philadelphia" },
      { id: "bufala", name: "Mozzarella di Bufala" },
      { id: "casu-axedu", name: "Casu Axedu" },
      { id: "bottarga", name: "Bottarga" },
      { id: "wakame", name: "Alga Wakame" },
    ],
  },
];

function getDateKey() {
  return "linea";
}

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Buongiorno 🌅";
  if (h >= 12 && h < 18) return "Buon pomeriggio ☀️";
  return "Buonasera 🌙";
}

function formatTime(d) {
  return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(d) {
  return d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
}

// ─── Ingredient Card ─────────────────────────────────────────────────────────
// Tap: gray → red → green → gray
// Piccolo tasto ✏ in basso a destra per editare la quantità

function IngredCard({ item, status, qty, onTap, onEditQty, onRemove }) {
  const dragRef = useRef(null);
  const bg =
    status === "green" ? "#2d7a2d" :
    status === "red"   ? "#c0392b" :
    "#fff";
  const border =
    status === "green" ? "#4caf50" :
    status === "red"   ? "#e53935" :
    "#e8e0d4";
  const nameColor =
    status === "green" ? "#fff" :
    status === "red"   ? "rgba(255,255,255,0.75)" :
    "#888";
  const qtyColor =
    status === "green" ? "#fff" :
    status === "red"   ? "#fff" :
    "#333";

  return (
    <div
      onPointerDown={e => { dragRef.current = { x: e.clientX, y: e.clientY }; }}
      onPointerUp={e => {
        if (!dragRef.current) return;
        const dx = Math.abs(e.clientX - dragRef.current.x);
        const dy = Math.abs(e.clientY - dragRef.current.y);
        dragRef.current = null;
        if (dx < 8 && dy < 8) onTap();
      }}
      style={{
        background: bg,
        border: `2px solid ${border}`,
        borderRadius: 12,
        padding: "12px 12px 10px",
        cursor: "pointer",
        transition: "background 0.12s, border-color 0.12s",
        position: "relative",
        minHeight: 80,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* Nome ingrediente */}
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: nameColor,
        lineHeight: 1.2,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        paddingRight: onRemove ? 18 : 0,
      }}>
        {item.name}
      </div>

      {/* Quantità / stato — grande e chiaro */}
      {status === "green" && !qty ? (
        <div style={{
          flexGrow: 1, display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ fontSize: 22 }}>✅</span>
          <span style={{
            fontSize: 16, fontWeight: 800, color: "#fff",
            fontFamily: "DM Sans, sans-serif", letterSpacing: 0.5,
          }}>Fatto!</span>
        </div>
      ) : (
        <div style={{
          fontWeight: 700,
          color: qty ? qtyColor : (status === "red" ? "#fff" : "#bbb"),
          lineHeight: 1.1,
          fontFamily: (qty || status === "red") ? "Jaapokki, sans-serif" : "DM Sans, sans-serif",
          letterSpacing: (qty || status === "red") ? 1 : 0,
          fontSize: qty ? 22 : (status === "red" ? 16 : 12),
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
        }}>
          {qty
            ? <>{qty}{status === "green" && <span style={{ marginLeft: 6, fontSize: 14 }}>✅</span>}</>
            : (status === "red" ? "DA FARE" : "—")}
        </div>
      )}

      {/* Tasto modifica quantità */}
      <button
        onClick={e => { e.stopPropagation(); onEditQty(); }}
        style={{
          position: "absolute",
          bottom: 6,
          right: 6,
          background: (status === "green" || status === "red") ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.07)",
          border: "none",
          borderRadius: 8,
          color: (status === "green" || status === "red") ? "rgba(255,255,255,0.7)" : "#aaa",
          fontSize: 15,
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          lineHeight: 1,
        }}
        title="Modifica quantità"
      >✏</button>

      {/* × rimuovi (solo custom) */}
      {onRemove && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            background: "none",
            border: "none",
            color: (status === "green" || status === "red") ? "rgba(255,255,255,0.5)" : "#bbb",
            fontSize: 16,
            lineHeight: 1,
            cursor: "pointer",
            padding: 2,
          }}
        >×</button>
      )}
    </div>
  );
}

// ─── Modal generico ───────────────────────────────────────────────────────────

function Modal({ title, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 380,
        border: "1px solid #e8e0d4"
      }}>
        <div style={{ fontFamily: "Jaapokki, sans-serif", fontSize: 16, color: "#d4763c", marginBottom: 16 }}>
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Reset modale ─────────────────────────────────────────────────────────────

function ResetModal({ onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <div style={{
        background: "#1e1e1e", borderRadius: 16, padding: 28, width: "100%", maxWidth: 340,
        border: "1px solid #e53935", textAlign: "center"
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
        <div style={{ fontFamily: "Jaapokki, sans-serif", fontSize: 22, color: "#e53935", marginBottom: 8 }}>
          RESET LINEA
        </div>
        <div style={{ fontSize: 14, color: "#aaa", marginBottom: 24, lineHeight: 1.6 }}>
          Tutti gli ingredienti torneranno a grigio e le quantità verranno cancellate. Sei sicuro?
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 14, background: "#2a2a2a", color: "#ccc", borderRadius: 10, fontSize: 15 }}>Annulla</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: 14, background: "#e53935", color: "#fff", borderRadius: 10, fontSize: 15, fontWeight: 700 }}>Reset</button>
        </div>
      </div>
    </div>
  );
}

// ─── State helpers ────────────────────────────────────────────────────────────

const STORAGE_KEY = "scivedda_linea_v2";

function loadLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveLocalState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, dateKey: getDateKey() }));
}

function buildInitialStatuses(customItems = {}) {
  const s = {};
  SECTIONS.forEach(sec => {
    sec.items.forEach(item => { s[item.id] = "gray"; });
    (customItems[sec.id] || []).forEach(item => { s[item.id] = "gray"; });
  });
  return s;
}

function buildInitialQtys(customItems = {}) {
  const q = {};
  SECTIONS.forEach(sec => {
    sec.items.forEach(item => { q[item.id] = ""; });
    (customItems[sec.id] || []).forEach(item => { q[item.id] = ""; });
  });
  return q;
}

async function upsertSupabase(state) {
  await supabase.from("linea_state").upsert({
    date_key: getDateKey(),
    statuses: state.statuses,
    qtys: state.qtys,
    custom_items: state.customItems,
    extras: state.extras,
    to_order: state.toOrder,
    session_id: SESSION_ID,
    updated_at: new Date().toISOString(),
  });
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function LineaApp() {
  const local = loadLocalState();

  const [customItems, setCustomItems] = useState(local?.customItems || {});
  const [statuses, setStatuses]       = useState(local?.statuses    || buildInitialStatuses());
  const [qtys, setQtys]               = useState(local?.qtys        || buildInitialQtys());
  const [extras, setExtras]           = useState(local?.extras      || []);
  const [toOrder, setToOrder]         = useState(local?.toOrder     || {}); // { [itemId]: { name, sectionLabel } }
  const [synced, setSynced]           = useState(false);

  // UI state
  const [editingQty, setEditingQty]   = useState(null);
  const [addingTo, setAddingTo]       = useState(null);
  const [showReset, setShowReset]     = useState(false);
  const [newExtra, setNewExtra]       = useState("");
  const [now, setNow]                 = useState(new Date());

  const debounceRef = useRef(null);

  // Orologio
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(t);
  }, []);

  // Applica stato remoto (da Realtime o fetch iniziale)
  const applyRemote = useCallback((row) => {
    if (!row) return;
    setStatuses(row.statuses || {});
    setQtys(row.qtys || {});
    setCustomItems(row.custom_items || {});
    setExtras(row.extras || []);
    setToOrder(row.to_order || {});
  }, []);

  // Fetch iniziale + sottoscrizione Realtime
  useEffect(() => {
    const dateKey = getDateKey();

    supabase
      .from("linea_state")
      .select("*")
      .eq("date_key", dateKey)
      .single()
      .then(({ data }) => {
        if (data) applyRemote(data);
        setSynced(true);
      });

    const channel = supabase
      .channel("linea_realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "linea_state",
        filter: `date_key=eq.${dateKey}`,
      }, (payload) => {
        const row = payload.new;
        if (row?.session_id === SESSION_ID) return; // ignora i propri aggiornamenti
        applyRemote(row);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [applyRemote]);

  // Persiste locale + manda a Supabase (debounced 600ms)
  const syncState = useCallback((state) => {
    saveLocalState({ ...state, toOrder: state.toOrder || toOrder });
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => upsertSupabase({ ...state, toOrder: state.toOrder ?? toOrder }), 600);
  }, [toOrder]);

  // Tap: gray → red → green → gray
  const handleTap = useCallback((id) => {
    setStatuses(prev => {
      const next = { ...prev, [id]: prev[id] === "gray" ? "red" : prev[id] === "red" ? "green" : "gray" };
      syncState({ statuses: next, qtys, customItems, extras });
      return next;
    });
  }, [qtys, customItems, extras, syncState]);

  function saveQty(val) {
    const next = { ...qtys, [editingQty.id]: val.trim() };
    setQtys(next);
    syncState({ statuses, qtys: next, customItems, extras });
    setEditingQty(null);
  }

  function addCustomItem(sectionId, name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = `custom-${sectionId}-${Date.now()}`;
    const nextCustom = { ...customItems, [sectionId]: [...(customItems[sectionId] || []), { id, name: trimmed }] };
    const nextStatuses = { ...statuses, [id]: "gray" };
    const nextQtys = { ...qtys, [id]: "" };
    setCustomItems(nextCustom);
    setStatuses(nextStatuses);
    setQtys(nextQtys);
    syncState({ statuses: nextStatuses, qtys: nextQtys, customItems: nextCustom, extras });
    setAddingTo(null);
  }

  function removeCustomItem(sectionId, itemId) {
    const nextCustom = { ...customItems, [sectionId]: (customItems[sectionId] || []).filter(i => i.id !== itemId) };
    const nextToOrder = { ...toOrder };
    delete nextToOrder[itemId];
    setCustomItems(nextCustom);
    setToOrder(nextToOrder);
    syncState({ statuses, qtys, customItems: nextCustom, extras, toOrder: nextToOrder });
  }

  function addExtra() {
    const text = newExtra.trim();
    if (!text) return;
    const nextExtras = [...extras, { id: Date.now(), text }];
    setExtras(nextExtras);
    syncState({ statuses, qtys, customItems, extras: nextExtras });
    setNewExtra("");
  }

  function removeExtra(id) {
    const nextExtras = extras.filter(e => e.id !== id);
    setExtras(nextExtras);
    syncState({ statuses, qtys, customItems, extras: nextExtras });
  }

  function toggleToOrder(itemId, itemName, sectionLabel) {
    const next = { ...toOrder };
    if (next[itemId]) {
      delete next[itemId];
    } else {
      next[itemId] = { name: itemName, sectionLabel };
    }
    setToOrder(next);
    syncState({ statuses, qtys, customItems, extras, toOrder: next });
  }

  function handleReset() {
    const nextStatuses = buildInitialStatuses(customItems);
    const nextQtys = buildInitialQtys(customItems);
    setStatuses(nextStatuses);
    setQtys(nextQtys);
    setExtras([]);
    setToOrder({});
    syncState({ statuses: nextStatuses, qtys: nextQtys, customItems, extras: [], toOrder: {} });
    setShowReset(false);
  }

  // Contatori
  const allIds = [
    ...SECTIONS.flatMap(s => s.items.map(i => i.id)),
    ...Object.values(customItems).flat().map(i => i.id),
  ];
  const greenCount = allIds.filter(id => statuses[id] === "green").length;
  const redCount   = allIds.filter(id => statuses[id] === "red").length;
  const totalCount = allIds.length;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 0 60px" }}>

      {/* ─── Header ─── */}
      <header style={{
        background: "#faf7f2", borderBottom: "1px solid #e8e0d4",
        padding: "14px 20px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ fontFamily: "Jaapokki, sans-serif", fontSize: 20, color: "#d4763c", letterSpacing: 1 }}>
          SCIVEDDA
          <div style={{ fontSize: 11, fontFamily: "DM Sans, sans-serif", letterSpacing: 3, marginTop: 1, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ color: "#aaa" }}>CUCINA — LINEA</span>
            <span style={{ fontSize: 8, color: synced ? "#4caf50" : "#aaa" }} title={synced ? "Connesso" : "Connessione..."}>●</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowReset(true)}
            style={{ background: "#fff0ef", color: "#e53935", border: "1px solid #f5cac8", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 700 }}
          >RESET</button>
          <a
            href={DASHBOARD_URL} target="_blank" rel="noreferrer"
            style={{ background: "#d4763c", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}
          >ORDINI ↗</a>
        </div>
      </header>

      <div style={{ padding: "0 14px" }}>

        {/* ─── Hero ─── */}
        <div style={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #231b14 100%)",
          border: "1px solid #2e2218", borderRadius: 16,
          padding: "18px 22px", marginTop: 16,
          display: "flex", flexWrap: "wrap", gap: 12,
          alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontFamily: "Jaapokki, sans-serif", fontSize: 24, color: "#d4763c" }}>{getGreeting()}</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 3, textTransform: "capitalize" }}>{formatDate(now)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "Jaapokki, sans-serif", fontSize: 42, color: "#f5f0e8", letterSpacing: 3, lineHeight: 1 }}>
              {formatTime(now)}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <span style={{
                background: "#2d7a2d", color: "#fff",
                borderRadius: 20, padding: "4px 10px",
                fontSize: 13, fontWeight: 700,
              }}>✅ {greenCount} fatti</span>
              <span style={{
                background: "#c0392b", color: "#fff",
                borderRadius: 20, padding: "4px 10px",
                fontSize: 13, fontWeight: 700,
              }}>⚠ {redCount} da fare</span>
              <span style={{
                background: "rgba(255,255,255,0.1)", color: "#aaa",
                borderRadius: 20, padding: "4px 10px",
                fontSize: 13, fontWeight: 600,
              }}>— {totalCount - greenCount - redCount}</span>
            </div>
          </div>
        </div>

        {/* ─── Altro ─── */}
        <div style={{ background: "#fff", border: "1px solid #e8e0d4", borderRadius: 14, padding: "14px 18px", marginTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#bbb", letterSpacing: 2, marginBottom: 10 }}>📋 ALTRO</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {extras.map(item => (
              <div key={item.id} style={{
                background: "#faf7f2", border: "1px solid #e8e0d4", borderRadius: 10,
                padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ flex: 1, fontSize: 15, color: "#333" }}>{item.text}</span>
                <button
                  onClick={() => removeExtra(item.id)}
                  style={{ background: "none", border: "none", color: "#ccc", fontSize: 20, lineHeight: 1, cursor: "pointer", padding: "0 2px" }}
                >×</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={newExtra}
                onChange={e => setNewExtra(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addExtra()}
                placeholder="Aggiungi voce..."
                style={{ flex: 1, background: "#faf7f2", border: "1px solid #e8e0d4", borderRadius: 10, padding: "10px 14px", color: "#333", fontSize: 14 }}
              />
              <button
                onClick={addExtra}
                style={{ background: "#d4763c", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 20, fontWeight: 700, cursor: "pointer" }}
              >+</button>
            </div>
          </div>
        </div>

        {/* ─── Sezioni ingredienti ─── */}
        {SECTIONS.map(section => (
          <Section
            key={section.id}
            section={section}
            customItems={customItems[section.id] || []}
            statuses={statuses}
            qtys={qtys}
            toOrder={toOrder}
            onTap={handleTap}
            onEditQty={(id, name) => setEditingQty({ id, name })}
            onRemoveCustom={(id) => removeCustomItem(section.id, id)}
            onAddNew={() => setAddingTo(section.id)}
            onToggleToOrder={(id, name) => toggleToOrder(id, name, section.label)}
          />
        ))}

        {/* ─── DA ORDINARE ─── */}
        {Object.keys(toOrder).length > 0 && (
          <div style={{ marginTop: 32, borderTop: "2px dashed #e8e0d4", paddingTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>🛒</span>
              <span style={{ fontFamily: "Jaapokki, sans-serif", fontSize: 15, color: "#d4763c", letterSpacing: 1 }}>DA ORDINARE</span>
              <span style={{ fontSize: 11, color: "#bbb", marginLeft: 2 }}>{Object.keys(toOrder).length} voci</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(toOrder).map(([id, { name, sectionLabel }]) => (
                <div key={id} style={{
                  background: "#fff", border: "1px solid #e8e0d4", borderRadius: 10,
                  padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{name}</div>
                    <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>{sectionLabel}</div>
                  </div>
                  <button
                    onClick={() => toggleToOrder(id, name, sectionLabel)}
                    style={{ background: "#f0ece4", border: "none", borderRadius: 8, color: "#999", fontSize: 13, padding: "6px 12px", cursor: "pointer", fontWeight: 600 }}
                  >✓ fatto</button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ─── Modal: modifica quantità ─── */}
      {editingQty && (
        <QtyModal
          name={editingQty.name}
          initialValue={qtys[editingQty.id] || ""}
          onSave={saveQty}
          onCancel={() => setEditingQty(null)}
        />
      )}

      {/* ─── Modal: aggiungi voce ─── */}
      {addingTo && (
        <AddItemModal
          sectionLabel={SECTIONS.find(s => s.id === addingTo)?.label || addingTo}
          onAdd={(name) => addCustomItem(addingTo, name)}
          onCancel={() => setAddingTo(null)}
        />
      )}

      {/* ─── Modal: reset ─── */}
      {showReset && (
        <ResetModal onConfirm={handleReset} onCancel={() => setShowReset(false)} />
      )}
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

function Section({ section, customItems, statuses, qtys, toOrder, onTap, onEditQty, onRemoveCustom, onAddNew, onToggleToOrder }) {
  const allItems = [...section.items, ...customItems];
  const greenCount = allItems.filter(i => (statuses[i.id] || "gray") === "green").length;

  return (
    <div style={{ marginTop: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>{section.icon}</span>
        <span style={{ fontFamily: "Jaapokki, sans-serif", fontSize: 15, color: "#d4763c", letterSpacing: 1 }}>
          {section.label}
        </span>
        <span style={{ fontSize: 11, color: "#bbb", marginLeft: 2 }}>{greenCount}/{allItems.length}</span>
        <button
          onClick={onAddNew}
          style={{ marginLeft: "auto", background: "#d4763c", color: "#fff", border: "none", borderRadius: 8, width: 30, height: 30, fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
        >+</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
        {allItems.map(item => (
          <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <IngredCard
              item={item}
              status={statuses[item.id] || "gray"}
              qty={qtys[item.id] || ""}
              onTap={() => onTap(item.id)}
              onEditQty={() => onEditQty(item.id, item.name)}
              onRemove={customItems.includes(item) ? () => onRemoveCustom(item.id) : undefined}
            />
            <button
              onClick={() => onToggleToOrder(item.id, item.name)}
              style={{
                background: toOrder[item.id] ? "#d4763c" : "#f0ece4",
                color: toOrder[item.id] ? "#fff" : "#aaa",
                border: "none", borderRadius: 8,
                padding: "5px 0", fontSize: 11, fontWeight: 700,
                cursor: "pointer", width: "100%",
                transition: "background 0.15s",
              }}
            >{toOrder[item.id] ? "🛒 in lista" : "da ordinare"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Modal: modifica quantità ────────────────────────────────────────────────

function QtyModal({ name, initialValue, onSave, onCancel }) {
  const [val, setVal] = useState(initialValue);
  return (
    <Modal title={name.toUpperCase()}>
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onSave(val)}
        placeholder="es: 2kg, scarso, da fare, 500g..."
        style={{
          width: "100%", background: "#faf7f2", border: "1px solid #e8e0d4",
          borderRadius: 8, padding: "12px 14px", color: "#1a1a1a", fontSize: 18,
          fontWeight: 700, letterSpacing: 0.5,
        }}
      />
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: 12, background: "#f0ece4", color: "#888", borderRadius: 8, fontSize: 14 }}>Annulla</button>
        <button onClick={() => onSave(val)} style={{ flex: 2, padding: 12, background: "#d4763c", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 700 }}>Salva</button>
      </div>
    </Modal>
  );
}

// ─── Modal: aggiungi voce ─────────────────────────────────────────────────────

function AddItemModal({ sectionLabel, onAdd, onCancel }) {
  const [val, setVal] = useState("");
  return (
    <Modal title={`+ AGGIUNGI A ${sectionLabel}`}>
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onAdd(val)}
        placeholder="Nome ingrediente..."
        style={{
          width: "100%", background: "#faf7f2", border: "1px solid #e8e0d4",
          borderRadius: 8, padding: "12px 14px", color: "#1a1a1a", fontSize: 16,
        }}
      />
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: 12, background: "#f0ece4", color: "#888", borderRadius: 8, fontSize: 14 }}>Annulla</button>
        <button onClick={() => onAdd(val)} style={{ flex: 2, padding: 12, background: "#d4763c", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 700 }}>Aggiungi</button>
      </div>
    </Modal>
  );
}
