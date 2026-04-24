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
  const rowGap = 8;
  const cardWidth = (pageWidth - (margin * 2) - colGap) / 2;
  const cardHeight = (pageHeight - 65) / 3; // Space for header/footer

  // High-res optimized URL for PDF (1200px is perfect for A4 print)
  const optimizeUrl = (url) => {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return url;
    return url.replace('/upload/', '/upload/f_jpg,q_auto:best,w_1200,c_limit/');
  };

  const allEntries = [];
  products.forEach(p => {
    allEntries.push({ name: p.name, desc: p.description || '', price: p.price, colors: p.colors || [], img: optimizeUrl(p.image), isOrig: true });
    if (p.types) p.types.forEach(t => {
      if (t) allEntries.push({ 
        name: t.name || p.name, 
        desc: t.description || p.description || '', 
        price: t.price || p.price, 
        colors: (t.colors && t.colors.length > 0) ? t.colors : p.colors, 
        img: optimizeUrl(t.image || p.image),
        isOrig: false 
      });
    });
  });

  const totalPages = Math.ceil(allEntries.length / 6);

  const drawHeader = (pageNum) => {
    // Logo / Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(28);
    pdf.setTextColor(0, 71, 171); // Blue
    pdf.text("PERFLO PLAST", margin, 20);
    
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text("INDUSTRIA DE PLÁSTICO - CATÁLOGO OFICIAL", margin, 26);

    // Date Box
    pdf.setDrawColor(197, 160, 89); // Gold
    pdf.setLineWidth(0.5);
    pdf.line(pageWidth - margin - 40, 20, pageWidth - margin, 20);
    pdf.setFontSize(10);
    pdf.setTextColor(197, 160, 89);
    const dateStr = new Date().toLocaleDateString('es-ES');
    pdf.text(dateStr, pageWidth - margin, 25, { align: 'right' });
  };

  const drawFooter = (pageNum) => {
    pdf.setDrawColor(241, 245, 249);
    pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`página ${pageNum} de ${totalPages}`, margin, pageHeight - 10);
    pdf.text("www.perfloplast.com", pageWidth - margin, pageHeight - 10, { align: 'right' });
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 41, 59);
    pdf.text(`© ${new Date().getFullYear()} PERFLO-PLAST`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  };

  const drawCard = (entry, x, y) => {
    // Card Background
    pdf.setDrawColor(241, 245, 249);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, y, cardWidth, cardHeight, 6, 6, 'FD');

    // Image Placeholder
    const imgPadding = 4;
    const imgBoxHeight = cardHeight * 0.55;
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(x + imgPadding, y + imgPadding, cardWidth - (imgPadding * 2), imgBoxHeight, 4, 4, 'F');
    
    // Add Image (Note: jsPDF handles URL loading, but async is better)
    // For performance in this native version, we use the URL directly
    try {
      pdf.addImage(entry.img, 'JPEG', x + imgPadding + 5, y + imgPadding + 5, cardWidth - (imgPadding * 2) - 10, imgBoxHeight - 10, undefined, 'FAST');
    } catch (e) { console.warn("Img skip", e); }

    // Text Content
    const textX = x + imgPadding + 2;
    let currentY = y + imgBoxHeight + 10;

    // Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(30, 41, 59);
    const title = pdf.splitTextToSize(entry.name.toUpperCase(), cardWidth - 25);
    pdf.text(title, textX, currentY);
    
    // Price Tag
    pdf.setFillColor(30, 41, 59);
    const priceText = `Q ${Number(entry.price).toFixed(2)}`;
    const priceWidth = pdf.getTextWidth(priceText) + 6;
    pdf.roundedRect(x + cardWidth - priceWidth - 4, currentY - 5, priceWidth, 8, 2, 2, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text(priceText, x + cardWidth - 4 - 3, currentY + 0.5, { align: 'right' });

    // Type Label
    currentY += 6;
    pdf.setFillColor(entry.isOrig ? 34 : 197, entry.isOrig ? 197 : 160, entry.isOrig ? 94 : 89);
    pdf.circle(textX + 1.5, currentY - 1, 1.2, 'F');
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(148, 163, 184);
    pdf.text(entry.isOrig ? "LÍNEA PRINCIPAL" : "MODELO DISPONIBLE", textX + 5, currentY);

    // Description
    currentY += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    const desc = pdf.splitTextToSize(entry.desc, cardWidth - 10);
    pdf.text(desc.slice(0, 3), textX, currentY, { lineHeightFactor: 1.2 });

    // Colors
    const colorY = y + cardHeight - 8;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(148, 163, 184);
    pdf.text("COLORES", textX, colorY);
    
    (entry.colors || []).slice(0, 8).forEach((c, i) => {
      const hex = c.hex.startsWith('#') ? c.hex : '#ffffff';
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      pdf.setDrawColor(226, 232, 240);
      pdf.setFillColor(r, g, b);
      pdf.circle(textX + 20 + (i * 5), colorY - 1, 1.8, 'FD');
    });
  };

  // Generate Pages
  for (let i = 0; i < allEntries.length; i += 6) {
    if (i > 0) pdf.addPage();
    const pageNum = Math.floor(i / 6) + 1;
    drawHeader(pageNum);
    
    const chunk = allEntries.slice(i, i + 6);
    chunk.forEach((entry, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = margin + (col * (cardWidth + colGap));
      const y = 35 + (row * (cardHeight + rowGap));
      drawCard(entry, x, y);
    });

    drawFooter(pageNum);
  }

  pdf.save(`Catalogo_PerfloPlast_${new Date().toISOString().split('T')[0]}.pdf`);
};





