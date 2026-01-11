import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type ParsedData, type ProductItem } from './types';

// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

const formatCurrency = (value: number) => {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
};

export function generatePdf(
  data: ParsedData, 
  options: { orderDate: Date; paymentMethod: string; notes: string }
) {
  const doc = new jsPDF() as jsPDFWithAutoTable;
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
  doc.text('Anotações:', col2X, customerInfoY + 21);

  doc.setFont('helvetica', 'normal');
  doc.text(data.customer.name, col1X + 18, customerInfoY + 7);
  doc.text(data.customer.phone, col1X + 12, customerInfoY + 14);
  doc.text(data.customer.address, col1X + 22, customerInfoY + 21, { maxWidth: 80 });

  doc.text(format(options.orderDate, 'dd/MM/yyyy', { locale: ptBR }), col2X + 35, customerInfoY + 7);
  doc.text(options.paymentMethod, col2X + 35, customerInfoY + 14);
  doc.text(options.notes, col2X + 35, customerInfoY + 21);

  let currentY = customerInfoY + infoHeight + 10;
  
  const drawTableSection = (title: string, products: ProductItem[], totalRows: number) => {
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
      ''
    ]);
  
    // Pad with empty rows
    while (body.length < totalRows) {
      body.push(['', '', '0', formatCurrency(0), formatCurrency(0), '']);
    }
  
    doc.autoTable({
      startY: currentY,
      head: [['ITEM', 'PRODUTOS / NÚMEROS', 'QUANTIDADE', 'R$ un.', 'Total', 'OK']],
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
        5: { halign: 'center', cellWidth: 15 }, // OK
      },
      didDrawCell: (data) => {
        if (data.column.dataKey === 5 && data.cell.section === 'body') {
          doc.setDrawColor(0);
          doc.rect(data.cell.x + 4, data.cell.y + 4, 7, 7);
        }
      },
    });
  
    currentY = (doc as any).lastAutoTable.finalY;
  };

  const catProducts = data.products.filter(p => p.type === 'GATO');
  const dogProducts = data.products.filter(p => p.type === 'CÃO');

  if (catProducts.length > 0) {
    drawTableSection('GATO', catProducts, 4);
    currentY += 5;
  }

  if (dogProducts.length > 0) {
    drawTableSection('CÃO', dogProducts, 9);
    currentY += 5;
  }
  
  // --- FOOTER ---
  const footerY = Math.max(currentY + 10, pageHeight - 50);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Total geral:', margin, footerY + 10);
  doc.text(formatCurrency(data.subtotal), margin + 30, footerY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Observação: "Frete separado"', margin, footerY + 20);

  const diffX = pageWidth - margin - 80;
  doc.rect(diffX, footerY + 3, 75, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Diferença em cima do valor original:', diffX + 2, footerY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCurrency(0), diffX + 2, footerY + 18, {maxWidth: 70});

  doc.save('pre-orcamento.pdf');
}
