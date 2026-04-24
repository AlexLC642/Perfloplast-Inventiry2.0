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
  const colGap = 10;
  const rowGap = 12;
  const cardWidth = (pageWidth - (margin * 2) - colGap) / 2;
  const cardHeight = (pageHeight - 70) / 2; // Increased height for 2x2 distribution

  const optimizeUrl = (url) => {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return url;
    return url.replace('/upload/', '/upload/f_jpg,q_auto:good,w_1000,c_limit/');
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

  const totalPages = Math.ceil(allEntries.length / 4); // 4 per page

  const drawHeader = () => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(32);
    pdf.setTextColor(0, 71, 171);
    pdf.text("PERFLO PLAST", margin, 20);
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    pdf.text("INDUSTRIA DE PLÁSTICO - CATÁLOGO OFICIAL", margin, 27);
    pdf.setDrawColor(197, 160, 89);
    pdf.setLineWidth(0.8);
    pdf.line(pageWidth - margin - 50, 20, pageWidth - margin, 20);
    pdf.setFontSize(11);
    pdf.setTextColor(197, 160, 89);
    pdf.text(new Date().toLocaleDateString('es-ES'), pageWidth - margin, 26, { align: 'right' });
  };

  const drawFooter = (pageNum) => {
    pdf.setDrawColor(241, 245, 249);
    pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`página ${pageNum} de ${totalPages}`, margin, pageHeight - 9);
    pdf.text("www.perfloplast.com", pageWidth - margin, pageHeight - 9, { align: 'right' });
  };

  const drawCard = (entry, x, y, imgElement) => {
    pdf.setDrawColor(241, 245, 249);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, y, cardWidth, cardHeight, 8, 8, 'FD');

    const imgPadding = 5;
    const imgBoxHeight = cardHeight * 0.62; // Significantly larger image box
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(x + imgPadding, y + imgPadding, cardWidth - (imgPadding * 2), imgBoxHeight, 5, 5, 'F');
    
    if (imgElement) {
      const targetW = cardWidth - (imgPadding * 2) - 12;
      const targetH = imgBoxHeight - 10;
      const ratio = Math.min(targetW / imgElement.width, targetH / imgElement.height);
      const drawW = imgElement.width * ratio;
      const drawH = imgElement.height * ratio;
      const offX = (targetW - drawW) / 2;
      const offY = (targetH - drawH) / 2;
      pdf.addImage(imgElement, 'JPEG', x + imgPadding + 6 + offX, y + imgPadding + 5 + offY, drawW, drawH, undefined, 'FAST');
    }

    const textX = x + imgPadding + 2;
    let currentY = y + imgBoxHeight + 12;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14); // Larger title
    pdf.setTextColor(30, 41, 59);
    const titleLines = pdf.splitTextToSize(entry.name.toUpperCase(), cardWidth - 35);
    pdf.text(titleLines, textX, currentY);
    
    pdf.setFillColor(30, 41, 59);
    const priceText = `Q ${Number(entry.price).toFixed(2)}`;
    const priceWidth = pdf.getTextWidth(priceText) + 6;
    pdf.roundedRect(x + cardWidth - priceWidth - 5, currentY - 6, priceWidth, 9, 2.5, 2.5, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.text(priceText, x + cardWidth - 5 - 3, currentY + 0.5, { align: 'right' });

    currentY += 8;
    pdf.setFillColor(entry.isOrig ? 34 : 197, entry.isOrig ? 197 : 160, entry.isOrig ? 94 : 89);
    pdf.circle(textX + 1.5, currentY - 1, 1.5, 'F');
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(entry.isOrig ? "LÍNEA PRINCIPAL" : "MODELO DISPONIBLE", textX + 6, currentY);

    currentY += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10); // More legible description
    pdf.setTextColor(71, 85, 105);
    const desc = pdf.splitTextToSize(entry.desc, cardWidth - 12);
    pdf.text(desc.slice(0, 4), textX, currentY, { lineHeightFactor: 1.2 });

    const colorY = y + cardHeight - 10;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text("COLORES DISPONIBLES", textX, colorY);
    
    (entry.colors || []).slice(0, 10).forEach((c, i) => {
      const hex = c.hex.startsWith('#') ? c.hex : '#ffffff';
      const r = parseInt(hex.slice(1, 3), 16) || 255;
      const g = parseInt(hex.slice(3, 5), 16) || 255;
      const b = parseInt(hex.slice(5, 7), 16) || 255;
      pdf.setDrawColor(226, 232, 240);
      pdf.setFillColor(r, g, b);
      pdf.circle(textX + 38 + (i * 6), colorY - 1.2, 2.2, 'FD');
    });
  };

  // Process pages (4 per page)
  const ITEMS_PER_PAGE = 4;
  const allImages = await Promise.all(allEntries.map(entry => loadImage(entry.imgUrl)));

  for (let i = 0; i < allEntries.length; i += ITEMS_PER_PAGE) {
    if (i > 0) {
      pdf.addPage();
      await new Promise(r => setTimeout(r, 10));
    }
    const pageNum = Math.floor(i / ITEMS_PER_PAGE) + 1;
    drawHeader();
    
    const chunk = allEntries.slice(i, i + ITEMS_PER_PAGE);
    chunk.forEach((entry, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = margin + (col * (cardWidth + colGap));
      const y = 38 + (row * (cardHeight + rowGap));
      drawCard(entry, x, y, allImages[i + index]);
    });

    drawFooter(pageNum);
  }

  pdf.save(`Catalogo_Vip_PerfloPlast_${new Date().toISOString().split('T')[0]}.pdf`);
};





