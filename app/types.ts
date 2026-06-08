export type FormState = {
    message: string;
    fileData?: string;
    fileName?: string;
    tableData?: string[][] | null;
    desmembreCount?: number;
    desmembreRemetenteCount?: Record<string, number>;
    desmembreRows?: string[][] | null; // Adiciona os dados de desmembre
  };