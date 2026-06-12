'use client';

import { useFormState } from 'react-dom';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { convertPdf } from './actions';
import type { FormState } from './types';
import { FileUpload } from './components/FileUpload';

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
    desmembreRemetenteCount: {}, 
    desmembreRows: null 
  };
  const [formState, formAction] = useFormState(convertPdf, initialState);
  const [searchQuery, setSearchQuery] = useState('');
  const [completedRows, setCompletedRows] = useState<number[]>([]);

  const handleCheckboxChange = (rowIndex: number) => {
    setCompletedRows(prev => {
      if (prev.includes(rowIndex)) {
        return prev.filter(idx => idx !== rowIndex);
      } else {
        return [...prev, rowIndex];
      }
    });
  };

  useEffect(() => {
    if (formState.fileData && formState.fileName) {
      downloadBase64File(formState.fileData, formState.fileName);
    }
  }, [formState.fileData, formState.fileName]);

  const mainTableHeader = formState.tableData ? formState.tableData[0] : [];
  const mainTableBody = formState.tableData ? formState.tableData.slice(1) : [];

  const desmembreHeader = formState.desmembreRows ? formState.desmembreRows[0] : [];
  const desmembreBody = formState.desmembreRows ? formState.desmembreRows.slice(1) : [];

  const filteredMainBody = mainTableBody.filter(row =>
    row.some(cell => cell.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredDesmembreBody = desmembreBody.filter(row =>
    row.some(cell => cell.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  let lastWagonId: string | null = null;
  let colorIndex = 0;
  const colorClasses = ['bg-yellow-100', 'bg-blue-100']; // Cores originais

  return (
    <main className="relative flex min-h-screen flex-col items-center p-6 md:p-12 bg-gray-100 text-gray-800">
      <Image
        src="/teag-logo.png"
        alt="TEAG Logo"
        width={120}
        height={40}
        className="absolute top-6 left-6 md:top-8 md:left-8"
      />
      <Image
        src="/baltech-logo.png"
        alt="Baltech Logo"
        width={120}
        height={40}
        className="absolute top-6 right-6 md:top-8 md:right-8"
      />
      <div className="w-full max-w-4xl bg-white p-8 rounded-xl shadow-lg mt-16 md:mt-20 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Conversor de PDF para Excel</h1>
        <p className="text-gray-600 mb-6 text-center">Faça o upload de um arquivo PDF para extrair os dados em formato de planilha.</p>
        
        <FileUpload formAction={formAction} />

        {formState.message && (
          <p className={`mt-4 text-sm ${formState.fileData ? 'text-green-600' : 'text-red-500'} text-center`}>
            {formState.message}
          </p>
        )}
      </div>

      {formState.tableData && (
        <div className="w-full mt-8">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Pesquisar em todas as tabelas..."
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {formState.desmembreCount && formState.desmembreCount > 0 && (
                <div className="bg-white p-4 rounded-lg mb-6 border border-indigo-200 shadow-md">
                    <h3 className="text-lg font-bold text-indigo-700">Resumo de Desmembres</h3>
                    <p className="text-indigo-600 mt-2"><strong>Total de Vagões Desmembrados:</strong> {formState.desmembreCount}</p>
                    {formState.desmembreRemetenteCount && Object.keys(formState.desmembreRemetenteCount).length > 0 && (
                        <div className="mt-2">
                            <p className="font-semibold text-indigo-600">Ocorrências por Remetente:</p>
                            <ul className="list-disc list-inside text-indigo-700 mt-1">
                                {Object.entries(formState.desmembreRemetenteCount).map(([remetente, count]) => (
                                    <li key={remetente}><strong>{remetente}:</strong> {count} ocorrência(s)</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {desmembreBody.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Detalhes dos Desmembres</h2>
                <div className="overflow-x-auto bg-white rounded-lg shadow-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Concluído</th>
                        {desmembreHeader.map((col, index) => (
                          <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredDesmembreBody.length > 0 ? (
                        filteredDesmembreBody.map((row, rowIndex) => {
                          const currentWagonId = row[0];
                          if (rowIndex === 0 || currentWagonId !== lastWagonId) {
                            if(rowIndex > 0) colorIndex = 1 - colorIndex;
                            lastWagonId = currentWagonId;
                          }
                          
                          const isCompleted = completedRows.includes(rowIndex);
                          const rowClassName = isCompleted ? 'bg-green-100' : colorClasses[colorIndex];

                          return (
                            <tr key={rowIndex} className={rowClassName}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={isCompleted}
                                        onChange={() => handleCheckboxChange(rowIndex)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                </td>
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className={`px-6 py-4 whitespace-nowrap text-sm ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-700'}`}>{cell}</td>
                              ))}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={desmembreHeader.length + 1} className="text-center py-4 text-gray-500">Nenhum resultado encontrado para a sua pesquisa.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {mainTableBody.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Todos os Dados Extraídos</h2>
                <div className="overflow-x-auto bg-white rounded-lg shadow-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {mainTableHeader.map((col, index) => (
                                    <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredMainBody.length > 0 ? (
                            filteredMainBody.map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-gray-50">
                                    {row.map((cell, cellIndex) => (
                                        <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cell}</td>
                                    ))}
                                </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={mainTableHeader.length} className="text-center py-4 text-gray-500">Nenhum resultado encontrado para a sua pesquisa.</td>
                            </tr>
                          )}
                        </tbody>
                    </table>
                </div>
              </div>
            )}
        </div>
      )}
    </main>
  );
}
