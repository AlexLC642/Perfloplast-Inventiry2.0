'use client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * PDF GENERATOR UTILITY
 * Generates a premium catalog PDF with high-fidelity product images.
 */
export const generateCatalogPdf = async (products) => {
  const HEADER_HTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #c5a059; padding-bottom: 20px; margin-bottom: 25px; width: 100%;">
      <div>
        <h1 style="margin: 0; font-size: 44px; color: #0047AB; font-weight: 950; letter-spacing: -0.04em; text-transform: uppercase; line-height: 1;">PERFLO PLAST</h1>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em;">Industria de Plástico - Catálogo Oficial</p>
      </div>
      <div style="text-align: right; background: #fcfcfc; padding: 12px 18px; border-radius: 18px; border: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 13px; color: #c5a059; font-weight: 900;">${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
        <div style="margin-top: 4px; height: 2px; background: #c5a059; width: 35px; margin-left: auto;"></div>
      </div>
    </div>
  `;

  const FOOTER_HTML = (page, total) => `
    <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #f1f5f9; text-align: center; width: 100%; display: flex; justify-content: space-between; align-items: center;">
      <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 700;">página ${page} de ${total}</p>
      <p style="margin: 0; font-size: 13px; color: #1e293b; font-weight: 800;">&copy; ${new Date().getFullYear()} PERFLO-PLAST</p>
      <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 700;">www.perfloplast.com</p>
    </div>
  `;

  // 1. Flatten Products into Entries
  const allEntries = [];
  products.forEach(p => {
    allEntries.push({
      displayName: p.name,
      description: p.description || '',
      price: p.price,
      colors: p.colors || [],
      image: p.image,
      transform: p.imageTransform || { scale: 1, x: 0, y: 0 },
      isOriginal: true
    });

    if (p.types && p.types.length > 0) {
      p.types.forEach(t => {
        if (!t) return;
        allEntries.push({
          displayName: typeof t === 'string' ? t : (t.name || p.name),
          description: (typeof t === 'object' && t.description) ? t.description : (p.description || ''),
          price: (typeof t === 'object' && t.price) ? t.price : p.price,
          colors: (typeof t === 'object' && t.colors && t.colors.length > 0) ? t.colors : p.colors,
          image: (typeof t === 'object' && t.image) ? t.image : p.image,
          transform: (typeof t === 'object' && t.imageTransform) ? t.imageTransform : (p.imageTransform || { scale: 1, x: 0, y: 0 }),
          isOriginal: false
        });
      });
    }
  });

  const chunks = [];
  for (let i = 0; i < allEntries.length; i += 6) {
    chunks.push(allEntries.slice(i, i + 6));
  }

  try {
    // 2. Optimized PDF Generation
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Helper to process a single page
    const renderPage = async (chunk, index) => {
      const pageDiv = document.createElement('div');
      pageDiv.style.position = 'fixed';
      pageDiv.style.top = '-10000px';
      pageDiv.style.left = '-10000px';
      pageDiv.style.width = '1000px';
      pageDiv.style.height = '1414px';
      pageDiv.style.background = 'white';
      pageDiv.style.padding = '40px 60px';
      pageDiv.style.fontFamily = "'Inter', system-ui, sans-serif";
      pageDiv.style.display = 'flex';
      pageDiv.style.flexDirection = 'column';
      pageDiv.style.boxSizing = 'border-box';
      pageDiv.style.overflow = 'hidden';

      let itemsHtml = chunk.map(entry => {
        const t = entry.transform || { scale: 1, x: 0, y: 0 };
        const colorSwatches = (entry.colors || []).slice(0, 10).map(c => `
          <div style="width: 16px; height: 16px; border-radius: 50%; background: ${c.hex}; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.1);"></div>
        `).join('');

        return `
          <div style="display: flex; flex-direction: column; padding: 20px; background: #ffffff; border-radius: 35px; border: 1px solid #e2e8f0; box-shadow: 0 15px 40px rgba(0,0,0,0.02); break-inside: avoid; height: 100%; box-sizing: border-box;">
            <div style="width: 100%; height: 180px; background: radial-gradient(circle at center, #f8fafc 0%, #f1f5f9 100%); border-radius: 25px; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 20px;">
              <div style="position: absolute; top: 12px; left: 12px; opacity: 0.1; font-weight: 950; font-size: 13px; color: #0047AB; text-transform: uppercase;">Perflo Plast</div>
              <img src="${entry.image}" style="max-width: 85%; max-height: 85%; object-fit: contain; transform: scale(${t.scale}) translate(${t.x || 0}%, ${t.y || 0}%);" crossorigin="anonymous" />
            </div>

            <div style="display: flex; flex-direction: column; flex-grow: 1;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 8px;">
                <h2 style="margin: 0; font-size: 18px; font-weight: 900; color: #1e293b; line-height: 1.1;">${entry.displayName}</h2>
                <div style="background: linear-gradient(135deg, #c5a059 0%, #a38241 100%); color: white; padding: 6px 14px; border-radius: 14px; font-weight: 950; font-size: 17px; white-space: nowrap;">
                  <span style="font-size: 10px; vertical-align: middle; margin-right: 2px;">Q</span>${Number(entry.price || 0).toFixed(2)}
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 8px;">
                <div style="width: 5px; height: 5px; border-radius: 50%; background: ${entry.isOriginal ? '#22c55e' : '#c5a059'};"></div>
                <span style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">${entry.isOriginal ? 'Línea Principal' : 'Modelo Seleccionado'}</span>
              </div>

              ${entry.description ? `
                <p style="margin: 0 0 12px 0; font-size: 9.5px; color: #64748b; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; font-weight: 500;">
                  ${entry.description}
                </p>
              ` : ''}

              <div style="margin-top: auto; border-top: 1px solid #f8fafc; padding-top: 12px; display: flex; align-items: center; gap: 8px;">
                <div style="display: flex; gap: -5px; align-items: center;">${colorSwatches}</div>
                <div style="height: 10px; width: 1px; background: #e2e8f0;"></div>
                <span style="font-size: 10px; color: #475569; font-weight: 800; text-transform: uppercase;">Colores</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      pageDiv.innerHTML = `
        ${HEADER_HTML}
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(3, 1fr); gap: 25px; flex: 1;">
          ${itemsHtml}
        </div>
        ${FOOTER_HTML(index + 1, chunks.length)}
      `;

      document.body.appendChild(pageDiv);

      const canvas = await html2canvas(pageDiv, {
        scale: 2, // Reduced from 3 to 2 for much faster generation while maintaining quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 0,
        removeContainer: true
      });

      document.body.removeChild(pageDiv);
      return { index, canvas };
    };

    // Process pages in parallel (batches of 2 to balance speed and memory)
    const CONCURRENCY_LIMIT = 2;
    const results = [];
    
    for (let i = 0; i < chunks.length; i += CONCURRENCY_LIMIT) {
      const batch = chunks.slice(i, i + CONCURRENCY_LIMIT).map((chunk, j) => 
        renderPage(chunk, i + j)
      );
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }

    // Assemble PDF in order
    results.sort((a, b) => a.index - b.index).forEach((res, i) => {
      if (i > 0) pdf.addPage();
      // Directly inject canvas and use JPEG for faster compression and smaller file size
      pdf.addImage(res.canvas, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    });

    pdf.save(`Catálogo_Premium_Perflo_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (err) {
    console.error("PDF Generation Error:", err);
    alert("Error al generar el PDF. Revisa tu conexión de red.");
  }
};





