import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * ComparisonSlider — Drag a handle to reveal before/after images.
 * Props: beforeImage, afterImage, beforeLabel, afterLabel, height
 */
export default function ComparisonSlider({
    beforeImage,
    afterImage,
    beforeLabel = 'Avant',
    afterLabel = 'Après',
    height = 400
}) {
    const containerRef = useRef(null);
    const [sliderPos, setSliderPos] = useState(50); // percentage 0-100
    const [isDragging, setIsDragging] = useState(false);

    const updatePosition = useCallback((clientX) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = clientX - rect.left;
        const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPos(pct);
    }, []);

    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
        updatePosition(e.clientX);
    }, [updatePosition]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        updatePosition(e.clientX);
    }, [isDragging, updatePosition]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleTouchStart = useCallback((e) => {
        setIsDragging(true);
        updatePosition(e.touches[0].clientX);
    }, [updatePosition]);

    const handleTouchMove = useCallback((e) => {
        if (!isDragging) return;
        updatePosition(e.touches[0].clientX);
    }, [isDragging, updatePosition]);

    // Global mouse/touch listeners for drag
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

    return (
        <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{
                position: 'relative',
                width: '100%',
                height: typeof height === 'number' ? `${height}px` : height,
                overflow: 'hidden',
                borderRadius: '8px',
                border: '1px solid #2A1A0E',
                cursor: isDragging ? 'grabbing' : 'ew-resize',
                userSelect: 'none',
                touchAction: 'none'
            }}
        >
            {/* After image (full background) */}
            <img
                src={afterImage}
                alt={afterLabel}
                draggable={false}
                style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                }}
            />

            {/* Before image (clipped to slider position) */}
            <div
                style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: `${sliderPos}%`,
                    height: '100%',
                    overflow: 'hidden'
                }}
            >
                <img
                    src={beforeImage}
                    alt={beforeLabel}
                    draggable={false}
                    style={{
                        position: 'absolute',
                        top: 0, left: 0,
                        width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%',
                        height: '100%',
                        objectFit: 'cover',
                        maxWidth: 'none'
                    }}
                />
            </div>

            {/* Slider line */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: `${sliderPos}%`,
                    transform: 'translateX(-50%)',
                    width: '3px',
                    height: '100%',
                    background: '#B8860B',
                    zIndex: 10,
                    pointerEvents: 'none'
                }}
            />

            {/* Slider handle */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: `${sliderPos}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#B8860B',
                    border: '3px solid #F0E6D3',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.6)',
                    zIndex: 11,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                }}
            >
                <span style={{ fontSize: '14px', color: '#0C0806', fontWeight: 'bold', letterSpacing: '-1px' }}>
                    ◂ ▸
                </span>
            </div>

            {/* Labels */}
            <div
                style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(12,8,6,0.8)',
                    padding: '4px 10px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    color: '#F0E6D3',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    pointerEvents: 'none',
                    zIndex: 5
                }}
            >
                {beforeLabel}
            </div>
            <div
                style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(12,8,6,0.8)',
                    padding: '4px 10px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    color: '#B8860B',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    pointerEvents: 'none',
                    zIndex: 5
                }}
            >
                {afterLabel}
            </div>

            {/* Hint (bottom center) */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(12,8,6,0.7)',
                    padding: '4px 12px',
                    borderRadius: '3px',
                    fontSize: '10px',
                    color: '#8B7050',
                    pointerEvents: 'none',
                    zIndex: 5,
                    whiteSpace: 'nowrap'
                }}
            >
                ← Glisser pour comparer →
            </div>
        </div>
    );
}
