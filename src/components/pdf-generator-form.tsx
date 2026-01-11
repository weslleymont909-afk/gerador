"use client";

import { useTransition, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileDown, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DatePicker } from '@/components/ui/date-picker';
import { parseOrderText } from '@/lib/parser';
import { type ParsedData, type ProductItem } from '@/lib/types';


const formSchema = z.object({
  orderText: z.string().min(50, { message: 'O texto do pedido parece muito curto.' }),
  orderDate: z.date({ required_error: 'A data do pedido é obrigatória.' }),
  frete: z.coerce.number().min(0, { message: 'O frete não pode ser negativo.' }).default(0),
});

const exampleText = `Olá! Gostaria de fazer um pedido.

--- RESUMO DO PEDIDO ---
- 9x Roupa Cirúrgica para Cães (Tamanho 01) (Fêmea) - R$ 115,20
- 1x Roupa Cirúrgica para Cães (Tamanho 05) (Macho) - R$ 14,80
- 1x Roupa Cirúrgica para Gatos (Tamanho 00)  - R$ 12,80

Subtotal: R$ 187,20

--- DADOS PARA ENTREGA ---
Nome: Maria Exemplo
CPF: 999.888.777-66
Telefone: (21) 95555-4444
Endereço: Rua da Imaginação, 789
Bairro: Centro
Cidade/Estado: Rio de Janeiro/RJ
CEP: 54321-876`;

const formatCurrency = (value: number) => {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
};

async function generatePdf(formData: {
  orderText: string;
  orderDate: Date;
  frete: number;
}) {
  const data = parseOrderText(formData.orderText);
  const options = {
    orderDate: formData.orderDate,
    paymentMethod: 'Pix',
    frete: formData.frete,
  };
  
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
    doc.setFillColor(173, 216, 230); // lightblue
    doc.rect(margin, currentY, pageWidth - margin * 2, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(title, margin + 2, currentY + 6);
    currentY += 8;

    const body = products.map((p, index) => {
      const productName = p.gender ? `${p.name} (${p.gender})` : p.name;
      return [
        index + 1,
        `${productName} / ${p.size}`,
        p.quantity,
        formatCurrency(p.unitPrice),
        formatCurrency(p.totalPrice),
      ];
    });

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
        0: { halign: 'center', cellWidth: 18 },
        1: { cellWidth: 'auto' },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 35 },
        4: { halign: 'right', cellWidth: 35 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY;
  };

  const catProducts = data.products.filter(p => p.type === 'GATO');
  const dogProducts = data.products.filter(p => p.type === 'CÃO');
  const otherProducts = data.products.filter(p => p.type === 'UNKNOWN');

  if (catProducts.length > 0) { drawTableSection('GATO', catProducts); currentY += 5; }
  if (dogProducts.length > 0) { drawTableSection('CÃO', dogProducts); currentY += 5; }
  if (otherProducts.length > 0) { drawTableSection('OUTROS', otherProducts); currentY += 5; }

  const calculatedSubtotal = data.products.reduce((sum, p) => sum + p.totalPrice, 0);
  const finalTotal = calculatedSubtotal + options.frete;

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
  doc.rect(diffX, footerY + 3, 75, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Diferença em cima do valor original:', diffX + 2, footerY + 8);
  doc.setFont('helvetica', 'normal');
  const difference = finalTotal - data.subtotal;
  doc.text(formatCurrency(difference), diffX + 2, footerY + 14, { maxWidth: 70 });

  return doc.output('datauristring');
}


export function PdfGeneratorForm() {
  const { toast } = useToast();
  const [isGenerating, startGenerationTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderText: '',
      frete: 0,
      orderDate: new Date(),
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startGenerationTransition(async () => {
      try {
        const pdfBase64 = await generatePdf(values);
        
        const link = document.createElement('a');
        link.href = pdfBase64;
        link.download = 'pre-orcamento.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'PDF Gerado com Sucesso!',
          description: 'O download do seu pré-orçamento deve começar em breve.',
          variant: 'default',
        });
      } catch (e: any) {
        console.error('PDF Generation Failed:', e);
        toast({
          title: 'Erro ao Gerar PDF',
          description: e.message || 'Não foi possível interpretar o texto. Verifique o formato.',
          variant: 'destructive',
        });
      }
    });
  };

  if (!isMounted) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Detalhes do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="animate-pulse bg-muted h-8 w-1/3 rounded-md" />
            <div className="animate-pulse bg-muted h-40 w-full rounded-md" />
             <div className="grid md:grid-cols-2 gap-4">
               <div>
                  <div className="animate-pulse bg-muted h-8 w-1/4 rounded-md mb-2" />
                  <div className="animate-pulse bg-muted h-10 w-full rounded-md" />
               </div>
                <div>
                  <div className="animate-pulse bg-muted h-8 w-1/4 rounded-md mb-2" />
                  <div className="animate-pulse bg-muted h-10 w-full rounded-md" />
               </div>
             </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
           <Button disabled>
             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerar Pré-Orçamento em PDF
            </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Detalhes do Pedido</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="orderText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cole o texto do pedido aqui</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={exampleText}
                      className="min-h-[250px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="orderDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Pedido</FormLabel>
                    <FormControl>
                       <DatePicker date={field.value} setDate={field.onChange} className="w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="frete"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frete</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              Gerar Pré-Orçamento em PDF
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
