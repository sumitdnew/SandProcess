import jsPDF from 'jspdf';
import { Order } from '../types';

interface POData {
  order: Order;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId: string;
    website?: string;
  };
}

export const generatePurchaseOrderPDF = (data: POData) => {
  const { order, companyInfo } = data;
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Header Section with Company Logo Area
  doc.setFillColor(25, 118, 210); // Primary blue
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(companyInfo.name, margin, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(companyInfo.address, margin, 28);
  doc.text(`Phone: ${companyInfo.phone} | Email: ${companyInfo.email}`, margin, 34);

  // PO Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PURCHASE ORDER', pageWidth - margin, 25, { align: 'right' });

  yPosition = 50;
  doc.setTextColor(0, 0, 0);

  // PO Number Box
  doc.setFillColor(240, 248, 255);
  doc.rect(pageWidth - 80, yPosition, 60, 30, 'F');
  doc.setDrawColor(25, 118, 210);
  doc.rect(pageWidth - 80, yPosition, 60, 30);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PO Number:', pageWidth - 75, yPosition + 10);
  doc.setFontSize(14);
  doc.text(order.orderNumber, pageWidth - 75, yPosition + 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Date:', pageWidth - 75, yPosition + 27);
  doc.text(new Date(order.createdAt).toLocaleDateString(), pageWidth - 45, yPosition + 27);

  yPosition += 40;

  // Vendor and Customer Information Side by Side
  const leftColumn = margin;
  const rightColumn = pageWidth / 2 + 10;

  // Vendor (From)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM (VENDOR):', leftColumn, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(companyInfo.name, leftColumn, yPosition);
  yPosition += 5;
  doc.text(companyInfo.address, leftColumn, yPosition);
  yPosition += 5;
  doc.text(`Tax ID: ${companyInfo.taxId}`, leftColumn, yPosition);
  yPosition += 5;
  doc.text(`Phone: ${companyInfo.phone}`, leftColumn, yPosition);
  yPosition += 5;
  doc.text(`Email: ${companyInfo.email}`, leftColumn, yPosition);

  // Customer (Bill To)
  yPosition = yPosition - 25; // Reset to same height as vendor
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TO (CUSTOMER):', rightColumn, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(order.customerName, rightColumn, yPosition);
  yPosition += 5;
  doc.text(order.deliveryLocation, rightColumn, yPosition);
  yPosition += 5;
  if (order.msaId) {
    doc.text(`MSA: ${order.msaId}`, rightColumn, yPosition);
    yPosition += 5;
  }

  yPosition = Math.max(yPosition + 15, 140);

  // Delivery Information
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 25, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DELIVERY INFORMATION', margin + 5, yPosition + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Delivery Location: ${order.deliveryLocation}`, margin + 5, yPosition + 15);
  doc.text(`Delivery Date: ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'TBD'}`, margin + 5, yPosition + 21);

  yPosition += 35;

  // Line Items Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDER DETAILS', margin, yPosition);
  yPosition += 8;

  // Table Header
  doc.setFillColor(25, 118, 210);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');

  doc.setFontSize(10);
  doc.text('Item', margin + 3, yPosition + 7);
  doc.text('Description', margin + 15, yPosition + 7);
  doc.text('Quantity', margin + 90, yPosition + 7);
  doc.text('Unit', margin + 115, yPosition + 7);
  doc.text('Unit Price', margin + 135, yPosition + 7);
  doc.text('Amount', pageWidth - margin - 25, yPosition + 7, { align: 'right' });

  yPosition += 10;
  doc.setTextColor(0, 0, 0);

  // Table Rows
  let itemNumber = 1;
  let subtotal = 0;

  if (order.products && order.products.length > 0) {
    order.products.forEach((product, index) => {
      const rowHeight = 12;
      
      // Alternate row background
      if (index % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, rowHeight, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      const unitPrice = product.unitPrice || 0;
      const amount = product.quantity * unitPrice;
      subtotal += amount;

      doc.text(String(itemNumber), margin + 3, yPosition + 8);
      doc.text(product.productName, margin + 15, yPosition + 8);
      doc.text(String(product.quantity), margin + 90, yPosition + 8);
      doc.text('tons', margin + 115, yPosition + 8);
      doc.text(`$${unitPrice.toLocaleString()}`, margin + 135, yPosition + 8);
      doc.text(`$${amount.toLocaleString()}`, pageWidth - margin - 5, yPosition + 8, { align: 'right' });

      yPosition += rowHeight;
      itemNumber++;
    });
  }

  // Draw table borders
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, yPosition - (itemNumber - 1) * 12, pageWidth - 2 * margin, (itemNumber - 1) * 12);

  yPosition += 10;

  // Totals Section
  const totalsX = pageWidth - margin - 60;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.text('Subtotal:', totalsX, yPosition);
  doc.text(`$${subtotal.toLocaleString()}`, pageWidth - margin - 5, yPosition, { align: 'right' });
  yPosition += 7;

  const taxRate = 0; // Adjust as needed
  const taxAmount = subtotal * taxRate;
  if (taxRate > 0) {
    doc.text(`Tax (${(taxRate * 100).toFixed(0)}%):`, totalsX, yPosition);
    doc.text(`$${taxAmount.toLocaleString()}`, pageWidth - margin - 5, yPosition, { align: 'right' });
    yPosition += 7;
  }

  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setFillColor(240, 248, 255);
  doc.rect(totalsX - 5, yPosition - 4, 65, 10, 'F');
  doc.text('TOTAL:', totalsX, yPosition + 3);
  doc.text(`$${order.totalAmount.toLocaleString()}`, pageWidth - margin - 5, yPosition + 3, { align: 'right' });

  yPosition += 20;

  // Terms and Conditions
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TERMS AND CONDITIONS:', margin, yPosition);
  yPosition += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const terms = [
    '• Payment Terms: Net 30 days',
    '• All products are subject to quality inspection upon delivery',
    '• Customer must report any quality issues within 48 hours of delivery',
    `• This Purchase Order is issued under MSA ${order.msaId || 'N/A'}`,
    '• Delivery times are estimates and subject to weather and road conditions',
    '• Risk of loss transfers to Customer upon delivery confirmation',
  ];

  terms.forEach(term => {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }
    const lines = doc.splitTextToSize(term, pageWidth - 2 * margin);
    lines.forEach((line: string) => {
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });
  });

  // Signature Section
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = margin;
  } else {
    yPosition += 10;
  }

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTHORIZED SIGNATURE:', margin, yPosition);
  yPosition += 15;

  doc.setFont('helvetica', 'normal');
  doc.text('Signature: ________________________________', margin, yPosition);
  yPosition += 10;
  doc.text('Name: _____________________________________', margin, yPosition);
  yPosition += 10;
  doc.text('Title: _____________________________________', margin, yPosition);
  yPosition += 10;
  doc.text('Date: _______________', margin, yPosition);

  // Customer Acceptance (if needed)
  yPosition += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER ACCEPTANCE (OPTIONAL):', margin, yPosition);
  yPosition += 15;

  doc.setFont('helvetica', 'normal');
  doc.text('Signature: ________________________________', margin, yPosition);
  yPosition += 10;
  doc.text('Name: _____________________________________', margin, yPosition);
  yPosition += 10;
  doc.text('Date: _______________', margin, yPosition);

  // Footer
  yPosition = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`PO ${order.orderNumber} | Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
  if (companyInfo.website) {
    yPosition += 4;
    doc.text(companyInfo.website, pageWidth / 2, yPosition, { align: 'center' });
  }

  // Download
  doc.save(`PurchaseOrder-${order.orderNumber}.pdf`);
};

export default generatePurchaseOrderPDF;