'use client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * PDF GENERATOR UTILITY
 * Generates a premium catalog PDF with high-fidelity product images.
 */
export const generateCatalogPdf = async (products) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const colGap = 8;
  const rowGap = 10;
  const cardWidth = (pageWidth - (margin * 2) - colGap) / 2;
  const cardHeight = (pageHeight - 65) / 3;

  // 800px is ideal for 2-column grid print quality vs speed balance
  const optimizeUrl = (url) => {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return url;
    return url.replace('/upload/', '/upload/f_jpg,q_auto:good,w_800,c_limit/');
  };

  const loadImage = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const allEntries = [];
  products.forEach(p => {
    allEntries.push({ name: p.name, desc: p.description || '', price: p.price, colors: p.colors || [], imgUrl: optimizeUrl(p.image), isOrig: true });
    if (p.types) p.types.forEach(t => {
      if (t) allEntries.push({ 
        name: t.name || p.name, 
        desc: t.description || p.description || '', 
        price: t.price || p.price, 
        colors: (t.colors && t.colors.length > 0) ? t.colors : p.colors, 
        imgUrl: optimizeUrl(t.image || p.image),
        isOrig: false 
      });
    });
  });

  const totalPages = Math.ceil(allEntries.length / 6);

  // 1. PRE-LOAD ALL IMAGES IN PARALLEL (Faster)
  const allLoadedImages = await Promise.all(allEntries.map(entry => loadImage(entry.imgUrl)));

  const drawHeader = () => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(28);
    pdf.setTextColor(0, 71, 171);
    pdf.text("PERFLO PLAST", margin, 20);
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text("INDUSTRIA DE PLÁSTICO - CATÁLOGO OFICIAL", margin, 26);
    pdf.setDrawColor(197, 160, 89);
    pdf.setLineWidth(0.5);
    pdf.line(pageWidth - margin - 40, 20, pageWidth - margin, 20);
    pdf.setFontSize(10);
    pdf.setTextColor(197, 160, 89);
    pdf.text(new Date().toLocaleDateString('es-ES'), pageWidth - margin, 25, { align: 'right' });
  };

  const drawFooter = (pageNum) => {
    pdf.setDrawColor(241, 245, 249);
    pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`página ${pageNum} de ${totalPages}`, margin, pageHeight - 10);
    pdf.text("www.perfloplast.com", pageWidth - margin, pageHeight - 10, { align: 'right' });
  };

  const drawCard = (entry, x, y, imgElement) => {
    pdf.setDrawColor(241, 245, 249);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, y, cardWidth, cardHeight, 6, 6, 'FD');

    const imgPadding = 4;
    const imgBoxHeight = cardHeight * 0.48;
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(x + imgPadding, y + imgPadding, cardWidth - (imgPadding * 2), imgBoxHeight, 4, 4, 'F');
    
    if (imgElement) {
      const targetW = cardWidth - (imgPadding * 2) - 10;
      const targetH = imgBoxHeight - 8;
      const ratio = Math.min(targetW / imgElement.width, targetH / imgElement.height);
      const drawW = imgElement.width * ratio;
      const drawH = imgElement.height * ratio;
      const offX = (targetW - drawW) / 2;
      const offY = (targetH - drawH) / 2;
      pdf.addImage(imgElement, 'JPEG', x + imgPadding + 5 + offX, y + imgPadding + 4 + offY, drawW, drawH, undefined, 'FAST');
    }

    const textX = x + imgPadding + 2;
    let currentY = y + imgBoxHeight + 10;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(30, 41, 59);
    const titleLines = pdf.splitTextToSize(entry.name.toUpperCase(), cardWidth - 28);
    pdf.text(titleLines, textX, currentY);
    
    pdf.setFillColor(30, 41, 59);
    const priceText = `Q ${Number(entry.price).toFixed(2)}`;
    const priceWidth = pdf.getTextWidth(priceText) + 5;
    pdf.roundedRect(x + cardWidth - priceWidth - 4, currentY - 5, priceWidth, 7, 2, 2, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.text(priceText, x + cardWidth - 4 - 2.5, currentY + 0.2, { align: 'right' });

    currentY += 6;
    pdf.setFillColor(entry.isOrig ? 34 : 197, entry.isOrig ? 197 : 160, entry.isOrig ? 94 : 89);
    pdf.circle(textX + 1.5, currentY - 1, 1.2, 'F');
    pdf.setFontSize(7);
    pdf.setTextColor(148, 163, 184);
    pdf.text(entry.isOrig ? "LÍNEA PRINCIPAL" : "MODELO DISPONIBLE", textX + 5, currentY);

    currentY += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    const desc = pdf.splitTextToSize(entry.desc, cardWidth - 10);
    pdf.text(desc.slice(0, 3), textX, currentY, { lineHeightFactor: 1.1 });

    const colorY = y + cardHeight - 8;
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(148, 163, 184);
    pdf.text("COLORES", textX, colorY);
    
    (entry.colors || []).slice(0, 8).forEach((c, i) => {
      const hex = c.hex.startsWith('#') ? c.hex : '#ffffff';
      const r = parseInt(hex.slice(1, 3), 16) || 255;
      const g = parseInt(hex.slice(3, 5), 16) || 255;
      const b = parseInt(hex.slice(5, 7), 16) || 255;
      pdf.setDrawColor(226, 232, 240);
      pdf.setFillColor(r, g, b);
      pdf.circle(textX + 18 + (i * 4.5), colorY - 1, 1.6, 'FD');
    });
  };

  // 2. DRAW PAGES WITH MICRO-PAUSES TO UNFREEZE UI
  for (let i = 0; i < allEntries.length; i += 6) {
    if (i > 0) {
      pdf.addPage();
      // Brief pause every page to let browser handle other events (like clicks)
      await new Promise(r => setTimeout(r, 10));
    }
    const pageNum = Math.floor(i / 6) + 1;
    drawHeader();
    
    const chunk = allEntries.slice(i, i + 6);
    chunk.forEach((entry, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = margin + (col * (cardWidth + colGap));
      const y = 35 + (row * (cardHeight + rowGap));
      drawCard(entry, x, y, allLoadedImages[i + index]);
    });

    drawFooter(pageNum);
  }

  pdf.save(`Catalogo_PerfloPlast_${new Date().toISOString().split('T')[0]}.pdf`);
};





