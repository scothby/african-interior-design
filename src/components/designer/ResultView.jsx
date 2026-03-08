import React from "react";
import ComparisonSlider from "../../ComparisonSlider";

const ResultView = ({
    t,
    uploadedImage,
    generatedImage,
    selectedStyle,
    error,
    comparisonMode,
    setComparisonMode,
    API_BASE_URL,
    toggleFavorite,
    isFavorite,
    handleDownload,
    isDownloading,
    handleExportPDF,
    isPdfGenerating,
    handleCreateWorld,
    setShowInpaintModal,
    setCurrentView,
    handleReset,
    openZoom,
    styles: s,
}) => {
    return (
        <div style={s.resultContainer}>
            <h3 style={s.resultTitle}>{t('app.result.title')}</h3>

            {error && (
                <div
                    style={{
                        ...s.error,
                        marginTop: "10px",
                        marginBottom: "20px",
                        padding: "15px",
                        background: "rgba(255, 50, 50, 0.1)",
                        border: "1px solid rgba(255, 50, 50, 0.3)",
                        borderRadius: "8px",
                        color: "#ff6b6b",
                    }}
                >
                    <strong>{t('app.result.error')}</strong> {error}
                </div>
            )}

            {/* Comparison mode toggle */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "8px",
                    marginBottom: "32px",
                    background: "rgba(20, 16, 13, 0.4)",
                    padding: "6px",
                    borderRadius: "12px",
                    width: "fit-content",
                    margin: "0 auto 32px",
                    border: "1px solid var(--color-border)"
                }}
            >
                <button
                    onClick={() => setComparisonMode("slider")}
                    style={{
                        padding: "8px 20px",
                        background: comparisonMode === "slider" ? "var(--color-primary)" : "transparent",
                        border: "none",
                        borderRadius: "8px",
                        color: comparisonMode === "slider" ? "#0C0806" : "var(--color-text-muted)",
                        fontSize: "13px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                >
                    <span className="material-symbols-outlined text-[18px]">split_screen</span>
                    {t('app.result.slider')}
                </button>
                <button
                    onClick={() => setComparisonMode("sideBySide")}
                    style={{
                        padding: "8px 20px",
                        background: comparisonMode === "sideBySide" ? "var(--color-primary)" : "transparent",
                        border: "none",
                        borderRadius: "8px",
                        color: comparisonMode === "sideBySide" ? "#0C0806" : "var(--color-text-muted)",
                        fontSize: "13px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                >
                    <span className="material-symbols-outlined text-[18px]">view_agenda</span>
                    {t('app.result.sideBySide')}
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
                <div style={s.comparisonContainer}>
                    <div style={s.comparisonItem}>
                        <div style={s.comparisonLabel}>{t('app.result.before')}</div>
                        <div
                            style={s.imageWrapper}
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
                                style={s.comparisonImage}
                            />
                            <div style={s.zoomHint}>{t('app.result.zoomHint')}</div>
                        </div>
                    </div>

                    <div style={s.arrow}>→</div>

                    <div style={s.comparisonItem}>
                        <div style={s.comparisonLabel}>{t('app.result.after')}</div>
                        <div
                            style={s.imageWrapper}
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
                                style={s.comparisonImage}
                            />
                            <div style={s.zoomHint}>{t('app.result.zoomHint')}</div>
                        </div>
                    </div>
                </div>
            )}

            <div style={s.styleInfo} className="glass-panel">
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                    }}
                >
                    <h4 style={s.styleInfoTitle}>
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
                <p style={s.styleInfoDesc}>{selectedStyle?.description}</p>

                <div style={s.materialsList}>
                    <strong>{t('app.result.materials')}</strong> {selectedStyle?.materials?.join(", ")}
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
                            {isDownloading ? t('app.result.creating') : t('app.result.download')}
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
                            {isPdfGenerating ? t('app.styleSelection.generating') : t('gallery.actions.pdf')}
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
                            {t('app.result.world')}
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
                            {t('app.result.inpainting')}
                        </span>
                    </button>
                </div>
            </div>

            <div style={s.resultActions}>
                <button
                    onClick={() => setCurrentView("select-style")}
                    style={s.secondaryBtn}
                >
                    {t('app.result.tryAnother')}
                </button>
                <button onClick={handleReset} style={s.primaryBtn}>
                    {t('app.result.newProject')}
                </button>
            </div>
        </div>
    );
};

export default ResultView;
