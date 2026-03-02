import { jsPDF } from 'jspdf';

/**
 * Charge une image depuis une URL et retourne un objet Image + un dataURL base64.
 */
function loadImageAsDataUrl(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.88), img });
        };
        img.onerror = () => reject(new Error(`Impossible de charger l'image : ${src}`));
        img.src = src;
    });
}

/**
 * Génère et télécharge un PDF de présentation du design africain.
 *
 * @param {object} params
 * @param {string} params.beforeSrc      - URL de l'image originale
 * @param {string} params.afterSrc       - URL de l'image générée (design africain)
 * @param {object} params.style          - Objet style complet (name, description, family, region, materials, colors, patterns, flag)
 * @param {string} [params.customPrompt] - Instructions personnalisées de l'utilisateur (optionnel)
 */
export const exportDesignPDF = async ({ beforeSrc, afterSrc, style, customPrompt }) => {
    // ── Chargement des images ─────────────────────────────────────────────────
    const [{ dataUrl: beforeDataUrl }, { dataUrl: afterDataUrl }] =
        await Promise.all([
            loadImageAsDataUrl(beforeSrc),
            loadImageAsDataUrl(afterSrc),
        ]);

    // ── Initialisation PDF (A4 portrait) ──────────────────────────────────────
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210; // largeur A4 en mm
    const H = 297; // hauteur A4 en mm
    const margin = 14;
    const contentW = W - margin * 2;

    // ── Palette de couleurs (thème africain sombre) ───────────────────────────
    const bg = [12, 8, 6];       // #0C0806 — fond très sombre
    const gold = [184, 134, 11];   // #B8860B — doré
    const cream = [240, 230, 211];  // #F0E6D3 — crème
    const brown = [139, 112, 80];   // #8B7050 — brun clair
    const darkBrown = [30, 18, 8];      // #1E1208 — brun foncé

    // ───────────────────────────────────────────────────────────────────────────
    // PAGE 1 — En-tête + Photo du design africain
    // ───────────────────────────────────────────────────────────────────────────

    // Fond noir
    pdf.setFillColor(...bg);
    pdf.rect(0, 0, W, H, 'F');

    // Bandeau décoratif haut (dégradé simulé en bandes)
    const bandeColors = [
        [139, 0, 0],     // rouge foncé
        [184, 134, 11],  // doré
        [34, 139, 34],   // vert
        [26, 39, 68],    // bleu nuit
        [184, 134, 11],  // doré
        [196, 30, 58],   // rouge vif
        [184, 134, 11],  // doré
        [34, 139, 34],   // vert
        [139, 0, 0],     // rouge foncé
    ];
    const bandeH = 4;
    const bandeW = W / bandeColors.length;
    bandeColors.forEach((color, i) => {
        pdf.setFillColor(...color);
        pdf.rect(i * bandeW, 0, bandeW, bandeH, 'F');
    });

    // Titre principal
    let y = bandeH + 8;
    pdf.setTextColor(...gold);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    const titleText = `${style.flag || '🌍'} ${style.name || 'Design Africain'}`;
    // jsPDF ne supporte pas les emojis natifs, on les retire proprement
    const cleanTitle = titleText.replace(/\p{Emoji}/gu, '').trim();
    pdf.text(cleanTitle || style.name, W / 2, y + 6, { align: 'center' });

    y += 12;
    pdf.setTextColor(...brown);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const subTitle = [style.family, style.region].filter(Boolean).join('  ·  ').toUpperCase();
    if (subTitle) pdf.text(subTitle, W / 2, y, { align: 'center' });

    // Ligne séparatrice dorée
    y += 5;
    pdf.setDrawColor(...gold);
    pdf.setLineWidth(0.4);
    pdf.line(W * 0.25, y, W * 0.75, y);
    y += 6;

    // Photo "Après" (design généré) — grande, centrée
    const imgH = 90;
    pdf.addImage(afterDataUrl, 'JPEG', margin, y, contentW, imgH, '', 'FAST');
    y += imgH + 4;

    // Label "Design africain"
    pdf.setFillColor(...gold);
    pdf.roundedRect(margin, y, 52, 6, 1.5, 1.5, 'F');
    pdf.setTextColor(...bg);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DESIGN AFRICAIN GÉNÉRÉ', margin + 26, y + 4, { align: 'center' });
    y += 12;

    // ── Description du style ──────────────────────────────────────────────────
    if (style.description) {
        pdf.setTextColor(...cream);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('À propos de ce style', margin, y);
        y += 6;

        pdf.setTextColor(...brown);
        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'normal');
        const descLines = pdf.splitTextToSize(style.description, contentW);
        pdf.text(descLines, margin, y);
        y += descLines.length * 4.5 + 4;
    }

    // ── Matériaux ─────────────────────────────────────────────────────────────
    if (style.materials?.length) {
        pdf.setDrawColor(...darkBrown);
        pdf.setLineWidth(0.3);
        pdf.line(margin, y, W - margin, y);
        y += 6;

        pdf.setTextColor(...cream);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Matériaux & Textures', margin, y);
        y += 6;

        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'normal');
        style.materials.forEach((mat) => {
            pdf.setFillColor(...gold);
            pdf.circle(margin + 1.5, y - 1, 1.2, 'F');
            pdf.setTextColor(...brown);
            pdf.text(mat, margin + 5, y);
            y += 5;
        });
        y += 2;
    }

    // ── Palette de couleurs ───────────────────────────────────────────────────
    if (style.colors?.length) {
        pdf.setDrawColor(...darkBrown);
        pdf.setLineWidth(0.3);
        pdf.line(margin, y, W - margin, y);
        y += 6;

        pdf.setTextColor(...cream);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Palette de couleurs', margin, y);
        y += 6;

        const swatchSize = 10;
        const swatchGap = 3;
        let swatchX = margin;
        style.colors.slice(0, 8).forEach((color) => {
            // Essayer de parser la couleur (hex ou nom)
            try {
                if (color.startsWith('#')) {
                    const r = parseInt(color.slice(1, 3), 16);
                    const g = parseInt(color.slice(3, 5), 16);
                    const b = parseInt(color.slice(5, 7), 16);
                    pdf.setFillColor(r, g, b);
                } else {
                    pdf.setFillColor(...gold);
                }
            } catch {
                pdf.setFillColor(...gold);
            }
            pdf.roundedRect(swatchX, y, swatchSize, swatchSize, 1.5, 1.5, 'F');
            swatchX += swatchSize + swatchGap;
        });
        y += swatchSize + 6;
    }

    // ── Motifs / Patterns ─────────────────────────────────────────────────────
    if (style.patterns?.length) {
        pdf.setDrawColor(...darkBrown);
        pdf.setLineWidth(0.3);
        pdf.line(margin, y, W - margin, y);
        y += 6;

        pdf.setTextColor(...cream);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Motifs traditionnels', margin, y);
        y += 6;

        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...brown);
        const patternsText = style.patterns.join('  ·  ');
        const patLines = pdf.splitTextToSize(patternsText, contentW);
        pdf.text(patLines, margin, y);
        y += patLines.length * 4.5 + 4;
    }

    // ── Instructions personnalisées ───────────────────────────────────────────
    if (customPrompt) {
        pdf.setDrawColor(...darkBrown);
        pdf.setLineWidth(0.3);
        pdf.line(margin, y, W - margin, y);
        y += 6;

        pdf.setTextColor(...cream);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Instructions personnalisées', margin, y);
        y += 6;

        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(...brown);
        const cpLines = pdf.splitTextToSize(`"${customPrompt}"`, contentW);
        pdf.text(cpLines, margin, y);
        y += cpLines.length * 4.5 + 4;
    }

    // ───────────────────────────────────────────────────────────────────────────
    // PAGE 2 — Comparaison Avant / Après
    // ───────────────────────────────────────────────────────────────────────────
    pdf.addPage();

    // Fond + bandeau
    pdf.setFillColor(...bg);
    pdf.rect(0, 0, W, H, 'F');
    bandeColors.forEach((color, i) => {
        pdf.setFillColor(...color);
        pdf.rect(i * bandeW, 0, bandeW, bandeH, 'F');
    });

    let y2 = bandeH + 10;

    pdf.setTextColor(...gold);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Avant / Après', W / 2, y2, { align: 'center' });
    y2 += 8;

    pdf.setDrawColor(...gold);
    pdf.setLineWidth(0.4);
    pdf.line(W * 0.35, y2, W * 0.65, y2);
    y2 += 8;

    // Images côte à côte
    const imgW2 = (contentW - 6) / 2;
    const imgH2 = imgW2 * 0.75;

    // AVANT
    pdf.addImage(beforeDataUrl, 'JPEG', margin, y2, imgW2, imgH2, '', 'FAST');
    pdf.setFillColor(...[42, 26, 14]);
    pdf.rect(margin, y2, 22, 7, 'F');
    pdf.setTextColor(...cream);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AVANT', margin + 11, y2 + 4.5, { align: 'center' });

    // APRÈS
    const afterX = margin + imgW2 + 6;
    pdf.addImage(afterDataUrl, 'JPEG', afterX, y2, imgW2, imgH2, '', 'FAST');
    pdf.setFillColor(...gold);
    pdf.rect(afterX, y2, 22, 7, 'F');
    pdf.setTextColor(...bg);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('APRÈS', afterX + 11, y2 + 4.5, { align: 'center' });

    y2 += imgH2 + 12;

    // Citation d'inspiration
    pdf.setDrawColor(...darkBrown);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y2, W - margin, y2);
    y2 += 8;

    pdf.setTextColor(...gold);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('"L\'Afrique ne se limite pas à un continent,', W / 2, y2, { align: 'center' });
    y2 += 7;
    pdf.text('elle est un univers entier de beauté et de culture."', W / 2, y2, { align: 'center' });

    // ── Pied de page ─────────────────────────────────────────────────────────
    const footerY = H - 12;
    pdf.setFillColor(...darkBrown);
    pdf.rect(0, footerY - 4, W, 16, 'F');
    pdf.setTextColor(...brown);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text('African Interior Designer — Transformez votre espace avec l\'âme de l\'Afrique', W / 2, footerY + 2, { align: 'center' });

    // Même pied de page sur la page 1
    pdf.setPage(1);
    pdf.setFillColor(...darkBrown);
    pdf.rect(0, footerY - 4, W, 16, 'F');
    pdf.setTextColor(...brown);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text('African Interior Designer — Transformez votre espace avec l\'âme de l\'Afrique', W / 2, footerY + 2, { align: 'center' });

    // ── Téléchargement ────────────────────────────────────────────────────────
    const safeStyleName = (style.name || 'design').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    pdf.save(`african-interior-${safeStyleName}.pdf`);
};
