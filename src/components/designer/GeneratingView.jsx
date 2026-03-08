import React from "react";

const GeneratingView = ({
    t,
    i18n,
    uploadedImage,
    API_BASE_URL,
    selectedStyle,
    editMode,
    styles: s,
}) => {
    return (
        <div style={{ ...s.generatingContainer, maxWidth: '600px', margin: '0 auto' }} className="glass-panel">
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '400px',
                aspectRatio: '16/9',
                margin: '0 auto 32px',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '2px solid var(--color-primary)',
                boxShadow: '0 0 30px rgba(212, 175, 55, 0.2)'
            }}>
                <img
                    src={uploadedImage.startsWith("http") ? uploadedImage : `${API_BASE_URL}${uploadedImage}`}
                    alt="Scanning"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, filter: 'grayscale(50%)' }}
                    className="skeleton"
                />
                <div className="ai-scanner"></div>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 10
                }}>
                    <div style={s.spinnerLarge} />
                </div>
            </div>

            <h3 style={{ ...s.generatingTitle, color: 'var(--color-primary)' }}>{t('app.generating.title')}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '24px', textAlign: 'left' }}>
                <div className="glass-panel" style={{ padding: '12px', background: 'rgba(212, 175, 55, 0.05)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Style</div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{selectedStyle?.[`name${i18n.language?.startsWith('en') ? '_en' : ''}`] || selectedStyle?.name}</div>
                </div>
                <div className="glass-panel" style={{ padding: '12px', background: 'rgba(212, 175, 55, 0.05)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Mode</div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{editMode === "background" ? t('app.generating.background') : t('app.generating.full')}</div>
                </div>
            </div>

            <div style={{ ...s.generatingDetails, marginTop: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--color-primary)' }}>🎨</span> {selectedStyle?.colors?.slice(0, 3).join(", ")}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--color-primary)' }}>🏛️</span> {t(`db.families.${selectedStyle?.family}`, { defaultValue: selectedStyle?.family })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--color-primary)' }}>🌍</span> {t(`db.regions.${selectedStyle?.region}`, { defaultValue: selectedStyle?.region })}
                </div>
            </div>
        </div>
    );
};

export default GeneratingView;
