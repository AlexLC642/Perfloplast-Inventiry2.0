'use client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * PDF GENERATOR UTILITY
 * Generates a premium catalog PDF with high-fidelity product images.
 */
export const generateCatalogPdf = async (products) => {
  // 1. Create a hidden container for the PDF layout
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-10000px';
  container.style.left = '-10000px';
  container.style.width = '800px'; // Standard width for PDF capture
  container.style.background = 'white';
  container.style.padding = '60px';
  container.style.fontFamily = "'Inter', sans-serif";
  container.style.color = '#1a1a1b';
  
  // 2. Build the Document Header
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #c5a059; padding-bottom: 20px; margin-bottom: 40px;">
      <div>
        <h1 style="margin: 0; font-size: 32px; color: #0047AB; font-weight: 900; letter-spacing: -0.02em;">PERFLO PLAST</h1>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Industria de Plástico - Catálogo Oficial</p>
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; font-size: 11px; color: #c5a059; font-weight: 800;">${new Date().toLocaleDateString()}</p>
        <p style="margin: 2px 0 0 0; font-size: 10px; color: #94a3b8; font-weight: 600;">Ref: PRODUCT_CATALOG_2024</p>
      </div>
    </div>
  `;

  // 3. Build the Product Grid/List
  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '30px';

  for (const product of products) {
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.gap = '30px';
    item.style.padding = '20px';
    item.style.background = '#f8fafc';
    item.style.borderRadius = '20px';
    item.style.border = '1px solid #e2e8f0';
    item.style.pageBreakInside = 'avoid';

    // Image Area (Capture the FidelityImage or just the base image for PDF speed/reliability)
    // For PDF, we'll use the base image to ensure it loads synchronously and clearly.
    const imageArea = `
      <div style="width: 150px; height: 150px; background: white; border-radius: 12px; padding: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
        <img src="${product.image}" style="width: 100%; height: 100%; object-fit: contain;" crossorigin="anonymous" />
      </div>
    `;

    // Colors Area
    const colorSwatches = (product.colors || []).map(c => `
      <div style="width: 12px; height: 12px; border-radius: 50%; background: ${c.hex}; border: 1px solid rgba(0,0,0,0.1);"></div>
    `).join('');

    // Types Area
    const typesList = (product.types || []).filter(t => t).map(t => (typeof t === 'string' ? t : t.name)).join(', ');

    item.innerHTML = `
      ${imageArea}
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #1e293b;">${product.name}</h2>
          <div style="font-size: 24px; font-weight: 900; color: #c5a059;">
            <span style="font-size: 14px; vertical-align: super; margin-right: 2px;">Q</span>${Number(product.price || 0).toFixed(2)}
          </div>
        </div>
        
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
          <div style="display: flex; gap: 4px;">${colorSwatches}</div>
          <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">Disponibilidad de Color</span>
        </div>

        ${typesList ? `
          <div style="display: flex; align-items: center; gap: 8px;">
             <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Modelos:</span>
             <span style="font-size: 12px; color: #1e293b; font-weight: 600;">${typesList}</span>
          </div>
        ` : ''}
      </div>
    `;
    list.appendChild(item);
  }

  container.appendChild(list);

  // 4. Add Footer
  const footer = document.createElement('div');
  footer.style.marginTop = '40px';
  footer.style.textAlign = 'center';
  footer.style.fontSize = '12px';
  footer.style.color = '#94a3b8';
  footer.style.fontWeight = '600';
  footer.innerHTML = `&copy; ${new Date().getFullYear()} Perflo-Plast. Industria de Plástico. Todos los derechos reservados.`;
  container.appendChild(footer);

  document.body.appendChild(container);

  try {
    // 5. Capture with html2canvas
    const canvas = await html2canvas(container, {
      scale: 2, // Retína quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // 6. Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Handle multi-page if content is too long
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`Catálogo_Perflo_Plast_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (err) {
    console.error("PDF Generation Error:", err);
    alert("Error al generar el PDF. Por favor intenta de nuevo.");
  } finally {
    document.body.removeChild(container);
  }
};
