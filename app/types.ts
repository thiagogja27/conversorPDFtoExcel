export type FormState = {
    message: string;
    fileData?: string;
    fileName?: string;
    tableData?: string[][] | null; // Adicionando dados da tabela
    desmembreCount?: number; // Contagem de vagões desmembrados
    desmembreRemetenteCount?: Record<string, number>; // Contagem de desmembres por remetente
  };