import { useState, useEffect } from "react";
import DB from "./african-styles-db.json";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const FAMILY_COLORS = {
    "Terres & Banco": "#8B4513",
    "Textiles Royaux": "#8B6914",
    "Côtier Swahili": "#1B4F72",
    "Géométrique Peint": "#4A235A",
    "Sauvage & Nomade": "#3D6B2C",
    "Islamique Africain": "#B71C1C",
    "Tropical Équatorial": "#1B5E20",
    "Urbain Contemporain": "#37474F",
};

const FAMILY_ICONS = {
    "Terres & Banco": "🏺",
    "Textiles Royaux": "🧵",
    "Côtier Swahili": "⛵",
    "Géométrique Peint": "◈",
    "Sauvage & Nomade": "🌿",
    "Islamique Africain": "☪",
    "Tropical Équatorial": "🌴",
    "Urbain Contemporain": "🏙",
};

const STEPS = [
    {
        icon: "📸",
        title: "Uploadez votre photo",
        desc: "Prenez une photo de n'importe quelle pièce. Salon, chambre, cuisine — tout fonctionne.",
    },
    {
        icon: "🎨",
        title: "Choisissez un style africain",
        desc: "Explorez 50+ styles authentiques : Kente, Touareg, Swahili, Ndebele, Agadez et bien plus.",
    },
    {
        icon: "✨",
        title: "L'IA transforme tout",
        desc: "Gemini AI applique le style en quelques secondes. Comparez avant/après, exportez en PDF ou explorez en monde 3D.",
    },
];

const FEATURES = [
    { icon: "🤖", label: "IA Gemini", desc: "Rendu photoréaliste" },
    { icon: "🌍", label: "Monde 3D", desc: "Exploration immersive" },
    { icon: "📄", label: "Export PDF", desc: "Fiche de design complète" },
    { icon: "🖼️", label: "Galerie", desc: "Toutes vos créations" },
    { icon: "🎨", label: "50+ styles", desc: "7 régions d'Afrique" },
    { icon: "🔒", label: "Sécurisé", desc: "Données protégées" },
];

const HERO_IMAGES = [
    "/families/TerresBanco.png",
    "/families/TextilesRoyaux.png",
    "/families/CotierSwahili.png",
    "/families/GeometriquePeint.png",
    "/families/SauvageNomade.png",
    "/families/IslamiqueAfricain.png",
    "/families/TropicalEquatorial.png",
    "/families/UrbainContemporain.png"
];

// Create stable random columns for the masonry outside the component to avoid reshuffling on re-render
const MASONRY_COLS = Array.from({ length: 6 }, () => [...HERO_IMAGES].sort(() => 0.5 - Math.random()));

