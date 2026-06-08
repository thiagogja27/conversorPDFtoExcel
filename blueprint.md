# Blueprint: Conversor de PDF para Excel

## Visão Geral

Esta aplicação é uma ferramenta web que permite aos usuários converter arquivos PDF de composição de trens em planilhas do Excel. O objetivo é extrair dados complexos de forma estruturada, identificar vagões que necessitam de desmembre e apresentar os resultados de forma clara e interativa tanto na interface web quanto no arquivo Excel gerado.

## Funcionalidades e Design Implementados

*   **Identidade Visual**:
    *   O logótipo da **TEAG** foi adicionado no canto superior esquerdo da página.
    *   O logótipo da **Baltech** foi adicionado no canto superior direito da página.
*   **Interface de Upload Simples**: Uma página inicial limpa com um componente de upload de arrastar e soltar (`drag-and-drop`) para arquivos PDF.
*   **Conversão no Servidor**: A conversão do PDF é feita inteiramente no servidor usando Server Actions do Next.js.
*   **Download Direto do Excel**: Após o processamento, o download do arquivo `.xlsx` é iniciado automaticamente no navegador do usuário.
*   **Estilo Moderno e Responsivo**: A aplicação utiliza TailwindCSS para um design moderno e responsivo.

### Funcionalidades de Análise de Dados

1.  **Barra de Pesquisa Global**: Uma barra de pesquisa permite ao usuário filtrar em tempo real os dados em **ambas** as tabelas ("Detalhes dos Desmembres" e "Todos os Dados Extraídos").

2.  **Extração de Dados Abrangente**: O motor de extração em `app/actions.ts` processa o texto do PDF para extrair dados detalhados de cada vagão, incluindo múltiplas Notas Fiscais (NFs) por vagão.

3.  **Identificação de Desmembres**: A lógica analisa o documento para identificar vagões que aparecem múltiplas vezes, marcando-os para desmembre.

4.  **Resumo de Desmembres na Interface**: Um quadro de resumo é exibido, mostrando o número total de vagões desmembrados e a contagem de ocorrências por Remetente.

5.  **Secção "Detalhes dos Desmembres" na Interface**:
    *   Uma nova tabela dedicada é renderizada na página se forem encontrados desmembres.
    *   **Coloração Alternada por Vagão**: As linhas da tabela são coloridas com um fundo alternado (amarelo e azul claro) para cada grupo de vagão, facilitando a visualização.

6.  **Tabela de Dados Completos**: Uma segunda tabela na interface exibe todos os dados extraídos do PDF.

7.  **Geração de Arquivo Excel com Duas Abas**:
    *   **Aba "Dados"**: Contém a extração completa de todos os dados do PDF.
    *   **Aba "Desmembres"**: Contém a mesma tabela de resumo de desmembres exibida na interface, para análise offline.

## Estrutura do Projeto

*   **`app/page.tsx`**: Componente principal da interface, contendo os logótipos, os formulários, a barra de pesquisa e as tabelas de resultados.
*   **`app/actions.ts`**: Server Action que contém toda a lógica de processamento do PDF, extração de dados e geração do arquivo Excel.
*   **`app/types.ts`**: Define a estrutura de tipos (`FormState`) para a comunicação entre o servidor e o cliente.
*   **`app/components/FileUpload.tsx`**: Componente reutilizável para a área de upload de arquivos.
*   **`blueprint.md`**: Este documento, servindo como a fonte da verdade para a arquitetura e funcionalidades da aplicação.
