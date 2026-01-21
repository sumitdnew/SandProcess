import jsPDF from 'jspdf';
import { Delivery } from '../types';

const COMPANY_INFO = {
  name: 'Sand Process Management Co.',
  address: 'Vaca Muerta Industrial Park, Neuquén, Argentina',
  phone: '+54 299 XXX-XXXX',
  email: 'logistics@sandprocess.com.ar',
  website: 'www.sandprocess.com.ar',
};

const generateTraceabilityPDF = (delivery: Delivery): void => {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  // Header bar
  doc.setFillColor(25, 118, 210);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('TRACEABILITY REPORT', margin, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.name, margin, 26);

  y = 45;
  doc.setTextColor(0, 0, 0);

  // Order / delivery summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Delivery Summary', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const lines = [
    `Order Number: ${delivery.orderNumber}`,
    `Customer: ${delivery.customerName}`,
    `Truck: ${delivery.truckLicensePlate}`,
    `Driver: ${delivery.driverName}`,
    `Route: ${delivery.route?.quarry?.name || 'Quarry'} → ${delivery.route?.well?.name || 'Well Site'}`,
    `Delivery Date: ${new Date(delivery.createdAt).toLocaleString()}`,
  ];

  lines.forEach(line => {
    doc.text(line, margin, y);
    y += 5;
  });

  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Checkpoints table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Checkpoints', margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFillColor(240, 248, 255);
  const tableStartY = y;
  doc.rect(margin, tableStartY, pageWidth - 2 * margin, 8, 'F');
  doc.text('Time', margin + 2, tableStartY + 5);
  doc.text('Name', margin + 40, tableStartY + 5);
  doc.text('Type', margin + 100, tableStartY + 5);
  doc.text('Location', margin + 135, tableStartY + 5);

  y = tableStartY + 10;
  doc.setFont('helvetica', 'normal');

  (delivery.checkpoints || []).forEach((cp, index) => {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = margin;
    }
    const time = cp.timestamp ? new Date(cp.timestamp).toLocaleTimeString() : 'N/A';
    const loc =
      cp.location && cp.location.lat !== undefined && cp.location.lng !== undefined
        ? `${cp.location.lat.toFixed(3)}, ${cp.location.lng.toFixed(3)}`
        : 'N/A';

    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y - 4, pageWidth - 2 * margin, 6, 'F');
    }

    doc.text(time, margin + 2, y);
    doc.text(cp.name || `Checkpoint ${index + 1}`, margin + 40, y);
    doc.text(cp.type || 'N/A', margin + 100, y);
    doc.text(loc, margin + 135, y);

    y += 6;
  });

  y += 4;

  // Signature info
  if (y > pageHeight - 50) {
    doc.addPage();
    y = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Delivery Confirmation', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const sig = delivery.signature;
  if (sig) {
    doc.text(`Signer: ${sig.signerName || ''} (${sig.signerTitle || ''})`, margin, y);
    y += 5;
    doc.text(`Signed At: ${sig.timestamp ? new Date(sig.timestamp).toLocaleString() : 'N/A'}`, margin, y);
    y += 5;
    if (sig.location?.lat !== undefined && sig.location?.lng !== undefined) {
      doc.text(
        `Signature Location: ${sig.location.lat.toFixed(3)}, ${sig.location.lng.toFixed(3)}`,
        margin,
        y,
      );
      y += 5;
    }
  } else {
    doc.text('No signature information recorded for this delivery.', margin, y);
    y += 5;
  }

  // Footer
  y = pageHeight - 20;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Traceability report for order ${delivery.orderNumber} • Generated ${new Date().toLocaleString()}`,
    pageWidth / 2,
    y,
    { align: 'center' },
  );

  doc.save(`Traceability-Report-${delivery.orderNumber}.pdf`);
};

export default generateTraceabilityPDF;


