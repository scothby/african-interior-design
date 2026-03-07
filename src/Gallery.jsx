import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ComparisonSlider from './ComparisonSlider';
import { exportCollage } from './utils/collageGenerator';
import { exportDesignPDF } from './utils/pdfGenerator';
import WorldViewerModal from './WorldViewerModal';
import InpaintingModal from './InpaintingModal';
import { useAuth } from './AuthContext';
import { fetchGalleryFromSupabase, toggleFavoriteInSupabase, deleteGalleryEntryInSupabase } from './supabaseClient';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Hook pour suivre la taille de la fenêtre
function useWindowSize() {
    const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
    useEffect(() => {
        const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return size;
}

export default function Gallery({ onBack, onGoToStyles, onGoToDesigner }) {
    const { t, i18n } = useTranslation();
    const { getToken } = useAuth();
    const { w: winW } = useWindowSize();

    // Breakpoints responsives
    const isMobileXS = winW < 400;   // petits smartphones (iPhone SE...)
    const isMobile = winW < 600;   // smartphones standard
    const isTablet = winW < 900;   // tablettes portrait
    const isDesktop = winW < 1280;  // laptop / tablette paysage
    // au-delà = grand écran (> 1280)

    // Colonnes grille
    const gridCols = isMobileXS
        ? '1fr'
        : isMobile
            ? 'repeat(2, 1fr)'
            : isTablet
                ? 'repeat(2, 1fr)'
                : isDesktop
                    ? 'repeat(3, 1fr)'
                    : 'repeat(4, 1fr)';  // grand écran → 4 colonnes

    // Hauteur thumbnail
    const thumbH = isMobileXS
        ? '160px'
        : isMobile
            ? '180px'
            : isTablet
                ? '200px'
                : isDesktop
                    ? '240px'
                    : '280px';  // grand écran

    // Gap de la grille
    const gridGap = isMobile ? '12px' : isTablet ? '16px' : '24px';

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [viewMode, setViewMode] = useState('single'); // 'single' | 'slider' | 'sideBySide'
    const [downloadingId, setDownloadingId] = useState(null);
    const [filter, setFilter] = useState('all');
    const [worldModal, setWorldModal] = useState({ open: false, entry: null });
    const [pdfDownloadingId, setPdfDownloadingId] = useState(null);
    // Modal plein écran par entrée
    const [entryModal, setEntryModal] = useState(null); // entry | null
    const [showInpaintModal, setShowInpaintModal] = useState(false);
    const [inpaintingEntry, setInpaintingEntry] = useState(null);
    const [isInpainting, setIsInpainting] = useState(false);

    const openEntryModal = (entry) => {
        setEntryModal(entry);
        setViewMode(entry.originalImage ? 'slider' : 'single');
        setConfirmDeleteId(null);
    };
    const closeEntryModal = () => setEntryModal(null);

    // Fetch gallery entries
    const fetchGallery = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchGalleryFromSupabase();
            setEntries(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchGallery(); }, [fetchGallery]);

    // Delete entry via Supabase
    const handleDelete = async (id) => {
        try {
            await deleteGalleryEntryInSupabase(id);
            setEntries(prev => prev.filter(e => e.id !== id));
            setConfirmDeleteId(null);
            closeEntryModal();
        } catch (err) {
            setError(err.message);
        }
    };

    // Toggle favorite via Supabase
    const toggleFavorite = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            const currentEntry = entries.find(entry => entry.id === id);
            const result = await toggleFavoriteInSupabase(id, currentEntry?.isFavorite || false);
            setEntries(prev => prev.map(entry => entry.id === id ? { ...entry, isFavorite: result.isFavorite } : entry));
        } catch (err) {
            setError(err.message);
        }
    };

    const formatDate = (iso) => {
        const d = new Date(iso);
        return d.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // Download image
    const handleDownload = async (entry) => {
        setDownloadingId(entry.id);
        try {
            await exportCollage(
                entry.originalImage ? (entry.originalImage.startsWith('http') ? entry.originalImage : `${API_BASE_URL}${entry.originalImage}`) : '',
                entry.generatedImage ? (entry.generatedImage.startsWith('http') ? entry.generatedImage : `${API_BASE_URL}${entry.generatedImage}`) : '',
                entry.styleName
            );
        } catch (err) {
            console.error('Download failed:', err);
            setError('Échec du téléchargement du collage');
        } finally {
            setDownloadingId(null);
        }
    };

    // Export PDF
    const handleExportPDF = async (entry) => {
        setPdfDownloadingId(entry.id);
        try {
            await exportDesignPDF({
                originalImage: entry.originalImage ? (entry.originalImage.startsWith('http') ? entry.originalImage : `${API_BASE_URL}${entry.originalImage}`) : '',
                generatedImage: entry.generatedImage ? (entry.generatedImage.startsWith('http') ? entry.generatedImage : `${API_BASE_URL}${entry.generatedImage}`) : '',
                styleName: entry.styleName,
                styleFamily: entry.styleFamily,
                description: entry.styleDescription || ''
            });
        } catch (err) {
            console.error('PDF export failed:', err);
            setError('Échec de la génération du PDF');
        } finally {
            setPdfDownloadingId(null);
        }
    };

    const handleInpaintSubmit = async (maskDataUrl, prompt) => {
        try {
            setIsInpainting(true);
            const token = await getToken();
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const response = await fetch(`${API_BASE_URL}/api/inpaint`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...config.headers
                },
                body: JSON.stringify({
                    originalImage: inpaintingEntry.generatedImage,
                    maskImage: maskDataUrl,
                    customPrompt: prompt,
                    style: {
                        id: inpaintingEntry.styleId,
                        name: inpaintingEntry.styleName,
                        family: inpaintingEntry.styleFamily
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to generate inpainting');
            }

            const data = await response.json();
            // Refresh gallery after inpainting
            await fetchGallery();
            setShowInpaintModal(false);
            setInpaintingEntry(null);

            // Si le modal actuel est toujours ouvert, le fermer (retour à la vue galerie)
            closeEntryModal();

        } catch (err) {
            console.error('Inpainting error:', err);
            setError(err.message || 'Error occurred during inpainting');
            setShowInpaintModal(false);
        } finally {
            setIsInpainting(false);
        }
    };

    return (
        <div style={s.app}>
            {/* Header */}
            <header style={s.header}>
                <div style={s.headerBar} />
                <div style={s.headerContent}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexWrap: 'wrap', gap: '20px' }}>
                        {/* Navigation Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                            {onBack && (
                                <button onClick={onBack} style={s.backBtn}>
                                    <span style={{ marginRight: '6px' }}>🏠</span>
                                    {t('nav.home', 'Home')}
                                </button>
                            )}
                            {onGoToStyles && (
                                <button
                                    onClick={onGoToStyles}
                                    style={{
                                        padding: "8px 16px",
                                        background: "rgba(184, 134, 11, 0.1)",
                                        border: "1px solid #B8860B",
                                        borderRadius: "4px",
                                        color: "#B8860B",
                                        fontSize: "12px",
                                        cursor: "pointer",
                                        fontFamily: "inherit"
                                    }}
                                >
                                    <span style={{ marginRight: '6px' }}>📚</span>
                                    {t('nav.styles', 'Styles')}
                                </button>
                            )}
                            {onGoToDesigner && (
                                <button
                                    onClick={onGoToDesigner}
                                    style={{
                                        padding: "8px 16px",
                                        background: "#B8860B",
                                        border: "none",
                                        borderRadius: "4px",
                                        color: "#0C0806",
                                        fontSize: "12px",
                                        cursor: "pointer",
                                        fontFamily: "inherit",
                                        fontWeight: "bold"
                                    }}
                                >
                                    <span style={{ marginRight: '6px' }}>🎨</span>
                                    {t('nav.create', 'Create')}
                                </button>
                            )}
                        </div>

                        {/* Filters */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flex: 1 }}>
                            <button
                                onClick={() => setFilter('all')}
                                style={{
                                    padding: '8px 16px',
                                    background: filter === 'all' ? '#B8860B' : 'transparent',
                                    color: filter === 'all' ? '#0C0806' : '#D4C3A3',
                                    border: `1px solid ${filter === 'all' ? '#B8860B' : 'rgba(184,134,11,0.3)'}`,
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {t('gallery.filters.all')}
                            </button>
                            <button
                                onClick={() => setFilter('favorites')}
                                style={{
                                    padding: '8px 16px',
                                    background: filter === 'favorites' ? '#B8860B' : 'transparent',
                                    color: filter === 'favorites' ? '#0C0806' : '#D4C3A3',
                                    border: `1px solid ${filter === 'favorites' ? '#B8860B' : 'rgba(184,134,11,0.3)'}`,
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {t('gallery.filters.favorites')}
                            </button>
                        </div>

                        {/* Title and Subtitle */}
                        <div style={{ textAlign: 'right', flex: 1 }}>
                            <h1 style={s.title}>{t('gallery.title')}</h1>
                            <p style={s.subtitle}>
                                {t('gallery.subtitle', { count: entries.length })}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main style={s.main}>
                {loading && (
                    <div style={s.loadingContainer}>
                        <div style={s.spinner} />
                        <span style={{ color: '#B8860B' }}>{t('gallery.loading')}</span>
                    </div>
                )}

                {error && <div style={s.error}>{error}</div>}

                {isInpainting && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(12, 8, 6, 0.8)', zIndex: 3000,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: '20px'
                    }}>
                        <div style={s.spinner} />
                        <h3 style={{ color: '#B8860B' }}>{t('app.generating.title')}...</h3>
                        <p style={{ color: '#8B7050' }}>{t('app.generating.desc_inpainting', { defaultValue: 'Patientez pendant que l\'IA retouche votre design' })}</p>
                    </div>
                )}

                {!loading && entries.length === 0 && (
                    <div style={s.emptyState}>
                        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎨</div>
                        <h3 style={{ color: '#F0E6D3', fontSize: '20px', margin: '0 0 12px 0' }}>
                            {t('gallery.empty.title')}
                        </h3>
                        <p style={{ color: '#8B7050', fontSize: '14px', margin: '0 0 24px 0' }}>
                            {t('gallery.empty.desc')}
                        </p>
                        <button onClick={onGoToDesigner} style={s.primaryBtn}>
                            {t('gallery.empty.goto')}
                        </button>
                    </div>
                )}

                {!loading && entries.length > 0 && (
                    <div style={{ ...s.grid, gridTemplateColumns: gridCols, gap: gridGap }}>
                        {entries.filter(e => filter === 'all' || e.isFavorite).map(entry => (
                            <div key={entry.id} style={s.card} className="gallery-card">
                                {/* Thumbnail — click = ouvrir modal */}
                                <div
                                    style={{ ...s.thumbnailWrapper, height: thumbH }}
                                    onClick={() => openEntryModal(entry)}
                                >
                                    <img
                                        src={entry.generatedImage ? (entry.generatedImage.startsWith('http') ? entry.generatedImage : `${API_BASE_URL}${entry.generatedImage}`) : ''}
                                        alt={entry.styleName}
                                        loading="lazy"
                                        style={s.thumbnail}
                                        className="gallery-thumb"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <div style={s.thumbnailOverlay} className="gallery-thumb-overlay">
                                        <span style={{ fontSize: '28px' }}>🔍</span>
                                    </div>
                                </div>

                                {/* Card Info */}
                                <div style={s.cardBody}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={s.cardTitle}>{entry.styleName}</div>
                                        <button
                                            onClick={(ev) => { ev.stopPropagation(); toggleFavorite(entry.id, ev); }}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                fontSize: '18px', padding: '0 4px', marginTop: '-2px',
                                                opacity: entry.isFavorite ? 1 : 0.6,
                                                transform: entry.isFavorite ? 'scale(1.1)' : 'scale(1)',
                                                transition: 'all 0.2s'
                                            }}
                                            title={entry.isFavorite ? t('gallery.actions.unfavorite') : t('gallery.actions.favorite')}
                                        >
                                            {entry.isFavorite ? '❤️' : '🤍'}
                                        </button>
                                    </div>
                                    <div style={s.cardFamily}>{entry.styleFamily}</div>
                                    <div style={s.cardDate}>{formatDate(entry.createdAt)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer style={s.footer}>
                <p>{t('gallery.subtitle', { count: entries.length })}</p>
            </footer>

            {/* World Viewer Modal */}
            {worldModal.open && worldModal.entry && (
                <WorldViewerModal
                    mode={worldModal.entry.worldUrl ? "view" : "generate"}
                    generatedImage={worldModal.entry.generatedImage}
                    galleryEntryId={worldModal.entry.id}
                    worldUrl={worldModal.entry.worldUrl}
                    selectedStyle={{ name: worldModal.entry.styleName }}
                    onClose={() => setWorldModal({ open: false, entry: null })}
                />
            )}

            {/* ——— MODAL ENTRY : vue plein écran avec modes + actions ——— */}
            {entryModal && (() => {
                const em = entryModal;
                const origSrc = em.originalImage ? (em.originalImage.startsWith('http') ? em.originalImage : `${API_BASE_URL}${em.originalImage}`) : '';
                const genSrc = em.generatedImage ? (em.generatedImage.startsWith('http') ? em.generatedImage : `${API_BASE_URL}${em.generatedImage}`) : '';
                return (
                    <div style={s.emOverlay} onClick={closeEntryModal}>
                        <div style={s.emBox} onClick={e => e.stopPropagation()}>

                            {/* Header */}
                            <div style={s.emHeader}>
                                <div>
                                    <div style={s.emTitle}>{em.styleName}</div>
                                    <div style={s.emSubtitle}>{em.styleFamily} &mdash; {formatDate(em.createdAt)}</div>
                                </div>
                                <button onClick={closeEntryModal} style={s.emClose}>✕</button>
                            </div>

                            {/* Mode tabs */}
                            <div style={s.emTabs}>
                                {[
                                    { id: 'single', label: '🖼️ Image' },
                                    ...(origSrc ? [
                                        { id: 'slider', label: `↔️ ${t('app.result.slider')}` },
                                        { id: 'sideBySide', label: `▥ ${t('app.result.sideBySide')}` }
                                    ] : [])
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setViewMode(tab.id)}
                                        style={{
                                            ...s.emTab,
                                            ...(viewMode === tab.id ? s.emTabActive : {})
                                        }}
                                    >{tab.label}</button>
                                ))}
                            </div>

                            {/* Viewer */}
                            <div style={s.emViewer}>
                                {viewMode === 'single' && (
                                    <img src={genSrc} alt={em.styleName} style={s.emSingleImg} />
                                )}
                                {viewMode === 'slider' && (
                                    <ComparisonSlider
                                        beforeImage={origSrc}
                                        afterImage={genSrc}
                                        height={500}
                                    />
                                )}
                                {viewMode === 'sideBySide' && (
                                    <div style={s.emSide}>
                                        <div style={s.emSideCol}>
                                            <div style={s.emSideLabel}>← {t('app.result.before').toUpperCase()}</div>
                                            <img src={origSrc} alt="Original" style={s.emSideImg} />
                                        </div>
                                        <div style={s.emSideCol}>
                                            <div style={{ ...s.emSideLabel, color: '#B8860B' }}>{t('app.result.after').toUpperCase()} →</div>
                                            <img src={genSrc} alt="Généré" style={s.emSideImg} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div style={s.emActions}>
                                <button
                                    onClick={() => handleDownload(em)}
                                    disabled={downloadingId === em.id}
                                    style={{ ...s.emBtn, ...s.emBtnPrimary, opacity: downloadingId === em.id ? 0.7 : 1 }}
                                >
                                    {downloadingId === em.id ? `⏳ ${t('app.result.creating')}` : `📥 ${t('gallery.actions.download')}`}
                                </button>

                                <button
                                    onClick={() => handleExportPDF(em)}
                                    disabled={pdfDownloadingId === em.id}
                                    style={{ ...s.emBtn, ...s.emBtnSecondary, opacity: pdfDownloadingId === em.id ? 0.7 : 1 }}
                                >
                                    {pdfDownloadingId === em.id ? `⏳ PDF...` : `📄 PDF`}
                                </button>

                                {em.generatedImage && (
                                    <button onClick={() => { closeEntryModal(); setWorldModal({ open: true, entry: em }); }} style={{ ...s.emBtn, ...s.emBtnWorld }}>
                                        🌍 {t('gallery.actions.world')}
                                    </button>
                                )}

                                {em.generatedImage && (
                                    <button onClick={() => { setInpaintingEntry(em); setShowInpaintModal(true); }} style={{ ...s.emBtn, ...s.emBtnPrimary, background: 'rgba(184, 134, 11, 0.15)', color: '#B8860B', border: '1px solid #B8860B' }}>
                                        🖌️ {t('app.result.inpainting')}
                                    </button>
                                )}

                                {confirmDeleteId === em.id ? (
                                    <>
                                        <button onClick={() => { handleDelete(em.id); closeEntryModal(); }} style={{ ...s.emBtn, ...s.emBtnDanger }}>
                                            {t('gallery.actions.confirm')}
                                        </button>
                                        <button onClick={() => setConfirmDeleteId(null)} style={{ ...s.emBtn, ...s.emBtnSecondary }}>
                                            {t('gallery.actions.cancel')}
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setConfirmDeleteId(em.id)} style={{ ...s.emBtn, ...s.emBtnDelete }}>
                                        🗑️ {t('gallery.actions.delete')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {showInpaintModal && inpaintingEntry && (
                <InpaintingModal
                    imageUrl={
                        inpaintingEntry.generatedImage.startsWith("http")
                            ? inpaintingEntry.generatedImage
                            : `${API_BASE_URL}${inpaintingEntry.generatedImage}`
                    }
                    onClose={() => { setShowInpaintModal(false); setInpaintingEntry(null); }}
                    onSubmit={handleInpaintSubmit}
                />
            )}
        </div>
    );
}

const s = {
    app: {
        minHeight: '100vh',
        background: '#0C0806',
        color: '#F0E6D3',
        fontFamily: "'Inter', sans-serif",
    },
    header: {
        background: '#160E07',
        borderBottom: '1px solid #2A1A0E',
        padding: '20px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
    },
    headerBar: {
        height: '4px',
        background: 'linear-gradient(90deg, #B8860B, #8B4513, #B8860B)',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    headerContent: {
        maxWidth: '1200px',
        margin: '0 auto',
    },
    backBtn: {
        background: 'none',
        border: '1px solid #8B7050',
        color: '#8B7050',
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        fontFamily: 'inherit',
    },
    title: {
        fontSize: '24px',
        margin: '0',
        color: '#F0E6D3',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: '12px',
        color: '#8B7050',
        margin: '4px 0 0 0',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
    },
    main: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 0',
        gap: '20px',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '3px solid rgba(184, 134, 11, 0.1)',
        borderTopColor: '#B8860B',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    error: {
        padding: '20px',
        background: 'rgba(255, 107, 107, 0.1)',
        border: '1px solid rgba(255, 107, 107, 0.3)',
        borderRadius: '8px',
        color: '#ff6b6b',
        textAlign: 'center',
        marginBottom: '40px',
    },
    emptyState: {
        textAlign: 'center',
        padding: '100px 20px',
        background: 'rgba(22, 14, 7, 0.5)',
        borderRadius: '24px',
        border: '1px dashed #2A1A0E',
    },
    primaryBtn: {
        background: '#B8860B',
        color: '#0C0806',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.2s',
    },
    grid: {
        display: 'grid',
        // NOTE: La valeur réelle est injectée dynamiquement via gridCols/gridGap
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '24px',
    },
    card: {
        background: '#160E07',
        border: '1px solid #2A1A0E',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'transform 0.3s ease, border-color 0.3s ease',
        cursor: 'pointer',
    },
    thumbnailWrapper: {
        position: 'relative',
        // La hauteur réelle est injectée dynamiquement via thumbH
        height: '240px',
        overflow: 'hidden',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transition: 'transform 0.5s ease',
    },
    thumbnailOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(12, 8, 6, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0,
        transition: 'opacity 0.3s ease',
    },
    cardBody: {
        padding: '16px',
    },
    cardTitle: {
        fontSize: 'var(--font-size-base)',
        fontWeight: 'bold',
        color: '#F0E6D3',
    },
    cardFamily: {
        fontSize: 'var(--font-size-xs)',
        color: '#B8860B',
        marginTop: '4px',
    },
    cardDate: {
        fontSize: 'var(--font-size-xs)',
        opacity: 0.7,
        color: '#8B7050',
        marginTop: '8px',
    },
    expandedPanel: {
        padding: '16px',
        borderTop: '1px solid #2A1A0E',
        background: 'rgba(12, 8, 6, 0.3)',
    },
    expandedActions: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
    },
    downloadBtn: {
        flex: 1,
        minWidth: '100px',
        background: 'rgba(184, 134, 11, 0.1)',
        border: '1px solid #B8860B',
        color: '#B8860B',
        padding: '10px',
        borderRadius: '6px',
        fontSize: 'var(--font-size-xs)',
        cursor: 'pointer',
        fontFamily: 'inherit',
    },
    pdfBtn: {
        flex: 1,
        minWidth: '70px',
        background: 'rgba(139, 112, 80, 0.1)',
        border: '1px solid #8B7050',
        color: '#8B7050',
        padding: '10px',
        borderRadius: '6px',
        fontSize: 'var(--font-size-xs)',
        cursor: 'pointer',
        fontFamily: 'inherit',
    },
    worldBtn: {
        flex: '1 0 100%',
        background: 'rgba(184, 134, 11, 0.2)',
        border: '1px solid #B8860B',
        color: '#F0E6D3',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        fontFamily: 'inherit',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
    },
    deleteBtn: {
        flex: '1 0 100%',
        background: 'none',
        border: '1px solid rgba(255, 107, 107, 0.3)',
        color: '#ff6b6b',
        padding: '8px',
        borderRadius: '6px',
        fontSize: '12px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        marginTop: '8px',
    },
    confirmDeleteBtn: {
        flex: 1,
        background: '#ff6b6b',
        color: '#ffffff',
        border: 'none',
        padding: '8px',
        borderRadius: '6px',
        fontSize: '12px',
        cursor: 'pointer',
        fontFamily: 'inherit',
    },
    cancelDeleteBtn: {
        flex: 1,
        background: '#2A1A0E',
        color: '#D4C3A3',
        border: 'none',
        padding: '8px',
        borderRadius: '6px',
        fontSize: '12px',
        cursor: 'pointer',
        fontFamily: 'inherit',
    },
    footer: {
        borderTop: '1px solid #2A1A0E',
        padding: '40px 20px',
        textAlign: 'center',
        color: '#8B7050',
        fontSize: '12px',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(12, 8, 6, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '40px',
    },
    modalContent: {
        background: '#160E07',
        border: '1px solid #2A1A0E',
        borderRadius: '24px',
        maxWidth: '800px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    modalHeader: {
        padding: '20px',
        borderBottom: '1px solid #2A1A0E',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#B8860B',
    },
    modalClose: {
        background: 'none',
        border: 'none',
        color: '#8B7050',
        fontSize: '20px',
        cursor: 'pointer',
    },
    modalImageContainer: {
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: '20px',
    },
    modalImage: {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        transition: 'transform 0.3s ease',
    },
    modalControls: {
        padding: '20px',
        borderTop: '1px solid #2A1A0E',
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
    },
    zoomBtn: {
        width: '40px',
        height: '40px',
        background: '#2A1A0E',
        border: 'none',
        borderRadius: '50%',
        color: '#F0E6D3',
        fontSize: '20px',
        cursor: 'pointer',
    },
    closeBtn: {
        padding: '8px 24px',
        background: '#B8860B',
        color: '#0C0806',
        border: 'none',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },

    // ——— Entry Modal styles ———
    emOverlay: {
        position: 'fixed', inset: 0,
        background: 'rgba(8,5,2,0.92)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: '16px',
    },
    emBox: {
        background: '#160E07',
        border: '1px solid #2A1A0E',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '1100px',
        maxHeight: '95vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
    },
    emHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px', borderBottom: '1px solid #2A1A0E', flexShrink: 0,
    },
    emTitle: { fontSize: '20px', fontWeight: 'bold', color: '#F0E6D3' },
    emSubtitle: { fontSize: '12px', color: '#8B7050', marginTop: '2px' },
    emClose: {
        background: 'rgba(255,255,255,0.05)', border: '1px solid #2A1A0E',
        borderRadius: '50%', width: '36px', height: '36px',
        color: '#8B7050', fontSize: '18px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
    },
    emTabs: {
        display: 'flex', gap: '8px', padding: '12px 24px',
        borderBottom: '1px solid #2A1A0E', flexShrink: 0, flexWrap: 'wrap',
    },
    emTab: {
        padding: '8px 18px', borderRadius: '20px', border: '1px solid #2A1A0E',
        background: 'transparent', color: '#8B7050',
        fontSize: '13px', fontWeight: '600', cursor: 'pointer',
        fontFamily: 'inherit', transition: 'all 0.2s',
    },
    emTabActive: {
        background: '#B8860B', border: '1px solid #B8860B',
        color: '#0C0806', boxShadow: '0 4px 14px rgba(184,134,11,0.35)',
    },
    emViewer: {
        flex: 1, overflow: 'hidden', minHeight: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
    },
    emSingleImg: {
        maxWidth: '100%', maxHeight: '100%',
        objectFit: 'contain', borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
    },
    emSide: {
        display: 'flex', gap: '12px', width: '100%', height: '100%',
        flexWrap: 'wrap',
    },
    emSideCol: {
        flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '6px',
    },
    emSideLabel: {
        fontSize: '11px', fontWeight: 'bold', color: '#8B7050',
        textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center',
    },
    emSideImg: {
        width: '100%', flex: 1, objectFit: 'cover',
        borderRadius: '10px', boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
    },
    emActions: {
        display: 'flex', gap: '10px', padding: '14px 24px', flexShrink: 0,
        borderTop: '1px solid #2A1A0E', flexWrap: 'wrap', alignItems: 'center',
    },
    emBtn: {
        padding: '10px 20px', borderRadius: '10px', fontSize: '13px',
        fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
        border: 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px',
    },
    emBtnPrimary: { background: '#B8860B', color: '#0C0806', boxShadow: '0 4px 12px rgba(184,134,11,0.35)' },
    emBtnSecondary: { background: 'rgba(139,112,80,0.15)', border: '1px solid #3A2510', color: '#D4C3A3' },
    emBtnWorld: { background: 'rgba(184,134,11,0.15)', border: '1px solid rgba(184,134,11,0.4)', color: '#F0E6D3' },
    emBtnDelete: { background: 'transparent', border: '1px solid rgba(255,107,107,0.35)', color: '#ff6b6b', marginLeft: 'auto' },
    emBtnDanger: { background: '#ff6b6b', color: '#fff' },
};
