import jsPDF from 'jspdf';
import { QCTest } from '../types';
import i18n from '../i18n/config';

interface CertificateData {
  test: QCTest;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

const pdf = (key: string) => i18n.t(`modules.quality.pdf.${key}`);

export const generateQCCertificatePDF = (data: CertificateData) => {
  const { test, companyInfo } = data;
  const doc = new jsPDF();

  const locale = i18n.language?.split('-')[0] === 'es' ? 'es-AR' : 'en-US';

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  const addText = (text: string, x: number, fontSize: number = 12, style: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    doc.text(text, x, yPosition);
    yPosition += fontSize * 0.5;
  };

  const addLine = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
  };

  doc.setDrawColor(25, 118, 210);
  doc.setLineWidth(1);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  doc.setTextColor(240, 240, 240);
  doc.setFontSize(60);
  doc.setFont('helvetica', 'bold');
  doc.text(pdf('watermarkCertified'), pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: 45,
  });
  doc.setTextColor(0, 0, 0);

  yPosition = 25;
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(25, 118, 210);
  doc.text(pdf('title'), pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(pdf('subtitle'), pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  doc.setTextColor(0, 0, 0);

  doc.setFillColor(240, 248, 255);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 15, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${pdf('certificateNo')} ${test.certificateId}`, pageWidth / 2, yPosition + 10, { align: 'center' });
  yPosition += 25;

  addLine();

  yPosition += 5;
  addText(pdf('issuedBy'), margin, 10, 'bold');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(companyInfo.name, margin, yPosition);
  yPosition += 5;
  doc.text(companyInfo.address, margin, yPosition);
  yPosition += 5;
  doc.text(
    i18n.t('modules.quality.pdf.phoneEmail', { phone: companyInfo.phone, email: companyInfo.email }),
    margin,
    yPosition
  );
  yPosition += 10;

  addLine();

  yPosition += 5;
  addText(pdf('productInformation'), margin, 12, 'bold');
  yPosition += 3;

  const productInfo: [string, string][] = [
    [pdf('productLabel'), test.productName],
    [pdf('lotNumberLabel'), test.lotNumber],
    [
      pdf('testDateLabel'),
      test.testDate ? new Date(test.testDate).toLocaleDateString(locale) : pdf('na'),
    ],
    [pdf('orderNumberLabel'), test.orderNumber || pdf('standaloneTest')],
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

  yPosition += 5;
  addText(pdf('testResults'), margin, 12, 'bold');
  yPosition += 8;

  doc.setFillColor(240, 248, 255);
  doc.rect(margin, yPosition - 6, pageWidth - 2 * margin, 10, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(pdf('colParameter'), margin + 5, yPosition);
  doc.text(pdf('colMeasuredValue'), margin + 80, yPosition);
  doc.text(pdf('colSpecification'), margin + 130, yPosition);
  doc.text(pdf('colResult'), margin + 160, yPosition);
  yPosition += 8;

  if (test.results) {
    const results = [
      {
        parameter: pdf('paramMeshSize'),
        value: test.results.meshSize.value,
        spec: test.results.meshSize.value,
        passed: test.results.meshSize.passed,
      },
      {
        parameter: pdf('paramPurity'),
        value: test.results.purity.value.toFixed(2) + '%',
        spec: pdf('specPurity'),
        passed: test.results.purity.passed,
      },
      {
        parameter: pdf('paramRoundness'),
        value: test.results.roundness.value.toFixed(2),
        spec: pdf('specRoundness'),
        passed: test.results.roundness.passed,
      },
      {
        parameter: pdf('paramMoisture'),
        value: test.results.moisture.value.toFixed(2) + '%',
        spec: pdf('specMoisture'),
        passed: test.results.moisture.passed,
      },
    ];

    doc.setFont('helvetica', 'normal');
    results.forEach((result, index) => {
      if (index % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPosition - 6, pageWidth - 2 * margin, 8, 'F');
      }

      doc.text(result.parameter, margin + 5, yPosition);
      doc.text(result.value, margin + 80, yPosition);
      doc.text(result.spec, margin + 130, yPosition);

      if (result.passed) {
        doc.setTextColor(46, 125, 50);
        doc.setFont('helvetica', 'bold');
        doc.text(pdf('pass'), margin + 160, yPosition);
      } else {
        doc.setTextColor(211, 47, 47);
        doc.setFont('helvetica', 'bold');
        doc.text(pdf('fail'), margin + 160, yPosition);
      }
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');

      yPosition += 8;
    });
  }

  yPosition += 10;
  addLine();

  yPosition += 5;
  const allPassed =
    test.results &&
    test.results.meshSize.passed &&
    test.results.purity.passed &&
    test.results.roundness.passed &&
    test.results.moisture.passed;

  if (allPassed) {
    doc.setFillColor(232, 245, 233);
    doc.rect(margin, yPosition - 6, pageWidth - 2 * margin, 15, 'F');
    doc.setTextColor(46, 125, 50);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(pdf('meetsStandards'), pageWidth / 2, yPosition + 5, { align: 'center' });
  } else {
    doc.setFillColor(255, 235, 238);
    doc.rect(margin, yPosition - 6, pageWidth - 2 * margin, 15, 'F');
    doc.setTextColor(211, 47, 47);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(pdf('notMeetStandards'), pageWidth / 2, yPosition + 5, { align: 'center' });
  }

  doc.setTextColor(0, 0, 0);
  yPosition += 25;

  yPosition += 10;
  addLine();
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text(pdf('qcTechnician'), margin, yPosition);
  doc.line(margin + 50, yPosition, margin + 100, yPosition);
  yPosition += 5;
  doc.setFontSize(8);
  doc.text(pdf('signatureDate'), margin + 50, yPosition);

  doc.setFontSize(10);
  yPosition -= 5;
  doc.text(pdf('qcManager'), pageWidth - margin - 100, yPosition);
  doc.line(pageWidth - margin - 50, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;
  doc.setFontSize(8);
  doc.text(pdf('signatureDate'), pageWidth - margin - 50, yPosition);

  yPosition += 15;

  yPosition = pageHeight - 30;
  addLine();
  yPosition += 5;

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(pdf('footer1'), pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  doc.text(pdf('footer2'), pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  doc.text(
    `${pdf('generated')} ${new Date().toLocaleString(locale)}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );

  doc.save(`QC-Certificate-${test.certificateId}.pdf`);
};

export default generateQCCertificatePDF;
