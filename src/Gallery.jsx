import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ComparisonSlider from './ComparisonSlider';
import { exportCollage } from './utils/collageGenerator';
import { exportDesignPDF } from './utils/pdfGenerator';
import WorldViewerModal from './WorldViewerModal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Gallery({ onBack, onGoToStyles, onGoToDesigner }) {
    const { t, i18n } = useTranslation();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [comparisonModes, setComparisonModes] = useState({}); // { [entryId]: 'slider' | 'sideBySide' }
    const [downloadingId, setDownloadingId] = useState(null);
    const [filter, setFilter] = useState('all');
    const [zoomModal, setZoomModal] = useState({ open: false, image: null, alt: '', zoom: 1, beforeImage: null, afterImage: null });
    const [worldModal, setWorldModal] = useState({ open: false, entry: null });
    const [pdfDownloadingId, setPdfDownloadingId] = useState(null);

    // Fetch gallery entries
    const fetchGallery = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/gallery`);
            if (!res.ok) throw new Error('Failed to load gallery');
            const data = await res.json();
            setEntries(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchGallery(); }, [fetchGallery]);

    // Delete entry
    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/gallery/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            setEntries(prev => prev.filter(e => e.id !== id));
            setConfirmDeleteId(null);
            setExpandedId(null);
        } catch (err) {
            setError(err.message);
        }
    };

    // Toggle favorite
    const toggleFavorite = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            const res = await fetch(`${API_BASE_URL}/api/gallery/${id}/favorite`, { method: 'PATCH' });
            if (!res.ok) throw new Error('Failed to update favorite');
            const data = await res.json();
            setEntries(prev => prev.map(entry => entry.id === id ? { ...entry, isFavorite: data.isFavorite } : entry));
        } catch (err) {
            setError(err.message);
        }
    };

    // Zoom helpers (can accept single image or before/after pair)
    const openZoom = (image, alt, beforeImage = null, afterImage = null) => {
        setZoomModal({
            open: true,
            image,
            alt,
            zoom: 1,
            beforeImage,
            afterImage
        });
    };
    const closeZoom = () => setZoomModal({ open: false, image: null, alt: '', zoom: 1, beforeImage: null, afterImage: null });
    const zoomIn = () => setZoomModal(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.5, 3) }));
    const zoomOut = () => setZoomModal(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.5, 0.5) }));
    const handleWheelZoom = (e) => { e.preventDefault(); e.deltaY < 0 ? zoomIn() : zoomOut(); };

    // Format date
    const formatDate = (iso) => {
        const d = new Date(iso);
        return d.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // Download image
    const handleDownload = async (entry) => {
        setDownloadingId(entry.id);
        try {
            await exportCollage(
                entry.originalImage.startsWith('http') ? entry.originalImage : `${API_BASE_URL}${entry.originalImage}`,
                entry.generatedImage.startsWith('http') ? entry.generatedImage : `${API_BASE_URL}${entry.generatedImage}`,
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
                originalImage: entry.originalImage.startsWith('http') ? entry.originalImage : `${API_BASE_URL}${entry.originalImage}`,
                generatedImage: entry.generatedImage.startsWith('http') ? entry.generatedImage : `${API_BASE_URL}${entry.generatedImage}`,
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

    return (
        <div style={s.app}>
            {/* Header */}
            <header style={s.header}>
                <div style={s.headerBar} />
                <div style={s.headerContent}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center' }}>
                        {onBack && (
                            <button onClick={onBack} style={s.backBtn}>{t('gallery.actions.back')}</button>
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
                                {t('gallery.actions.styles')}
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
                                {t('gallery.actions.create')}
                            </button>
                        )}
                        <div>
                            <h1 style={s.title}>{t('gallery.title')}</h1>
                            <p style={s.subtitle}>
                                {t('gallery.subtitle', { count: entries.length })}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', gap: '8px' }}>
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
                </div>
            </header>

            {/* Main */}
            <main style={s.main}>
                {loading && (
                    <div style={s.loadingContainer}>
                        <div style={s.spinner} />
                        <span style={{ color: '#B8860B' }}>{t('gallery.status.loading')}</span>
                    </div>
                )}

                {error && <div style={s.error}>{error}</div>}

                {!loading && entries.length === 0 && (
                    <div style={s.emptyState}>
                        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎨</div>
                        <h3 style={{ color: '#F0E6D3', fontSize: '20px', margin: '0 0 12px 0' }}>
                            {t('gallery.status.emptyTitle')}
                        </h3>
                        <p style={{ color: '#8B7050', fontSize: '14px', margin: '0 0 24px 0' }}>
                            {t('gallery.status.emptyDesc')}
                        </p>
                        <button onClick={onBack} style={s.primaryBtn}>
                            {t('gallery.status.goToDesigner')}
                        </button>
                    </div>
                )}

                {!loading && entries.length > 0 && (
                    <div style={s.grid}>
                        {entries.filter(e => filter === 'all' || e.isFavorite).map(entry => (
                            <div key={entry.id} style={s.card} className="gallery-card">
                                {/* Thumbnail */}
                                <div
                                    style={s.thumbnailWrapper}
                                    onClick={() => {
                                        if (expandedId === entry.id) {
                                            openZoom(
                                                null,
                                                entry.styleName,
                                                entry.originalImage.startsWith('http') ? entry.originalImage : `${API_BASE_URL}${entry.originalImage}`,
                                                entry.generatedImage.startsWith('http') ? entry.generatedImage : `${API_BASE_URL}${entry.generatedImage}`
                                            );
                                        } else {
                                            setExpandedId(entry.id);
                                        }
                                    }}
                                >
                                    <img
                                        src={entry.generatedImage.startsWith('http') ? entry.generatedImage : `${API_BASE_URL}${entry.generatedImage}`}
                                        alt={entry.styleName}
                                        style={s.thumbnail}
                                        className="gallery-thumb"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <div style={s.thumbnailOverlay} className="gallery-thumb-overlay">
                                        <span style={{ fontSize: '18px' }}>{t('gallery.actions.zoom')}</span>
                                    </div>
                                </div>

                                {/* Card Info */}
                                <div style={s.cardBody}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={s.cardTitle}>{entry.styleName}</div>
                                        <button
                                            onClick={(e) => toggleFavorite(entry.id, e)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '18px',
                                                padding: '0 4px',
                                                marginTop: '-2px',
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

                                {/* Expanded View */}
                                {expandedId === entry.id && (
                                    <div style={s.expandedPanel}>
                                        {/* Comparison Mode Toggle */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            marginBottom: '16px'
                                        }}>
                                            <button
                                                onClick={() => setComparisonModes(prev => ({ ...prev, [entry.id]: 'slider' }))}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: (comparisonModes[entry.id] || 'slider') === 'slider' ? '#B8860B' : 'transparent',
                                                    border: `1px solid ${(comparisonModes[entry.id] || 'slider') === 'slider' ? '#B8860B' : '#2A1A0E'}`,
                                                    borderRadius: '4px',
                                                    color: (comparisonModes[entry.id] || 'slider') === 'slider' ? '#0C0806' : '#8B7050',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    fontFamily: 'inherit'
                                                }}
                                            >
                                                ↔ Slider
                                            </button>
                                            <button
                                                onClick={() => setComparisonModes(prev => ({ ...prev, [entry.id]: 'sideBySide' }))}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: comparisonModes[entry.id] === 'sideBySide' ? '#B8860B' : 'transparent',
                                                    border: `1px solid ${comparisonModes[entry.id] === 'sideBySide' ? '#B8860B' : '#2A1A0E'}`,
                                                    borderRadius: '4px',
                                                    color: comparisonModes[entry.id] === 'sideBySide' ? '#0C0806' : '#8B7050',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    fontFamily: 'inherit'
                                                }}
                                            >
                                                ▥ Side-by-Side
                                            </button>
                                        </div>

                                        {/* Result View */}
                                        {(comparisonModes[entry.id] || 'slider') === 'slider' ? (
                                            <div style={{ marginBottom: '16px' }}>
                                                <ComparisonSlider
                                                    beforeImage={entry.originalImage.startsWith('http') ? entry.originalImage : `${API_BASE_URL}${entry.originalImage}`}
                                                    afterImage={entry.generatedImage.startsWith('http') ? entry.generatedImage : `${API_BASE_URL}${entry.generatedImage}`}
                                                    height={220}
                                                />
                                            </div>
                                        ) : (
                                            <div style={{
                                                display: 'flex',
                                                gap: '8px',
                                                marginBottom: '16px',
                                                flexDirection: window.innerWidth < 480 ? 'column' : 'row'
                                            }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '10px', color: '#8B7050', marginBottom: '4px', textAlign: 'center' }}>AVANT</div>
                                                    <img
                                                        src={entry.originalImage.startsWith('http') ? entry.originalImage : `${API_BASE_URL}${entry.originalImage}`}
                                                        alt="Original"
                                                        style={{ width: '100%', borderRadius: '4px', aspectRatio: '4/3', objectFit: 'cover', cursor: 'pointer' }}
                                                        onClick={() => openZoom(null, entry.styleName, entry.originalImage, entry.generatedImage)}
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '10px', color: '#B8860B', marginBottom: '4px', textAlign: 'center' }}>APRÈS</div>
                                                    <img
                                                        src={entry.generatedImage.startsWith('http') ? entry.generatedImage : `${API_BASE_URL}${entry.generatedImage}`}
                                                        alt="Generated"
                                                        style={{ width: '100%', borderRadius: '4px', aspectRatio: '4/3', objectFit: 'cover', cursor: 'pointer' }}
                                                        onClick={() => openZoom(null, entry.styleName, entry.originalImage, entry.generatedImage)}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                            <button
                                                onClick={() => openZoom(
                                                    null,
                                                    entry.styleName,
                                                    entry.originalImage.startsWith('http') ? entry.originalImage : `${API_BASE_URL}${entry.originalImage}`,
                                                    entry.generatedImage.startsWith('http') ? entry.generatedImage : `${API_BASE_URL}${entry.generatedImage}`
                                                )}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: 'transparent',
                                                    border: '1px solid #8B7050',
                                                    borderRadius: '4px',
                                                    color: '#8B7050',
                                                    fontSize: '11px',
                                                    cursor: 'pointer',
                                                    fontFamily: 'inherit'
                                                }}
                                            >
                                                {t('gallery.actions.zoom')}
                                            </button>
                                        </div>

                                        {/* Custom Prompt Display */}
                                        {entry.customPrompt && (
                                            <div style={{
                                                marginBottom: '16px',
                                                padding: '12px',
                                                background: 'rgba(184,134,11,0.05)',
                                                border: '1px solid rgba(184,134,11,0.2)',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                color: '#D4C3A3',
                                                fontStyle: 'italic'
                                            }}>
                                                <span style={{
                                                    display: 'block',
                                                    color: '#B8860B',
                                                    fontWeight: 'bold',
                                                    fontStyle: 'normal',
                                                    marginBottom: '4px',
                                                    textTransform: 'uppercase',
                                                    fontSize: '10px',
                                                    letterSpacing: '0.05em'
                                                }}>
                                                    {t('gallery.prompts.instructions')}
                                                </span>
                                                "{entry.customPrompt}"
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div style={s.expandedActions}>
                                            <button
                                                onClick={() => handleDownload(entry)}
                                                disabled={downloadingId === entry.id}
                                                style={{
                                                    ...s.downloadBtn,
                                                    opacity: downloadingId === entry.id ? 0.7 : 1,
                                                    cursor: downloadingId === entry.id ? 'wait' : 'pointer'
                                                }}
                                            >
                                                {downloadingId === entry.id ? `⏳ ${t('app.result.creating')}` : `📥 ${t('gallery.actions.download')}`}
                                            </button>

                                            <button
                                                onClick={() => handleExportPDF(entry)}
                                                disabled={pdfDownloadingId === entry.id}
                                                style={{
                                                    ...s.pdfBtn,
                                                    opacity: pdfDownloadingId === entry.id ? 0.7 : 1,
                                                    cursor: pdfDownloadingId === entry.id ? 'wait' : 'pointer'
                                                }}
                                            >
                                                {pdfDownloadingId === entry.id ? `⏳ ${t('gallery.actions.pdf')}...` : `📄 ${t('gallery.actions.pdf')}`}
                                            </button>

                                            {/* Bouton Monde 3D si worldUrl existe */}
                                            {entry.worldUrl && (
                                                <button
                                                    onClick={() => setWorldModal({ open: true, entry })}
                                                    style={s.worldBtn}
                                                >
                                                    🌍 {t('gallery.actions.world')}
                                                </button>
                                            )}

                                            {confirmDeleteId === entry.id ? (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => handleDelete(entry.id)} style={s.confirmDeleteBtn}>
                                                        {t('gallery.status.confirm')}
                                                    </button>
                                                    <button onClick={() => setConfirmDeleteId(null)} style={s.cancelDeleteBtn}>
                                                        {t('gallery.status.cancel')}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setConfirmDeleteId(entry.id)} style={s.deleteBtn}>
                                                    🗑️ {t('gallery.actions.delete')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
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
            {worldModal.open && worldModal.entry?.worldUrl && (
                <WorldViewerModal
                    mode="view"
                    worldUrl={worldModal.entry.worldUrl}
                    selectedStyle={{ name: worldModal.entry.styleName }}
                    onClose={() => setWorldModal({ open: false, entry: null })}
                />
            )}

            {/* Zoom Modal */}
            {zoomModal.open && (
                <div style={s.modalOverlay} onClick={closeZoom}>
                    <div
                        style={{
                            ...s.modalContent,
                            ...(zoomModal.beforeImage && zoomModal.afterImage ? { width: '90vw', height: '90vh' } : {})
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={s.modalHeader}>
                            <span style={s.modalTitle}>{zoomModal.alt} (Zoom: {Math.round(zoomModal.zoom * 100)}%)</span>
                            <button onClick={closeZoom} style={s.modalClose}>✕</button>
                        </div>
                        <div
                            style={{
                                ...s.modalImageContainer,
                                ...(zoomModal.beforeImage && zoomModal.afterImage ? { padding: '40px' } : {})
                            }}
                            onWheel={handleWheelZoom}
                        >
                            {zoomModal.beforeImage && zoomModal.afterImage ? (
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flex: 1
                                }}>
                                    <ComparisonSlider
                                        beforeImage={zoomModal.beforeImage}
                                        afterImage={zoomModal.afterImage}
                                        height="100%"
                                    />
                                </div>
                            ) : (
                                <img
                                    src={zoomModal.image}
                                    alt={zoomModal.alt}
                                    style={{ ...s.modalImage, transform: `scale(${zoomModal.zoom})` }}
                                />
                            )}
                        </div>
                        <div style={s.modalControls}>
                            <button onClick={zoomOut} style={s.zoomBtn}>-</button>
                            <button onClick={closeZoom} style={s.closeBtn}>{t('gallery.status.close')}</button>
                            <button onClick={zoomIn} style={s.zoomBtn}>+</button>
                        </div>
                    </div>
                </div>
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
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
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
        height: 'min(50vw, 200px)',
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
    }
};
