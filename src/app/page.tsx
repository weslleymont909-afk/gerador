"use client";

import dynamic from 'next/dynamic';
import { Toaster } from "@/components/ui/toaster";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PdfGeneratorForm = dynamic(
  () => import('@/components/pdf-generator-form').then(mod => mod.PdfGeneratorForm),
  {
    ssr: false,
    loading: () => (
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
    ),
  }
);

export default function Home() {
  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-headline font-bold">Gerador de Pré-Orçamento</h1>
          <p className="text-muted-foreground mt-2">Cole o texto do seu pedido para gerar um PDF profissional instantaneamente.</p>
        </div>
        <PdfGeneratorForm />
        <Toaster />
      </div>
    </main>
  );
}
