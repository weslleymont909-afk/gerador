import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type ParsedData, type ProductItem } from './types';

const formatCurrency = (value: number) => {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
};

export function generatePdf(
  data: ParsedData, 
  options: { orderDate: Date; paymentMethod: string; frete: number }
) {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // --- HEADER ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('PRÉ-ORÇAMENTO', pageWidth / 2, margin + 5, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(margin, margin + 10, pageWidth - margin, margin + 10);

  // Customer Info Box
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const customerInfoY = margin + 18;
  const infoHeight = 40;
  doc.rect(margin, customerInfoY, pageWidth - margin * 2, infoHeight);
  
  const col1X = margin + 3;
  const col2X = margin + 100;

  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', col1X, customerInfoY + 7);
  doc.text('Fone:', col1X, customerInfoY + 14);
  doc.text('Endereço:', col1X, customerInfoY + 21);
  doc.text('Data do pedido:', col2X, customerInfoY + 7);
  doc.text('Forma de pgto:', col2X, customerInfoY + 14);
  doc.text('Frete:', col2X, customerInfoY + 21);

  doc.setFont('helvetica', 'normal');
  doc.text(data.customer.name, col1X + 18, customerInfoY + 7);
  doc.text(data.customer.phone, col1X + 12, customerInfoY + 14);
  doc.text(data.customer.address, col1X + 22, customerInfoY + 21, { maxWidth: 80 });

  doc.text(format(options.orderDate, 'dd/MM/yyyy', { locale: ptBR }), col2X + 35, customerInfoY + 7);
  doc.text(options.paymentMethod, col2X + 35, customerInfoY + 14);
  doc.text(formatCurrency(options.frete), col2X + 35, customerInfoY + 21);

  let currentY = customerInfoY + infoHeight + 10;
  
  const drawTableSection = (title: string, products: ProductItem[]) => {
    if (products.length === 0) return;
    // Section Header
    doc.setFillColor(173, 216, 230); // lightblue
    doc.rect(margin, currentY, pageWidth - margin * 2, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(title, margin + 2, currentY + 6);
    currentY += 8;
  
    // Prepare table data
    const body = products.map((p, index) => [
      index + 1,
      `${p.name} / ${p.size}`,
      p.quantity,
      formatCurrency(p.unitPrice),
      formatCurrency(p.totalPrice),
    ]);
  
    autoTable(doc, {
      startY: currentY,
      head: [['ITEM', 'PRODUTOS / NÚMEROS', 'QUANTIDADE', 'R$ un.', 'Total']],
      body: body,
      theme: 'grid',
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: 0,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: 0,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 18 }, // ITEM
        1: { cellWidth: 'auto' }, // PRODUTOS
        2: { halign: 'center', cellWidth: 30 }, // QTD
        3: { halign: 'right', cellWidth: 35 }, // R$ un.
        4: { halign: 'right', cellWidth: 35 }, // Total
      },
    });
  
    currentY = (doc as any).lastAutoTable.finalY;
  };

  const catProducts = data.products.filter(p => p.type === 'GATO');
  const dogProducts = data.products.filter(p => p.type === 'CÃO');
  const otherProducts = data.products.filter(p => p.type === 'UNKNOWN');


  if (catProducts.length > 0) {
    drawTableSection('GATO', catProducts);
    currentY += 5;
  }

  if (dogProducts.length > 0) {
    drawTableSection('CÃO', dogProducts);
    currentY += 5;
  }
  
  if (otherProducts.length > 0) {
    drawTableSection('OUTROS', otherProducts);
    currentY += 5;
  }
  
  // Recalculate total from products
  const calculatedSubtotal = data.products.reduce((sum, p) => sum + p.totalPrice, 0);
  const finalTotal = calculatedSubtotal + options.frete;

  // --- FOOTER ---
  let footerY = Math.max(currentY + 10, pageHeight - 50);
  if (footerY > pageHeight - 50) {
    doc.addPage();
    footerY = margin;
  }
  
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  const totalY = footerY + 10;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total geral:', margin, totalY);
  doc.text(formatCurrency(finalTotal), margin + 35, totalY);

  const diffX = pageWidth - margin - 80;
  doc.rect(diffX, footerY + 3, 75, 20); // Increased height of the box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Diferença em cima do valor original:', diffX + 2, footerY + 8);
  doc.setFont('helvetica', 'normal');
  const difference = finalTotal - data.subtotal;
  doc.text(formatCurrency(difference), diffX + 2, footerY + 14, {maxWidth: 70});


  doc.save('pre-orcamento.pdf');
}
