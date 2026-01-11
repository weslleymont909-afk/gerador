"use client";

import dynamic from 'next/dynamic';
import { Toaster } from "@/components/ui/toaster";
import { Skeleton } from "@/components/ui/skeleton";

const PdfGeneratorForm = dynamic(
  () => import('@/components/pdf-generator-form').then(mod => mod.PdfGeneratorForm),
  { 
    ssr: false,
    loading: () => <PdfFormSkeleton />
  }
);

function PdfFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[250px] w-full rounded-lg" />
      <div className="grid md:grid-cols-2 gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-48" />
      </div>
    </div>
  )
}


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
