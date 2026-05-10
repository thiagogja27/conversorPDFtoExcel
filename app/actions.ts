'use server';

import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import pdf from 'pdf-parse';
import * as XLSX from 'xlsx';

function processExtractedText(text: string): (string[])[] {
  const aoaData: (string[])[] = [
    ['Seq.', 'Vagão', 'Num. CT-e', 'Tara', 'TU', 'TB', 'Ticket Tara', 'Ticket TU', 'Ticket TB', 'Mercadoria', 'Data Carregamento', 'Nota Fiscal (NF)', 'Chave NFE', 'Data NF', 'Peso Total NF', 'Peso Rateio', 'Remetente NF', 'Destinatário NF']
  ];

  const recordSplitRegex = /^\s*(?=\d{1,3}\.?\s+[A-Z0-9-]{6,14})/m;
  const records = text.split(recordSplitRegex).filter(r => r.trim() !== '');

  const wagonRegex = /^(\d{1,3})\.?\s+([A-Z0-9-]{6,14})\s+(.*)/s;
  const nfBoundaryRegex = /(\S+)\s+([\d\s]{40,60})\s+(\d{2}\s*[/|-]\s*\d{2}\s*[/|-]\s*\d{2,4})/g;


  for (const record of records) {
    const wagonMatch = record.match(wagonRegex);
    if (!wagonMatch) continue;

    const seq = wagonMatch[1].trim();
    const rawPlate = wagonMatch[2].trim().toUpperCase();
    const sanitizedPlate = rawPlate.replace(/O/g, '0').replace(/I/g, '1');
    const restOfRecord = wagonMatch[3] || '';

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
    tara = numberParts[2] || '';
    tu = numberParts[3] || '';
    tb = numberParts[4] || '';
    ticketTara = numberParts[5] || '';
    ticketTu = numberParts[6] || '';
    ticketTb = numberParts[7] || '';

    let isFirstNfForWagon = true;
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
      
      const restOfNfLine = finalNfMatch[4].trim().split(/\s+/).filter(Boolean);
      const pesoTotalNf = restOfNfLine[0] || '';
      const pesoRateio = restOfNfLine[1] || '';
      const clienteParts = restOfNfLine.slice(2);

      const mid = Math.ceil(clienteParts.length / 2);
      const remetenteNf = clienteParts.slice(0, mid).join(' ');
      const destinatarioNf = clienteParts.slice(mid).join(' ');

      if (isFirstNfForWagon) {
        const completeRow = [
            seq, sanitizedPlate, numCte, tara, tu, tb, ticketTara, ticketTu, ticketTb, mercadoria, dataCarregamento,
            numNf, chaveNfe, dataNf, pesoTotalNf, pesoRateio, remetenteNf, destinatarioNf
        ];
        aoaData.push(completeRow);
        isFirstNfForWagon = false;
      } else {
        const partialRow = [
            '', '', '', '', '', '', '', '', '', '', '',
            numNf, chaveNfe, dataNf, pesoTotalNf, pesoRateio, remetenteNf, destinatarioNf
        ];
        aoaData.push(partialRow);
      }
    }
  }

  return aoaData;
}

export async function convertPdf(prevState: any, formData: FormData): Promise<{ downloadUrl?: string; error?: string }> {
  const file = formData.get('pdf') as File;
  if (!file || file.size === 0) {
    return { error: 'Nenhum arquivo enviado. Por favor, selecione um PDF.' };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);

    if (!data.text || data.text.trim() === ''){
        return { error: 'O PDF parece estar vazio ou contém apenas imagens. Não foi possível encontrar texto.' };
    }

    const extractedData = processExtractedText(data.text);

    if (extractedData.length <= 1) {
      return { error: 'Não foi possível extrair dados estruturados do PDF. Verifique se o formato do arquivo corresponde ao esperado.' };
    }

    const ws = XLSX.utils.aoa_to_sheet(extractedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');

    const outputFileName = `dados-${Date.now()}.xlsx`;
    const outputPath = join(process.cwd(), 'public', outputFileName);

    await writeFile(outputPath, XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }));

    setTimeout(async () => {
      try {
        await unlink(outputPath);
      } catch (e) {
        console.error(`Failed to delete temporary file: ${outputPath}`, e);
      }
    }, 60 * 1000);

    return { downloadUrl: `/${outputFileName}` };
  } catch (error) {
    console.error(error);
    return { error: 'Ocorreu um erro inesperado no servidor durante o processamento do PDF.' };
  }
}
