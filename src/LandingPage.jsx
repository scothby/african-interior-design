import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import DB from "./african-styles-db.json";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { fetchStylesFromSupabase, fetchGalleryFromSupabase, fetchLandingAssetsFromSupabase, fetchTestimonials } from "./supabaseClient";

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

const getSteps = (t) => [
    {
        icon: "📸",
        title: t('landing.howItWorks.steps.1.title'),
        desc: t('landing.howItWorks.steps.1.desc'),
    },
    {
        icon: "🎨",
        title: t('landing.howItWorks.steps.2.title'),
        desc: t('landing.howItWorks.steps.2.desc'),
    },
    {
        icon: "✨",
        title: t('landing.howItWorks.steps.3.title'),
        desc: t('landing.howItWorks.steps.3.desc'),
    },
    {
        icon: "🖌️",
        title: t('landing.howItWorks.steps.4.title', { defaultValue: "Retouche Inpainting" }),
        desc: t('landing.howItWorks.steps.4.desc', { defaultValue: "Retouchez précisément des zones de votre design ou remplacez des meubles avec l'IA." }),
    },
];

const getFeatures = (t) => [
    { icon: "🤖", label: t('landing.features.gemini_label', { defaultValue: "IA Gemini" }), desc: t('landing.features.gemini_desc', { defaultValue: "Rendu photoréaliste" }) },
    { icon: "🌍", label: "Monde 3D", desc: t('landing.features.world_desc', { defaultValue: "Exploration immersive" }) },
    { icon: "📄", label: "Export PDF", desc: t('landing.features.pdf_desc', { defaultValue: "Fiche de design complète" }) },
    { icon: "🖼️", label: t('header.gallery'), desc: t('landing.features.gallery_desc', { defaultValue: "Toutes vos créations" }) },
    { icon: "🎨", label: "50+ styles", desc: t('landing.features.styles_desc', { defaultValue: "7 régions d'Afrique" }) },
    { icon: "🔒", label: t('landing.features.secure_label', { defaultValue: "Sécurisé" }), desc: t('landing.features.secure_desc', { defaultValue: "Données protégées" }) },
];

// We will move this inside the component to use Supabase data
const DEFAULT_HERO_IMAGES = [
    "/families/TerresBanco.png",
    "/families/TextilesRoyaux.png",
    "/families/CotierSwahili.png",
    "/families/GeometriquePeint.png",
    "/families/SauvageNomade.png",
    "/families/IslamiqueAfricain.png",
    "/families/TropicalEquatorial.png",
    "/families/UrbainContemporain.png"
];

