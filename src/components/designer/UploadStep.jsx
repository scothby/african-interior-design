import React from "react";
import Logo from "../Logo";

const UploadStep = ({
    t,
    dragActive,
    handleDrag,
    handleDrop,
    handleFileUpload,
    isLoading,
    error,
    styles: s
}) => {
    return (
        <div className="w-full max-w-5xl">
            <div className="glass-panel rounded-[2.5rem] p-8 md:p-14 overflow-hidden relative" style={{ background: "var(--glass-bg)", border: "1px solid var(--color-border)" }}>
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl" style={{ background: "var(--color-primary-dark)", opacity: 0.2 }}></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-3xl" style={{ background: "#8B4513", opacity: 0.1 }}></div>

                <div
                    className="relative group cursor-pointer"
                    onClick={() => document.getElementById("file-upload").click()}
                >
                    <div
                        className={`rounded-3xl p-12 md:p-20 transition-all duration-500 flex flex-col items-center justify-center text-center ${dragActive ? "scale-[1.01]" : ""}`}
                        style={{ background: dragActive ? "rgba(212, 175, 55, 0.1)" : "rgba(22, 14, 7, 0.6)", border: dragActive ? "2px dashed var(--color-primary)" : "1px dashed #2A1A0E" }}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <div className="mb-8 relative pointer-events-none">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 group-hover:scale-[2.5] transition-transform duration-700"></div>
                            <div className="relative w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl transform group-hover:-translate-y-3 transition-transform duration-500" style={{ background: "#0A0806", border: "1px solid #2A1A0E" }}>
                                <span className="material-symbols-outlined text-5xl" style={{ color: "var(--color-primary)" }}>
                                    photo_camera
                                </span>
                            </div>
                        </div>

                        <h2 style={{ fontSize: "var(--font-size-xl)", color: "var(--color-text-main)" }} className="font-display font-bold mb-6 leading-tight pointer-events-none">
                            {t('app.upload.dragText')} <br className="hidden md:block" />
                            <span className="transition-colors pointer-events-auto" style={{ color: "var(--color-primary)", textDecoration: "underline", textUnderlineOffset: "8px", textDecorationColor: "rgba(212, 175, 55, 0.3)" }}>
                                {t('app.upload.clickText')}
                            </span>
                        </h2>

                        <div className="flex flex-wrap items-center justify-center gap-4 font-semibold uppercase tracking-widest pointer-events-none" style={{ fontSize: "var(--font-size-xs)", color: "#8B7050" }}>
                            <span style={{ background: "#1A1008", padding: "4px 12px", borderRadius: "6px", border: "1px solid #2A1A0E" }}>
                                JPG
                            </span>
                            <span style={{ background: "#1A1008", padding: "4px 12px", borderRadius: "6px", border: "1px solid #2A1A0E" }}>
                                PNG
                            </span>
                            <span style={{ background: "#1A1008", padding: "4px 12px", borderRadius: "6px", border: "1px solid #2A1A0E" }}>
                                WebP
                            </span>
                            <span className="ml-2 font-normal lowercase italic opacity-70">
                                {t('app.upload.maxSize')}
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
                    <div style={s.loading} className="mt-8">
                        <div style={s.spinner} />
                        <span>{t('app.upload.loading')}</span>
                    </div>
                )}

                {error && (
                    <div style={s.error} className="mt-8">
                        {error}
                    </div>
                )}

                <div className="mt-12 flex flex-wrap items-center justify-center gap-10" style={{ color: "#A08060" }}>
                    <div className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors" style={{ background: "rgba(212, 175, 55, 0.1)" }}>
                            <span className="material-symbols-outlined text-xl" style={{ color: "var(--color-primary)" }}>
                                verified
                            </span>
                        </div>
                        <span className="text-sm font-medium">
                            {t('app.upload.feature1')}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors" style={{ background: "rgba(139, 101, 8, 0.1)" }}>
                            <span className="material-symbols-outlined text-xl" style={{ color: "#8B6508" }}>
                                security
                            </span>
                        </div>
                        <span className="text-sm font-medium">
                            {t('app.upload.feature2')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadStep;
