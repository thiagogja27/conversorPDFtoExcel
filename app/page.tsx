'use client';

import { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { convertPdf } from './actions';
import type { FormState } from './types';
import { Upload, Download, RefreshCw, FileSpreadsheet, Sparkles, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

const initialState: FormState = {
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending} 
      className="w-full h-14 text-lg font-semibold rounded-xl bg-primary text-primary-foreground disabled:bg-primary/80 flex items-center justify-center gap-3 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-100"
    >
      {pending ? (
        <><Loader2 className="w-6 h-6 animate-spin" /> Processando...</>
      ) : (
        'Converter para Excel'
      )}
    </button>
  );
}

export default function ConverterPage() {
  const [state, formAction] = useFormState(convertPdf, initialState);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('Nenhum arquivo selecionado');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state.fileData && state.fileName) {
      const byteCharacters = atob(state.fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = state.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShowSuccess(true);
    }
  }, [state.fileData, state.fileName]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setShowSuccess(false); // Reset success state
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileName('Nenhum arquivo selecionado');
    const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
    setShowSuccess(false);
    // We don't need to reload the page anymore, just reset the client state
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="p-2 rounded-xl bg-blue-100">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Conversor de PDF para Excel</h1>
            <p className="text-sm text-gray-500">Extração de dados de alta precisão</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 md:py-20">
        <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-4">
                <Sparkles className="w-4 h-4" />
                Robusto e Confiável
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tighter mb-4">
                Envie seu PDF e baixe em Excel
            </h2>
            <p className="text-lg text-gray-600 max-w-lg mx-auto">
                A nova arquitetura de servidor garante conversões estáveis e precisas, eliminando os erros de navegador.
            </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-8 transition-all duration-500">
          {!showSuccess ? (
            <form action={formAction}>
              <div className="mb-6">
                <label htmlFor="pdf-upload" className="block text-lg font-semibold text-gray-700 mb-3 text-center">1. Escolha o arquivo PDF</label>
                <div className="relative">
                  <input 
                    type="file" 
                    name="pdf" 
                    id="pdf-upload" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    onChange={handleFileChange} 
                    accept=".pdf"
                    required
                  />
                  <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 transition-colors duration-300 hover:border-blue-500 hover:bg-blue-50">
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="font-medium text-center px-2">{fileName}</span>
                  </div>
                </div>
              </div>
              
              {file && (
                <div className="mt-8">
                  <label className="block text-lg font-semibold text-gray-700 mb-3 text-center">2. Inicie a conversão</label>
                  <SubmitButton />
                </div>
              )}
            </form>
          ) : (
            <div className="text-center space-y-6 py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto animate-pulse" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Download Iniciado!</h3>
                <p className="text-gray-600 mt-1">Seu arquivo Excel foi gerado e o download começou.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <button 
                    onClick={handleReset}
                    className="w-full sm:w-auto h-12 px-8 text-lg font-semibold rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center gap-3 transition-all duration-300 ease-in-out transform hover:bg-gray-300 active:bg-gray-400"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Converter Outro Arquivo
                  </button>
              </div>
            </div>
          )}

          {state.message && !state.fileData && (
             <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex items-center">
                    <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                    <div>
                        <p className="font-bold text-red-800">Ocorreu um Erro</p>
                        <p className="text-sm text-red-700">{state.message}</p>
                    </div>
                </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
