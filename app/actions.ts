'use server';

import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import pdf from 'pdf-parse';
import * as XLSX from 'xlsx';
import type { FormState } from './types';

function processExtractedText(text: string): { 
  aoaData: (string[])[], 
  desmembreCount: number, 
  desmembreRows: (string[])[],
  desmembreRemetenteCount: Record<string, number>,
  prefixo: string | null,
  trainName: string | null
} {
  const convertWeightValue = (value: string): string => {
    if (!value) return '';
    const cleanedValue = value.replace(/\./g, '').replace(/,/g, '.');
    const number = parseFloat(cleanedValue);
    if (isNaN(number)) {
      return value;
    }
    const finalValue = Math.round(number * 1000);
    return finalValue.toString();
  };

  const prefixoRegex = /Prefixo\s*-\s*OS:\s*([^\n\r]*?)(?:\s{2,}|\n|\r)/;
  const prefixoMatch = text.match(prefixoRegex);
  const prefixo = prefixoMatch ? prefixoMatch[1].trim() : null;

  const trainRegex = /(?:Nome do Trem|Trem):\s*([^\n\r]+)/i;
  const trainMatch = text.match(trainRegex);
  const trainName = trainMatch ? trainMatch[1].trim() : null;

  const mainHeader = ['Seq.', 'Vagão', 'Num. CT-e', 'Tara', 'TU', 'TB', 'Ticket Tara', 'Ticket TU', 'Ticket TB', 'Mercadoria', 'Data Carregamento', 'Nota Fiscal (NF)', 'Chave NFE', 'Data NF', 'Peso Total NF', 'Peso Rateio', 'Remetente NF', 'Destinatário NF'];
  const desmembreHeader = ['Vagão', 'TB', 'Chave NFE', 'Remetente NF', 'Data NF', 'Peso Rateio', 'FORNECEDOR'];
  const aoaData: (string[])[] = [mainHeader];
  const desmembreRows: (string[])[] = [desmembreHeader];
  const desmembreRemetenteCount: Record<string, number> = {};

  const recordSplitRegex = /^\s*(?=\d{1,3}\.?\s+[A-Z0-9-]{6,14})/m;
  const records = text.split(recordSplitRegex).filter(r => r.trim() !== '');

  const wagonRegex = /^(\d{1,3})\.?\s+([A-Z0-9-]{6,14})\s+(.*)/s;
  const nfBoundaryRegex = /(\S+)\s+([\d\s]{40,60})\s+(\d{2}\s*[/|-]\s*\d{2}\s*[/|-]\s*\d{2,4})/g;

  const wagonCounts = new Map<string, number>();
  const uniqueDesmembres = new Set<string>();

  for (const record of records) {
      const wagonMatch = record.match(wagonRegex);
      if (wagonMatch) {
          const rawPlate = wagonMatch[2].trim().toUpperCase();
          const sanitizedPlate = rawPlate.replace(/O/g, '0').replace(/I/g, '1');
          if ((wagonCounts.get(sanitizedPlate) || 0) > 0) {
            uniqueDesmembres.add(sanitizedPlate);
          }
          wagonCounts.set(sanitizedPlate, (wagonCounts.get(sanitizedPlate) || 0) + 1);
      }
  }

  const desmembreCount = uniqueDesmembres.size;

  for (const record of records) {
    const wagonMatch = record.match(wagonRegex);
    if (!wagonMatch) continue;

    const seq = wagonMatch[1].trim();
    const rawPlate = wagonMatch[2].trim().toUpperCase();
    const sanitizedPlate = rawPlate.replace(/O/g, '0').replace(/I/g, '1');
    let restOfRecord = wagonMatch[3] || '';

    const isDesmembre = uniqueDesmembres.has(sanitizedPlate);
    const wagonDisplay = sanitizedPlate;

    const footerTerminator = /Tota(l)?|Qntd|Ticket|Recebemos|Assinatura/i;
    const footerMatchIndex = restOfRecord.search(footerTerminator);
    if (footerMatchIndex !== -1) {
      restOfRecord = restOfRecord.substring(0, footerMatchIndex);
    }

    const allNfMatches = [...restOfRecord.matchAll(nfBoundaryRegex)];
    if (allNfMatches.length === 0) continue;

    const firstNfMatch = allNfMatches[0];
    const wagonInfoString = restOfRecord.substring(0, firstNfMatch.index).trim();
    
    let numCte = '', tara = '', tu = '', tb = '', ticketTara = '', ticketTu = '', ticketTb = '', mercadoria = '', dataCarregamento = '';

    const dateRegex = /(\d{2}[\/|-]\d{2}[\/|-]\d{2,4}\s+\d{2}:\d{2}:\d{2})\s*$/;
    const dateMatch = wagonInfoString.match(dateRegex);
    
    let stringToParse = wagonInfoString;
    if (dateMatch) {
        dataCarregamento = dateMatch[0].trim();
        stringToParse = wagonInfoString.substring(0, dateMatch.index).trim();
    }

    const parts = stringToParse.split(/\s+/).filter(Boolean);
    const mercadoriaParts: string[] = [];
    let firstMerchandiseIndex = parts.length;

    for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];
        if (/[a-zA-Z]/.test(part) && isNaN(parseFloat(part))) {
            mercadoriaParts.unshift(part);
            firstMerchandiseIndex = i;
        } else {
            if (mercadoriaParts.length > 0) break;
        }
    }
    
    mercadoria = mercadoriaParts.join(' ');
    const numberParts = parts.slice(0, firstMerchandiseIndex);
    
    numCte = `${numberParts[0] || ''} ${numberParts[1] || ''}`.trim();
    tara = convertWeightValue(numberParts[2] || '');
    tu = convertWeightValue(numberParts[3] || '');
    tb = convertWeightValue(numberParts[4] || '');
    ticketTara = numberParts[5] || '';
    ticketTu = numberParts[6] || '';
    ticketTb = numberParts[7] || '';

    const nfParser = /(\S+)\s+([\d\s]{40,60})\s+(\d{2}\s*[/|-]\s*\d{2}\s*[/|-]\s*\d{2,4})\s+(.*)/;

    for (let i = 0; i < allNfMatches.length; i++) {
      const match = allNfMatches[i];
      const startIndex = match.index;
      const endIndex = (i + 1 < allNfMatches.length) ? allNfMatches[i + 1].index : restOfRecord.length;
      const nfBlock = restOfRecord.substring(startIndex, endIndex);
      const singleLineNfBlock = nfBlock.replace(/[\r\n]+/g, ' ').trim();

      const finalNfMatch = singleLineNfBlock.match(nfParser);
      if (!finalNfMatch) continue;

      const numNf = finalNfMatch[1].trim();
      const chaveNfe = finalNfMatch[2].replace(/\s/g, '');
      const dataNf = finalNfMatch[3].replace(/\s/g, '').replace(/-/g, '/');
      const restOfNfRaw = finalNfMatch[4];

      const restOfNfLine = restOfNfRaw.trim().split(/\s+/).filter(Boolean);
      
      let pesoTotalNf = '';
      let pesoRateio = '';
      let clientStartIndex = 0;

      if (restOfNfLine.length > 0) {
        const potentialWeight1 = convertWeightValue(restOfNfLine[0]);
        if (/^\d+$/.test(potentialWeight1)) {
            pesoTotalNf = potentialWeight1;
            clientStartIndex = 1;
        }
      }
      
      if (clientStartIndex === 1 && restOfNfLine.length > 1) {
        const potentialWeight2 = convertWeightValue(restOfNfLine[1]);
        if (/^\d+$/.test(potentialWeight2)) {
            pesoRateio = potentialWeight2;
            clientStartIndex = 2;
        }
      }
      
      const clienteParts = restOfNfLine.slice(clientStartIndex);

      const mid = Math.ceil(clienteParts.length / 2);
      const remetenteNf = clienteParts.slice(0, mid).join(' ');
      const destinatarioNf = clienteParts.slice(mid).join(' ');

      const completeRow = [
          seq, wagonDisplay, numCte, tara, tu, tb, ticketTara, ticketTu, ticketTb, mercadoria, dataCarregamento,
          numNf, chaveNfe, dataNf, pesoTotalNf, pesoRateio, remetenteNf, destinatarioNf
      ];
      aoaData.push(completeRow);

      if (isDesmembre) {
        const desmembreWagonDisplay = `${sanitizedPlate}`;
        const fornecedorCnpj = chaveNfe.length >= 20 ? chaveNfe.substring(6, 20) : '';
        const desmembreSummaryRow = [desmembreWagonDisplay, tb, chaveNfe, remetenteNf, dataNf, pesoRateio, fornecedorCnpj];
        desmembreRows.push(desmembreSummaryRow);
        if (remetenteNf) {
          desmembreRemetenteCount[remetenteNf] = (desmembreRemetenteCount[remetenteNf] || 0) + 1;
        }
      }
    }
  }

  return { aoaData, desmembreCount, desmembreRows, desmembreRemetenteCount, prefixo, trainName };
}

