import jsPDF from 'jspdf';
import { QCTest } from '../types';

interface CertificateData {
  test: QCTest;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export const generateQCCertificatePDF = (data: CertificateData) => {
  const { test, companyInfo } = data;
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add text
  const addText = (text: string, x: number, fontSize: number = 12, style: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    doc.text(text, x, yPosition);
    yPosition += fontSize * 0.5;
  };

  // Helper function to add line
  const addLine = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
  };

  // Add border
  doc.setDrawColor(25, 118, 210); // Primary blue
  doc.setLineWidth(1);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Add watermark (optional)
  doc.setTextColor(240, 240, 240);
  doc.setFontSize(60);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFIED', pageWidth / 2, pageHeight / 2, { 
    align: 'center',
    angle: 45 
  });
  doc.setTextColor(0, 0, 0); // Reset to black

  // Header
  yPosition = 25;
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(25, 118, 210); // Primary blue
  doc.text('QUALITY CONTROL CERTIFICATE', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Sand Processing & Quality Assurance', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  doc.setTextColor(0, 0, 0); // Reset to black

  // Certificate Number Box
  doc.setFillColor(240, 248, 255); // Light blue background
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 15, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Certificate No: ${test.certificateId}`, pageWidth / 2, yPosition + 10, { align: 'center' });
  yPosition += 25;

  addLine();

  // Company Information
  yPosition += 5;
  addText('ISSUED BY:', margin, 10, 'bold');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(companyInfo.name, margin, yPosition);
  yPosition += 5;
  doc.text(companyInfo.address, margin, yPosition);
  yPosition += 5;
  doc.text(`Phone: ${companyInfo.phone} | Email: ${companyInfo.email}`, margin, yPosition);
  yPosition += 10;

  addLine();

  // Product Information
  yPosition += 5;
  addText('PRODUCT INFORMATION', margin, 12, 'bold');
  yPosition += 3;

  const productInfo = [
    ['Product:', test.productName],
    ['Lot Number:', test.lotNumber],
    ['Test Date:', test.testDate ? new Date(test.testDate).toLocaleDateString() : 'N/A'],
    ['Order Number:', test.orderNumber || 'Standalone Test'],
  ];

  doc.setFontSize(11);
  productInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 50, yPosition);
    yPosition += 6;
  });

  yPosition += 5;
  addLine();

  // Test Results
  yPosition += 5;
  addText('TEST RESULTS', margin, 12, 'bold');
  yPosition += 8;

  // Table header
  doc.setFillColor(240, 248, 255);
  doc.rect(margin, yPosition - 6, pageWidth - 2 * margin, 10, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Parameter', margin + 5, yPosition);
  doc.text('Measured Value', margin + 80, yPosition);
  doc.text('Specification', margin + 130, yPosition);
  doc.text('Result', margin + 160, yPosition);
  yPosition += 8;

  // Table rows
  if (test.results) {
    const results = [
      {
        parameter: 'Mesh Size',
        value: test.results.meshSize.value,
        spec: test.results.meshSize.value, // Should come from product spec
        passed: test.results.meshSize.passed,
      },
      {
        parameter: 'Purity (%)',
        value: test.results.purity.value.toFixed(2) + '%',
        spec: '≥ 95%',
        passed: test.results.purity.passed,
      },
      {
        parameter: 'Roundness',
        value: test.results.roundness.value.toFixed(2),
        spec: '≥ 0.80',
        passed: test.results.roundness.passed,
      },
      {
        parameter: 'Moisture (%)',
        value: test.results.moisture.value.toFixed(2) + '%',
        spec: '≤ 1.0%',
        passed: test.results.moisture.passed,
      },
    ];

    doc.setFont('helvetica', 'normal');
    results.forEach((result, index) => {
      // Alternate row background
      if (index % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPosition - 6, pageWidth - 2 * margin, 8, 'F');
      }

      doc.text(result.parameter, margin + 5, yPosition);
      doc.text(result.value, margin + 80, yPosition);
      doc.text(result.spec, margin + 130, yPosition);
      
      // Result with color
      if (result.passed) {
        doc.setTextColor(46, 125, 50); // Green
        doc.setFont('helvetica', 'bold');
        doc.text('PASS', margin + 160, yPosition);
      } else {
        doc.setTextColor(211, 47, 47); // Red
        doc.setFont('helvetica', 'bold');
        doc.text('FAIL', margin + 160, yPosition);
      }
      doc.setTextColor(0, 0, 0); // Reset
      doc.setFont('helvetica', 'normal');
      
      yPosition += 8;
    });
  }

  yPosition += 10;
  addLine();

  // Overall Result
  yPosition += 5;
  const allPassed = test.results && 
    test.results.meshSize.passed && 
    test.results.purity.passed && 
    test.results.roundness.passed && 
    test.results.moisture.passed;

  if (allPassed) {
    doc.setFillColor(232, 245, 233); // Light green
    doc.rect(margin, yPosition - 6, pageWidth - 2 * margin, 15, 'F');
    doc.setTextColor(46, 125, 50); // Green
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ PRODUCT MEETS ALL QUALITY STANDARDS', pageWidth / 2, yPosition + 5, { align: 'center' });
  } else {
    doc.setFillColor(255, 235, 238); // Light red
    doc.rect(margin, yPosition - 6, pageWidth - 2 * margin, 15, 'F');
    doc.setTextColor(211, 47, 47); // Red
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('✗ PRODUCT DOES NOT MEET QUALITY STANDARDS', pageWidth / 2, yPosition + 5, { align: 'center' });
  }
  
  doc.setTextColor(0, 0, 0); // Reset
  yPosition += 25;

  // Signature section
  yPosition += 10;
  addLine();
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // QC Technician signature
  doc.text('QC Technician:', margin, yPosition);
  doc.line(margin + 50, yPosition, margin + 100, yPosition);
  yPosition += 5;
  doc.setFontSize(8);
  doc.text('Signature & Date', margin + 50, yPosition);
  
  // QC Manager signature
  doc.setFontSize(10);
  yPosition -= 5;
  doc.text('QC Manager:', pageWidth - margin - 100, yPosition);
  doc.line(pageWidth - margin - 50, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;
  doc.setFontSize(8);
  doc.text('Signature & Date', pageWidth - margin - 50, yPosition);

  yPosition += 15;

  // Footer
  yPosition = pageHeight - 30;
  addLine();
  yPosition += 5;
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('This certificate is valid only for the lot number specified above.', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  doc.text('Certificate generated electronically and is valid without signature.', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });

  // Download
  doc.save(`QC-Certificate-${test.certificateId}.pdf`);
};

export default generateQCCertificatePDF;