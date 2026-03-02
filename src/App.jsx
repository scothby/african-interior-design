import { useState, useMemo, useEffect } from "react";
import DB from "./african-styles-db.json";
import InteriorDesignApp from "./InteriorDesignApp";
import Gallery from "./Gallery";
import LandingPage from "./LandingPage";
import "./App.css";

const FAMILY_COLORS = {
  "Terres & Banco": "#8B4513",
  "Textiles Royaux": "#8B6914",
  "Côtier Swahili": "#1B4F72",
  "Géométrique Peint": "#1A237E",
  "Sauvage & Nomade": "#4A235A",
  "Islamique Africain": "#B71C1C",
  "Tropical Équatorial": "#1B5E20",
  "Urbain Contemporain": "#212121"
};

const FAMILY_ICONS = {
  "Terres & Banco": "🏺",
  "Textiles Royaux": "🧵",
  "Côtier Swahili": "⛵",
  "Géométrique Peint": "◈",
  "Sauvage & Nomade": "🌿",
  "Islamique Africain": "☪",
  "Tropical Équatorial": "🌴",
  "Urbain Contemporain": "🏙"
};

export default function App() {
  const [currentApp, setCurrentApp] = useState(() => {
    return localStorage.getItem('interior_ai_last_page') || 'landing';
  });
  const [search, setSearch] = useState("");
  const [activeRegion, setActiveRegion] = useState("Tout");
  const [activeFamily, setActiveFamily] = useState("Tout");
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const filtered = useMemo(() => {
    return DB.styles.filter(s => {
      const matchSearch = !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.country.toLowerCase().includes(search.toLowerCase()) ||
        s.family.toLowerCase().includes(search.toLowerCase());
      const matchRegion = activeRegion === "Tout" || s.region === activeRegion;
      const matchFamily = activeFamily === "Tout" || s.family === activeFamily;
      return matchSearch && matchRegion && matchFamily;
    });
  }, [search, activeRegion, activeFamily]);

  useEffect(() => {
    localStorage.setItem('interior_ai_last_page', currentApp);
  }, [currentApp]);

  const copyPrompt = (prompt) => {
    navigator.clipboard?.writeText(prompt);
    setCopied(prompt);
    setTimeout(() => setCopied(null), 2000);
  };

  const selectedStyle = selected ? DB.styles.find(s => s.id === selected) : null;

  // Render Landing Page
  if (currentApp === "landing") {
    return (
      <LandingPage
        onEnterDesigner={() => setCurrentApp("designer")}
        onEnterGallery={() => setCurrentApp("gallery")}
        onEnterDatabase={() => setCurrentApp("database")}
      />
    );
  }

  // Render Interior Designer App
  if (currentApp === "designer") {
    return <InteriorDesignApp onBack={() => setCurrentApp("landing")} onGoToStyles={() => setCurrentApp("database")} />;
  }

  // Render Gallery
  if (currentApp === "gallery") {
    return <Gallery onBack={() => setCurrentApp("landing")} onGoToStyles={() => setCurrentApp("database")} />;
  }

  // Render Database View (existing)

  return (
    <div style={{ background: "var(--color-bg-dark)", minHeight: "100vh", color: "var(--color-text-main)" }}>
      {/* Kente header bar */}
      <div style={{ height: "5px", background: "linear-gradient(90deg,#8B0000,#B8860B,#228B22,#1A2744,#B8860B,#C41E3A,#B8860B,#228B22,#8B0000)" }} />

      {/* Header */}
      <header className="glass-panel" style={{ padding: "28px 32px 20px", borderBottom: `1px solid var(--color-border)`, borderTop: "none", borderLeft: "none", borderRight: "none", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "0.35em", color: "var(--color-primary)", textTransform: "uppercase", marginBottom: "4px" }}>
              Base de données
            </div>
            <h1 style={{ margin: 0, fontSize: "clamp(20px,3vw,32px)" }}>
              Styles Africains <span style={{ color: "var(--color-primary)" }}>·</span> <span style={{ color: "var(--color-text-muted)", fontSize: "0.6em" }}>{filtered.length} / {DB.styles.length}</span>
            </h1>
          </div>

          {/* Hamburger Menu Button (Mobile Only) */}
          <button
            className={`mobile-menu-btn ${isMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>

          {/* Desktop Navigation */}
          <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              className="btn-secondary"
              onClick={() => setCurrentApp("landing")}
              style={{ padding: "10px 20px", borderRadius: "4px", fontSize: "13px" }}
            >
              🏠 Accueil
            </button>
            <button
              className="btn-primary"
              onClick={() => setCurrentApp("designer")}
              style={{ padding: "10px 20px", borderRadius: "4px", fontSize: "13px" }}
            >
              🏛️ African Interior Designer
            </button>
            <button
              className="btn-secondary"
              onClick={() => setCurrentApp("gallery")}
              style={{ padding: "10px 20px", borderRadius: "4px", fontSize: "13px" }}
            >
              🖼️ Galerie
            </button>
            {/* Search */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un style, pays, famille..."
              style={{
                background: "var(--color-bg-dark)", border: "1px solid var(--color-border)", color: "var(--color-text-main)",
                padding: "10px 16px", borderRadius: "4px", fontSize: "13px",
                width: "280px", fontFamily: "var(--font-body)", outline: "none", transition: "border-color 0.3s"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
              onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
            />
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        <div className={`mobile-nav-overlay ${isMenuOpen ? 'open' : ''}`}>
          <div className="mobile-nav-links">
            <button onClick={() => { setCurrentApp("landing"); setIsMenuOpen(false); }}>
              🏠 Accueil
            </button>
            <button onClick={() => { setCurrentApp("designer"); setIsMenuOpen(false); }}>
              🏛️ Designer
            </button>
            <button onClick={() => { setCurrentApp("gallery"); setIsMenuOpen(false); }}>
              🖼️ Galerie
            </button>

            {/* Mobile Search */}
            <div style={{ padding: "0 20px", width: "100%", boxSizing: "border-box", marginTop: "20px" }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                style={{
                  background: "rgba(0,0,0,0.5)", border: "1px solid var(--color-border)", color: "var(--color-text-main)",
                  padding: "14px 16px", borderRadius: "8px", fontSize: "16px",
                  width: "100%", boxSizing: "border-box", fontFamily: "var(--font-body)", outline: "none"
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div style={{ marginTop: "20px", display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
        {/* Region filter */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["Tout", ...DB.regions].map(r => (
            <button key={r} onClick={() => setActiveRegion(r)} style={{
              padding: "5px 12px", border: `1px solid ${activeRegion === r ? "#B8860B" : "#2A1A0E"}`,
              background: activeRegion === r ? "rgba(184,134,11,0.12)" : "transparent",
              color: activeRegion === r ? "#B8860B" : "#6B5030", cursor: "pointer",
              fontSize: "11px", letterSpacing: "0.08em", borderRadius: "2px",
              fontFamily: "Georgia, serif", transition: "all 0.15s"
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* Family filter */}
      <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
        <button onClick={() => setActiveFamily("Tout")} style={{
          padding: "5px 12px", border: `1px solid ${activeFamily === "Tout" ? "#B8860B" : "#2A1A0E"}`,
          background: activeFamily === "Tout" ? "rgba(184,134,11,0.12)" : "transparent",
          color: activeFamily === "Tout" ? "#B8860B" : "#6B5030", cursor: "pointer",
          fontSize: "11px", borderRadius: "2px", fontFamily: "Georgia, serif"
        }}>Toutes</button>
        {DB.families.map(f => (
          <button key={f} onClick={() => setActiveFamily(f)} style={{
            padding: "5px 12px",
            border: `1px solid ${activeFamily === f ? FAMILY_COLORS[f] : "#2A1A0E"}`,
            background: activeFamily === f ? `${FAMILY_COLORS[f]}22` : "transparent",
            color: activeFamily === f ? FAMILY_COLORS[f] : "#6B5030",
            cursor: "pointer", fontSize: "11px", borderRadius: "2px",
            fontFamily: "Georgia, serif", transition: "all 0.15s"
          }}>{FAMILY_ICONS[f]} {f}</button>
        ))}
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 200px)" }}>
        {/* Grid */}
        <div style={{
          flex: 1, padding: "24px 28px",
          display: "grid",
          gridTemplateColumns: selected ? "repeat(auto-fill, minmax(200px, 1fr))" : "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "12px", alignContent: "start"
        }}>
          {filtered.map(style => (
            <div
              key={style.id}
              onClick={() => setSelected(selected === style.id ? null : style.id)}
              style={{
                background: "#120B05",
                border: `1px solid ${selected === style.id ? "#B8860B" : "#1E1208"}`,
                borderRadius: "4px", cursor: "pointer",
                transition: "all 0.2s",
                transform: selected === style.id ? "scale(1.01)" : "scale(1)",
                overflow: "hidden"
              }}
              onMouseEnter={e => { if (selected !== style.id) e.currentTarget.style.borderColor = "#3A2A15"; }}
              onMouseLeave={e => { if (selected !== style.id) e.currentTarget.style.borderColor = "#1E1208"; }}
            >
              {/* Color strip */}
              <div style={{ display: "flex", height: "6px" }}>
                {style.colors.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
              </div>

              <div style={{ padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span style={{ fontSize: "18px" }}>{style.flag}</span>
                  <span style={{
                    fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase",
                    color: FAMILY_COLORS[style.family] || "#B8860B",
                    padding: "2px 6px", border: `1px solid ${FAMILY_COLORS[style.family]}44`,
                    borderRadius: "2px"
                  }}>{style.family}</span>
                </div>
                <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "2px", color: "#F0E6D3" }}>{style.name}</div>
                <div style={{ fontSize: "11px", color: "#8B7050", marginBottom: "8px" }}>{style.country}</div>
                <p style={{ fontSize: "12px", color: "#7A6040", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                  {style.description.substring(0, 80)}…
                </p>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 20px", color: "#6B5030", fontStyle: "italic" }}>
              Aucun style trouvé pour cette recherche.
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedStyle && (
          <div style={{
            width: "360px", flexShrink: 0,
            borderLeft: "1px solid #1E1208",
            background: "#0E0905",
            padding: "28px",
            overflowY: "auto",
            maxHeight: "calc(100vh - 200px)",
            position: "sticky", top: 0
          }}>
            {/* Color palette */}
            <div style={{ display: "flex", height: "60px", borderRadius: "3px", overflow: "hidden", marginBottom: "20px" }}>
              {selectedStyle.colors.map((c, i) => (
                <div key={i} title={selectedStyle.colorNames?.[i] || c} style={{ flex: 1, background: c, cursor: "pointer" }} />
              ))}
            </div>

            <div style={{ fontSize: "10px", letterSpacing: "0.25em", color: "#B8860B", textTransform: "uppercase", marginBottom: "6px" }}>
              {selectedStyle.region}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span style={{ fontSize: "28px" }}>{selectedStyle.flag}</span>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "normal" }}>{selectedStyle.name}</h2>
            </div>
            <div style={{ fontSize: "12px", color: "#8B7050", marginBottom: "12px" }}>
              {selectedStyle.country} · <span style={{ color: FAMILY_COLORS[selectedStyle.family] }}>{selectedStyle.family}</span>
            </div>

            <p style={{ fontSize: "13px", color: "#A08060", lineHeight: 1.7, fontStyle: "italic", marginBottom: "20px" }}>
              {selectedStyle.description}
            </p>

            {/* Colors */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B5030", marginBottom: "8px" }}>Palette</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selectedStyle.colors.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#160E07", padding: "5px 8px", borderRadius: "2px" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: c, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: "9px", color: "#6B5030" }}>{selectedStyle.colorNames?.[i] || `Couleur ${i + 1}`}</div>
                      <div style={{ fontSize: "10px", color: "#B8860B", fontFamily: "monospace" }}>{c}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Materials */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B5030", marginBottom: "8px" }}>Matières & Matériaux</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {selectedStyle.materials.map((m, i) => (
                  <span key={i} style={{
                    padding: "3px 8px", background: "#1A1008",
                    border: "1px solid #2A1A0E", borderRadius: "2px",
                    fontSize: "11px", color: "#A08060"
                  }}>{m}</span>
                ))}
              </div>
            </div>

            {/* Patterns */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B5030", marginBottom: "8px" }}>Motifs & Patterns</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {selectedStyle.patterns.map((p, i) => (
                  <span key={i} style={{
                    padding: "3px 8px", background: "#1A1008",
                    border: "1px solid #2A1A0E", borderRadius: "2px",
                    fontSize: "11px", color: "#A08060"
                  }}>{p}</span>
                ))}
              </div>
            </div>

            {/* Rooms */}
            {selectedStyle.rooms && (
              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B5030", marginBottom: "8px" }}>Pièces adaptées</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {selectedStyle.rooms.map((r, i) => (
                    <span key={i} style={{
                      padding: "3px 8px", background: "#1A1008",
                      border: "1px solid #2A1A0E", borderRadius: "2px",
                      fontSize: "11px", color: "#A08060"
                    }}>{r}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt */}
            <div>
              <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B5030", marginBottom: "8px" }}>
                Prompt Replicate / FLUX
              </div>
              <div style={{
                background: "#0A0603", border: "1px solid #2A1A0E",
                borderRadius: "3px", padding: "12px",
                fontSize: "11px", color: "#8B7050", lineHeight: 1.6,
                fontFamily: "monospace", marginBottom: "8px"
              }}>
                {selectedStyle.prompt}
              </div>
              <button
                onClick={() => copyPrompt(selectedStyle.prompt)}
                style={{
                  width: "100%", padding: "10px",
                  background: copied === selectedStyle.prompt ? "#228B22" : "transparent",
                  border: `1px solid ${copied === selectedStyle.prompt ? "#228B22" : "#2A1A0E"}`,
                  color: copied === selectedStyle.prompt ? "#FFFFFF" : "#B8860B",
                  cursor: "pointer", fontSize: "11px", letterSpacing: "0.2em",
                  textTransform: "uppercase", borderRadius: "2px",
                  fontFamily: "Georgia, serif", transition: "all 0.2s"
                }}
              >
                {copied === selectedStyle.prompt ? "✓ Copié !" : "⎘ Copier le prompt"}
              </button>
            </div>

            <button
              onClick={() => setSelected(null)}
              style={{
                width: "100%", padding: "8px", marginTop: "12px",
                background: "transparent", border: "1px solid #1E1208",
                color: "#4A3A25", cursor: "pointer", fontSize: "10px",
                letterSpacing: "0.2em", textTransform: "uppercase",
                borderRadius: "2px", fontFamily: "Georgia, serif"
              }}
            >✕ Fermer</button>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div style={{
        borderTop: "1px solid #1E1208", padding: "16px 32px",
        display: "flex", gap: "24px", flexWrap: "wrap"
      }}>
        {DB.families.map(f => {
          const count = DB.styles.filter(s => s.family === f).length;
          return (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px" }}>{FAMILY_ICONS[f]}</span>
              <span style={{ fontSize: "10px", color: "#4A3A25" }}>{f}</span>
              <span style={{ fontSize: "10px", color: FAMILY_COLORS[f], fontWeight: "bold" }}>{count}</span>
            </div>
          );
        })}
      </div>

      <div style={{ height: "5px", background: "linear-gradient(90deg,#1A2744,#B8860B,#228B22,#8B0000,#B8860B,#1A2744)" }} />
    </div >
  );
}
