"use client";

import { useState, useTransition, useEffect } from 'react';
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
import { parseOrderText } from '@/lib/parser';
import { generatePdf } from '@/lib/pdf-generator';
import { DatePicker } from './ui/date-picker';

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
Nome: Maria Souza
CPF: 999.888.777-66
Telefone: (21) 95555-4444
Endereço: Rua da Imaginação, 789
Bairro: Centro
Cidade/Estado: Rio de Janeiro/RJ
CEP: 54321-876`;

export function PdfGeneratorForm() {
  const { toast } = useToast();
  const [isGenerating, startGenerationTransition] = useTransition();
  const [isClient, setIsClient] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderText: '',
      frete: 0,
      orderDate: undefined,
    },
  });

  useEffect(() => {
    // This effect runs only on the client, ensuring client-side only rendering for date picker
    setIsClient(true);
    form.setValue('orderDate', new Date());
  }, [form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startGenerationTransition(() => {
      try {
        const parsedData = parseOrderText(values.orderText);
        generatePdf(parsedData, {
          orderDate: values.orderDate,
          paymentMethod: 'Pix',
          frete: values.frete,
        });
        toast({
          title: 'PDF Gerado com Sucesso!',
          description: 'O download do seu pré-orçamento deve começar em breve.',
          variant: 'default',
        });
      } catch (error: any) {
        console.error('PDF Generation Failed:', error);
        toast({
          title: 'Erro ao Gerar PDF',
          description: error.message || 'Não foi possível interpretar o texto. Verifique o formato.',
          variant: 'destructive',
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
              {isClient && (
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
              )}
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
