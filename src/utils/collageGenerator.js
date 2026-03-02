/**
 * Utility to generate a before/after collage image using HTML5 Canvas.
 * @param {string} beforeSrc - URL of the original image
 * @param {string} afterSrc - URL of the generated image
 * @param {string} styleName - Name of the applied style
 * @returns {Promise<void>} - Triggers a download
 */
export const exportCollage = async (beforeSrc, afterSrc, styleName) => {
    return new Promise((resolve, reject) => {
        const beforeImg = new Image();
        const afterImg = new Image();

        // Handle CORS if images are hosted on a different origin (e.g., local Node backend)
        beforeImg.crossOrigin = "anonymous";
        afterImg.crossOrigin = "anonymous";

        let loadedCount = 0;
        const onImageLoad = () => {
            loadedCount++;
            if (loadedCount === 2) {
                generateCanvas();
            }
        };

        const onImageError = (err) => {
            console.error("Error loading images for collage:", err);
            reject(new Error("Impossible de charger les images pour le collage."));
        };

        beforeImg.onload = onImageLoad;
        beforeImg.onerror = onImageError;
        afterImg.onload = onImageLoad;
        afterImg.onerror = onImageError;

        // Start loading
        beforeImg.src = beforeSrc;
        afterImg.src = afterSrc;

        function generateCanvas() {
            try {
                // Determine target dimensions. We'll use the 'after' image dimensions as the base
                const targetW = afterImg.width;
                const targetH = afterImg.height;

                // Canvas dimensions: Side-by-side with a gap, plus a header/footer area
                const gap = Math.floor(targetW * 0.02); // 2% gap
                const margin = Math.floor(targetW * 0.05); // 5% outer margin
                const headerH = Math.floor(targetH * 0.1); // 10% header height
                const footerH = Math.floor(targetH * 0.12); // 12% footer height

                const canvasW = (targetW * 2) + gap + (margin * 2);
                const canvasH = targetH + headerH + footerH + (margin * 2);

                const canvas = document.createElement('canvas');
                canvas.width = canvasW;
                canvas.height = canvasH;
                const ctx = canvas.getContext('2d');

                // 1. Fill background (Dark Theme)
                ctx.fillStyle = '#0C0806'; // Very dark brown/black
                ctx.fillRect(0, 0, canvasW, canvasH);

                // 2. Draw Header Text
                ctx.fillStyle = '#B8860B'; // Golden color
                ctx.font = `bold ${Math.floor(headerH * 0.4)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const headerY = margin + (headerH / 2);
                ctx.fillText(`Style : ${styleName.toUpperCase()}`, canvasW / 2, headerY - (headerH * 0.1));

                // Draw decorative line under header
                ctx.beginPath();
                ctx.moveTo(canvasW * 0.3, headerY + (headerH * 0.2));
                ctx.lineTo(canvasW * 0.7, headerY + (headerH * 0.2));
                ctx.strokeStyle = '#2A1A0E';
                ctx.lineWidth = 2;
                ctx.stroke();

                // 3. Draw Before Image
                const leftImgX = margin;
                const imgY = margin + headerH;

                // Calculate dimensions for before image to cover the target area (crop if necessary)
                const beforeRatio = beforeImg.width / beforeImg.height;
                const targetRatio = targetW / targetH;
                let sx = 0, sy = 0, sw = beforeImg.width, sh = beforeImg.height;

                if (beforeRatio > targetRatio) {
                    // Before is wider
                    sw = beforeImg.height * targetRatio;
                    sx = (beforeImg.width - sw) / 2;
                } else {
                    // Before is taller
                    sh = beforeImg.width / targetRatio;
                    sy = (beforeImg.height - sh) / 2;
                }

                ctx.drawImage(beforeImg, sx, sy, sw, sh, leftImgX, imgY, targetW, targetH);

                // 4. Draw After Image
                const rightImgX = margin + targetW + gap;
                ctx.drawImage(afterImg, 0, 0, afterImg.width, afterImg.height, rightImgX, imgY, targetW, targetH);

                // 5. Draw Image Labels (Avant / Après)
                const labelPaddingX = Math.floor(targetW * 0.04);
                const labelPaddingY = Math.floor(targetH * 0.03);
                const labelFontSize = Math.floor(targetH * 0.04);

                ctx.font = `bold ${labelFontSize}px sans-serif`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';

                // Avant Label background
                const avantText = "AVANT";
                const avantWidth = ctx.measureText(avantText).width;
                ctx.fillStyle = 'rgba(12, 8, 6, 0.7)';
                ctx.fillRect(leftImgX + labelPaddingX - 10, imgY + labelPaddingY - 10, avantWidth + 20, labelFontSize + 20);
                // Avant Label text
                ctx.fillStyle = '#F0E6D3';
                ctx.fillText(avantText, leftImgX + labelPaddingX, imgY + labelPaddingY);

                // Après Label background
                const apresText = "APRÈS";
                const apresWidth = ctx.measureText(apresText).width;
                ctx.fillStyle = 'rgba(12, 8, 6, 0.7)';
                ctx.fillRect(rightImgX + labelPaddingX - 10, imgY + labelPaddingY - 10, apresWidth + 20, labelFontSize + 20);
                // Après Label text
                ctx.fillStyle = '#B8860B';
                ctx.fillText(apresText, rightImgX + labelPaddingX, imgY + labelPaddingY);

                // 6. Draw Footer (Branding)
                const footerY = imgY + targetH + (footerH / 2);
                ctx.fillStyle = '#8B7050';
                ctx.font = `${Math.floor(footerH * 0.25)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText("🏛️ African Interior Designer", canvasW / 2, footerY);

                // 7. Convert to Data URL and Trigger Download
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

                const link = document.createElement('a');
                link.href = dataUrl;
                const safeStyleName = styleName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                link.download = `african-design-${safeStyleName}-collage.jpg`;

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                resolve();
            } catch (err) {
                console.error("Error generating collage canvas:", err);
                reject(err);
            }
        }
    });
};