export default function LandingPage({ onEnterDesigner, onEnterGallery, onEnterDatabase, onEnterPalettes, user, onSignOut }) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [hoveredFamily, setHoveredFamily] = useState(null);
    const [recentDesigns, setRecentDesigns] = useState([]);
    const [loadingGallery, setLoadingGallery] = useState(true);
    const [featuredCreations, setFeaturedCreations] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
    const [heroImages, setHeroImages] = useState(DEFAULT_HERO_IMAGES);
    const [heroComparison, setHeroComparison] = useState("/hero-comparison.png");

    // Supabase-sourced data (with fallback to local JSON)
    const [stylesData, setStylesData] = useState({
        styles: DB.styles,
        regions: DB.regions,
        families: DB.families,
    });

    // Fetch styles and assets from Supabase on mount
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [styles, assets, tests] = await Promise.all([
                    fetchStylesFromSupabase(),
                    fetchLandingAssetsFromSupabase(),
                    fetchTestimonials()
                ]);

                setStylesData(styles);
                setTestimonials(tests);

                if (assets && assets.length > 0) {
                    const masonry = assets.filter(a => a.asset_type === 'hero_masonry').map(a => a.image_url);
                    const comparison = assets.find(a => a.asset_type === 'hero_comparison');
                    const featured = assets.filter(a => a.asset_type === 'featured_creation');

                    if (masonry.length > 0) setHeroImages(masonry);
                    if (comparison) setHeroComparison(comparison.image_url);
                    setFeaturedCreations(featured);
                }
            } catch (err) {
                console.error("Failed to fetch initial data from Supabase, using fallbacks", err);
            }
        };
        loadInitialData();
    }, []);

    const masonryCols = useState(() =>
        Array.from({ length: 6 }, () => [...heroImages].sort(() => 0.5 - Math.random()))
    )[0];

    // Stabilize masonry even when heroImages update (optional: update when heroImages change?)
    // Actually, let's keep it simple: just map them properly.

    // We no longer fetch gallery on landing page to keep it as a pure showcase
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(t);
    }, []);

    const totalStyles = stylesData.styles.length;
    const totalRegions = stylesData.regions.length;
    const totalFamilies = stylesData.families.length;

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
            <div className="kente-bar" />

            {/* Language Switcher Overlay */}
            <div style={{ position: "absolute", top: "20px", right: "24px", zIndex: 1000, display: "flex", gap: "10px", alignItems: "center" }}>
                {user && (
                    <div style={{ marginRight: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "12px", color: "#8B7050", opacity: 0.8 }}>{user.email}</span>
                        <button
                            onClick={onSignOut}
                            style={{
                                background: "rgba(184,134,11,0.1)",
                                border: "1px solid rgba(184,134,11,0.3)",
                                color: "#B8860B",
                                padding: "4px 12px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = "rgba(184,134,11,0.2)"; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = "rgba(184,134,11,0.1)"; }}
                        >
                            {t('header.signOut')}
                        </button>
                    </div>
                )}
                <LanguageSwitcher />
            </div>

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
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                            width: "calc(100vw / 5)",
                            animation: `${i % 2 === 0 ? 'slideUp' : 'slideDown'} ${40 + (i % 3) * 10}s linear infinite`
                        }}>
                            {/* Stabilize columns based on heroImages */}
                            {[...heroImages].sort((a, b) => (i * 13 + a.length) % 7 - (i * 7 + b.length) % 13).concat([...heroImages].sort((a, b) => b.length - a.length)).map((img, j) => (
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
                        ✦ {t('landing.badge')}
                    </div>

                    {/* Titre */}
                    <h1 style={{ margin: "0 0 20px", fontSize: "clamp(32px, 6vw, 68px)", lineHeight: 1.15, maxWidth: "840px", animation: visible ? "fadeUp 0.6s ease both" : "none", animationDelay: "0.2s" }}>
                        {t('landing.title1')}
                        <br />
                        <span style={{
                            background: "linear-gradient(90deg, var(--color-primary), #F0C040, var(--color-primary))",
                            backgroundSize: "200% auto",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            animation: "shimmer 3s linear infinite",
                            display: "inline-block"
                        }}>
                            {t('landing.title2')}
                        </span>
                    </h1>

                    {/* Sous-titre */}
                    <p style={{ margin: "0 0 40px", fontSize: "clamp(15px, 2vw, 18px)", color: "#8B7050", maxWidth: "560px", lineHeight: 1.7, animation: visible ? "fadeUp 0.6s ease both" : "none", animationDelay: "0.3s" }}>
                        {t('landing.subtitle', { count: totalStyles })}
                    </p>

                    {/* CTA Buttons */}
                    <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center", animation: visible ? "fadeUp 0.6s ease both" : "none", animationDelay: "0.4s" }}>
                        <button
                            className="btn-primary"
                            onClick={onEnterDesigner}
                            style={{
                                padding: "min(3vw, 16px) min(8vw, 40px)",
                                borderRadius: "8px",
                                fontSize: "var(--font-size-sm)",
                                animation: "pulseGold 3s ease infinite"
                            }}
                        >
                            🏛️ {t('landing.startDesign')}
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={onEnterGallery}
                            style={{
                                padding: "min(3vw, 16px) min(6vw, 36px)",
                                borderRadius: "8px",
                                fontSize: "var(--font-size-sm)"
                            }}
                        >
                            🖼️ {t('landing.viewGallery')}
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={onEnterDatabase}
                            style={{
                                padding: "min(3vw, 16px) min(6vw, 36px)",
                                borderRadius: "8px",
                                fontSize: "var(--font-size-sm)"
                            }}
                        >
                            📚 {t('landing.browseStyles')}
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={onEnterPalettes}
                            style={{
                                padding: "min(3vw, 16px) min(6vw, 36px)",
                                borderRadius: "8px",
                                fontSize: "var(--font-size-sm)",
                                background: "rgba(184,134,11,0.1)",
                                border: "1px solid rgba(184,134,11,0.5)",
                                color: "#F0E6D3"
                            }}
                        >
                            🎨 Palettes Africaines
                        </button>
                    </div>

                    {/* Stats */}
                    <div style={{
                        display: "flex",
                        gap: "min(10vw, 40px)",
                        marginTop: "56px",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        animation: visible ? "fadeUp 0.6s ease both" : "none",
                        animationDelay: "0.55s"
                    }}>
                        {[
                            { value: `${totalStyles}+`, label: t('landing.stats.styles') },
                            { value: `${totalRegions}`, label: t('landing.stats.regions') },
                            { value: `${totalFamilies}`, label: t('landing.stats.families') },
                        ].map((stat) => (
                            <div key={stat.label} style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "var(--font-size-xl)", fontWeight: "bold", color: "#B8860B", lineHeight: 1 }}>{stat.value}</div>
                                <div style={{ fontSize: "var(--font-size-xs)", color: "#8B7050", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px" }}>{stat.label}</div>
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
                            src={heroComparison}
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
                        <div style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#B8860B", marginBottom: "12px" }}>✦ {t('landing.howItWorks.tag')}</div>
                        <h2 style={{ margin: 0, fontSize: "clamp(22px, 4vw, 36px)", fontWeight: "normal" }}>{t('landing.howItWorks.title')}</h2>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                        {getSteps(t).map((step, i) => (
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
                        <div style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#B8860B", marginBottom: "12px" }}>✦ {t('landing.stylesAvailable.tag')}</div>
                        <h2 style={{ margin: "0 0 12px", fontSize: "clamp(22px, 4vw, 36px)", fontWeight: "normal" }}>{t('landing.stylesAvailable.title')}</h2>
                        <p style={{ margin: 0, color: "#6B5030", fontSize: "14px" }}>{t('landing.stylesAvailable.desc')}</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px" }}>
                        {stylesData.families.map((family) => {
                            const color = FAMILY_COLORS[family] || "#B8860B";
                            const icon = FAMILY_ICONS[family] || "🌍";
                            const count = stylesData.styles.filter(s => s.family === family).length;
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
                                        <div style={{ fontSize: "15px", fontWeight: "bold", color: "#F0E6D3", marginBottom: "4px" }}>{t(`db.families.${family}`, { defaultValue: family })}</div>
                                        <div style={{ fontSize: "11px", color: color, fontWeight: "bold" }}>{t('landing.stylesAvailable.count', { count })}</div>
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
                        <div style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#B8860B", marginBottom: "12px" }}>✦ {t('landing.regions.tag')}</div>
                        <h2 style={{ margin: "0 0 12px", fontSize: "clamp(22px, 4vw, 36px)", fontWeight: "normal" }}>{t('landing.regions.title', { count: totalRegions })}</h2>
                        <p style={{ margin: 0, color: "#6B5030", fontSize: "14px" }}>{t('landing.regions.desc')}</p>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px" }}>
                        {stylesData.regions.map((region) => {
                            const count = stylesData.styles.filter(s => s.region === region).length;
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
                                    <span>{t(`db.regions.${region}`, { defaultValue: region })}</span>
                                    <span style={{ fontSize: "12px", color: "#8B7050", fontWeight: "normal" }}>{t('landing.regions.count', { count })}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>
            {/* ─────────────────────────────────────────────────────────────
          SECTION — GALERIE VITRINE (Gérée par Admin via Database)
      ───────────────────────────────────────────────────────────── */}
            {
                featuredCreations.length > 0 && (
                    <section style={{ padding: "80px 24px", borderTop: "1px solid #1E1208" }}>
                        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                            <div style={{ textAlign: "center", marginBottom: "48px" }}>
                                <div style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#B8860B", marginBottom: "12px" }}>✦ {t('landing.inspirations.tag', { defaultValue: "Vitrine" })}</div>
                                <h2 style={{ margin: "0 0 12px", fontSize: "clamp(22px, 4vw, 36px)", fontWeight: "normal" }}>{t('landing.inspirations.title', { defaultValue: "Dernières Créations" })}</h2>
                                <p style={{ margin: 0, color: "#6B5030", fontSize: "14px" }}>{t('landing.inspirations.desc', { defaultValue: "Découvrez ce que notre communauté et notre IA imaginent pour l'intérieur africain." })}</p>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
                                {featuredCreations.map(c => ({
                                    id: c.id,
                                    generatedImage: c.image_url,
                                    styleName: c.title || 'Design Africain',
                                    styleFamily: 'Inspiration'
                                })).map(entry => (
                                    <div key={entry.id} style={{
                                        background: "#120B05", border: "1px solid #1E1208", borderRadius: "8px", overflow: "hidden", transition: "all 0.2s"
                                    }} className="step-card">
                                        <div style={{ height: "200px", background: "#0A0603" }}>
                                            <img src={entry.generatedImage.startsWith('/') ? entry.generatedImage : entry.generatedImage} alt={entry.styleName} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = 'none'; }} />
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
                                    className="btn-secondary"
                                    style={{ padding: "12px 32px", borderRadius: "var(--radius-sm)", fontSize: "13px" }}
                                >
                                    {t('landing.inspirations.exploreGallery', { defaultValue: "EXPLORE THE FULL GALLERY →" })}
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
                    <div style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#B8860B", marginBottom: "12px" }}>✦ {t('landing.features.tag')}</div>
                    <h2 style={{ margin: "0 0 48px", fontSize: "clamp(22px, 4vw, 36px)", fontWeight: "normal" }}>{t('landing.features.title')}</h2>

                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
                        {getFeatures(t).map((f) => (
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
          SECTION — TÉMOIGNAGES
      ───────────────────────────────────────────────────────────── */}
            {testimonials.length > 0 && (
                <section style={{ padding: "80px 24px", borderTop: "1px solid #1E1208" }}>
                    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                        <div style={{ textAlign: "center", marginBottom: "56px" }}>
                            <div style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#B8860B", marginBottom: "12px" }}>✦ Témoignages</div>
                            <h2 style={{ margin: 0, fontSize: "clamp(22px, 4vw, 36px)", fontWeight: "normal" }}>Ils réinventent l'Afrique avec nous</h2>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                            {testimonials.map((t, i) => (
                                <div key={i} className="glass-panel" style={{ padding: "32px", borderRadius: "12px", border: "1px solid #1E1208", display: "flex", flexDirection: "column", gap: "16px" }}>
                                    <div style={{ color: "#B8860B", fontSize: "20px" }}>{"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}</div>
                                    <p style={{ margin: 0, fontSize: "15px", lineHeight: "1.7", color: "#A08060", fontStyle: "italic" }}>"{t.content}"</p>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(45deg, #2A1A0E, #B8860B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                                            {t.user_name[0]}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "14px", fontWeight: "bold", color: "#F0E6D3" }}>{t.user_name}</div>
                                            <div style={{ fontSize: "11px", color: "#6B5030" }}>{t.user_role}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ─────────────────────────────────────────────────────────────
          SECTION — CTA FINAL
      ───────────────────────────────────────────────────────────── */}
            <section style={{ padding: "100px 24px", borderTop: "1px solid #1E1208", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(#2A1A0E 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.3, pointerEvents: "none" }} />
                <div style={{ position: "relative" }}>
                    <div style={{ fontSize: "56px", marginBottom: "24px", animation: "floatGlobe 6s ease-in-out infinite" }}>🌍</div>
                    <h2 style={{ margin: "0 0 16px", fontSize: "clamp(24px, 4vw, 42px)", fontWeight: "normal" }}>{t('landing.cta.title')}</h2>
                    <p style={{ margin: "0 0 40px", color: "#8B7050", fontSize: "15px" }}>{t('landing.cta.desc')}</p>
                    <button
                        className="btn-primary"
                        onClick={onEnterDesigner}
                        style={{ padding: "18px 56px", fontSize: "17px" }}
                    >
                        🏛️ {t('landing.cta.btn')}
                    </button>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer style={{ borderTop: "1px solid #1E1208", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ fontSize: "12px", color: "#4A3520" }}>
                    {t('landing.footer.desc', { styles: totalStyles, regions: totalRegions, families: totalFamilies })}
                </div>
                <div style={{ display: "flex", gap: "20px" }}>
                    {[[t('landing.footer.designer'), onEnterDesigner], [t('landing.footer.gallery'), onEnterGallery], [t('landing.footer.styles'), onEnterDatabase]].map(([label, fn]) => (
                        <button key={label} onClick={fn} style={{ background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer", fontFamily: "var(--font-heading)", padding: 0 }}
                            onMouseEnter={e => e.currentTarget.style.color = "var(--color-primary)"}
                            onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-muted)"}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </footer>
            <div className="kente-bar" />
        </div >
    );
}
