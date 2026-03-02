import React, { useState, useEffect, useCallback } from 'react';
import ComparisonSlider from './ComparisonSlider';
import { exportCollage } from './utils/collageGenerator';
import { exportDesignPDF } from './utils/pdfGenerator';
import StyleManager from './StyleManager';
import WorldViewerModal from './WorldViewerModal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function InteriorDesignApp({ onBack, onGoToStyles }) {
  const [currentView, setCurrentView] = useState('upload'); // 'upload', 'select-style', 'generating', 'result', 'manage-styles'
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generatedId, setGeneratedId] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [activeRegion, setActiveRegion] = useState('Tout');
  const [activeFamily, setActiveFamily] = useState('Tout');
  const [search, setSearch] = useState('');
  const [dragActive, setDragActive] = useState(false);
  // Zoom modal state
  const [zoomModal, setZoomModal] = useState({ open: false, image: null, alt: '', zoom: 1 });
  const [comparisonMode, setComparisonMode] = useState('slider'); // 'slider' or 'sideBySide'
  const [customPrompt, setCustomPrompt] = useState(''); // User's custom instructions
  const [editMode, setEditMode] = useState('full'); // 'full' or 'background'
  const [isWorldCreating, setIsWorldCreating] = useState(false);
  const [showWorldModal, setShowWorldModal] = useState(false);
  const [worldOperationId, setWorldOperationId] = useState(null);
  const [worldStatus, setWorldStatus] = useState(null);

  // Dynamic styles database
  const [stylesDb, setStylesDb] = useState({ styles: [], regions: [], families: [] });

  // Fetch styles from backend
  const fetchStyles = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/styles`);
      if (!res.ok) throw new Error('Failed to fetch styles');
      const data = await res.json();

      // Extract unique regions and families for filters
      const regions = [...new Set(data.styles.map(s => s.region))].filter(Boolean);
      const families = [...new Set(data.styles.map(s => s.family))].filter(Boolean);

      setStylesDb({
        styles: data.styles,
        regions: regions,
        families: families
      });
    } catch (err) {
      console.error('Error fetching styles:', err);
    }
  }, []);

  useEffect(() => {
    fetchStyles();
  }, [fetchStyles]);

  // Filter styles
  const filteredStyles = stylesDb.styles.filter(s => {
    const matchSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.country && s.country.toLowerCase().includes(search.toLowerCase())) ||
      (s.family && s.family.toLowerCase().includes(search.toLowerCase()));
    const matchRegion = activeRegion === 'Tout' || s.region === activeRegion;
    const matchFamily = activeFamily === 'Tout' || s.family === activeFamily;
    return matchSearch && matchRegion && matchFamily;
  });

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setUploadedImage(data.path);
      setCurrentView('select-style');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle drag and drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  // Generate styled image
  const handleGenerate = async () => {
    if (!selectedStyle || !uploadedImage) return;

    setIsLoading(true);
    setError(null);
    setCurrentView('generating');

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalImage: uploadedImage,
          style: selectedStyle,
          customPrompt: customPrompt,
          editMode: editMode
        })
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();
      setGeneratedImage(data.generatedImage);
      setGeneratedId(data.id);
      setIsFavorite(false);
      setCurrentView('result');
    } catch (err) {
      setError(err.message);
      setCurrentView('select-style');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!generatedId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/gallery/${generatedId}/favorite`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to update favorite');
      const data = await res.json();
      setIsFavorite(data.isFavorite);
    } catch (err) {
      console.error('Favorite error:', err);
    }
  };

  // Download image using fetch
  const handleDownload = async () => {
    if (!generatedImage || !uploadedImage) return;
    setIsDownloading(true);
    setError(null);
    try {
      await exportCollage(
        uploadedImage.startsWith('http') ? uploadedImage : `${API_BASE_URL}${uploadedImage}`,
        generatedImage.startsWith('http') ? generatedImage : `${API_BASE_URL}${generatedImage}`,
        selectedStyle.name
      );
    } catch (err) {
      console.error('Download failed:', err);
      setError('Échec du téléchargement du collage');
    } finally {
      setIsDownloading(false);
    }
  };

  // Export PDF du design
  const handleExportPDF = async () => {
    if (!generatedImage || !selectedStyle || isPdfGenerating) return;
    setIsPdfGenerating(true);
    try {
      await exportDesignPDF({
        beforeSrc: uploadedImage.startsWith('http') ? uploadedImage : `${API_BASE_URL}${uploadedImage}`,
        afterSrc: generatedImage.startsWith('http') ? generatedImage : `${API_BASE_URL}${generatedImage}`,
        style: selectedStyle,
        customPrompt: customPrompt || null,
      });
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // Open world viewer modal
  const handleCreateWorld = () => {
    if (!generatedImage) return;
    setShowWorldModal(true);
  };

  // Open zoom modal
  const openZoom = (image, alt) => {
    setZoomModal({ open: true, image, alt, zoom: 1 });
  };

  // Close zoom modal
  const closeZoom = () => {
    setZoomModal({ open: false, image: null, alt: '', zoom: 1 });
  };

  // Zoom in/out
  const zoomIn = () => setZoomModal(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.5, 3) }));
  const zoomOut = () => setZoomModal(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.5, 0.5) }));

  // Handle wheel zoom
  const handleWheelZoom = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };
  const handleReset = () => {
    setCurrentView('upload');
    setUploadedImage(null);
    setSelectedStyle(null);
    setGeneratedImage(null);
    setError(null);
  };

  // Render upload view
  const renderUpload = () => (
    <div style={styles.uploadContainer} className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{ ...styles.woodenBtn, padding: '6px 16px', fontSize: '13px' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            ← Retour
          </button>
        )}
        {onGoToStyles && (
          <button
            onClick={onGoToStyles}
            style={{ ...styles.woodenBtn, padding: '6px 16px', fontSize: '13px' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            📚 Base de Styles
          </button>
        )}
        <div style={{ flex: 1 }} /> {/* Spacer */}
        <button
          onClick={() => setCurrentView('manage-styles')}
          style={{ ...styles.woodenBtn, padding: '6px 16px', fontSize: '13px' }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          ⚙️ Gérer la Base de Styles
        </button>
      </div>
      <div
        style={{
          ...styles.dropZone,
          borderColor: dragActive ? '#B8860B' : 'transparent',
          background: dragActive ? 'rgba(184,134,11,0.05)' : '#e8cfab'
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileUpload(e.target.files[0])}
          style={styles.fileInput}
          id="file-upload"
        />
        <label htmlFor="file-upload" style={styles.uploadLabel}>
          <div style={styles.uploadIcon}>
            <img src="/camera-icon.svg" alt="Camera" style={{ width: '64px', height: '64px', opacity: 0.8 }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
            <div style={{ display: 'none', fontSize: '48px' }}>📷</div>
          </div>
          <div style={styles.uploadText}>
            Glissez votre photo ici ou <span style={styles.uploadLink}>cliquez pour parcourir</span>
          </div>
          <div style={styles.uploadHint}>
            JPG, PNG, WebP jusqu'à 10MB
          </div>
        </label>
      </div>

      {isLoading && (
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <span>Téléchargement en cours...</span>
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}
    </div>
  );

  // Render style selection view
  const renderStyleSelection = () => (
    <div style={styles.selectionContainer}>
      <div style={styles.previewSection}>
        <h3 style={styles.sectionTitle}>Votre Photo</h3>
        <img
          src={`${API_BASE_URL}${uploadedImage}`}
          alt="Uploaded"
          style={styles.previewImage}
        />
        <button onClick={() => setCurrentView('upload')} style={styles.changePhotoBtn}>
          Changer de photo
        </button>

        {selectedStyle && (
          <div style={styles.generateSection}>
            <div style={styles.selectedStylePreview}>
              <span style={styles.flag}>{selectedStyle.flag}</span>
              <span style={styles.selectedStyleName}>{selectedStyle.name}</span>
            </div>

            {/* Custom Instructions Input */}
            <div style={{ marginBottom: '16px', width: '100%', maxWidth: '300px' }}>
              <label
                htmlFor="customPrompt"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#8B7050',
                  marginBottom: '6px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Instructions supplémentaires (Optionnel)
              </label>
              <textarea
                id="customPrompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ex: Garde le canapé gris tel quel, ajoute une grande plante verte au fond..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#0E0905',
                  border: '1px solid #2A1A0E',
                  borderRadius: '6px',
                  color: '#F0E6D3',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  resize: 'vertical',
                  minHeight: '60px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            {/* Mode de transformation */}
            <div style={{ marginBottom: '16px', width: '100%', maxWidth: '300px' }}>
              <div
                style={{
                  fontSize: '12px',
                  color: '#8B7050',
                  marginBottom: '6px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Mode de transformation
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#F0E6D3' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="editMode"
                    value="full"
                    checked={editMode === 'full'}
                    onChange={() => setEditMode('full')}
                    style={{ accentColor: '#B8860B' }}
                  />
                  <span>
                    Transformer toute la pièce{' '}
                    <span style={{ color: '#8B7050', fontSize: '12px' }}>
                      (mode actuel : la personne et les meubles peuvent aussi changer)
                    </span>
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="editMode"
                    value="background"
                    checked={editMode === 'background'}
                    onChange={() => setEditMode('background')}
                    style={{ accentColor: '#B8860B' }}
                  />
                  <span>
                    Ne modifier que l’arrière‑plan{' '}
                    <span style={{ color: '#8B7050', fontSize: '12px' }}>
                      (la personne ou le meuble principal est conservé, seul le décor change)
                    </span>
                  </span>
                </label>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              style={{
                ...styles.generateBtn,
                ...(isLoading ? styles.generateBtnLoading : {})
              }}
            >
              {isLoading ? (
                <span style={styles.btnContent}>
                  <span style={styles.btnSpinner}></span>
                  Génération...
                </span>
              ) : (
                '🎨 Générer le design'
              )}
            </button>
          </div>
        )}
      </div>

      <div style={styles.stylesSection} className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ ...styles.sectionTitle, marginBottom: 0 }}>Choisir un Style Africain</h3>
        </div>

        {/* Filters */}
        <div style={styles.filters}>
          <select
            value={activeRegion}
            onChange={(e) => setActiveRegion(e.target.value)}
            style={styles.select}
          >
            <option value="Tout">Toutes les régions</option>
            {stylesDb.regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select
            value={activeFamily}
            onChange={(e) => setActiveFamily(e.target.value)}
            style={styles.select}
          >
            <option value="Tout">Toutes les familles</option>
            {stylesDb.families.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Style Grid */}
        <div style={styles.styleGrid}>
          {filteredStyles.map(style => (
            <div
              key={style.id}
              onClick={() => setSelectedStyle(style)}
              style={{
                ...styles.styleCard,
                borderColor: selectedStyle?.id === style.id ? '#B8860B' : '#2A1A0E',
                background: selectedStyle?.id === style.id ? 'rgba(184,134,11,0.15)' : '#160E07'
              }}
            >
              <div style={styles.styleHeader}>
                <span style={styles.flag}>{style.flag}</span>
                <span style={styles.styleName}>{style.name}</span>
              </div>
              <div style={styles.styleCountry}>{style.country}</div>
              <div style={styles.styleFamily}>{style.family}</div>
              <div style={styles.colorPreview}>
                {style.colors.slice(0, 4).map((c, i) => (
                  <div key={i} style={{ ...styles.colorDot, background: c }} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {selectedStyle && (
          <div style={styles.selectedInfo}>
            <h4 style={styles.selectedTitle}>
              {selectedStyle.flag} {selectedStyle.name}
            </h4>
            <p style={styles.selectedDesc}>{selectedStyle.description}</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render generating view
  const renderGenerating = () => (
    <div style={styles.generatingContainer} className="glass-panel">
      <div style={styles.spinnerLarge} />
      <h3 style={styles.generatingTitle}>Création de votre design...</h3>
      <p style={styles.generatingText}>
        L'IA applique le style <strong>{selectedStyle?.name}</strong> à votre photo
      </p>
      <p style={styles.generatingText}>
        Mode : {editMode === 'background' ? 'Arrière‑plan uniquement' : 'Transformation complète'}
      </p>
      <div style={styles.generatingDetails}>
        <div>🎨 Palette: {selectedStyle?.colors?.slice(0, 3).join(', ')}</div>
        <div>🏛️ Style: {selectedStyle?.family}</div>
        <div>🌍 Région: {selectedStyle?.region}</div>
      </div>
    </div>
  );

  // Render result view with before/after comparison
  const renderResult = () => (
    <div style={styles.resultContainer}>
      <h3 style={styles.resultTitle}>✨ Votre Design Africain</h3>

      {/* Comparison mode toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setComparisonMode('slider')}
          style={{
            padding: '8px 16px',
            background: comparisonMode === 'slider' ? '#B8860B' : 'transparent',
            border: `1px solid ${comparisonMode === 'slider' ? '#B8860B' : '#2A1A0E'}`,
            borderRadius: '4px',
            color: comparisonMode === 'slider' ? '#0C0806' : '#8B7050',
            fontSize: '12px',
            fontWeight: comparisonMode === 'slider' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          ↔ Slider
        </button>
        <button
          onClick={() => setComparisonMode('sideBySide')}
          style={{
            padding: '8px 16px',
            background: comparisonMode === 'sideBySide' ? '#B8860B' : 'transparent',
            border: `1px solid ${comparisonMode === 'sideBySide' ? '#B8860B' : '#2A1A0E'}`,
            borderRadius: '4px',
            color: comparisonMode === 'sideBySide' ? '#0C0806' : '#8B7050',
            fontSize: '12px',
            fontWeight: comparisonMode === 'sideBySide' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          ▥ Côte à côte
        </button>
      </div>

      {/* Slider mode */}
      {comparisonMode === 'slider' && (
        <div style={{ marginBottom: '32px' }}>
          <ComparisonSlider
            beforeImage={uploadedImage.startsWith('http') ? uploadedImage : `${API_BASE_URL}${uploadedImage}`}
            afterImage={generatedImage.startsWith('http') ? generatedImage : `${API_BASE_URL}${generatedImage}`}
            height={450}
          />
        </div>
      )}

      {/* Side by side mode */}
      {comparisonMode === 'sideBySide' && (
        <div style={styles.comparisonContainer}>
          <div style={styles.comparisonItem}>
            <div style={styles.comparisonLabel}>Avant</div>
            <div style={styles.imageWrapper} onClick={() => openZoom(uploadedImage.startsWith('http') ? uploadedImage : `${API_BASE_URL}${uploadedImage}`, 'Original')}>
              <img
                src={uploadedImage.startsWith('http') ? uploadedImage : `${API_BASE_URL}${uploadedImage}`}
                alt="Original"
                style={styles.comparisonImage}
              />
              <div style={styles.zoomHint}>🔍 Cliquer pour zoomer</div>
            </div>
          </div>

          <div style={styles.arrow}>→</div>

          <div style={styles.comparisonItem}>
            <div style={styles.comparisonLabel}>Après</div>
            <div style={styles.imageWrapper} onClick={() => openZoom(generatedImage.startsWith('http') ? generatedImage : `${API_BASE_URL}${generatedImage}`, 'Généré')}>
              <img
                src={generatedImage.startsWith('http') ? generatedImage : `${API_BASE_URL}${generatedImage}`}
                alt="Generated"
                style={styles.comparisonImage}
              />
              <div style={styles.zoomHint}>🔍 Cliquer pour zoomer</div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.styleInfo} className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h4 style={styles.styleInfoTitle}>
            {selectedStyle?.flag} {selectedStyle?.name}
          </h4>
          <button
            onClick={toggleFavorite}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '24px',
              padding: '0 8px',
              marginTop: '-4px',
              opacity: isFavorite ? 1 : 0.6,
              transform: isFavorite ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.2s'
            }}
            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        </div>
        <p style={styles.styleInfoDesc}>{selectedStyle?.description}</p>

        <div style={styles.materialsList}>
          <strong>Matériaux:</strong> {selectedStyle?.materials?.join(', ')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            style={{
              ...styles.downloadBtn,
              opacity: isDownloading ? 0.7 : 1,
              cursor: isDownloading ? 'wait' : 'pointer'
            }}
          >
            {isDownloading ? '⏳ Création du collage...' : '📸 Télécharger Avant/Après'}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isPdfGenerating}
            style={{
              ...styles.downloadBtn,
              background: 'rgba(184,134,11,0.2)',
              border: '1px solid #B8860B',
              color: '#B8860B',
              opacity: isPdfGenerating ? 0.7 : 1,
              cursor: isPdfGenerating ? 'wait' : 'pointer',
              marginTop: '4px'
            }}
          >
            {isPdfGenerating ? '⏳ Génération PDF...' : '📄 Exporter en PDF'}
          </button>
          <button
            onClick={handleCreateWorld}
            style={{ ...styles.secondaryBtn, marginTop: '4px' }}
          >
            🌍 Créer un monde virtuel 3D
          </button>
        </div>
      </div>

      <div style={styles.resultActions}>
        <button onClick={() => setCurrentView('select-style')} style={styles.secondaryBtn}>
          ← Essayer un autre style
        </button>
        <button onClick={handleReset} style={styles.primaryBtn}>
          🏠 Nouveau projet
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={styles.maskIcon}>🎭</div>
              <div>
                <h1 style={styles.title}>African Interior Designer</h1>
                <p style={styles.subtitle}>Transformez votre espace avec l'âme de l'Afrique</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {currentView === 'upload' && renderUpload()}
        {currentView === 'select-style' && renderStyleSelection()}
        {currentView === 'generating' && renderGenerating()}
        {currentView === 'result' && renderResult()}
        {currentView === 'manage-styles' && (
          <StyleManager
            onBack={() => {
              setCurrentView('select-style');
              fetchStyles(); // Refresh styles when returning
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>Base de {stylesDb.styles.length} styles africains · {stylesDb.regions.length} régions · {stylesDb.families.length} familles</p>
      </footer>
      {/* Zoom Modal */}
      {zoomModal.open && (
        <div style={styles.modalOverlay} onClick={closeZoom}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>{zoomModal.alt} (Zoom: {Math.round(zoomModal.zoom * 100)}%)</span>
              <button onClick={closeZoom} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalImageContainer} onWheel={handleWheelZoom}>
              <img
                src={zoomModal.image}
                alt={zoomModal.alt}
                style={{
                  ...styles.modalImage,
                  transform: `scale(${zoomModal.zoom})`
                }}
              />
            </div>
            <div style={styles.modalControls}>
              <button onClick={zoomOut} style={styles.zoomBtn}>-</button>
              <button onClick={closeZoom} style={styles.closeBtn}>Fermer</button>
              <button onClick={zoomIn} style={styles.zoomBtn}>+</button>
            </div>
            <div style={styles.modalHint}>Molette souris ou boutons +/- pour zoomer</div>
          </div>
        </div>
      )}
      {/* World Viewer Modal */}
      {showWorldModal && (
        <WorldViewerModal
          mode="generate"
          generatedImage={generatedImage}
          selectedStyle={selectedStyle}
          galleryEntryId={generatedId}
          onClose={() => setShowWorldModal(false)}
        />
      )}
    </div>
  );
}

const styles = {
  app: {
    fontFamily: "var(--font-body)",
    backgroundImage: "url(/ndop-bg.png)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    minHeight: "100vh",
    color: "#F0E6D3",
    display: "flex",
    flexDirection: "column"
  },
  header: {
    borderBottom: "none",
    background: "transparent",
    paddingTop: "40px",
    paddingBottom: "20px"
  },
  headerContent: {
    padding: "0 32px",
    textAlign: "center"
  },
  maskIcon: {
    fontSize: "64px",
    filter: "drop-shadow(2px 4px 6px rgba(0,0,0,0.5))"
  },
  title: {
    margin: "0 0 4px 0",
    fontSize: "clamp(28px, 5vw, 42px)",
    fontWeight: "900",
    color: "#7e4a1d", // Darker brown
    textShadow: "1px 1px 0px rgba(255,255,255,0.8)",
    fontFamily: "var(--font-heading)"
  },
  subtitle: {
    margin: 0,
    fontSize: "16px",
    color: "#5a3a18",
    fontWeight: "500",
    textShadow: "1px 1px 0px rgba(255,255,255,0.5)",
  },
  main: {
    flex: 1,
    padding: "0 32px 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  footer: {
    padding: "16px 32px",
    borderTop: "none",
    textAlign: "center",
    fontSize: "13px",
    color: "#8e6231",
    fontWeight: "500"
  },
  woodenBtn: {
    padding: "8px 20px",
    background: "linear-gradient(to bottom, #fdfbf7, #f4eadc)",
    border: "2px solid #5a3a18",
    borderRadius: "24px",
    color: "#5a3a18",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    fontFamily: "var(--font-heading)",
    boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
    transition: "all 0.2s ease"
  },
  // Upload styles
  uploadContainer: {
    width: "100%",
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "40px 60px",
    background: "#fdfbf7", // Very light beige matching reference
    borderRadius: "24px",
    border: "none",
    boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
    textAlign: "center",
    position: "relative"
  },
  dropZone: {
    border: "none",
    background: "#e8cfab",
    padding: "80px 40px",
    borderRadius: "16px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    boxShadow: "inset 0 4px 12px rgba(142, 98, 49, 0.2)",
    marginBottom: "20px"
  },
  fileInput: {
    display: "none"
  },
  uploadLabel: {
    cursor: "pointer"
  },
  uploadIcon: {
    fontSize: "48px",
    marginBottom: "16px",
    filter: "drop-shadow(2px 4px 6px rgba(142, 98, 49, 0.3))"
  },
  uploadText: {
    fontSize: "22px",
    fontWeight: "500",
    color: "#2a1a0e",
    marginBottom: "8px",
    fontFamily: "var(--font-body)"
  },
  uploadLink: {
    color: "#5a3a18",
    textDecoration: "underline",
    fontWeight: "bold"
  },
  uploadHint: {
    fontSize: "14px",
    color: "#5a3a18",
    fontWeight: "500"
  },
  loading: {
    marginTop: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    color: "#B8860B"
  },
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid #2A1A0E",
    borderTop: "2px solid #B8860B",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  error: {
    marginTop: "16px",
    padding: "12px",
    background: "rgba(196,30,58,0.1)",
    border: "1px solid #C41E3A",
    borderRadius: "4px",
    color: "#C41E3A",
    textAlign: "center"
  },

  // Selection styles
  selectionContainer: {
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    gap: "32px",
    maxWidth: "1200px",
    margin: "0 auto"
  },
  previewSection: {
    background: "var(--glass-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    padding: "16px"
  },
  sectionTitle: {
    fontSize: "14px",
    color: "#B8860B",
    margin: "0 0 16px 0",
    textTransform: "uppercase",
    letterSpacing: "0.1em"
  },
  previewImage: {
    width: "100%",
    height: "auto",
    borderRadius: "4px",
    marginBottom: "12px"
  },
  changePhotoBtn: {
    width: "100%",
    padding: "8px",
    background: "transparent",
    border: "1px solid #2A1A0E",
    color: "#6B5030",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "inherit"
  },
  stylesSection: {
    background: "var(--glass-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    padding: "16px"
  },
  filters: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
    flexWrap: "wrap"
  },
  select: {
    background: "#0C0806",
    border: "1px solid #2A1A0E",
    color: "#F0E6D3",
    padding: "8px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    fontFamily: "inherit",
    cursor: "pointer"
  },
  searchInput: {
    flex: 1,
    minWidth: "150px",
    background: "#0C0806",
    border: "1px solid #2A1A0E",
    color: "#F0E6D3",
    padding: "8px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    fontFamily: "inherit"
  },
  styleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "12px",
    maxHeight: "400px",
    overflowY: "auto",
    padding: "4px"
  },
  styleCard: {
    border: "1px solid #2A1A0E",
    borderRadius: "6px",
    padding: "12px",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  styleHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px"
  },
  flag: {
    fontSize: "20px"
  },
  styleName: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#F0E6D3"
  },
  styleCountry: {
    fontSize: "11px",
    color: "#8B7050",
    marginBottom: "4px"
  },
  styleFamily: {
    fontSize: "10px",
    color: "#6B5030",
    marginBottom: "8px"
  },
  colorPreview: {
    display: "flex",
    gap: "4px"
  },
  colorDot: {
    width: "16px",
    height: "16px",
    borderRadius: "2px",
    border: "1px solid #2A1A0E"
  },
  selectedInfo: {
    marginTop: "16px",
    padding: "16px",
    background: "rgba(184,134,11,0.1)",
    border: "1px solid #B8860B",
    borderRadius: "6px"
  },
  selectedTitle: {
    margin: "0 0 8px 0",
    fontSize: "16px",
    color: "#B8860B"
  },
  selectedDesc: {
    margin: "0 0 16px 0",
    fontSize: "13px",
    color: "#8B7050",
    lineHeight: "1.5"
  },
  generateSection: {
    marginTop: "16px",
    padding: "16px",
    background: "rgba(184,134,11,0.1)",
    border: "1px solid #B8860B",
    borderRadius: "6px",
    animation: "fadeIn 0.3s ease-in"
  },
  selectedStylePreview: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(184,134,11,0.3)"
  },
  selectedStyleName: {
    fontSize: "14px",
    color: "#B8860B",
    fontWeight: "bold"
  },
  generateBtn: {
    width: "100%",
    padding: "12px 24px",
    background: "#B8860B",
    border: "none",
    borderRadius: "4px",
    color: "#0C0806",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.3s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  generateBtnLoading: {
    background: "#6B5B3E",
    cursor: "not-allowed"
  },
  btnContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  btnSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid #0C0806",
    borderTop: "2px solid #B8860B",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },

  // Generating styles
  generatingContainer: {
    textAlign: "center",
    padding: "60px 20px"
  },
  spinnerLarge: {
    width: "60px",
    height: "60px",
    margin: "0 auto 24px",
    border: "3px solid #2A1A0E",
    borderTop: "3px solid #B8860B",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  generatingTitle: {
    fontSize: "24px",
    color: "#F0E6D3",
    margin: "0 0 12px 0"
  },
  generatingText: {
    fontSize: "14px",
    color: "#8B7050",
    margin: "0 0 24px 0"
  },
  generatingDetails: {
    fontSize: "12px",
    color: "#6B5030",
    lineHeight: "2"
  },

  // Result styles
  resultContainer: {
    maxWidth: "1000px",
    margin: "0 auto"
  },
  resultTitle: {
    textAlign: "center",
    fontSize: "24px",
    color: "#F0E6D3",
    margin: "0 0 32px 0"
  },
  comparisonContainer: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    gap: "16px",
    alignItems: "center",
    marginBottom: "32px"
  },
  comparisonItem: {
    textAlign: "center"
  },
  comparisonLabel: {
    fontSize: "12px",
    color: "#8B7050",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "8px"
  },
  comparisonImage: {
    width: "100%",
    maxHeight: "400px",
    objectFit: "cover",
    borderRadius: "8px",
    border: "1px solid #2A1A0E"
  },
  imageWrapper: {
    position: "relative",
    cursor: "pointer",
    overflow: "hidden",
    borderRadius: "8px"
  },
  zoomHint: {
    position: "absolute",
    bottom: "8px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.7)",
    color: "#F0E6D3",
    padding: "4px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    opacity: 0,
    pointerEvents: "none"
  },
  arrow: {
    fontSize: "24px",
    color: "#B8860B"
  },
  // Modal styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px"
  },
  modalContent: {
    background: "#160E07",
    border: "1px solid #2A1A0E",
    borderRadius: "8px",
    maxWidth: "90vw",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #2A1A0E"
  },
  modalTitle: {
    color: "#B8860B",
    fontSize: "16px"
  },
  modalClose: {
    background: "transparent",
    border: "none",
    color: "#8B7050",
    fontSize: "20px",
    cursor: "pointer"
  },
  modalImageContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "auto",
    padding: "20px",
    background: "#0C0806",
    cursor: "grab"
  },
  modalImage: {
    maxWidth: "100%",
    maxHeight: "70vh",
    objectFit: "contain",
    transition: "transform 0.2s",
    borderRadius: "4px"
  },
  modalControls: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    padding: "16px 20px",
    borderTop: "1px solid #2A1A0E",
    background: "#160E07"
  },
  zoomBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "1px solid #2A1A0E",
    background: "#0C0806",
    color: "#B8860B",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  closeBtn: {
    padding: "8px 24px",
    border: "1px solid #2A1A0E",
    borderRadius: "4px",
    background: "transparent",
    color: "#8B7050",
    cursor: "pointer",
    fontSize: "14px"
  },
  modalHint: {
    textAlign: "center",
    padding: "8px 20px",
    fontSize: "12px",
    color: "#6B5030",
    background: "#0C0806"
  },
  styleInfo: {
    background: "var(--glass-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    padding: "24px",
    textAlign: "center",
    marginBottom: "24px"
  },
  styleInfoTitle: {
    fontSize: "20px",
    color: "#B8860B",
    margin: "0 0 12px 0"
  },
  styleInfoDesc: {
    fontSize: "14px",
    color: "#8B7050",
    margin: "0 0 16px 0",
    lineHeight: "1.6"
  },
  materialsList: {
    fontSize: "13px",
    color: "#6B5030",
    marginBottom: "20px"
  },
  downloadBtn: {
    display: "inline-block",
    padding: "12px 24px",
    background: "#1B5E20",
    border: "none",
    borderRadius: "4px",
    color: "#F0E6D3",
    textDecoration: "none",
    fontSize: "14px",
    cursor: "pointer"
  },
  resultActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "center"
  },
  primaryBtn: {
    padding: "12px 24px",
    background: "#B8860B",
    border: "none",
    borderRadius: "4px",
    color: "#0C0806",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    fontFamily: "inherit"
  },
  secondaryBtn: {
    padding: "12px 24px",
    background: "transparent",
    border: "1px solid #2A1A0E",
    borderRadius: "4px",
    color: "#8B7050",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "inherit"
  }
};
