import { slugify } from './download';

// ── Geração de PDF Oficial ──
// O jsPDF (~400 KB) só é carregado quando alguém gera um PDF.
export async function generatePDF(title, text) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, M = 18, CW = W - M * 2;
  let y = 0;
  const checkPage = (needed) => {
    if (y + needed > 275) {
      doc.addPage();
      y = M;
    }
  };

  // Header institucional
  doc.setFillColor(21, 36, 28);
  doc.rect(0, 0, W, 26, 'F');
  doc.setDrawColor(46, 139, 87);
  doc.setLineWidth(0.6);
  doc.line(0, 26, W, 26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('AGROBOT · LAUDO E PRESCRIÇÃO TÉCNICA', M, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 220, 205);
  doc.text('Inteligência Agronômica Tropical', M, 18);

  const dateStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(dateStr, W - M, 18, { align: 'right' });
  y = 36;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(18, 26, 21);
  doc.text(title, M, y);
  y += 2;
  doc.setDrawColor(220, 227, 216);
  doc.setLineWidth(0.3);
  doc.line(M, y + 2, W - M, y + 2);
  y += 9;

  const clean = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#{1,3}\s/gm, '');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 50, 42);

  const lines = doc.splitTextToSize(clean, CW);
  lines.forEach((line) => {
    checkPage(5.5);
    doc.text(line, M, y);
    y += 5.2;
  });

  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 125, 115);
    doc.text(
      `AgroBot · Documento Técnico de Apoio · Página ${i} de ${total}`,
      W / 2,
      290,
      { align: 'center' }
    );
  }
  doc.save(`agrobot_laudo_${slugify(title) || 'documento'}.pdf`);
}
