import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function InpaintingModal({ imageUrl, onClose, onSubmit }) {
    const { t } = useTranslation();
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(30);
    const [prompt, setPrompt] = useState('');
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [strokes, setStrokes] = useState([]);
    const [currentStroke, setCurrentStroke] = useState(null);

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            // Scale down if image is too large for the screen, but maintain aspect ratio
            const maxWidth = window.innerWidth * 0.8;
            const maxHeight = window.innerHeight * 0.6;
            let ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
            if (ratio > 1) ratio = 1; // Don't scale up

            const width = img.width * ratio;
            const height = img.height * ratio;
            setImageSize({ width, height, originalWidth: img.width, originalHeight: img.height });

            const canvas = canvasRef.current;
            if (canvas) {
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                // Initialize transparent canvas
                ctx.clearRect(0, 0, width, height);
            }
        };
        img.src = imageUrl;
    }, [imageUrl]);

    const startDrawing = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsDrawing(true);
        setCurrentStroke({ size: brushSize, points: [{ x, y }] });
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCurrentStroke(prev => ({ ...prev, points: [...prev.points, { x, y }] }));

        // Draw on screen
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(255, 50, 150, 0.5)'; // visual semi-transparent pink
        ctx.lineWidth = brushSize;

        const prevPoint = currentStroke.points[currentStroke.points.length - 1] || { x, y };
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing && currentStroke) {
            setStrokes([...strokes, currentStroke]);
            setCurrentStroke(null);
        }
        setIsDrawing(false);
    };

    const clearMask = () => {
        setStrokes([]);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleSubmit = () => {
        if (strokes.length === 0) {
            alert(t('inpainting.alerts.mask'));
            return;
        }
        if (!prompt.trim()) {
            alert(t('inpainting.alerts.prompt'));
            return;
        }

        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = imageSize.originalWidth;
        maskCanvas.height = imageSize.originalHeight;
        const ctx = maskCanvas.getContext('2d');

        // Fill with black (keep)
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

        // Draw strokes in white (inpaint)
        const scaleX = imageSize.originalWidth / imageSize.width;
        const scaleY = imageSize.originalHeight / imageSize.height;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'white';

        strokes.forEach(stroke => {
            ctx.lineWidth = stroke.size * scaleX;
            ctx.beginPath();
            if (stroke.points.length > 0) {
                ctx.moveTo(stroke.points[0].x * scaleX, stroke.points[0].y * scaleY);
                stroke.points.forEach(point => {
                    ctx.lineTo(point.x * scaleX, point.y * scaleY);
                });
            }
            ctx.stroke();
        });

        const maskDataUrl = maskCanvas.toDataURL('image/png');
        onSubmit(maskDataUrl, prompt);
    };

    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <h3 style={{ marginTop: 0, fontSize: '20px', color: '#B8860B' }}>{t('inpainting.title')}</h3>
                <p style={{ fontSize: '13px', color: '#8B7050', marginBottom: '15px' }}>
                    {t('inpainting.desc')}
                </p>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>{t('inpainting.brushSize')} : {brushSize}px</label>
                        <input
                            type="range"
                            min="10"
                            max="100"
                            value={brushSize}
                            onChange={e => setBrushSize(parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: '#B8860B' }}
                        />
                    </div>
                    <button onClick={clearMask} style={clearBtnStyle}>{t('inpainting.clear')}</button>
                </div>

                <div
                    ref={containerRef}
                    style={{
                        position: 'relative',
                        width: imageSize.width || '100%',
                        height: imageSize.height || '300px',
                        backgroundColor: '#000',
                        backgroundImage: `url(${imageUrl})`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        cursor: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${brushSize}" height="${brushSize}" viewBox="0 0 ${brushSize} ${brushSize}"><circle cx="${brushSize / 2}" cy="${brushSize / 2}" r="${brushSize / 2 - 1}" fill="rgba(255,50,150,0.5)" stroke="white"/></svg>') ${brushSize / 2} ${brushSize / 2}, auto`,
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #2A1A0E',
                        margin: '0 auto'
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        style={{ position: 'absolute', top: 0, left: 0 }}
                    />
                </div>

                <div style={{ marginTop: '20px' }}>
                    <label style={labelStyle}>{t('inpainting.promptLabel')} :</label>
                    <input
                        type="text"
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder={t('inpainting.placeholder')}
                        style={inputStyle}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button onClick={onClose} style={secondaryBtnStyle}>{t('inpainting.cancel')}</button>
                    <button onClick={handleSubmit} style={primaryBtnStyle}>{t('inpainting.generate')} ✨</button>
                </div>
            </div>
        </div>
    );
}

const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
};
const modalContentStyle = {
    backgroundColor: '#0E0905', padding: '25px', borderRadius: '12px',
    border: '1px solid #3A2A1E', width: '90%', maxWidth: '800px',
    maxHeight: '90vh', overflowY: 'auto'
};
const labelStyle = { color: '#F0E6D3', fontSize: '14px', display: 'block', marginBottom: '8px', fontWeight: 'bold' };
const inputStyle = {
    width: '100%', padding: '10px', background: '#160E07',
    border: '1px solid #2A1A0E', borderRadius: '6px', color: '#fff', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box'
};
const primaryBtnStyle = {
    background: '#B8860B', color: '#000', border: 'none',
    padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px'
};
const secondaryBtnStyle = {
    background: 'transparent', color: '#8B7050', border: '1px solid #2A1A0E',
    padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px'
};
const clearBtnStyle = {
    background: 'rgba(255, 50, 50, 0.1)', color: '#ff6b6b', border: '1px solid rgba(255, 50, 50, 0.3)',
    padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', height: 'fit-content', alignSelf: 'flex-end'
};
