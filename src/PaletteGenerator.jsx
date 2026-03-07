import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Logo from './components/Logo';
import DB from './african-styles-db.json';

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

export default function PaletteGenerator({ onBack, onGoToDesigner, stylesData = DB }) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFamily, setActiveFamily] = useState("all");
    const [copiedColor, setCopiedColor] = useState(null);

    const filteredStyles = useMemo(() => {
        return stylesData.styles.filter(style => {
            const matchSearch = (style.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (style.country || "").toLowerCase().includes(searchTerm.toLowerCase());
            const matchFamily = activeFamily === "all" || style.family === activeFamily;
            return matchSearch && matchFamily;
        });
    }, [searchTerm, activeFamily, stylesData.styles]);

    const handleCopy = (hex, name) => {
        navigator.clipboard?.writeText(hex);
        setCopiedColor(`${hex}-${name}`);
        setTimeout(() => setCopiedColor(null), 2000);
    };

    return (
        <div style={s.container}>
            {/* Header */}
            <header style={s.header}>
                <div style={s.headerBar} />
                <div style={s.headerContent}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={onBack} className="btn-secondary" style={{ ...s.navBtn, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Logo size={16} /> {t('palette.nav.home')}
                            </button>
                            <button onClick={onGoToDesigner} className="btn-primary" style={{ ...s.navBtn, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Logo size={16} /> {t('palette.nav.create')}
                            </button>
                        </div>

                        <div style={{ textAlign: 'right', flex: 1 }}>
                            <div style={s.tag}>{t('palette.newTag')}</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                                <Logo size={24} />
                                <h1 style={s.title}>{t('palette.title')}</h1>
                            </div>
                            <p style={s.subtitle}>{t('palette.subtitle', { count: stylesData.styles.length })}</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div style={s.filtersContainer}>
                        <div style={{ flex: 1 }}>
                            <input
                                type="text"
                                placeholder={t('palette.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={s.searchInput}
                            />
                        </div>
                        <div style={s.pillFilters}>
                            <button
                                onClick={() => setActiveFamily("all")}
                                style={{ ...s.pill, ...(activeFamily === "all" ? s.pillActive : {}) }}
                            >
                                {t('filters.allFem')}
                            </button>
                            {stylesData.families.map(f => (
                                <button
                                    key={f}
                                    onClick={() => setActiveFamily(f)}
                                    style={{
                                        ...s.pill,
                                        ...(activeFamily === f ? { background: `${FAMILY_COLORS[f]}22`, borderColor: FAMILY_COLORS[f], color: FAMILY_COLORS[f] } : {})
                                    }}
                                >
                                    {t(`db.families.${f}`, { defaultValue: f })}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Grid */}
            <main style={s.main}>
                {filteredStyles.length === 0 ? (
                    <div style={s.empty}>{t('palette.empty')}</div>
                ) : (
                    <div style={s.grid}>
                        {filteredStyles.map(style => (
                            <div key={style.id} className="glass-panel" style={s.card}>
                                <div style={s.cardHeader}>
                                    <div>
                                        <div style={s.cardTitle}>
                                            <span style={{ marginRight: '8px' }}>{style.flag}</span>
                                            {style.name}
                                        </div>
                                        <div style={s.cardSubtitle}>{style.country} • {t(`db.families.${style.family}`, { defaultValue: style.family })}</div>
                                    </div>
                                </div>

                                {/* Palette */}
                                <div style={s.paletteWrapper}>
                                    {style.colors.map((color, index) => {
                                        const cName = style.colorNames?.[index] || `${t('app.color')} ${index + 1}`;
                                        const isCopied = copiedColor === `${color}-${cName}`;

                                        return (
                                            <div
                                                key={index}
                                                style={{ ...s.colorStrap, backgroundColor: color }}
                                                onClick={() => handleCopy(color, cName)}
                                                title={`Copier ${color}`}
                                                className="color-strap"
                                            >
                                                <div style={{ ...s.colorInfo, opacity: isCopied ? 1 : '' }} className="color-info">
                                                    <span style={s.colorHex}>{isCopied ? t('palette.copied') : color}</span>
                                                    <span style={s.colorName}>{cName}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

const s = {
    container: {
        minHeight: '100vh',
        background: '#0C0806',
        color: '#F0E6D3',
        fontFamily: "'Inter', sans-serif",
    },
    header: {
        background: '#160E07',
        borderBottom: '1px solid #2A1A0E',
        position: 'sticky',
        top: 0,
        zIndex: 100,
    },
    headerBar: {
        height: '4px',
        background: 'linear-gradient(90deg, #B8860B, #8B4513, #B8860B)',
    },
    headerContent: {
        padding: '24px 32px',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    navBtn: {
        padding: '10px 20px',
        borderRadius: '8px',
        fontSize: '13px',
    },
    tag: {
        display: 'inline-block',
        fontSize: '10px',
        letterSpacing: '0.2em',
        color: '#B8860B',
        background: 'rgba(184,134,11,0.1)',
        padding: '4px 10px',
        borderRadius: '12px',
        marginBottom: '8px',
        fontWeight: 'bold',
    },
    title: {
        fontSize: '28px',
        margin: '0 0 4px',
        color: '#F0E6D3',
    },
    subtitle: {
        fontSize: '13px',
        color: '#8B7050',
        margin: 0,
    },
    filtersContainer: {
        marginTop: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
    },
    searchInput: {
        width: '100%',
        maxWidth: '300px',
        background: '#0A0603',
        border: '1px solid #2A1A0E',
        padding: '12px 16px',
        borderRadius: '8px',
        color: '#F0E6D3',
        outline: 'none',
        fontSize: '14px',
    },
    pillFilters: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
    },
    pill: {
        padding: '8px 16px',
        background: 'transparent',
        border: '1px solid #2A1A0E',
        color: '#8B7050',
        borderRadius: '20px',
        fontSize: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    pillActive: {
        background: '#B8860B',
        borderColor: '#B8860B',
        color: '#0C0806',
        fontWeight: 'bold',
    },
    main: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 32px',
    },
    empty: {
        textAlign: 'center',
        color: '#8B7050',
        padding: '60px',
        fontSize: '15px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '24px',
    },
    card: {
        border: '1px solid #1E1208',
        borderRadius: '16px',
        overflow: 'hidden',
        padding: 0,
        background: '#120B05',
        transition: 'transform 0.2s',
    },
    cardHeader: {
        padding: '20px',
        borderBottom: '1px solid #1E1208',
    },
    cardTitle: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#F0E6D3',
        marginBottom: '4px',
    },
    cardSubtitle: {
        fontSize: '12px',
        color: '#8B7050',
    },
    paletteWrapper: {
        display: 'flex',
        height: '140px',
        width: '100%',
    },
    colorStrap: {
        flex: 1,
        position: 'relative',
        cursor: 'pointer',
        transition: 'flex 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
    },
    colorInfo: {
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        padding: '12px 6px',
        textAlign: 'center',
        opacity: 0,
        transition: 'opacity 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    colorHex: {
        fontSize: '11px',
        color: '#FFF',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        letterSpacing: '0.05em',
    },
    colorName: {
        fontSize: '9px',
        color: '#D4C3A3',
        textTransform: 'uppercase',
        lineHeight: 1.2,
    }
};

// Add CSS for hover effects since inline styles can't do pseudo-classes easily for child un-hover state
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  .color-strap:hover { flex: 2; z-index: 10; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
  .color-strap:hover .color-info { opacity: 1 !important; }
  .card:hover { transform: translateY(-4px); border-color: #3A2A15 !important; }
`;
document.head.appendChild(styleSheet);