export async function convertPdf(prevState: any, formData: FormData): Promise<FormState> {
  const file = formData.get('pdf') as File;
  if (!file || file.size === 0) {
    return { message: 'Nenhum arquivo enviado. Por favor, selecione um PDF.', tableData: null, desmembreCount: 0, desmembreRemetenteCount: {}, desmembreRows: null };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);

    if (!data.text || data.text.trim() === ''){
      return { message: 'O PDF parece estar vazio ou contém apenas imagens. Não foi possível encontrar texto.', tableData: null, desmembreCount: 0, desmembreRemetenteCount: {}, desmembreRows: null };
    }

    const { aoaData, desmembreCount, desmembreRows, desmembreRemetenteCount, prefixo, trainName } = processExtractedText(data.text);

    if (aoaData.length <= 1) {
      return { 
        message: 'Não foi possível extrair dados estruturados do PDF. Verifique se o formato do arquivo corresponde ao esperado.',
        tableData: null,
        desmembreCount: 0,
        desmembreRemetenteCount: {},
        desmembreRows: null
      };
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoaData);
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');

    if (desmembreRows.length > 1) {
      const wsDesmembre = XLSX.utils.aoa_to_sheet(desmembreRows);
      XLSX.utils.book_append_sheet(wb, wsDesmembre, 'Desmembres');
    }

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer', cellStyles: true });
    const base64Data = (excelBuffer as Buffer).toString('base64');
    
    const sanitizedTrainName = trainName ? trainName.replace(/[^a-zA-Z0-9-]/g, '_').replace(/\s/g, '-') : null;
    const sanitizedPrefix = prefixo ? prefixo.replace(/[^a-zA-Z0-9-]/g, '_').replace(/\s/g, '-') : null;
    const outputFileName = sanitizedTrainName ? `${sanitizedTrainName}.xlsx` : (sanitizedPrefix ? `${sanitizedPrefix}.xlsx` : 'resumo-composicao.xlsx');

    return {
      message: 'Arquivo processado com sucesso!',
      fileData: base64Data,
      fileName: outputFileName,
      tableData: aoaData,
      desmembreCount: desmembreCount,
      desmembreRemetenteCount: desmembreRemetenteCount,
      desmembreRows: desmembreRows
    };

  } catch (error) {
    console.error(error);
    return { 
      message: 'Ocorreu um erro inesperado no servidor durante o processamento do PDF.',
      tableData: null,
      desmembreCount: 0,
      desmembreRemetenteCount: {},
      desmembreRows: null
    };
  }
}