export default function LandingPage({ onEnterDesigner, onEnterGallery, onEnterDatabase }) {
    const [visible, setVisible] = useState(false);
    const [hoveredFamily, setHoveredFamily] = useState(null);
    const [recentDesigns, setRecentDesigns] = useState([]);
    const [loadingGallery, setLoadingGallery] = useState(true);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/gallery`);
                if (res.ok) {
                    const data = await res.json();
                    setRecentDesigns(data.slice(0, 8)); // Top 8 recent
                }
            } catch (err) {
                console.error("Failed to fetch gallery for landing page", err);
            } finally {
                setLoadingGallery(false);
            }
        };
        fetchGallery();
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(t);
    }, []);

    const totalStyles = DB.styles.length;
    const totalRegions = DB.regions.length;
    const totalFamilies = DB.families.length;

    return (
        <div style={{ background: "var(--color-bg-dark)", minHeight: "100vh", color: "var(--color-text-main)", overflowX: "hidden" }}>

            {/* ── Keyframe styles ── */}
            <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes slideDown {
          0%   { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes floatGlobe {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50%       { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes pulseGold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(184,134,11,0); }
          50%       { box-shadow: 0 0 24px 4px rgba(184,134,11,0.25); }
        }
        .cta-primary:hover {
          transform: translateY(-2px) scale(1.03) !important;
          box-shadow: 0 8px 32px rgba(184,134,11,0.5) !important;
        }
        .cta-secondary:hover {
          background: rgba(184,134,11,0.15) !important;
          transform: translateY(-2px) !important;
        }
        .step-card:hover {
          border-color: rgba(184,134,11,0.5) !important;
          transform: translateY(-4px) !important;
        }
        .family-card:hover {
          transform: translateY(-4px) scale(1.02) !important;
        }
        .feature-chip:hover {
          border-color: #B8860B !important;
          background: rgba(184,134,11,0.1) !important;
        }
      `}</style>

            {/* ── Kente top bar ── */}
            <div style={{ height: "5px", background: "linear-gradient(90deg,#8B0000,#B8860B,#228B22,#1A2744,#B8860B,#C41E3A,#B8860B,#228B22,#8B0000)" }} />

            {/* ─────────────────────────────────────────────────────────────
          SECTION HÉRO
      ───────────────────────────────────────────────────────────── */}
            <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px 80px", textAlign: "center", overflow: "hidden" }}>

                {/* Animated Masonry Grid Background */}
                <div style={{
                    position: "absolute",
                    inset: "-50% -20%",
                    transform: "rotate(-12deg) scale(1.1)",
                    display: "flex",
                    gap: "16px",
                    opacity: 0.5,
                    pointerEvents: "none",
                    zIndex: 0,
                    overflow: "hidden"
                }}>
                    {MASONRY_COLS.map((col, i) => (
                        <div key={i} style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                            width: "calc(100vw / 5)",
                            animation: `${i % 2 === 0 ? 'slideUp' : 'slideDown'} ${40 + (i % 3) * 10}s linear infinite`
                        }}>
                            {/* Double the images to loop seamlessly */}
                            {[...col, ...col].map((img, j) => (
                                <img key={j} src={img} alt="" style={{ width: "100%", borderRadius: "12px", objectFit: "cover", boxShadow: "0 8px 24px rgba(0,0,0,0.8)" }} />
                            ))}
                        </div>
                    ))}
                </div>

                <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to bottom, transparent 0%, rgba(12, 8, 6, 0.2) 40%, var(--color-bg-dark) 100%)",
                    zIndex: 1,
                    pointerEvents: "none"
                }} />

                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "800px", height: "800px", background: "radial-gradient(ellipse at center, rgba(184,134,11,0.25) 0%, transparent 60%)", pointerEvents: "none", borderRadius: "50%", zIndex: 1 }} />

                {/* Contenu Héro en premier plan */}
                <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "1200px" }}>

                    {/* Globe animé */}
                    <div style={{ fontSize: "80px", animation: "floatGlobe 5s ease-in-out infinite", marginBottom: "28px", filter: "drop-shadow(0 0 24px rgba(184,134,11,0.4))", opacity: visible ? 1 : 0, transition: "opacity 0.6s" }}>
                        🌍
                    </div>

                    {/* Badge */}
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "5px 16px", border: "1px solid rgba(184,134,11,0.4)", borderRadius: "999px", background: "rgba(184,134,11,0.08)", fontSize: "11px", color: "#B8860B", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "24px", animation: visible ? "fadeUp 0.5s ease both" : "none", animationDelay: "0.1s" }}>
                        ✦ Design d'intérieur africain par IA
                    </div>

                    {/* Titre */}
                    <h1 style={{ margin: "0 0 20px", fontSize: "clamp(32px, 6vw, 68px)", lineHeight: 1.15, maxWidth: "840px", animation: visible ? "fadeUp 0.6s ease both" : "none", animationDelay: "0.2s" }}>
                        Transformez votre espace avec
                        <br />
                        <span style={{
                            background: "linear-gradient(90deg, var(--color-primary), #F0C040, var(--color-primary))",
                            backgroundSize: "200% auto",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            animation: "shimmer 3s linear infinite",
                            display: "inline-block"
                        }}>
                            l'âme de l'Afrique
                        </span>
                    </h1>

                    {/* Sous-titre */}
                    <p style={{ margin: "0 0 40px", fontSize: "clamp(15px, 2vw, 18px)", color: "#8B7050", maxWidth: "560px", lineHeight: 1.7, animation: visible ? "fadeUp 0.6s ease both" : "none", animationDelay: "0.3s" }}>
                        Uploadez une photo de votre pièce, choisissez parmi <strong style={{ color: "#B8860B" }}>{totalStyles}+ styles africains authentiques</strong> et laissez l'IA la transformer en quelques secondes.
                    </p>

                    {/* CTA Buttons */}
                    <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center", animation: visible ? "fadeUp 0.6s ease both" : "none", animationDelay: "0.4s" }}>
                        <button
                            className="btn-primary"
                            onClick={onEnterDesigner}
                            style={{ padding: "16px 40px", borderRadius: "8px", fontSize: "16px", animation: "pulseGold 3s ease infinite" }}
                        >
                            🏛️ Commencer le design
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={onEnterGallery}
                            style={{ padding: "16px 36px", borderRadius: "8px", fontSize: "16px" }}
                        >
                            🖼️ Voir la galerie
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={onEnterDatabase}
                            style={{ padding: "16px 36px", borderRadius: "8px", fontSize: "16px" }}
                        >
                            📚 Parcourir tous les styles
                        </button>
                    </div>

                    {/* Stats */}
                    <div style={{ display: "flex", gap: "40px", marginTop: "56px", flexWrap: "wrap", justifyContent: "center", animation: visible ? "fadeUp 0.6s ease both" : "none", animationDelay: "0.55s" }}>
                        {[
                            { value: `${totalStyles}+`, label: "Styles africains" },
                            { value: `${totalRegions}`, label: "Régions d'Afrique" },
                            { value: `${totalFamilies}`, label: "Familles de design" },
                        ].map((stat) => (
                            <div key={stat.label} style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "32px", fontWeight: "bold", color: "#B8860B", lineHeight: 1 }}>{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Hero Comparison Image */}
                    <div style={{
                        marginTop: "80px",
                        maxWidth: "1000px",
                        marginLeft: "auto",
                        marginRight: "auto",
                        borderRadius: "16px",
                        overflow: "hidden",
                        border: "1px solid #2A1A0E",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                        animation: visible ? "fadeUp 0.8s ease both" : "none",
                        animationDelay: "0.7s"
                    }}>
                        <img
                            src="/hero-comparison.png"
                            alt="Avant et Après Design Africain par IA"
                            style={{ width: "100%", height: "auto", display: "block" }}
                        />
                    </div>
                </div>
            </section>

            {/* ─────────────────────────────────────────────────────────────
          SECTION — COMMENT ÇA MARCHE
      ───────────────────────────────────────────────────────────── */}
            <section style={{ padding: "80px 24px", borderTop: "1px solid #1E1208", background: "#0E0905" }}>
                <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "56px" }}>
                        <div style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#B8860B", marginBottom: "12px" }}>✦ Comment ça marche</div>
                        <h2 style={{ margin: 0, fontSize: "clamp(22px, 4vw, 36px)", fontWeight: "normal" }}>Trois étapes, un résultat spectaculaire</h2>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                        {STEPS.map((step, i) => (
                            <div
                                key={i}
                                className="step-card glass-panel"
                                style={{ position: "relative", padding: "32px 28px", borderRadius: "10px", transition: "all 0.25s" }}
                            >
                                {/* Numéro de step */}
                                <div style={{ position: "absolute", top: "16px", right: "20px", fontSize: "44px", fontWeight: "bold", color: "rgba(184,134,11,0.08)", lineHeight: 1, fontFamily: "var(--font-heading)" }}>0{i + 1}</div>
                                <div style={{ fontSize: "40px", marginBottom: "16px" }}>{step.icon}</div>
                                <h3 style={{ margin: "0 0 10px", fontSize: "16px", fontWeight: "bold", color: "var(--color-text-main)" }}>{step.title}</h3>
                                <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.7 }}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─────────────────────────────────────────────────────────────
          SECTION — FAMILLES DE STYLES
      ───────────────────────────────────────────────────────────── */}
            <section style={{ padding: "80px 24px", borderTop: "1px solid #1E1208" }}>
                <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "56px" }}>
                        <div style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#B8860B", marginBottom: "12px" }}>✦ Styles disponibles</div>
                        <h2 style={{ margin: "0 0 12px", fontSize: "clamp(22px, 4vw, 36px)", fontWeight: "normal" }}>8 familles de design africain</h2>
                        <p style={{ margin: 0, color: "#6B5030", fontSize: "14px" }}>De l'architecture saharienne aux textiles royaux Ashanti, chaque style est authentique et documenté.</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px" }}>
                        {DB.families.map((family) => {
                            const color = FAMILY_COLORS[family] || "#B8860B";
                            const icon = FAMILY_ICONS[family] || "🌍";
                            const count = DB.styles.filter(s => s.family === family).length;
                            const isHovered = hoveredFamily === family;

                            // Terres & Banco -> TerresBanco
                            const imageName = family.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "");

                            return (
                                <div
                                    key={family}
                                    className="family-card glass-panel"
                                    onClick={onEnterDatabase}
                                    onMouseEnter={() => setHoveredFamily(family)}
                                    onMouseLeave={() => setHoveredFamily(null)}
                                    style={{
                                        padding: "0",
                                        background: isHovered ? `${color}18` : "var(--glass-bg)",
                                        border: `1px solid ${isHovered ? color : "var(--glass-border)"}`,
                                        borderRadius: "10px",
                                        cursor: "pointer",
                                        transition: "all 0.25s",
                                        overflow: "hidden"
                                    }}
                                >
                                    {/* Cover Image */}
                                    <div style={{
                                        height: "140px",
                                        background: "#0A0603",
                                        position: "relative",
                                        overflow: "hidden"
                                    }}>
                                        <img
                                            src={`/families/${imageName}.png`}
                                            alt={`Style ${family}`}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                filter: isHovered ? "brightness(1) contrast(1.1)" : "brightness(0.8) contrast(1)",
                                                transition: "all 0.4s",
                                                transform: isHovered ? "scale(1.05)" : "scale(1)"
                                            }}
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                        <div style={{
                                            position: "absolute",
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            height: "50%",
                                            background: "linear-gradient(to top, #120B05 0%, transparent 100%)"
                                        }} />
                                        <div style={{
                                            position: "absolute",
                                            top: "12px",
                                            right: "12px",
                                            fontSize: "20px",
                                            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                                        }}>
                                            {icon}
                                        </div>
                                    </div>

                                    {/* Text Content */}
                                    <div style={{ padding: "16px 20px" }}>
                                        {/* Bande couleur */}
                                        <div style={{ height: "3px", borderRadius: "1.5px", background: color, marginBottom: "12px", width: isHovered ? "100%" : "40%", transition: "width 0.3s" }} />
                                        <div style={{ fontSize: "15px", fontWeight: "bold", color: "#F0E6D3", marginBottom: "4px" }}>{family}</div>
                                        <div style={{ fontSize: "11px", color: color, fontWeight: "bold" }}>{count} style{count > 1 ? "s" : ""}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ─────────────────────────────────────────────────────────────
          SECTION — RÉGIONS D'AFRIQUE
      ───────────────────────────────────────────────────────────── */}
            <section style={{ padding: "80px 24px", borderTop: "1px solid #1E1208", background: "#0E0905" }}>
                <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "56px" }}>
                        <div style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#B8860B", marginBottom: "12px" }}>✦ Géographie du Design</div>
                        <h2 style={{ margin: "0 0 12px", fontSize: "clamp(22px, 4vw, 36px)", fontWeight: "normal" }}>{totalRegions} grandes régions culturelles</h2>
                        <p style={{ margin: 0, color: "#6B5030", fontSize: "14px" }}>Explorez la diversité architecturale et décorative à travers le continent.</p>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px" }}>
                        {DB.regions.map((region) => {
                            const count = DB.styles.filter(s => s.region === region).length;
                            return (
                                <button
                                    key={region}
                                    onClick={onEnterDatabase}
                                    style={{
                                        padding: "16px 24px",
                                        background: "#120B05",
                                        border: "1px solid #2A1A0E",
                                        borderRadius: "8px",
                                        color: "#F0E6D3",
                                        fontSize: "15px",
                                        fontWeight: "bold",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "8px",
                                        minWidth: "160px"
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = "#B8860B";
                                        e.currentTarget.style.transform = "translateY(-2px)";
                                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(184,134,11,0.1)";
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = "#2A1A0E";
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "none";
                                    }}
                                >
                                    <span>{region}</span>
                                    <span style={{ fontSize: "12px", color: "#8B7050", fontWeight: "normal" }}>{count} styles</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>
            {/* ─────────────────────────────────────────────────────────────
          SECTION — GALERIE RÉCENTE
      ───────────────────────────────────────────────────────────── */}
            {
                !loadingGallery && recentDesigns.length > 0 && (
                    <section style={{ padding: "80px 24px", borderTop: "1px solid #1E1208" }}>
                        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                            <div style={{ textAlign: "center", marginBottom: "48px" }}>
                                <div style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#B8860B", marginBottom: "12px" }}>✦ Inspirations</div>
                                <h2 style={{ margin: "0 0 12px", fontSize: "clamp(22px, 4vw, 36px)", fontWeight: "normal" }}>Dernières Créations</h2>
                                <p style={{ margin: 0, color: "#6B5030", fontSize: "14px" }}>Découvrez les intérieurs générés par la communauté.</p>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
                                {recentDesigns.map(entry => (
                                    <div key={entry.id} style={{
                                        background: "#120B05", border: "1px solid #1E1208", borderRadius: "8px", overflow: "hidden", transition: "all 0.2s"
                                    }} className="step-card">
                                        <div style={{ height: "200px", background: "#0A0603" }}>
                                            <img src={entry.generatedImage.startsWith('http') ? entry.generatedImage : `${API_BASE_URL}${entry.generatedImage}`} alt={entry.styleName} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = 'none'; }} />
                                        </div>
                                        <div style={{ padding: "14px" }}>
                                            <div style={{ fontSize: "15px", fontWeight: "bold", color: "#F0E6D3", marginBottom: "4px" }}>
                                                {entry.styleName}
                                            </div>
                                            <div style={{ fontSize: "11px", color: "#B8860B", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                                {entry.styleFamily}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ textAlign: "center", marginTop: "36px" }}>
                                <button
                                    onClick={onEnterGallery}
                                    className="cta-secondary"
                                    style={{ padding: "12px 32px", background: "transparent", border: "1px solid rgba(184,134,11,0.5)", borderRadius: "6px", color: "#B8860B", fontSize: "13px", cursor: "pointer", fontFamily: "Georgia, serif", transition: "all 0.2s" }}
                                >
                                    Explorer toute la galerie →
                                </button>
                            </div>
                        </div>
                    </section>
                )
            }

            {/* ─────────────────────────────────────────────────────────────
          SECTION — FONCTIONNALITÉS
      ───────────────────────────────────────────────────────────── */}
            <section style={{ padding: "80px 24px", borderTop: "1px solid #1E1208", background: "#0E0905" }}>
                <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
                    <div style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#B8860B", marginBottom: "12px" }}>✦ Fonctionnalités</div>
                    <h2 style={{ margin: "0 0 48px", fontSize: "clamp(22px, 4vw, 36px)", fontWeight: "normal" }}>Tout ce dont vous avez besoin</h2>

                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
                        {FEATURES.map((f) => (
                            <div
                                key={f.label}
                                className="feature-chip"
                                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "22px 28px", background: "#120B05", border: "1px solid #1E1208", borderRadius: "12px", minWidth: "120px", transition: "all 0.2s" }}
                            >
                                <span style={{ fontSize: "28px" }}>{f.icon}</span>
                                <span style={{ fontSize: "13px", fontWeight: "bold", color: "#F0E6D3" }}>{f.label}</span>
                                <span style={{ fontSize: "11px", color: "#6B5030" }}>{f.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─────────────────────────────────────────────────────────────
          SECTION — CTA FINAL
      ───────────────────────────────────────────────────────────── */}
            <section style={{ padding: "100px 24px", borderTop: "1px solid #1E1208", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(#2A1A0E 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.3, pointerEvents: "none" }} />
                <div style={{ position: "relative" }}>
                    <div style={{ fontSize: "56px", marginBottom: "24px", animation: "floatGlobe 6s ease-in-out infinite" }}>🌍</div>
                    <h2 style={{ margin: "0 0 16px", fontSize: "clamp(24px, 4vw, 42px)", fontWeight: "normal" }}>Prêt à transformer votre intérieur ?</h2>
                    <p style={{ margin: "0 0 40px", color: "#8B7050", fontSize: "15px" }}>Gratuit, sans inscription. Résultat en moins d'une minute.</p>
                    <button
                        className="cta-primary"
                        onClick={onEnterDesigner}
                        style={{ padding: "18px 56px", background: "linear-gradient(135deg, #B8860B, #8B6914)", border: "none", borderRadius: "8px", color: "#FFF8E7", fontSize: "17px", fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia, serif", transition: "all 0.25s" }}
                    >
                        🏛️ Commencer maintenant
                    </button>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer style={{ borderTop: "1px solid #1E1208", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ fontSize: "12px", color: "#4A3520" }}>
                    🏛️ African Interior Designer — {totalStyles} styles · {totalRegions} régions · {totalFamilies} familles
                </div>
                <div style={{ display: "flex", gap: "20px" }}>
                    {[["Designer", onEnterDesigner], ["Galerie", onEnterGallery], ["Styles", onEnterDatabase]].map(([label, fn]) => (
                        <button key={label} onClick={fn} style={{ background: "none", border: "none", color: "#6B5030", fontSize: "12px", cursor: "pointer", fontFamily: "Georgia, serif", padding: 0 }}
                            onMouseEnter={e => e.currentTarget.style.color = "#B8860B"}
                            onMouseLeave={e => e.currentTarget.style.color = "#6B5030"}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </footer>
            <div style={{ height: "4px", background: "linear-gradient(90deg,#8B0000,#B8860B,#228B22,#1A2744,#B8860B,#C41E3A)" }} />
        </div >
    );
}
