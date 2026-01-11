"use client";

import { useState, useRef, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, FileDown, Loader2, Printer, WandSparkles } from 'lucide-react';
import { format } from "date-fns";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { detectErrorsInText } from '@/ai/flows/detect-errors-in-text';
import { parseOrderText } from '@/lib/parser';
import { generatePdf } from '@/lib/pdf-generator';
import { DatePicker } from './ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const formSchema = z.object({
  orderText: z.string().min(50, { message: 'O texto do pedido parece muito curto.' }),
  orderDate: z.date({ required_error: 'A data do pedido é obrigatória.' }),
  paymentMethod: z.string().min(1, { message: 'Selecione uma forma de pagamento.' }),
  notes: z.string(),
});

const exampleText = `Olá! Gostaria de fazer um pedido.

--- RESUMO DO PEDIDO ---
- 9x Roupa Cirúrgica para Cães (Tamanho 01) (Fêmea) - R$ 115,20
- 1x Roupa Cirúrgica para Cães (Tamanho 05) (Macho) - R$ 14,80
- 1x Roupa Cirúrgica para Gatos (Tamanho 00)  - R$ 12,80

Subtotal: R$ 187,20

--- DADOS PARA ENTREGA ---
Nome: weslley monteiro
CPF: 08935006238
Telefone: 91981007061
Endereço: Rua da Praia Unida, 909
Bairro: Cotijuba
Cidade/Estado: Belém/PA
CEP: 66846360`;

export function PdfGeneratorForm() {
  const { toast } = useToast();
  const [aiErrors, setAiErrors] = useState<string[]>([]);
  const [isCheckingErrors, startErrorCheckTransition] = useTransition();
  const [isGenerating, startGenerationTransition] = useTransition();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderText: '',
      orderDate: new Date(),
      paymentMethod: 'Pix / Cartão / Dinheiro',
      notes: 'Frete separado',
    },
  });

  const handleTextChange = (text: string) => {
    form.setValue('orderText', text);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      if (text.trim().length > 50) {
        startErrorCheckTransition(async () => {
          try {
            const result = await detectErrorsInText({ text });
            setAiErrors(result.errors);
          } catch (e) {
            console.error('AI Error Check Failed:', e);
          }
        });
      } else {
        setAiErrors([]);
      }
    }, 1000);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startGenerationTransition(() => {
      try {
        const parsedData = parseOrderText(values.orderText);
        generatePdf(parsedData, {
          orderDate: values.orderDate,
          paymentMethod: values.paymentMethod,
          notes: values.notes,
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
                      onChange={(e) => handleTextChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isCheckingErrors && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando o texto com IA...
              </div>
            )}
            
            {aiErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Possíveis Erros Detectados pela IA</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    {aiErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-3 gap-4">
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
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pix / Cartão / Dinheiro">Pix / Cartão / Dinheiro</SelectItem>
                        <SelectItem value="Pix">Pix</SelectItem>
                        <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                        <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
