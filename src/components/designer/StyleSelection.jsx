import React from "react";
import Skeleton from "../common/Skeleton";

const StyleSelection = ({
    t,
    i18n,
    uploadedImage,
    API_BASE_URL,
    setCurrentView,
    selectedStyle,
    setSelectedStyle,
    selectedRoomType,
    setSelectedRoomType,
    roomTypes,
    selectedPalette,
    setSelectedPalette,
    colorPalettes,
    customPrompt,
    setCustomPrompt,
    editMode,
    setEditMode,
    activeRegion,
    setActiveRegion,
    activeFamily,
    setActiveFamily,
    search,
    setSearch,
    stylesDb,
    filteredStyles,
    handleGenerate,
    isLoading,
    isInitialLoading,
    styles: s,
}) => {
    return (
        <div style={s.selectionContainer}>
            <div style={s.previewSection}>
                <h3 style={s.sectionTitle}>{t('app.styleSelection.yourPhoto')}</h3>
                <img
                    src={
                        uploadedImage && uploadedImage.startsWith("http")
                            ? uploadedImage
                            : `${API_BASE_URL}${uploadedImage}`
                    }
                    alt="Uploaded"
                    style={s.previewImage}
                />
                <button
                    onClick={() => setCurrentView("upload")}
                    style={s.changePhotoBtn}
                >
                    {t('app.styleSelection.changePhoto')}
                </button>

                {selectedStyle && (
                    <div style={s.generateSection}>
                        <div style={s.selectedStylePreview}>
                            <span style={s.flag}>{selectedStyle.flag}</span>
                            <span style={s.selectedStyleName}>{selectedStyle[`name${i18n.language?.startsWith('en') ? '_en' : ''}`] || selectedStyle.name}</span>
                        </div>

                        {/* Room Type Selector */}
                        <div style={{ marginBottom: "16px", width: "100%", maxWidth: "300px" }}>
                            <label style={{
                                display: "block", fontSize: "12px", color: "#8B7050", marginBottom: "6px",
                                fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em"
                            }}>
                                {t('app.styleSelection.roomType', { defaultValue: "Type de pièce" })}
                            </label>
                            <select
                                value={selectedRoomType?.id || ""}
                                onChange={(e) => {
                                    const rt = roomTypes.find(r => r.id === e.target.value);
                                    setSelectedRoomType(rt);
                                }}
                                style={{
                                    ...s.select,
                                    width: "100%",
                                    background: "#0E0905",
                                    padding: "10px",
                                    fontSize: "13px"
                                }}
                            >
                                {isInitialLoading ? (
                                    <option>Loading...</option>
                                ) : (
                                    roomTypes.map(rt => (
                                        <option key={rt.id} value={rt.id}>{rt.icon} {rt.name}</option>
                                    ))
                                )}
                            </select>
                        </div>

                        {/* Color Palette Selector */}
                        <div style={{ marginBottom: "16px", width: "100%", maxWidth: "300px" }}>
                            <label style={{
                                display: "block", fontSize: "12px", color: "#8B7050", marginBottom: "6px",
                                fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em"
                            }}>
                                {t('app.styleSelection.colorPalette', { defaultValue: "Palette de couleurs" })}
                            </label>
                            <select
                                value={selectedPalette?.id || ""}
                                onChange={(e) => {
                                    const p = colorPalettes.find(cp => cp.id === e.target.value);
                                    setSelectedPalette(p);
                                }}
                                style={{
                                    ...s.select,
                                    width: "100%",
                                    background: "#0E0905",
                                    padding: "10px",
                                    fontSize: "13px"
                                }}
                            >
                                <option value="">{t('app.styleSelection.defaultPalette', { defaultValue: "Couleurs du style" })}</option>
                                {colorPalettes.map(p => (
                                    <option key={p.id} value={p.id}>🎨 {p.name}</option>
                                ))}
                            </select>
                            {selectedPalette && (
                                <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
                                    {selectedPalette.colors.map((c, i) => (
                                        <div key={i} style={{ width: "20px", height: "10px", background: c, borderRadius: "2px" }} />
                                    ))}
                                </div>
                            )}
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
                                {t('app.styleSelection.customInstructions')}
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
                                {t('app.styleSelection.transformationMode.title')}
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
                                        {t('app.styleSelection.transformationMode.full')}{" "}
                                        <span style={{ color: "#8B7050", fontSize: "12px" }}>
                                            {t('app.styleSelection.transformationMode.fullDesc')}
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
                                        {t('app.styleSelection.transformationMode.background')}{" "}
                                        <span style={{ color: "#8B7050", fontSize: "12px" }}>
                                            {t('app.styleSelection.transformationMode.backgroundDesc')}
                                        </span>
                                    </span>
                                </label>
                            </div>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            style={{
                                ...s.generateBtn,
                                ...(isLoading ? s.generateBtnLoading : {}),
                            }}
                        >
                            {isLoading ? (
                                <span style={s.btnContent}>
                                    <span style={s.btnSpinner}></span>
                                    {t('app.styleSelection.generating')}
                                </span>
                            ) : (
                                `🎨 ${t('app.styleSelection.generate')}`
                            )}
                        </button>
                    </div>
                )}
            </div>

            <div style={s.stylesSection} className="glass-panel">
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                    }}
                >
                    <h3 style={{ ...s.sectionTitle, marginBottom: 0 }}>
                        {t('app.styleSelection.chooseStyle')}
                    </h3>
                </div>

                {/* Filters */}
                <div style={s.filters}>
                    <select
                        value={activeRegion}
                        onChange={(e) => setActiveRegion(e.target.value)}
                        style={s.select}
                    >
                        <option value="Tout">{t('app.styleSelection.allRegions')}</option>
                        {stylesDb.regions.map((r) => (
                            <option key={r} value={r}>
                                {t(`db.regions.${r}`, { defaultValue: r })}
                            </option>
                        ))}
                    </select>

                    <select
                        value={activeFamily}
                        onChange={(e) => setActiveFamily(e.target.value)}
                        style={s.select}
                    >
                        <option value="Tout">{t('app.styleSelection.allFamilies')}</option>
                        {stylesDb.families.map((f) => (
                            <option key={f} value={f}>
                                {t(`db.families.${f}`, { defaultValue: f })}
                            </option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder={t('app.styleSelection.search')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={s.searchInput}
                        disabled={isInitialLoading}
                    />
                </div>

                {/* Style Grid */}
                <div style={s.styleGrid}>
                    {isInitialLoading ? (
                        Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} style={{ ...s.styleCard, borderColor: "#1A140E", padding: 0, overflow: "hidden" }}>
                                <Skeleton height="120px" width="100%" />
                                <div style={{ padding: "12px" }}>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                        <Skeleton type="circle" width="20px" height="20px" />
                                        <Skeleton type="text" width="100px" />
                                    </div>
                                    <Skeleton type="text" width="60px" />
                                    <Skeleton type="text" width="80px" />
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                                        <Skeleton type="circle" width="12px" height="12px" />
                                        <Skeleton type="circle" width="12px" height="12px" />
                                        <Skeleton type="circle" width="12px" height="12px" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : filteredStyles.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#8B7050' }}>
                            {t('app.styleSelection.noStylesFound', { defaultValue: 'Aucun style trouvé' })}
                        </div>
                    ) : (
                        filteredStyles.map((style) => (
                            <div
                                key={style.id}
                                onClick={() => setSelectedStyle(style)}
                                style={{
                                    ...s.styleCard,
                                    borderColor:
                                        selectedStyle?.id === style.id ? "#B8860B" : "#2A1A0E",
                                    background:
                                        selectedStyle?.id === style.id
                                            ? "rgba(184,134,11,0.15)"
                                            : "#160E07",
                                    padding: 0,
                                    overflow: "hidden"
                                }}
                            >
                                <div style={{ width: "100%", height: "120px", borderBottom: selectedStyle?.id === style.id ? "1px solid #B8860B" : "1px solid #2A1A0E", overflow: "hidden" }}>
                                    <img
                                        src={style.image_url || `/families/${style.family?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "") || "TextilesRoyaux"}.png`}
                                        alt={style[`name${i18n.language?.startsWith('en') ? '_en' : ''}`] || style.name}
                                        loading="lazy"
                                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                                        onError={(e) => {
                                            e.target.src = "/families/TextilesRoyaux.png"; // Ultimate fallback
                                        }}
                                    />
                                </div>
                                <div style={{ padding: "12px" }}>
                                    <div style={s.styleHeader}>
                                        <span style={s.flag}>{style.flag}</span>
                                        <span style={s.styleName}>{style[`name${i18n.language?.startsWith('en') ? '_en' : ''}`] || style.name}</span>
                                    </div>
                                    <div style={s.styleCountry}>{style.country}</div>
                                    <div style={s.styleFamily}>{t(`db.families.${style.family}`, { defaultValue: style.family })}</div>
                                    <div style={s.colorPreview}>
                                        {style.colors.slice(0, 4).map((c, i) => (
                                            <div key={i} style={{ ...s.colorDot, background: c }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )))}
                </div>

                {selectedStyle && (
                    <div style={s.selectedInfo}>
                        <h4 style={s.selectedTitle}>
                            {selectedStyle.flag} {selectedStyle[`name${i18n.language?.startsWith('en') ? '_en' : ''}`] || selectedStyle.name}
                        </h4>
                        <p style={s.selectedDesc}>{selectedStyle[`description${i18n.language?.startsWith('en') ? '_en' : ''}`] || selectedStyle.description}</p>
                        {selectedStyle[`cultural_history${i18n.language?.startsWith('en') ? '_en' : ''}`] && (
                            <div style={s.styleHistory}>
                                <strong>📜 {t('app.styleSelection.history', { defaultValue: 'Histoire Culturelle' })} :</strong><br />
                                {selectedStyle[`cultural_history${i18n.language?.startsWith('en') ? '_en' : ''}`]}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StyleSelection;
