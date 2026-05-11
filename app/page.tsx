'use client';

import { useFormState } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { convertPdf } from './actions';
import type { FormState } from './types';

// Função para baixar o arquivo a partir dos dados base64
function downloadBase64File(base64Data: string, fileName: string) {
  const linkSource = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Data}`;
  const downloadLink = document.createElement('a');
  downloadLink.href = linkSource;
  downloadLink.download = fileName;
  downloadLink.click();
}

export default function Home() {
  const initialState: FormState = { 
    message: '', 
    tableData: null, 
    desmembreCount: 0, 
    desmembreRemetenteCount: {} 
  };
  const [formState, formAction] = useFormState(convertPdf, initialState);
  const [tableData, setTableData] = useState<(string[])[] | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (formState.fileData && formState.fileName) {
      downloadBase64File(formState.fileData, formState.fileName);
      // Limpa o formulário após o sucesso
      formRef.current?.reset(); 
    }
    // Atualiza os dados da tabela independentemente do download
    if (formState.tableData) {
      setTableData(formState.tableData);
    } else {
      // Limpa a tabela se não houver dados (ex: erro ou novo upload)
      setTableData(null);
    }
  }, [formState]);

  const header = tableData ? tableData[0] : [];
  const body = tableData ? tableData.slice(1) : [];

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-gray-50">
      <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Conversor de PDF para Excel</h1>
        <p className="text-gray-600 mb-6">Faça o upload de um arquivo PDF para extrair os dados em formato de planilha.</p>
        
        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <label htmlFor="pdf" className="block text-sm font-medium text-gray-700 mb-1">Arquivo PDF</label>
            <input 
              type="file" 
              name="pdf" 
              id="pdf" 
              accept=".pdf" 
              required
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
          >
            Converter e Baixar
          </button>
        </form>

        {formState.message && (
          <p className={`mt-4 text-sm ${formState.fileData ? 'text-green-600' : 'text-red-600'}`}>
            {formState.message}
          </p>
        )}
      </div>

      {tableData && body.length > 0 && (
        <div className="w-full max-w-7xl mt-8">
            {formState.desmembreCount && formState.desmembreCount > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
                    <h3 className="text-lg font-bold text-blue-800">Resumo de Desmembres</h3>
                    <p className="text-blue-700 mt-2"><strong>Total de Vagões Desmembrados:</strong> {formState.desmembreCount}</p>
                    {formState.desmembreRemetenteCount && Object.keys(formState.desmembreRemetenteCount).length > 0 && (
                        <div className="mt-2">
                            <p className="font-semibold text-blue-700">Ocorrências por Remetente:</p>
                            <ul className="list-disc list-inside text-blue-600 mt-1">
                                {Object.entries(formState.desmembreRemetenteCount).map(([remetente, count]) => (
                                    <li key={remetente}><strong>{remetente}:</strong> {count} ocorrência(s)</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Dados Extraídos</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {header.map((col, index) => (
                                <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {body.map((row, rowIndex) => {
                            const isDesmembre = row[1]?.includes('(Desmembre)');
                            return (
                                <tr key={rowIndex} className={isDesmembre ? 'bg-yellow-100' : ''}>
                                    {row.map((cell, cellIndex) => (
                                        <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </main>
  );
}
