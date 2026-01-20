import jsPDF from 'jspdf';
import { msasApi } from '../services/api';

// Company information constant
const COMPANY_INFO = {
  name: 'Sand Process Management Co.',
  legalName: 'Sand Process Management Company S.A.',
  address: 'Vaca Muerta Industrial Park, Neuquén, Argentina',
  taxId: 'CUIT: 30-XXXXXXXX-X',
  representative: 'Juan Carlos Pérez',
  title: 'General Manager',
};

const generateMSAPDF = async (msaId: string): Promise<void> => {
  // Fetch MSA data from Supabase
  const msa = await msasApi.getById(msaId);
  
  if (!msa) {
    throw new Error('MSA not found');
  }

  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper to check if we need a new page
  const checkPageBreak = (spaceNeeded: number = 20) => {
    if (yPosition + spaceNeeded > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper to add text with word wrap
  const addText = (text: string, fontSize: number = 10, style: 'normal' | 'bold' = 'normal', maxWidth?: number) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    const lines = doc.splitTextToSize(text, maxWidth || pageWidth - 2 * margin);
    lines.forEach((line: string) => {
      checkPageBreak();
      doc.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    });
  };

  const addSection = (title: string, content: string) => {
    checkPageBreak(30);
    yPosition += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, yPosition);
    yPosition += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(content, pageWidth - 2 * margin);
    lines.forEach((line: string) => {
      checkPageBreak();
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 3;
  };

  // Title Page
  yPosition = pageHeight / 3;
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('MASTER SERVICE AGREEMENT', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`Agreement No: ${msa.msaNumber || `MSA-${msa.id.substring(0, 8).toUpperCase()}`}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;
  doc.text(`Date: ${new Date(msa.startDate).toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  doc.setFontSize(12);
  doc.text('BETWEEN', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.legalName, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;
  doc.setFont('helvetica', 'normal');
  doc.text('("Service Provider")', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  doc.text('AND', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFont('helvetica', 'bold');
  doc.text(msa.customerName, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;
  doc.setFont('helvetica', 'normal');
  doc.text('("Customer")', pageWidth / 2, yPosition, { align: 'center' });

  // New page for content
  doc.addPage();
  yPosition = margin;

  // Header
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const msaNumber = msa.msaNumber || `MSA-${msa.id.substring(0, 8).toUpperCase()}`;
  doc.text(`MSA No: ${msaNumber}`, margin, yPosition);
  doc.text(`Page 2 of 5`, pageWidth - margin - 20, yPosition);
  yPosition += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // 1. Parties
  addSection(
    '1. PARTIES',
    `This Master Service Agreement ("Agreement") is entered into as of ${new Date(msa.startDate).toLocaleDateString()} ("Effective Date") by and between ${COMPANY_INFO.legalName}, a company organized under the laws of Argentina with tax ID ${COMPANY_INFO.taxId} ("Service Provider"), and ${msa.customerName} ("Customer").`
  );

  // 2. Services
  addSection(
    '2. SERVICES',
    `Service Provider agrees to provide sand processing and delivery services to Customer as specified in individual Purchase Orders issued under this Agreement. Services include but are not limited to: sand extraction, washing, screening, quality testing, packaging, and delivery to Customer-specified locations within Vaca Muerta region.`
  );

  // 3. Term
  addSection(
    '3. TERM AND TERMINATION',
    `This Agreement shall commence on ${new Date(msa.startDate).toLocaleDateString()} and continue until ${new Date(msa.endDate).toLocaleDateString()} ("Initial Term"), unless earlier terminated as provided herein. Either party may terminate this Agreement with 30 days written notice. Termination shall not affect obligations under existing Purchase Orders.`
  );

  // 4. Pricing
  addSection(
    '4. PRICING AND PAYMENT',
    `Pricing for services shall be as specified in individual Purchase Orders. Payment terms: ${msa.paymentTerms}. Interest on overdue amounts shall accrue at 2% per month. Customer shall pay all applicable taxes except those based on Service Provider's income.`
  );

  // 5. Quality Standards
  addSection(
    '5. QUALITY STANDARDS',
    `All sand products shall meet industry specifications for mesh size, purity (≥95%), roundness (≥0.80), and moisture content (≤1.0%). Service Provider shall provide Quality Control certificates for each lot. Customer has 48 hours from delivery to report quality issues.`
  );

  // New page
  doc.addPage();
  yPosition = margin;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`MSA No: ${msaNumber}`, margin, yPosition);
  doc.text(`Page 3 of 5`, pageWidth - margin - 20, yPosition);
  yPosition += 10;
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // 6. Delivery
  addSection(
    '6. DELIVERY TERMS',
    `Service Provider shall deliver products to locations specified in Purchase Orders. Delivery times are estimates and Service Provider shall not be liable for delays beyond its reasonable control. Risk of loss transfers to Customer upon delivery and signature confirmation.`
  );

  // 7. Warranty
  addSection(
    '7. WARRANTIES',
    `Service Provider warrants that products shall conform to Quality Standards specified herein. EXCEPT AS EXPRESSLY PROVIDED, SERVICE PROVIDER MAKES NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.`
  );

  // 8. Limitation of Liability
  addSection(
    '8. LIMITATION OF LIABILITY',
    `Service Provider's total liability under this Agreement shall not exceed the amounts paid by Customer for the specific product or service giving rise to the claim. IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.`
  );

  // 9. Compliance
  addSection(
    '9. REGULATORY COMPLIANCE',
    `Service Provider shall comply with all applicable environmental, safety, and transportation regulations. Customer shall provide necessary permits and access for deliveries to well sites. Both parties shall maintain required insurance coverage.`
  );

  // 10. Confidentiality
  addSection(
    '10. CONFIDENTIALITY',
    `Each party agrees to maintain confidentiality of the other party's proprietary information, including pricing, technical specifications, and business operations. This obligation survives termination for 3 years.`
  );

  // New page
  doc.addPage();
  yPosition = margin;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`MSA No: ${msaNumber}`, margin, yPosition);
  doc.text(`Page 4 of 5`, pageWidth - margin - 20, yPosition);
  yPosition += 10;
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // 11. Force Majeure
  addSection(
    '11. FORCE MAJEURE',
    `Neither party shall be liable for failure to perform due to causes beyond reasonable control, including natural disasters, war, strikes, government actions, or pandemics. The affected party must notify the other party within 48 hours.`
  );

  // 12. Dispute Resolution
  addSection(
    '12. DISPUTE RESOLUTION',
    `Disputes shall first be resolved through good faith negotiations. If unresolved within 30 days, disputes shall be submitted to arbitration in Neuquén, Argentina under Argentine Commercial Arbitration Rules. The decision shall be final and binding.`
  );

  // 13. General Provisions
  addSection(
    '13. GENERAL PROVISIONS',
    `This Agreement constitutes the entire agreement between parties. Amendments must be in writing signed by both parties. This Agreement shall be governed by the laws of Argentina. If any provision is invalid, the remainder shall continue in effect. No waiver of any provision shall constitute a waiver of any other provision.`
  );

  // New page for signatures
  doc.addPage();
  yPosition = margin;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`MSA No: ${msaNumber}`, margin, yPosition);
  doc.text(`Page 5 of 5`, pageWidth - margin - 20, yPosition);
  yPosition += 10;
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 20;

  // Signature Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURES', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.', margin, yPosition);
  yPosition += 20;

  // Service Provider Signature
  doc.setFont('helvetica', 'bold');
  doc.text('SERVICE PROVIDER:', margin, yPosition);
  yPosition += 10;

  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.legalName, margin, yPosition);
  yPosition += 15;

  doc.text('Signature: ________________________________', margin, yPosition);
  yPosition += 10;

  doc.text(`Name: ${COMPANY_INFO.representative}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Title: ${COMPANY_INFO.title}`, margin, yPosition);
  yPosition += 7;
  doc.text('Date: _______________', margin, yPosition);
  yPosition += 25;

  // Customer Signature
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER:', margin, yPosition);
  yPosition += 10;

  doc.setFont('helvetica', 'normal');
  doc.text(msa.customerName, margin, yPosition);
  yPosition += 15;

  doc.text('Signature: ________________________________', margin, yPosition);
  yPosition += 10;

  doc.text('Name: ___________________________', margin, yPosition);
  yPosition += 7;
  doc.text('Title: ___________________________', margin, yPosition);
  yPosition += 7;
  doc.text('Date: _______________', margin, yPosition);

  // Footer
  yPosition = pageHeight - 20;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('This is a legally binding agreement. Please review carefully before signing.', pageWidth / 2, yPosition, { align: 'center' });

  // Download
  doc.save(`MSA-${msaNumber}.pdf`);
};

export default generateMSAPDF;
