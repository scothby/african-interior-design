import React, { useState, useEffect, useCallback } from "react";
import ComparisonSlider from "./ComparisonSlider";
import { exportCollage } from "./utils/collageGenerator";
import { exportDesignPDF } from "./utils/pdfGenerator";
import StyleManager from "./StyleManager";
import WorldViewerModal from "./WorldViewerModal";
import InpaintingModal from "./InpaintingModal";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function InteriorDesignApp({ onBack, onGoToStyles }) {
  const [currentView, setCurrentView] = useState("upload"); // 'upload', 'select-style', 'generating', 'result', 'manage-styles'
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generatedId, setGeneratedId] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [activeRegion, setActiveRegion] = useState("Tout");
  const [activeFamily, setActiveFamily] = useState("Tout");
  const [search, setSearch] = useState("");
  const [dragActive, setDragActive] = useState(false);
  // Zoom modal state
  const [zoomModal, setZoomModal] = useState({
    open: false,
    image: null,
    alt: "",
    zoom: 1,
  });
  const [comparisonMode, setComparisonMode] = useState("slider"); // 'slider' or 'sideBySide'
  const [customPrompt, setCustomPrompt] = useState(""); // User's custom instructions
  const [editMode, setEditMode] = useState("full"); // 'full' or 'background'
  const [isWorldCreating, setIsWorldCreating] = useState(false);
  const [showWorldModal, setShowWorldModal] = useState(false);
  const [worldOperationId, setWorldOperationId] = useState(null);
  const [worldStatus, setWorldStatus] = useState(null);
  const [showInpaintModal, setShowInpaintModal] = useState(false);

  // Dynamic styles database
  const [stylesDb, setStylesDb] = useState({
    styles: [],
    regions: [],
    families: [],
  });

  // Fetch styles from backend
  const fetchStyles = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/styles`);
      if (!res.ok) throw new Error("Failed to fetch styles");
      const data = await res.json();

      // Extract unique regions and families for filters
      const regions = [...new Set(data.styles.map((s) => s.region))].filter(
        Boolean,
      );
      const families = [...new Set(data.styles.map((s) => s.family))].filter(
        Boolean,
      );

      setStylesDb({
        styles: data.styles,
        regions: regions,
        families: families,
      });
    } catch (err) {
      console.error("Error fetching styles:", err);
    }
  }, []);

  useEffect(() => {
    fetchStyles();
  }, [fetchStyles]);

  // Filter styles
  const filteredStyles = stylesDb.styles.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.country && s.country.toLowerCase().includes(search.toLowerCase())) ||
      (s.family && s.family.toLowerCase().includes(search.toLowerCase()));
    const matchRegion = activeRegion === "Tout" || s.region === activeRegion;
    const matchFamily = activeFamily === "Tout" || s.family === activeFamily;
    return matchSearch && matchRegion && matchFamily;
  });

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setUploadedImage(data.path);
      setCurrentView("select-style");
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
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
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
    setCurrentView("generating");

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalImage: uploadedImage,
          style: selectedStyle,
          customPrompt: customPrompt,
          editMode: editMode,
        }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const data = await response.json();
      setGeneratedImage(data.generatedImage);
      setGeneratedId(data.id);
      setIsFavorite(false);
      setCurrentView("result");
    } catch (err) {
      setError(err.message);
      setCurrentView("select-style");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!generatedId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/gallery/${generatedId}/favorite`,
        { method: "PATCH" },
      );
      if (!res.ok) throw new Error("Failed to update favorite");
      const data = await res.json();
      setIsFavorite(data.isFavorite);
    } catch (err) {
      console.error("Favorite error:", err);
    }
  };

  // Download image using fetch
  const handleDownload = async () => {
    if (!generatedImage || !uploadedImage) return;
    setIsDownloading(true);
    setError(null);
    try {
      await exportCollage(
        uploadedImage.startsWith("http")
          ? uploadedImage
          : `${API_BASE_URL}${uploadedImage}`,
        generatedImage.startsWith("http")
          ? generatedImage
          : `${API_BASE_URL}${generatedImage}`,
        selectedStyle.name,
      );
    } catch (err) {
      console.error("Download failed:", err);
      setError("Échec du téléchargement du collage");
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
        beforeSrc: uploadedImage.startsWith("http")
          ? uploadedImage
          : `${API_BASE_URL}${uploadedImage}`,
        afterSrc: generatedImage.startsWith("http")
          ? generatedImage
          : `${API_BASE_URL}${generatedImage}`,
        style: selectedStyle,
        customPrompt: customPrompt || null,
      });
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // Open world viewer modal
  const handleCreateWorld = () => {
    if (!generatedImage) return;
    setShowWorldModal(true);
  };

  // Handle inpainting submission
  const handleInpaintSubmit = async (maskDataUrl, prompt) => {
    setShowInpaintModal(false);
    setIsLoading(true);
    setError(null);
    setCurrentView("generating"); // Show loading screen

    try {
      const response = await fetch(`${API_BASE_URL}/api/inpaint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalImage: generatedImage, // Edit the result image
          maskImage: maskDataUrl,
          style: selectedStyle,
          customPrompt: prompt,
        }),
      });

      if (!response.ok) {
        let errMessage = "Inpainting failed";
        try {
          const errData = await response.json();
          errMessage = errData.error || errData.details || errMessage;
        } catch (e) { }
        throw new Error(errMessage);
      }

      const data = await response.json();
      setGeneratedImage(data.generatedImage);
      setGeneratedId(data.id);
      setIsFavorite(false);
      // Wait a moment for image to load, then switch view back
      setCurrentView("result");
    } catch (err) {
      console.error("Inpainting Submit Error:", err);
      alert("Erreur Inpainting : " + err.message);
      setError(err.message);
      setCurrentView("result");
    } finally {
      setIsLoading(false);
    }
  };

  // Open zoom modal
  const openZoom = (image, alt) => {
    setZoomModal({ open: true, image, alt, zoom: 1 });
  };

  // Close zoom modal
  const closeZoom = () => {
    setZoomModal({ open: false, image: null, alt: "", zoom: 1 });
  };

  // Zoom in/out
  const zoomIn = () =>
    setZoomModal((prev) => ({ ...prev, zoom: Math.min(prev.zoom + 0.5, 3) }));
  const zoomOut = () =>
    setZoomModal((prev) => ({ ...prev, zoom: Math.max(prev.zoom - 0.5, 0.5) }));

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
    setCurrentView("upload");
    setUploadedImage(null);
    setSelectedStyle(null);
    setGeneratedImage(null);
    setError(null);
  };

  const renderUploadContent = () => (
    <div className="w-full max-w-5xl">
      <div className="glass-panel-tw rounded-[2.5rem] p-8 md:p-14 overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-ochre/5 rounded-full blur-3xl"></div>

        <div
          className="relative group cursor-pointer"
          onClick={() => document.getElementById("file-upload").click()}
        >
          <div
            className={`upload-zone-glass-tw rounded-3xl p-12 md:p-20 transition-all duration-500 flex flex-col items-center justify-center text-center ${dragActive ? "bg-white/60 border-primary scale-[1.01]" : "group-hover:bg-white/40 dark:group-hover:bg-slate-800/40"}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="mb-8 relative pointer-events-none">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 group-hover:scale-[2.5] transition-transform duration-700"></div>
              <div className="relative w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-xl border border-white/50 dark:border-slate-700/50 transform group-hover:-translate-y-3 transition-transform duration-500">
                <span className="material-symbols-outlined text-5xl text-primary">
                  photo_camera
                </span>
              </div>
            </div>

            <h2 className="text-2xl md:text-4xl font-display font-bold mb-6 text-slate-900 dark:text-slate-50 leading-tight pointer-events-none">
              Glissez votre photo ici ou <br className="hidden md:block" />
              <span className="text-primary underline decoration-primary/30 decoration-4 underline-offset-8 cursor-pointer hover:text-primary/80 transition-colors pointer-events-auto">
                cliquez pour parcourir
              </span>
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600 dark:text-slate-400 text-sm font-semibold uppercase tracking-widest pointer-events-none">
              <span className="bg-white/40 dark:bg-slate-800/40 px-3 py-1 rounded-md">
                JPG
              </span>
              <span className="bg-white/40 dark:bg-slate-800/40 px-3 py-1 rounded-md">
                PNG
              </span>
              <span className="bg-white/40 dark:bg-slate-800/40 px-3 py-1 rounded-md">
                WebP
              </span>
              <span className="ml-2 font-normal lowercase italic opacity-70">
                — Jusqu'à 10MB
              </span>
            </div>
          </div>

          <input
            id="file-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files[0])}
          />
        </div>

        {isLoading && (
          <div style={styles.loading} className="mt-8">
            <div style={styles.spinner} />
            <span>Téléchargement en cours...</span>
          </div>
        )}

        {error && (
          <div style={styles.error} className="mt-8">
            {error}
          </div>
        )}

        <div className="mt-12 flex flex-wrap items-center justify-center gap-10 text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-primary text-xl">
                verified
              </span>
            </div>
            <span className="text-sm font-medium">
              IA optimisée pour les motifs africains
            </span>
          </div>
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
              <span className="material-symbols-outlined text-secondary dark:text-indigo-300 text-xl">
                security
              </span>
            </div>
            <span className="text-sm font-medium">
              Traitement sécurisé et privé
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render style selection view
  const renderStyleSelection = () => (
    <div style={styles.selectionContainer}>
      <div style={styles.previewSection}>
        <h3 style={styles.sectionTitle}>Votre Photo</h3>
        <img
          src={
            uploadedImage && uploadedImage.startsWith("http")
              ? uploadedImage
              : `${API_BASE_URL}${uploadedImage}`
          }
          alt="Uploaded"
          style={styles.previewImage}
        />
        <button
          onClick={() => setCurrentView("upload")}
          style={styles.changePhotoBtn}
        >
          Changer de photo
        </button>

        {selectedStyle && (
          <div style={styles.generateSection}>
            <div style={styles.selectedStylePreview}>
              <span style={styles.flag}>{selectedStyle.flag}</span>
              <span style={styles.selectedStyleName}>{selectedStyle.name}</span>
            </div>

            {/* Custom Instructions Input */}
            <div
              style={{ marginBottom: "16px", width: "100%", maxWidth: "300px" }}
            >
              <label
                htmlFor="customPrompt"
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "#8B7050",
                  marginBottom: "6px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
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
                  width: "100%",
                  padding: "10px",
                  background: "#0E0905",
                  border: "1px solid #2A1A0E",
                  borderRadius: "6px",
                  color: "#F0E6D3",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  resize: "vertical",
                  minHeight: "60px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            {/* Mode de transformation */}
            <div
              style={{ marginBottom: "16px", width: "100%", maxWidth: "300px" }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#8B7050",
                  marginBottom: "6px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Mode de transformation
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "13px",
                  color: "#F0E6D3",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="editMode"
                    value="full"
                    checked={editMode === "full"}
                    onChange={() => setEditMode("full")}
                    style={{ accentColor: "#B8860B" }}
                  />
                  <span>
                    Transformer toute la pièce{" "}
                    <span style={{ color: "#8B7050", fontSize: "12px" }}>
                      (mode actuel : la personne et les meubles peuvent aussi
                      changer)
                    </span>
                  </span>
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="editMode"
                    value="background"
                    checked={editMode === "background"}
                    onChange={() => setEditMode("background")}
                    style={{ accentColor: "#B8860B" }}
                  />
                  <span>
                    Ne modifier que l’arrière‑plan{" "}
                    <span style={{ color: "#8B7050", fontSize: "12px" }}>
                      (la personne ou le meuble principal est conservé, seul le
                      décor change)
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
                ...(isLoading ? styles.generateBtnLoading : {}),
              }}
            >
              {isLoading ? (
                <span style={styles.btnContent}>
                  <span style={styles.btnSpinner}></span>
                  Génération...
                </span>
              ) : (
                "🎨 Générer le design"
              )}
            </button>
          </div>
        )}
      </div>

      <div style={styles.stylesSection} className="glass-panel">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ ...styles.sectionTitle, marginBottom: 0 }}>
            Choisir un Style Africain
          </h3>
        </div>

        {/* Filters */}
        <div style={styles.filters}>
          <select
            value={activeRegion}
            onChange={(e) => setActiveRegion(e.target.value)}
            style={styles.select}
          >
            <option value="Tout">Toutes les régions</option>
            {stylesDb.regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            value={activeFamily}
            onChange={(e) => setActiveFamily(e.target.value)}
            style={styles.select}
          >
            <option value="Tout">Toutes les familles</option>
            {stylesDb.families.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
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
          {filteredStyles.map((style) => (
            <div
              key={style.id}
              onClick={() => setSelectedStyle(style)}
              style={{
                ...styles.styleCard,
                borderColor:
                  selectedStyle?.id === style.id ? "#B8860B" : "#2A1A0E",
                background:
                  selectedStyle?.id === style.id
                    ? "rgba(184,134,11,0.15)"
                    : "#160E07",
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
        L'IA applique le style <strong>{selectedStyle?.name}</strong> à votre
        photo
      </p>
      <p style={styles.generatingText}>
        Mode :{" "}
        {editMode === "background"
          ? "Arrière‑plan uniquement"
          : "Transformation complète"}
      </p>
      <div style={styles.generatingDetails}>
        <div>🎨 Palette: {selectedStyle?.colors?.slice(0, 3).join(", ")}</div>
        <div>🏛️ Style: {selectedStyle?.family}</div>
        <div>🌍 Région: {selectedStyle?.region}</div>
      </div>
    </div>
  );

  // Render result view with before/after comparison
  const renderResult = () => (
    <div style={styles.resultContainer}>
      <h3 style={styles.resultTitle}>✨ Votre Design Africain</h3>

      {error && (
        <div
          style={{
            ...styles.error,
            marginTop: "10px",
            marginBottom: "20px",
            padding: "15px",
            background: "rgba(255, 50, 50, 0.1)",
            border: "1px solid rgba(255, 50, 50, 0.3)",
            borderRadius: "8px",
            color: "#ff6b6b",
          }}
        >
          <strong>Erreur :</strong> {error}
        </div>
      )}

      {/* Comparison mode toggle */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => setComparisonMode("slider")}
          style={{
            padding: "8px 16px",
            background: comparisonMode === "slider" ? "#B8860B" : "transparent",
            border: `1px solid ${comparisonMode === "slider" ? "#B8860B" : "#2A1A0E"}`,
            borderRadius: "4px",
            color: comparisonMode === "slider" ? "#0C0806" : "#8B7050",
            fontSize: "12px",
            fontWeight: comparisonMode === "slider" ? "bold" : "normal",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ↔ Slider
        </button>
        <button
          onClick={() => setComparisonMode("sideBySide")}
          style={{
            padding: "8px 16px",
            background:
              comparisonMode === "sideBySide" ? "#B8860B" : "transparent",
            border: `1px solid ${comparisonMode === "sideBySide" ? "#B8860B" : "#2A1A0E"}`,
            borderRadius: "4px",
            color: comparisonMode === "sideBySide" ? "#0C0806" : "#8B7050",
            fontSize: "12px",
            fontWeight: comparisonMode === "sideBySide" ? "bold" : "normal",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ▥ Côte à côte
        </button>
      </div>

      {/* Slider mode */}
      {comparisonMode === "slider" && (
        <div style={{ marginBottom: "32px" }}>
          <ComparisonSlider
            beforeImage={
              uploadedImage.startsWith("http")
                ? uploadedImage
                : `${API_BASE_URL}${uploadedImage}`
            }
            afterImage={
              generatedImage.startsWith("http")
                ? generatedImage
                : `${API_BASE_URL}${generatedImage}`
            }
            height={450}
          />
        </div>
      )}

      {/* Side by side mode */}
      {comparisonMode === "sideBySide" && (
        <div style={styles.comparisonContainer}>
          <div style={styles.comparisonItem}>
            <div style={styles.comparisonLabel}>Avant</div>
            <div
              style={styles.imageWrapper}
              onClick={() =>
                openZoom(
                  uploadedImage.startsWith("http")
                    ? uploadedImage
                    : `${API_BASE_URL}${uploadedImage}`,
                  "Original",
                )
              }
            >
              <img
                src={
                  uploadedImage.startsWith("http")
                    ? uploadedImage
                    : `${API_BASE_URL}${uploadedImage}`
                }
                alt="Original"
                style={styles.comparisonImage}
              />
              <div style={styles.zoomHint}>🔍 Cliquer pour zoomer</div>
            </div>
          </div>

          <div style={styles.arrow}>→</div>

          <div style={styles.comparisonItem}>
            <div style={styles.comparisonLabel}>Après</div>
            <div
              style={styles.imageWrapper}
              onClick={() =>
                openZoom(
                  generatedImage.startsWith("http")
                    ? generatedImage
                    : `${API_BASE_URL}${generatedImage}`,
                  "Généré",
                )
              }
            >
              <img
                src={
                  generatedImage.startsWith("http")
                    ? generatedImage
                    : `${API_BASE_URL}${generatedImage}`
                }
                alt="Generated"
                style={styles.comparisonImage}
              />
              <div style={styles.zoomHint}>🔍 Cliquer pour zoomer</div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.styleInfo} className="glass-panel">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <h4 style={styles.styleInfoTitle}>
            {selectedStyle?.flag} {selectedStyle?.name}
          </h4>
          <button
            onClick={toggleFavorite}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "24px",
              padding: "0 8px",
              marginTop: "-4px",
              opacity: isFavorite ? 1 : 0.6,
              transform: isFavorite ? "scale(1.1)" : "scale(1)",
              transition: "all 0.2s",
            }}
            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            {isFavorite ? "❤️" : "🤍"}
          </button>
        </div>
        <p style={styles.styleInfoDesc}>{selectedStyle?.description}</p>

        <div style={styles.materialsList}>
          <strong>Matériaux:</strong> {selectedStyle?.materials?.join(", ")}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "12px",
            width: "100%",
            marginTop: "24px",
          }}
        >
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            onMouseEnter={(e) => { if (!isDownloading) { e.currentTarget.style.background = "rgba(184, 134, 11, 0.1)"; e.currentTarget.style.borderColor = "#B8860B"; } }}
            onMouseLeave={(e) => { if (!isDownloading) { e.currentTarget.style.background = "rgba(42, 26, 14, 0.4)"; e.currentTarget.style.borderColor = "#3A2A1E"; } }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "16px 8px", background: "rgba(42, 26, 14, 0.4)", border: "1px solid #3A2A1E",
              borderRadius: "12px", color: "#F0E6D3", cursor: isDownloading ? "wait" : "pointer",
              opacity: isDownloading ? 0.7 : 1, transition: "all 0.3s ease", outline: 'none'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "28px", marginBottom: "8px", color: "#B8860B" }}>
              {isDownloading ? "hourglass_empty" : "download"}
            </span>
            <span style={{ fontSize: "12px", fontWeight: "600", textAlign: "center" }}>
              {isDownloading ? "Création..." : "Avant/Après"}
            </span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isPdfGenerating}
            onMouseEnter={(e) => { if (!isPdfGenerating) { e.currentTarget.style.background = "rgba(184, 134, 11, 0.1)"; e.currentTarget.style.borderColor = "#B8860B"; } }}
            onMouseLeave={(e) => { if (!isPdfGenerating) { e.currentTarget.style.background = "rgba(42, 26, 14, 0.4)"; e.currentTarget.style.borderColor = "#3A2A1E"; } }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "16px 8px", background: "rgba(42, 26, 14, 0.4)", border: "1px solid #3A2A1E",
              borderRadius: "12px", color: "#F0E6D3", cursor: isPdfGenerating ? "wait" : "pointer",
              opacity: isPdfGenerating ? 0.7 : 1, transition: "all 0.3s ease", outline: 'none'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "28px", marginBottom: "8px", color: "#B8860B" }}>
              {isPdfGenerating ? "hourglass_empty" : "picture_as_pdf"}
            </span>
            <span style={{ fontSize: "12px", fontWeight: "600", textAlign: "center" }}>
              {isPdfGenerating ? "Génération..." : "Export PDF"}
            </span>
          </button>

          <button
            onClick={handleCreateWorld}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(184, 134, 11, 0.1)"; e.currentTarget.style.borderColor = "#B8860B"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(42, 26, 14, 0.4)"; e.currentTarget.style.borderColor = "#3A2A1E"; }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "16px 8px", background: "rgba(42, 26, 14, 0.4)", border: "1px solid #3A2A1E",
              borderRadius: "12px", color: "#F0E6D3", cursor: "pointer", transition: "all 0.3s ease", outline: 'none'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "28px", marginBottom: "8px", color: "#B8860B" }}>
              public
            </span>
            <span style={{ fontSize: "12px", fontWeight: "600", textAlign: "center" }}>
              Monde 3D
            </span>
          </button>

          <button
            onClick={() => setShowInpaintModal(true)}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(184, 134, 11, 0.25)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(184, 134, 11, 0.15)"; e.currentTarget.style.transform = "translateY(0)"; }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "16px 8px", background: "rgba(184, 134, 11, 0.15)", border: "1px solid #B8860B",
              borderRadius: "12px", color: "#B8860B", cursor: "pointer", transition: "all 0.3s ease", outline: 'none'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "28px", marginBottom: "8px" }}>
              format_paint
            </span>
            <span style={{ fontSize: "12px", fontWeight: "600", textAlign: "center" }}>
              Inpainting
            </span>
          </button>
        </div>
      </div>

      <div style={styles.resultActions}>
        <button
          onClick={() => setCurrentView("select-style")}
          style={styles.secondaryBtn}
        >
          ← Essayer un autre style
        </button>
        <button onClick={handleReset} style={styles.primaryBtn}>
          🏠 Nouveau projet
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-background-light dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300 flex flex-col relative overflow-x-hidden">
      <div className="kente-pattern"></div>

      <nav className="container mx-auto px-6 py-8 flex items-center justify-between relative z-10 w-full">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-5 py-2.5 rounded-button bg-white/60 dark:bg-slate-800/60 backdrop-blur-md shadow-sm border border-white/40 dark:border-slate-700/50 hover:bg-white/80 transition-all font-medium text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">
                arrow_back
              </span>
              Retour
            </button>
          )}
          {onGoToStyles && (
            <button
              onClick={onGoToStyles}
              className="flex items-center gap-2 px-5 py-2.5 rounded-button bg-white/60 dark:bg-slate-800/60 backdrop-blur-md shadow-sm border border-white/40 dark:border-slate-700/50 hover:bg-white/80 transition-all font-medium text-sm"
            >
              <span className="text-lg">📚</span>
              Base de Styles
            </button>
          )}
        </div>

        <div className="text-center hidden lg:block">
          <h1 className="flex items-center justify-center gap-3 text-3xl font-display font-bold text-slate-900 dark:text-white">
            <span className="material-symbols-outlined text-primary text-4xl">
              temple_hindu
            </span>
            African Interior Designer
          </h1>
          <p className="text-slate-600 dark:text-slate-400 italic mt-1 font-medium">
            Transformez votre espace avec l’âme de l’Afrique
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="p-2.5 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-md shadow-sm border border-white/40 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:scale-110 transition-transform"
            onClick={() => document.documentElement.classList.toggle("dark")}
          >
            <span className="material-symbols-outlined dark:hidden">
              dark_mode
            </span>
            <span className="material-symbols-outlined hidden dark:block">
              light_mode
            </span>
          </button>
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-button bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] transition-all font-medium text-sm"
            onClick={() => setCurrentView("manage-styles")}
          >
            <span className="material-symbols-outlined text-[18px]">
              settings
            </span>
            Gérer la Base de Styles
          </button>
        </div>
      </nav>

      <div className="lg:hidden text-center px-6 mb-8 relative z-10">
        <h1 className="flex items-center justify-center gap-2 text-2xl font-display font-bold text-slate-900 dark:text-white">
          <span className="material-symbols-outlined text-primary text-3xl">
            temple_hindu
          </span>
          African Interior Designer
        </h1>
        <p className="text-slate-600 dark:text-slate-400 italic text-sm mt-1">
          Transformez votre espace avec l’âme de l’Afrique
        </p>
      </div>

      <main
        className="container mx-auto px-6 py-4 flex flex-col items-center justify-center flex-1 relative z-10 w-full"
        style={{ paddingBottom: "40px" }}
      >
        {currentView === "upload" && renderUploadContent()}
        {currentView === "select-style" && renderStyleSelection()}
        {currentView === "generating" && renderGenerating()}
        {currentView === "result" && renderResult()}
        {currentView === "manage-styles" && (
          <StyleManager
            onBack={() => {
              setCurrentView("select-style");
              fetchStyles(); // Refresh styles when returning
            }}
          />
        )}
      </main>

      <footer className="mt-auto py-12 relative z-10 w-full">
        <div className="container mx-auto px-6 text-center">
          <div
            className="inline-flex flex-wrap items-center justify-center gap-4 md:gap-8 px-8 py-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-full border border-white/40 dark:border-slate-700/40 shadow-lg"
            style={{ boxSizing: "border-box" }}
          >
            <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] w-full md:w-auto mb-2 md:mb-0">
              Base de données
            </span>
            <div
              className="flex items-center gap-6 text-sm font-semibold text-slate-800 dark:text-slate-200"
              style={{ flexWrap: "wrap", justifyContent: "center" }}
            >
              <div className="flex flex-col items-center md:flex-row md:gap-2">
                <span className="text-primary text-lg">
                  {stylesDb.styles.length}
                </span>
                <span className="text-xs opacity-70 uppercase tracking-tighter">
                  Styles
                </span>
              </div>
              <span className="hidden md:block w-px h-6 bg-slate-400/30"></span>
              <div className="flex flex-col items-center md:flex-row md:gap-2">
                <span className="text-ochre text-lg">
                  {stylesDb.regions.length}
                </span>
                <span className="text-xs opacity-70 uppercase tracking-tighter">
                  Régions
                </span>
              </div>
              <span className="hidden md:block w-px h-6 bg-slate-400/30"></span>
              <div className="flex flex-col items-center md:flex-row md:gap-2">
                <span className="text-secondary dark:text-indigo-400 text-lg">
                  {stylesDb.families.length}
                </span>
                <span className="text-xs opacity-70 uppercase tracking-tighter">
                  Familles
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      {showInpaintModal && (
        <InpaintingModal
          imageUrl={
            generatedImage.startsWith("http")
              ? generatedImage
              : `${API_BASE_URL}${generatedImage}`
          }
          onClose={() => setShowInpaintModal(false)}
          onSubmit={handleInpaintSubmit}
        />
      )}
      {/* Zoom Modal */}
      {zoomModal.open && (
        <div style={styles.modalOverlay} onClick={closeZoom}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>
                {zoomModal.alt} (Zoom: {Math.round(zoomModal.zoom * 100)}%)
              </span>
              <button onClick={closeZoom} style={styles.modalClose}>
                ✕
              </button>
            </div>
            <div style={styles.modalImageContainer} onWheel={handleWheelZoom}>
              <img
                src={zoomModal.image}
                alt={zoomModal.alt}
                style={{
                  ...styles.modalImage,
                  transform: `scale(${zoomModal.zoom})`,
                }}
              />
            </div>
            <div style={styles.modalControls}>
              <button onClick={zoomOut} style={styles.zoomBtn}>
                -
              </button>
              <button onClick={closeZoom} style={styles.closeBtn}>
                Fermer
              </button>
              <button onClick={zoomIn} style={styles.zoomBtn}>
                +
              </button>
            </div>
            <div style={styles.modalHint}>
              Molette souris ou boutons +/- pour zoomer
            </div>
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
    flexDirection: "column",
  },
  header: {
    borderBottom: "none",
    background: "transparent",
    paddingTop: "40px",
    paddingBottom: "20px",
  },
  headerContent: {
    padding: "0 32px",
    textAlign: "center",
  },
  maskIcon: {
    fontSize: "64px",
    filter: "drop-shadow(2px 4px 6px rgba(0,0,0,0.5))",
  },
  title: {
    margin: "0 0 4px 0",
    fontSize: "clamp(28px, 5vw, 42px)",
    fontWeight: "900",
    color: "red", // Darker brown
    textShadow: "1px 1px 0px rgba(255,255,255,0.8)",
    fontFamily: "var(--font-heading)",
  },
  subtitle: {
    margin: 0,
    fontSize: "16px",
    color: "red",
    fontWeight: "500",
    textShadow: "1px 1px 0px rgba(255,255,255,0.5)",
  },
  main: {
    flex: 1,
    padding: "0 32px 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  footer: {
    padding: "16px 32px",
    borderTop: "none",
    textAlign: "center",
    fontSize: "13px",
    color: "red",
    fontWeight: "500",
  },
  woodenBtn: {
    padding: "8px 20px",
    background: "linear-gradient(to bottom, #fdfbf7, #f4eadc)",
    border: "2px solid #5a3a18",
    borderRadius: "24px",
    color: "red",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    fontFamily: "var(--font-heading)",
    boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
    transition: "all 0.2s ease",
  },
  // Upload styles
  uploadContainer: {
    width: "100%",
    maxWidth: "500px",
    margin: "0 auto",
    padding: "32px 40px",
    background: "#fdfbf7", // Very light beige matching reference
    borderRadius: "24px",
    border: "none",
    boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
    textAlign: "center",
    position: "relative",
  },
  dropZone: {
    border: "none",
    background: "#e8cfab",
    padding: "40px 24px",
    borderRadius: "16px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    boxShadow: "inset 0 4px 12px rgba(142, 98, 49, 0.2)",
    marginBottom: "20px",
  },
  fileInput: {
    display: "none",
  },
  uploadLabel: {
    cursor: "pointer",
  },
  uploadIcon: {
    fontSize: "48px",
    marginBottom: "16px",
    filter: "drop-shadow(2px 4px 6px rgba(142, 98, 49, 0.3))",
  },
  uploadText: {
    fontSize: "22px",
    fontWeight: "500",
    color: "red",
    marginBottom: "8px",
    fontFamily: "var(--font-body)",
  },
  uploadLink: {
    color: "red",
    textDecoration: "underline",
    fontWeight: "bold",
  },
  uploadHint: {
    fontSize: "14px",
    color: "red",
    fontWeight: "500",
  },
  loading: {
    marginTop: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    color: "#B8860B",
  },
  spinner: {
    width: "20px",
    height: "20px",
    border: "2px solid #2A1A0E",
    borderTop: "2px solid #B8860B",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  error: {
    marginTop: "16px",
    padding: "12px",
    background: "rgba(196,30,58,0.1)",
    border: "1px solid #C41E3A",
    borderRadius: "4px",
    color: "#C41E3A",
    textAlign: "center",
  },

  // Selection styles
  selectionContainer: {
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    gap: "32px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  previewSection: {
    background: "var(--glass-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    padding: "16px",
  },
  sectionTitle: {
    fontSize: "14px",
    color: "#B8860B",
    margin: "0 0 16px 0",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  previewImage: {
    width: "100%",
    height: "auto",
    borderRadius: "4px",
    marginBottom: "12px",
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
    fontFamily: "inherit",
  },
  stylesSection: {
    background: "var(--glass-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    padding: "16px",
  },
  filters: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  select: {
    background: "#0C0806",
    border: "1px solid #2A1A0E",
    color: "#F0E6D3",
    padding: "8px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    fontFamily: "inherit",
    cursor: "pointer",
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
    fontFamily: "inherit",
  },
  styleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "12px",
    maxHeight: "400px",
    overflowY: "auto",
    padding: "4px",
  },
  styleCard: {
    border: "1px solid #2A1A0E",
    borderRadius: "6px",
    padding: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  styleHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
  },
  flag: {
    fontSize: "20px",
  },
  styleName: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#F0E6D3",
  },
  styleCountry: {
    fontSize: "11px",
    color: "#8B7050",
    marginBottom: "4px",
  },
  styleFamily: {
    fontSize: "10px",
    color: "#6B5030",
    marginBottom: "8px",
  },
  colorPreview: {
    display: "flex",
    gap: "4px",
  },
  colorDot: {
    width: "16px",
    height: "16px",
    borderRadius: "2px",
    border: "1px solid #2A1A0E",
  },
  selectedInfo: {
    marginTop: "16px",
    padding: "16px",
    background: "rgba(184,134,11,0.1)",
    border: "1px solid #B8860B",
    borderRadius: "6px",
  },
  selectedTitle: {
    margin: "0 0 8px 0",
    fontSize: "16px",
    color: "#B8860B",
  },
  selectedDesc: {
    margin: "0 0 16px 0",
    fontSize: "13px",
    color: "#8B7050",
    lineHeight: "1.5",
  },
  generateSection: {
    marginTop: "16px",
    padding: "16px",
    background: "rgba(184,134,11,0.1)",
    border: "1px solid #B8860B",
    borderRadius: "6px",
    animation: "fadeIn 0.3s ease-in",
  },
  selectedStylePreview: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(184,134,11,0.3)",
  },
  selectedStyleName: {
    fontSize: "14px",
    color: "#B8860B",
    fontWeight: "bold",
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
    justifyContent: "center",
  },
  generateBtnLoading: {
    background: "#6B5B3E",
    cursor: "not-allowed",
  },
  btnContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  btnSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid #0C0806",
    borderTop: "2px solid #B8860B",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  // Generating styles
  generatingContainer: {
    textAlign: "center",
    padding: "60px 20px",
  },
  spinnerLarge: {
    width: "60px",
    height: "60px",
    margin: "0 auto 24px",
    border: "3px solid #2A1A0E",
    borderTop: "3px solid #B8860B",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  generatingTitle: {
    fontSize: "24px",
    color: "#F0E6D3",
    margin: "0 0 12px 0",
  },
  generatingText: {
    fontSize: "14px",
    color: "#8B7050",
    margin: "0 0 24px 0",
  },
  generatingDetails: {
    fontSize: "12px",
    color: "#6B5030",
    lineHeight: "2",
  },

  // Result styles
  resultContainer: {
    maxWidth: "1000px",
    margin: "0 auto",
  },
  resultTitle: {
    textAlign: "center",
    fontSize: "24px",
    color: "#F0E6D3",
    margin: "0 0 32px 0",
  },
  comparisonContainer: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    gap: "16px",
    alignItems: "center",
    marginBottom: "32px",
  },
  comparisonItem: {
    textAlign: "center",
  },
  comparisonLabel: {
    fontSize: "12px",
    color: "#8B7050",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "8px",
  },
  comparisonImage: {
    width: "100%",
    maxHeight: "400px",
    objectFit: "cover",
    borderRadius: "8px",
    border: "1px solid #2A1A0E",
  },
  imageWrapper: {
    position: "relative",
    cursor: "pointer",
    overflow: "hidden",
    borderRadius: "8px",
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
    pointerEvents: "none",
  },
  arrow: {
    fontSize: "24px",
    color: "#B8860B",
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
    padding: "20px",
  },
  modalContent: {
    background: "#160E07",
    border: "1px solid #2A1A0E",
    borderRadius: "8px",
    maxWidth: "90vw",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #2A1A0E",
  },
  modalTitle: {
    color: "#B8860B",
    fontSize: "16px",
  },
  modalClose: {
    background: "transparent",
    border: "none",
    color: "#8B7050",
    fontSize: "20px",
    cursor: "pointer",
  },
  modalImageContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "auto",
    padding: "20px",
    background: "#0C0806",
    cursor: "grab",
  },
  modalImage: {
    maxWidth: "100%",
    maxHeight: "70vh",
    objectFit: "contain",
    transition: "transform 0.2s",
    borderRadius: "4px",
  },
  modalControls: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    padding: "16px 20px",
    borderTop: "1px solid #2A1A0E",
    background: "#160E07",
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
    justifyContent: "center",
  },
  closeBtn: {
    padding: "8px 24px",
    border: "1px solid #2A1A0E",
    borderRadius: "4px",
    background: "transparent",
    color: "#8B7050",
    cursor: "pointer",
    fontSize: "14px",
  },
  modalHint: {
    textAlign: "center",
    padding: "8px 20px",
    fontSize: "12px",
    color: "#6B5030",
    background: "#0C0806",
  },
  styleInfo: {
    background: "var(--glass-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    padding: "24px",
    textAlign: "center",
    marginBottom: "24px",
  },
  styleInfoTitle: {
    fontSize: "20px",
    color: "#B8860B",
    margin: "0 0 12px 0",
  },
  styleInfoDesc: {
    fontSize: "14px",
    color: "#8B7050",
    margin: "0 0 16px 0",
    lineHeight: "1.6",
  },
  materialsList: {
    fontSize: "13px",
    color: "#6B5030",
    marginBottom: "20px",
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
    cursor: "pointer",
  },
  resultActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
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
    fontFamily: "inherit",
  },
  secondaryBtn: {
    padding: "12px 24px",
    background: "transparent",
    border: "1px solid #2A1A0E",
    borderRadius: "4px",
    color: "#8B7050",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
