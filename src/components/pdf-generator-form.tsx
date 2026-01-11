"use client";

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileDown, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DatePicker } from '@/components/ui/date-picker';
import { generatePdfAction } from '@/app/actions';

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

export function PdfGeneratorForm() {
  const { toast } = useToast();
  const [isGenerating, startGenerationTransition] = useTransition();

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
      const result = await generatePdfAction(values);
      
      if ('error' in result) {
        console.error('PDF Generation Failed:', result.error);
        toast({
          title: 'Erro ao Gerar PDF',
          description: result.error || 'Não foi possível interpretar o texto. Verifique o formato.',
          variant: 'destructive',
        });
      } else {
        // Create a link to download the PDF
        const link = document.createElement('a');
        link.href = result.pdfBase64;
        link.download = 'pre-orcamento.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'PDF Gerado com Sucesso!',
          description: 'O download do seu pré-orçamento deve começar em breve.',
          variant: 'default',
        });
      }
    });
  };

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
