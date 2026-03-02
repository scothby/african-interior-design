import { useState, useEffect, useCallback } from 'react';
import ComparisonSlider from './ComparisonSlider';
import { exportCollage } from './utils/collageGenerator';
import WorldViewerModal from './WorldViewerModal';

const API_BASE_URL = 'http://localhost:5000';

export default function Gallery({ onBack }) {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const [filter, setFilter] = useState('all');
    const [zoomModal, setZoomModal] = useState({ open: false, image: null, alt: '', zoom: 1, beforeImage: null, afterImage: null });
    const [worldModal, setWorldModal] = useState({ open: false, entry: null }); // pour ouvrir le viewer monde

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
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // Download image
    const handleDownload = async (entry) => {
        setDownloadingId(entry.id);
        try {
            await exportCollage(
                `${API_BASE_URL}${entry.originalImage}`,
                `${API_BASE_URL}${entry.generatedImage}`,
                entry.styleName
            );
        } catch (err) {
            console.error('Download failed:', err);
            setError('Échec du téléchargement du collage');
        } finally {
            setDownloadingId(null);
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
                            <button onClick={onBack} style={s.backBtn}>← Retour</button>
                        )}
                        <div>
                            <h1 style={s.title}>🖼️ Galerie des Réalisations</h1>
                            <p style={s.subtitle}>
                                {entries.length} design{entries.length !== 1 ? 's' : ''} réalisé{entries.length !== 1 ? 's' : ''}
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
                            Toutes
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
                            ❤️ Favoris
                        </button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main style={s.main}>
                {loading && (
                    <div style={s.loadingContainer}>
                        <div style={s.spinner} />
                        <span style={{ color: '#B8860B' }}>Chargement de la galerie...</span>
                    </div>
                )}

                {error && <div style={s.error}>{error}</div>}

                {!loading && entries.length === 0 && (
                    <div style={s.emptyState}>
                        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎨</div>
                        <h3 style={{ color: '#F0E6D3', fontSize: '20px', margin: '0 0 12px 0' }}>
                            Aucune réalisation pour le moment
                        </h3>
                        <p style={{ color: '#8B7050', fontSize: '14px', margin: '0 0 24px 0' }}>
                            Utilisez le Designer pour transformer vos photos avec des styles africains.
                            Chaque création sera automatiquement sauvegardée ici.
                        </p>
                        <button onClick={onBack} style={s.primaryBtn}>
                            🏛️ Aller au Designer
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
                                            // If already expanded, open zoom with comparison
                                            openZoom(
                                                null,
                                                entry.styleName,
                                                `${API_BASE_URL}${entry.originalImage}`,
                                                `${API_BASE_URL}${entry.generatedImage}`
                                            );
                                        } else {
                                            // Otherwise, expand the card
                                            setExpandedId(entry.id);
                                        }
                                    }}
                                >
                                    <img
                                        src={`${API_BASE_URL}${entry.generatedImage}`}
                                        alt={entry.styleName}
                                        style={s.thumbnail}
                                        className="gallery-thumb"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <div style={s.thumbnailOverlay} className="gallery-thumb-overlay">
                                        <span style={{ fontSize: '18px' }}>🔍</span>
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
                                            title={entry.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
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
                                        {/* Comparison Slider */}
                                        <div style={{ marginBottom: '16px' }}>
                                            <ComparisonSlider
                                                beforeImage={`${API_BASE_URL}${entry.originalImage}`}
                                                afterImage={`${API_BASE_URL}${entry.generatedImage}`}
                                                height={220}
                                            />
                                        </div>

                                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                            <button
                                                onClick={() => openZoom(
                                                    null,
                                                    entry.styleName,
                                                    `${API_BASE_URL}${entry.originalImage}`,
                                                    `${API_BASE_URL}${entry.generatedImage}`
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
                                                🔍 Voir en grand format
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
                                                    Instructions particulières :
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
                                                {downloadingId === entry.id ? '⏳ Collage...' : '📥 Télécharger'}
                                            </button>

                                            {/* Bouton Monde 3D si worldUrl existe */}
                                            {entry.worldUrl && (
                                                <button
                                                    onClick={() => setWorldModal({ open: true, entry })}
                                                    style={s.worldBtn}
                                                >
                                                    🌍 Monde 3D
                                                </button>
                                            )}

                                            {confirmDeleteId === entry.id ? (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => handleDelete(entry.id)} style={s.confirmDeleteBtn}>
                                                        Confirmer
                                                    </button>
                                                    <button onClick={() => setConfirmDeleteId(null)} style={s.cancelDeleteBtn}>
                                                        Annuler
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setConfirmDeleteId(entry.id)} style={s.deleteBtn}>
                                                    🗑️ Supprimer
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
                <p>Galerie · {entries.length} réalisation{entries.length !== 1 ? 's' : ''}</p>
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
                            <button onClick={closeZoom} style={s.closeBtn}>Fermer</button>
                            <button onClick={zoomIn} style={s.zoomBtn}>+</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Styles — consistent with the app's dark African aesthetic
const s = {
    app: {
        fontFamily: "'Georgia', serif",
        background: "#0C0806",
        minHeight: "100vh",
        color: "#F0E6D3",
        display: "flex",
        flexDirection: "column"
    },
    header: { borderBottom: "1px solid #1E1208" },
    headerBar: {
        height: "5px",
        background: "linear-gradient(90deg,#8B0000,#B8860B,#228B22,#1A2744,#B8860B,#C41E3A,#B8860B,#228B22,#8B0000)"
    },
    headerContent: { padding: "24px 32px", textAlign: "center" },
    title: { margin: "0 0 8px 0", fontSize: "28px", fontWeight: "normal", color: "#F0E6D3" },
    subtitle: { margin: 0, fontSize: "14px", color: "#8B7050" },
    backBtn: {
        padding: "8px 16px", background: "transparent", border: "1px solid #2A1A0E",
        borderRadius: "4px", color: "#8B7050", fontSize: "12px", cursor: "pointer", fontFamily: "inherit"
    },
    main: { flex: 1, padding: "24px 32px" },
    footer: {
        padding: "16px 32px", borderTop: "1px solid #1E1208",
        textAlign: "center", fontSize: "12px", color: "#6B5030"
    },

    // Loading & Error
    loadingContainer: {
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: "12px", padding: "60px 20px"
    },
    spinner: {
        width: "24px", height: "24px", border: "2px solid #2A1A0E",
        borderTop: "2px solid #B8860B", borderRadius: "50%", animation: "spin 1s linear infinite"
    },
    error: {
        padding: "12px", background: "rgba(196,30,58,0.1)", border: "1px solid #C41E3A",
        borderRadius: "4px", color: "#C41E3A", textAlign: "center", marginBottom: "16px"
    },

    // Empty state
    emptyState: {
        textAlign: "center", padding: "80px 20px", maxWidth: "500px", margin: "0 auto"
    },
    primaryBtn: {
        padding: "12px 24px", background: "#B8860B", border: "none", borderRadius: "4px",
        color: "#0C0806", fontSize: "14px", fontWeight: "bold", cursor: "pointer", fontFamily: "inherit"
    },

    // Grid
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "16px"
    },

    // Card
    card: {
        background: "#120B05", border: "1px solid #1E1208", borderRadius: "8px",
        overflow: "hidden", transition: "all 0.2s"
    },
    thumbnailWrapper: {
        position: "relative", cursor: "pointer", overflow: "hidden",
        height: "200px", background: "#0A0603"
    },
    thumbnail: {
        width: "100%", height: "100%", objectFit: "cover",
        transition: "transform 0.3s"
    },
    thumbnailOverlay: {
        position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: 0, transition: "opacity 0.2s", pointerEvents: "none"
    },
    cardBody: { padding: "14px" },
    cardTitle: { fontSize: "15px", fontWeight: "bold", color: "#F0E6D3", marginBottom: "4px" },
    cardFamily: {
        fontSize: "11px", color: "#B8860B", textTransform: "uppercase",
        letterSpacing: "0.08em", marginBottom: "6px"
    },
    cardDate: { fontSize: "11px", color: "#6B5030" },

    // Expanded Panel
    expandedPanel: {
        padding: "16px", borderTop: "1px solid #1E1208",
        background: "#0E0905", animation: "fadeIn 0.3s ease-in"
    },
    comparisonRow: {
        display: "grid", gridTemplateColumns: "1fr auto 1fr",
        gap: "12px", alignItems: "center", marginBottom: "16px"
    },
    comparisonCol: { textAlign: "center" },
    compLabel: {
        fontSize: "10px", color: "#8B7050", textTransform: "uppercase",
        letterSpacing: "0.1em", marginBottom: "6px"
    },
    compImage: {
        width: "100%", height: "120px", objectFit: "cover",
        borderRadius: "4px", border: "1px solid #2A1A0E", cursor: "pointer"
    },
    compArrow: { fontSize: "20px", color: "#B8860B" },
    expandedActions: {
        display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap"
    },
    worldBtn: {
        padding: "8px 16px", background: "rgba(34,139,34,0.15)",
        border: "1px solid #228B22", borderRadius: "4px",
        color: "#6DBF6D", fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
        fontWeight: "bold"
    },
    downloadBtn: {
        padding: "8px 16px", background: "#1B5E20", border: "none",
        borderRadius: "4px", color: "#F0E6D3", fontSize: "12px", cursor: "pointer", fontFamily: "inherit"
    },
    deleteBtn: {
        padding: "8px 16px", background: "transparent", border: "1px solid #C41E3A44",
        borderRadius: "4px", color: "#C41E3A", fontSize: "12px", cursor: "pointer", fontFamily: "inherit"
    },
    confirmDeleteBtn: {
        padding: "8px 16px", background: "#C41E3A", border: "none",
        borderRadius: "4px", color: "#fff", fontSize: "12px", cursor: "pointer", fontFamily: "inherit"
    },
    cancelDeleteBtn: {
        padding: "8px 16px", background: "transparent", border: "1px solid #2A1A0E",
        borderRadius: "4px", color: "#8B7050", fontSize: "12px", cursor: "pointer", fontFamily: "inherit"
    },

    // Zoom Modal (identical to InteriorDesignApp)
    modalOverlay: {
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 1000, padding: "20px"
    },
    modalContent: {
        background: "#160E07", border: "1px solid #2A1A0E", borderRadius: "8px",
        maxWidth: "90vw", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden"
    },
    modalHeader: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 20px", borderBottom: "1px solid #2A1A0E"
    },
    modalTitle: { color: "#B8860B", fontSize: "16px" },
    modalClose: {
        background: "transparent", border: "none", color: "#8B7050", fontSize: "20px", cursor: "pointer"
    },
    modalImageContainer: {
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "auto", padding: "20px", background: "#0C0806", cursor: "grab"
    },
    modalImage: {
        maxWidth: "100%", maxHeight: "70vh", objectFit: "contain",
        transition: "transform 0.2s", borderRadius: "4px"
    },
    modalControls: {
        display: "flex", justifyContent: "center", alignItems: "center",
        gap: "16px", padding: "16px 20px", borderTop: "1px solid #2A1A0E", background: "#160E07"
    },
    zoomBtn: {
        width: "40px", height: "40px", borderRadius: "50%", border: "1px solid #2A1A0E",
        background: "#0C0806", color: "#B8860B", fontSize: "20px", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center"
    },
    closeBtn: {
        padding: "8px 24px", border: "1px solid #2A1A0E", borderRadius: "4px",
        background: "transparent", color: "#8B7050", cursor: "pointer", fontSize: "14px"
    }
};
