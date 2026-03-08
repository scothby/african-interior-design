import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import ComparisonSlider from "./ComparisonSlider";
import { exportCollage } from "./utils/collageGenerator";
import { exportDesignPDF } from "./utils/pdfGenerator";
import AdminManager from "./AdminManager";
import WorldViewerModal from "./WorldViewerModal";
import InpaintingModal from "./InpaintingModal";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { useAuth } from "./AuthContext";
import Logo from "./components/Logo";
import { fetchStylesFromSupabase, fetchRoomTypes, fetchColorPalettes } from "./supabaseClient";

// New modular components
import UploadStep from "./components/designer/UploadStep";
import StyleSelection from "./components/designer/StyleSelection";
import GeneratingView from "./components/designer/GeneratingView";
import ResultView from "./components/designer/ResultView";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function InteriorDesignApp({ onBack, onGoToStyles, onGoToGallery, onGoToPalettes }) {
  const { t, i18n } = useTranslation();
  const { getToken, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState("upload"); // 'upload', 'select-style', 'generating', 'result', 'manage-styles'
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generatedId, setGeneratedId] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
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
  const [roomTypes, setRoomTypes] = useState([]);
  const [colorPalettes, setColorPalettes] = useState([]);

  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [selectedPalette, setSelectedPalette] = useState(null);

  // Fetch styles, room types, and palettes from Supabase directly
  const fetchInitialData = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      const [stylesData, roomsData, palettesData] = await Promise.all([
        fetchStylesFromSupabase(),
        fetchRoomTypes(),
        fetchColorPalettes()
      ]);

      setStylesDb(stylesData);
      setRoomTypes(roomsData);
      setColorPalettes(palettesData);

      // Select defaults if not set
      if (roomsData.length > 0) setSelectedRoomType(roomsData[0]);
    } catch (err) {
      console.error("Error fetching data from Supabase:", err);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Filter styles using useMemo to avoid re-calculating on every render
  const filteredStyles = useMemo(() => {
    return stylesDb.styles.filter((s) => {
      const searchLower = search.toLowerCase();
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(searchLower) ||
        (s.name_en && s.name_en.toLowerCase().includes(searchLower)) ||
        (s.description && s.description.toLowerCase().includes(searchLower)) ||
        (s.description_en && s.description_en.toLowerCase().includes(searchLower)) ||
        (s.country && s.country.toLowerCase().includes(searchLower)) ||
        (s.family && s.family.toLowerCase().includes(searchLower));
      const matchRegion = activeRegion === "Tout" || s.region === activeRegion;
      const matchFamily = activeFamily === "Tout" || s.family === activeFamily;
      return matchSearch && matchRegion && matchFamily;
    });
  }, [stylesDb.styles, search, activeRegion, activeFamily]);

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("photo", file);
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${token}` },
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
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          originalImage: uploadedImage,
          style: selectedStyle,
          customPrompt: customPrompt,
          editMode: editMode,
          roomType: selectedRoomType,
          selectedPalette: selectedPalette,
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
      const token = await getToken();
      const res = await fetch(
        `${API_BASE_URL}/api/gallery/${generatedId}/favorite`,
        {
          method: "PATCH",
          headers: { "Authorization": `Bearer ${token}` }
        },
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
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/inpaint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          originalImage: generatedImage, // Edit the result image
          maskImage: maskDataUrl,
          style: selectedStyle,
          customPrompt: prompt,
          roomType: selectedRoomType,
          selectedPalette: selectedPalette,
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

  // The local render functions are now replaced by external components for better maintainability.

  const renderUploadContent = () => (
    <UploadStep
      t={t}
      handleFileUpload={handleFileUpload}
      dragActive={dragActive}
      handleDrag={handleDrag}
      handleDrop={handleDrop}
      isLoading={isLoading}
      error={error}
      styles={styles}
    />
  );

  const renderStyleSelection = () => (
    <StyleSelection
      t={t}
      i18n={i18n}
      uploadedImage={uploadedImage}
      API_BASE_URL={API_BASE_URL}
      setCurrentView={setCurrentView}
      selectedStyle={selectedStyle}
      setSelectedStyle={setSelectedStyle}
      selectedRoomType={selectedRoomType}
      setSelectedRoomType={setSelectedRoomType}
      roomTypes={roomTypes}
      selectedPalette={selectedPalette}
      setSelectedPalette={setSelectedPalette}
      colorPalettes={colorPalettes}
      customPrompt={customPrompt}
      setCustomPrompt={setCustomPrompt}
      editMode={editMode}
      setEditMode={setEditMode}
      activeRegion={activeRegion}
      setActiveRegion={setActiveRegion}
      activeFamily={activeFamily}
      setActiveFamily={setActiveFamily}
      search={search}
      setSearch={setSearch}
      stylesDb={stylesDb}
      filteredStyles={filteredStyles}
      handleGenerate={handleGenerate}
      isLoading={isLoading}
      isInitialLoading={isInitialLoading}
      styles={styles}
    />
  );

  const renderGenerating = () => (
    <GeneratingView
      t={t}
      i18n={i18n}
      uploadedImage={uploadedImage}
      API_BASE_URL={API_BASE_URL}
      selectedStyle={selectedStyle}
      editMode={editMode}
      styles={styles}
    />
  );

  const renderResult = () => (
    <ResultView
      t={t}
      uploadedImage={uploadedImage}
      generatedImage={generatedImage}
      selectedStyle={selectedStyle}
      error={error}
      comparisonMode={comparisonMode}
      setComparisonMode={setComparisonMode}
      API_BASE_URL={API_BASE_URL}
      toggleFavorite={toggleFavorite}
      isFavorite={isFavorite}
      handleDownload={handleDownload}
      isDownloading={isDownloading}
      handleExportPDF={handleExportPDF}
      isPdfGenerating={isPdfGenerating}
      handleCreateWorld={handleCreateWorld}
      setShowInpaintModal={setShowInpaintModal}
      setCurrentView={setCurrentView}
      handleReset={handleReset}
      openZoom={openZoom}
      styles={styles}
    />
  );

  return (
    <div className="font-sans min-h-screen transition-colors duration-300 flex flex-col relative overflow-x-hidden" style={{ background: "var(--color-bg-dark)", color: "var(--color-text-main)" }}>
      {/* Kente header bar */}
      <div style={{ height: "5px", background: "linear-gradient(90deg,#8B0000,#B8860B,#228B22,#1A2744,#B8860B,#C41E3A,#B8860B,#228B22,#8B0000)", width: "100%", position: "absolute", top: 0, zIndex: 50 }} />

      <nav className="container mx-auto px-6 py-8 flex items-center justify-between relative z-10 w-full mt-2">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="btn-secondary"
              style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}
            >
              <Logo size={18} />
              {t('gallery.back')}
            </button>
          )}
          {onGoToStyles && (
            <button
              onClick={onGoToStyles}
              className="btn-secondary"
              style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}
            >
              <span className="text-lg">📚</span>
              {t('gallery.baseStyles')}
            </button>
          )}
          {onGoToGallery && (
            <button
              onClick={onGoToGallery}
              className="btn-secondary"
              style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}
            >
              <span className="text-lg">🖼️</span>
              {t('header.gallery')}
            </button>
          )}
          {onGoToPalettes && (
            <button
              onClick={onGoToPalettes}
              className="btn-secondary"
              style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", background: "rgba(184,134,11,0.1)", border: "1px solid rgba(184,134,11,0.5)", color: "#F0E6D3" }}
            >
              <span className="text-lg">🎨</span>
              Palettes
            </button>
          )}
        </div>

        <div className="text-center hidden lg:block">
          <h1 className="flex items-center justify-center gap-3 text-3xl font-display font-bold" style={{ color: "var(--color-text-main)", margin: 0 }}>
            <Logo size={40} />
            {t('designer.title')}
          </h1>
          <p className="italic mt-1 font-medium" style={{ color: "#8B7050" }}>
            {t('designer.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {isAdmin && (
            <button
              className="btn-primary"
              style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}
              onClick={() => setCurrentView("manage-styles")}
            >
              <span className="material-symbols-outlined text-[18px]">
                settings
              </span>
              {t('designer.manageStyles')}
            </button>
          )}
        </div>
      </nav>

      <div className="lg:hidden text-center px-6 mb-8 relative z-10">
        <h1 className="flex items-center justify-center gap-2 text-2xl font-display font-bold" style={{ color: "var(--color-text-main)", margin: 0 }}>
          <span className="material-symbols-outlined text-3xl" style={{ color: "var(--color-primary)" }}>
            temple_hindu
          </span>
          {t('designer.title')}
        </h1>
        <p className="italic text-sm mt-1" style={{ color: "#8B7050" }}>
          {t('designer.subtitle')}
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
          <AdminManager
            onBack={() => {
              setCurrentView("select-style");
              fetchInitialData(); // Refresh all data when returning
            }}
          />
        )}
      </main>

      <footer className="mt-auto py-8 relative z-10 w-full border-t border-t-[#1E1208]" style={{ borderTop: "1px solid #1E1208" }}>
        <div className="container mx-auto px-6 text-center">
          <div
            className="inline-flex flex-wrap items-center justify-center gap-4 md:gap-8 px-8 py-3"
            style={{ boxSizing: "border-box" }}
          >
            <span style={{ color: "#6B5030", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.2em" }}>
              {t('footerStats.database')}
            </span>
            <div
              className="flex items-center gap-6 text-sm font-semibold"
              style={{ flexWrap: "wrap", justifyContent: "center", color: "#A08060" }}
            >
              <div className="flex flex-col items-center md:flex-row md:gap-2">
                <span style={{ fontSize: "16px", color: "var(--color-primary)" }}>
                  {stylesDb.styles.length}
                </span>
                <span className="text-[10px] opacity-70 uppercase tracking-tighter">
                  {t('footerStats.styles')}
                </span>
              </div>
              <span className="hidden md:block w-px h-4" style={{ background: "#2A1A0E" }}></span>
              <div className="flex flex-col items-center md:flex-row md:gap-2">
                <span style={{ fontSize: "16px", color: "#8B4513" }}>
                  {stylesDb.regions.length}
                </span>
                <span className="text-[10px] opacity-70 uppercase tracking-tighter">
                  {t('footerStats.regions')}
                </span>
              </div>
              <span className="hidden md:block w-px h-4" style={{ background: "#2A1A0E" }}></span>
              <div className="flex flex-col items-center md:flex-row md:gap-2">
                <span style={{ fontSize: "16px", color: "var(--color-primary-dark)" }}>
                  {stylesDb.families.length}
                </span>
                <span className="text-[10px] opacity-70 uppercase tracking-tighter">
                  {t('footerStats.families')}
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
                {t('zoomModal.close')}
              </button>
              <button onClick={zoomIn} style={styles.zoomBtn}>
                +
              </button>
            </div>
            <div style={styles.modalHint}>
              {t('zoomModal.hint')}
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
    color: "#3A2A1E", // Darker brown
    textShadow: "1px 1px 0px rgba(255,255,255,0.8)",
    fontFamily: "var(--font-heading)",
  },
  subtitle: {
    margin: 0,
    fontSize: "16px",
    color: "#6B5030",
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
    gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
    gap: "16px",
    maxHeight: "550px",
    overflowY: "auto",
    padding: "8px",
  },
  styleCard: {
    border: "1px solid rgba(184, 134, 11, 0.1)",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    background: "#160E07",
    overflow: "hidden",
    position: "relative",
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
  styleHistory: {
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid rgba(184, 134, 11, 0.2)",
    fontSize: "12px",
    color: "#D4C3A3",
    lineHeight: "1.6",
    fontStyle: "italic",
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
  btnSmall: {
    padding: "6px 12px",
    fontSize: "11px",
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
