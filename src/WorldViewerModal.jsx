import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:5000';

/**
 * WorldViewerModal — Modal plein écran pour la génération et l'exploration d'un monde virtuel 3D
 *
 * Props:
 *  - mode: 'generate' | 'view'
 *  - generatedImage: string (chemin relatif, ex: /generated/xxx.png) — requis en mode generate
 *  - selectedStyle: object — requis en mode generate
 *  - galleryEntryId: string — pour sauvegarder le worldUrl en galerie
 *  - worldUrl: string — requis en mode view
 *  - onClose: () => void
 */
export default function WorldViewerModal({
    mode = 'generate',
    generatedImage,
    selectedStyle,
    galleryEntryId,
    worldUrl: initialWorldUrl,
    onClose
}) {
    const [phase, setPhase] = useState(mode === 'view' ? 'viewer' : 'init');
    // phases: 'init' → 'uploading' → 'generating' → 'polling' → 'viewer' | 'error'
    const [worldUrl, setWorldUrl] = useState(initialWorldUrl || null);
    const [operationId, setOperationId] = useState(null);
    const [error, setError] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [elapsedSecs, setElapsedSecs] = useState(0);
    const pollRef = useRef(null);
    const timerRef = useRef(null);
    const modalRef = useRef(null);

    const steps = [
        { key: 'uploading', label: 'Envoi de l\'image vers World Labs...' },
        { key: 'generating', label: 'Lancement de la génération 3D...' },
        { key: 'polling', label: 'Génération du monde en cours... (2-5 min)' },
        { key: 'viewer', label: 'Monde prêt !' },
    ];
    const currentStepIndex = steps.findIndex(s => s.key === phase);

    // Timer visible
    useEffect(() => {
        if (['uploading', 'generating', 'polling'].includes(phase)) {
            timerRef.current = setInterval(() => setElapsedSecs(s => s + 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [phase]);

    // Polling du status de l'opération
    const startPolling = useCallback((opId, entryId) => {
        setPhase('polling');
        pollRef.current = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/worlds/status/${opId}`);
                const data = await res.json();
                if (data.done) {
                    clearInterval(pollRef.current);
                    const url = data.worldUrl || (data.worldId ? `https://marble.worldlabs.ai/world/${data.worldId}` : null);
                    if (url) {
                        setWorldUrl(url);
                        setPhase('viewer');
                        // Sauvegarder en galerie si on a un entryId
                        if (entryId) {
                            fetch(`${API_BASE_URL}/api/gallery/${entryId}/world`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ worldUrl: url, worldOperationId: opId })
                            }).catch(console.error);
                        }
                    } else {
                        setError('Monde généré mais aucun lien disponible.');
                        setPhase('error');
                    }
                } else if (data.error) {
                    clearInterval(pollRef.current);
                    setError(data.error);
                    setPhase('error');
                }
            } catch (err) {
                clearInterval(pollRef.current);
                setError('Impossible de vérifier l\'état du monde : ' + err.message);
                setPhase('error');
            }
        }, 5000);
    }, []);

    // Démarrer la création si mode generate
    useEffect(() => {
        if (mode !== 'generate') return;

        const create = async () => {
            try {
                setPhase('uploading');
                const response = await fetch(`${API_BASE_URL}/api/worlds/create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ generatedImage, style: selectedStyle })
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data?.details || data?.error || 'Création échouée');
                }
                setPhase('generating');
                if (data.worldUrl) {
                    // Déjà prêt
                    setWorldUrl(data.worldUrl);
                    setPhase('viewer');
                    if (galleryEntryId) {
                        fetch(`${API_BASE_URL}/api/gallery/${galleryEntryId}/world`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ worldUrl: data.worldUrl, worldOperationId: data.operationId })
                        }).catch(console.error);
                    }
                } else if (data.operationId) {
                    setOperationId(data.operationId);
                    startPolling(data.operationId, galleryEntryId);
                } else {
                    throw new Error('Aucun operationId reçu de World Labs');
                }
            } catch (err) {
                setError(err.message);
                setPhase('error');
            }
        };

        create();
        return () => clearInterval(pollRef.current);
    }, []); // eslint-disable-line

    // Plein écran natif
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            modalRef.current?.requestFullscreen?.();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen?.();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFSChange);
        return () => document.removeEventListener('fullscreenchange', onFSChange);
    }, []);

    // Fermer avec Escape
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' && !document.fullscreenElement) onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    return (
        <div style={s.overlay}>
            <div ref={modalRef} style={s.modal}>

                {/* ── Header ── */}
                <div style={s.header}>
                    <div style={s.headerLeft}>
                        <span style={s.headerIcon}>🌍</span>
                        <div>
                            <div style={s.headerTitle}>
                                {selectedStyle ? `Monde – ${selectedStyle.name}` : 'Monde Virtuel 3D'}
                            </div>
                            {['uploading', 'generating', 'polling'].includes(phase) && (
                                <div style={s.headerTimer}>⏱ {formatTime(elapsedSecs)}</div>
                            )}
                        </div>
                    </div>
                    <div style={s.headerActions}>
                        {phase === 'viewer' && (
                            <button onClick={toggleFullscreen} style={s.iconBtn} title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}>
                                {isFullscreen ? '⊡' : '⛶'}
                            </button>
                        )}
                        <button onClick={onClose} style={s.closeBtn} title="Fermer">✕</button>
                    </div>
                </div>

                {/* ── Contenu ── */}
                <div style={s.body}>

                    {/* Génération en cours */}
                    {['uploading', 'generating', 'polling', 'init'].includes(phase) && (
                        <div style={s.generatingWrapper}>
                            {/* Globe animé */}
                            <div style={s.globeWrapper}>
                                <div style={s.globe}>🌍</div>
                                <div style={s.pulseRing} />
                                <div style={{ ...s.pulseRing, animationDelay: '0.5s', opacity: 0.5 }} />
                            </div>

                            {/* Étapes */}
                            <div style={s.stepsWrapper}>
                                {steps.slice(0, -1).map((step, i) => {
                                    const done = i < currentStepIndex;
                                    const active = i === currentStepIndex;
                                    return (
                                        <div key={step.key} style={s.step}>
                                            <div style={{
                                                ...s.stepDot,
                                                background: done ? '#228B22' : active ? '#B8860B' : '#2A1A0E',
                                                border: `2px solid ${done ? '#228B22' : active ? '#B8860B' : '#3A2A1E'}`,
                                            }}>
                                                {done ? '✓' : active ? <span style={s.stepSpinner} /> : ''}
                                            </div>
                                            <span style={{
                                                ...s.stepLabel,
                                                color: done ? '#6B9B6B' : active ? '#F0E6D3' : '#4A3520',
                                                fontWeight: active ? 'bold' : 'normal',
                                            }}>
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Message info */}
                            {phase === 'polling' && (
                                <div style={s.infoBox}>
                                    <div style={{ fontSize: '13px', color: '#B8860B', marginBottom: '4px' }}>
                                        La génération 3D prend généralement 2 à 5 minutes.
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6B5030' }}>
                                        Le viewer s'affichera automatiquement une fois prêt. Pas besoin de rester sur cette fenêtre.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Erreur */}
                    {phase === 'error' && (
                        <div style={s.errorWrapper}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                            <div style={{ color: '#C41E3A', fontSize: '16px', marginBottom: '8px' }}>Erreur de génération</div>
                            <div style={{ color: '#8B7050', fontSize: '13px', maxWidth: '400px', textAlign: 'center' }}>{error}</div>
                            <button onClick={onClose} style={s.retryBtn}>Fermer</button>
                        </div>
                    )}

                    {/* Viewer Marble — écran de lancement */}
                    {phase === 'viewer' && worldUrl && (
                        <div style={s.launchWrapper}>
                            <div style={s.launchGlobeArea}>
                                <div style={s.launchGlobe}>🌍</div>
                                <div style={s.launchRing1} />
                                <div style={s.launchRing2} />
                            </div>

                            <div style={s.launchTitle}>Votre monde 3D est prêt !</div>
                            <div style={s.launchSub}>
                                Explorez votre intérieur africain en 3D immersive sur Marble.
                            </div>

                            <button
                                onClick={() => {
                                    const w = Math.min(1400, window.screen.width - 100);
                                    const h = Math.min(900, window.screen.height - 100);
                                    const left = (window.screen.width - w) / 2;
                                    const top = (window.screen.height - h) / 2;
                                    window.open(worldUrl, 'marble-world', `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`);
                                }}
                                style={s.launchBtn}
                            >
                                🚀 Explorer le monde 3D
                            </button>


                        </div>
                    )}

                </div>



            </div>

            <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.7} 50%{transform:scale(1.15);opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulseRing { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.5);opacity:0} }
        @keyframes launchPulseAnim { 0%{transform:translate(-50%,-50%) scale(1);opacity:0.5} 100%{transform:translate(-50%,-50%) scale(2.8);opacity:0} }
        .globe-emoji { animation: pulse 2s ease-in-out infinite; }
      `}</style>
        </div>
    );
}

const s = {
    overlay: {
        position: 'fixed', inset: 0, background: 'rgba(4,2,1,0.95)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: '16px'
    },
    modal: {
        background: '#0C0806', border: '1px solid #2A1A0E', borderRadius: '12px',
        width: '100%', maxWidth: '1100px', height: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 0 60px rgba(184,134,11,0.15)'
    },
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid #1E1208',
        background: '#110A05', flexShrink: 0
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    headerIcon: { fontSize: '28px' },
    headerTitle: { color: '#F0E6D3', fontSize: '16px', fontFamily: "'Georgia', serif" },
    headerTimer: { color: '#6B5030', fontSize: '12px', marginTop: '2px' },
    headerActions: { display: 'flex', alignItems: 'center', gap: '8px' },
    iconBtn: {
        width: '36px', height: '36px', borderRadius: '6px',
        background: 'transparent', border: '1px solid #2A1A0E',
        color: '#8B7050', fontSize: '16px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    openBtn: {
        padding: '7px 14px', borderRadius: '6px',
        background: 'rgba(184,134,11,0.15)', border: '1px solid #B8860B',
        color: '#B8860B', fontSize: '12px', textDecoration: 'none',
        fontWeight: 'bold', cursor: 'pointer'
    },
    closeBtn: {
        width: '36px', height: '36px', borderRadius: '6px',
        background: 'transparent', border: '1px solid #2A1A0E',
        color: '#8B7050', fontSize: '18px', cursor: 'pointer'
    },
    body: { flex: 1, display: 'flex', overflow: 'hidden' },
    iframe: { width: '100%', height: '100%', border: 'none', background: '#000' },

    // Génération
    generatingWrapper: {
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '32px', padding: '40px'
    },
    globeWrapper: { position: 'relative', width: '80px', height: '80px' },
    globe: {
        fontSize: '64px', lineHeight: 1,
        animation: 'pulse 2s ease-in-out infinite',
        display: 'block', textAlign: 'center'
    },
    pulseRing: {
        position: 'absolute', inset: '-8px', borderRadius: '50%',
        border: '2px solid rgba(184,134,11,0.4)',
        animation: 'pulseRing 2s ease-out infinite'
    },
    stepsWrapper: { display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '420px' },
    step: { display: 'flex', alignItems: 'center', gap: '12px' },
    stepDot: {
        width: '24px', height: '24px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: '12px', color: '#fff'
    },
    stepSpinner: {
        display: 'inline-block', width: '10px', height: '10px',
        border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite'
    },
    stepLabel: { fontSize: '14px', fontFamily: "'Georgia', serif" },
    infoBox: {
        padding: '16px 24px', background: 'rgba(184,134,11,0.05)',
        border: '1px solid rgba(184,134,11,0.2)', borderRadius: '8px',
        textAlign: 'center', maxWidth: '420px'
    },

    // Erreur
    errorWrapper: {
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '12px'
    },
    retryBtn: {
        marginTop: '16px', padding: '10px 24px',
        background: 'transparent', border: '1px solid #C41E3A',
        borderRadius: '6px', color: '#C41E3A', cursor: 'pointer', fontSize: '14px'
    },

    // Launch screen
    launchWrapper: {
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '24px', padding: '40px', position: 'relative', overflow: 'hidden'
    },
    launchGlobeArea: {
        position: 'relative', width: '120px', height: '120px',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    launchGlobe: {
        fontSize: '72px', lineHeight: 1,
        animation: 'pulse 3s ease-in-out infinite',
        position: 'relative', zIndex: 1
    },
    launchRing1: {
        position: 'absolute', inset: '-10px', borderRadius: '50%',
        border: '2px solid rgba(184,134,11,0.3)',
        animation: 'pulseRing 2.5s ease-out infinite'
    },
    launchRing2: {
        position: 'absolute', inset: '-10px', borderRadius: '50%',
        border: '2px solid rgba(184,134,11,0.2)',
        animation: 'pulseRing 2.5s ease-out infinite 0.7s'
    },
    launchTitle: {
        color: '#F0E6D3', fontSize: '26px',
        fontFamily: "'Georgia', serif", fontWeight: 'bold',
        position: 'relative', zIndex: 1
    },
    launchSub: {
        color: '#8B7050', fontSize: '14px', textAlign: 'center',
        maxWidth: '380px', lineHeight: 1.6, position: 'relative', zIndex: 1
    },
    launchBtn: {
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        padding: '16px 36px', borderRadius: '12px',
        background: 'linear-gradient(135deg, #B8860B, #8B6914)',
        color: '#FFF8E7', fontSize: '17px', fontWeight: 'bold',
        border: 'none', cursor: 'pointer',
        boxShadow: '0 4px 24px rgba(184,134,11,0.45)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        position: 'relative', zIndex: 1, letterSpacing: '0.3px'
    },
    launchAlt: {
        color: '#6B5030', fontSize: '13px', textDecoration: 'underline',
        cursor: 'pointer', position: 'relative', zIndex: 1
    },
    launchUrlBox: {
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 16px', borderRadius: '8px',
        background: 'rgba(184,134,11,0.05)', border: '1px solid rgba(184,134,11,0.15)',
        maxWidth: '520px', width: '100%', position: 'relative', zIndex: 1
    },
    launchUrlText: {
        color: '#B8860B', fontSize: '12px', flex: 1,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
    },
    copyBtn: {
        background: 'transparent', border: 'none',
        cursor: 'pointer', fontSize: '16px', padding: '0 4px',
        flexShrink: 0
    },

    // Footer
    footer: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px', borderTop: '1px solid #1E1208',
        background: '#110A05', flexShrink: 0
    },
    footerHint: { fontSize: '12px', color: '#6B5030', fontStyle: 'italic' },
    footerLink: {
        fontSize: '12px', color: '#B8860B', textDecoration: 'underline', cursor: 'pointer'
    },
};
