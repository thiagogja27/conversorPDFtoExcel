# Blueprint: Conversor de PDF para Excel

## Visão Geral

Esta aplicação é uma ferramenta web que permite aos usuários converter arquivos PDF em planilhas do Excel de forma rápida e fácil. O objetivo é fornecer uma interface simples e intuitiva, onde o usuário pode fazer o upload de um arquivo PDF e receber um link para baixar o arquivo Excel convertido.

## Funcionalidades e Design Implementados

*   **Interface de Upload Simples**: Uma página inicial limpa com um formulário para upload de arquivos PDF.
*   **Conversão no Servidor**: A conversão do PDF é feita inteiramente no servidor usando Server Actions do Next.js.
*   **Download Direto**: Após o processamento, um link para download do arquivo `.xlsx` gerado é exibido dinamicamente na interface.
*   **Estilo Moderno**: A aplicação utiliza TailwindCSS para um design moderno e responsivo, com um gradiente de fundo sutil e uma fonte personalizada (Inter).
*   **Componentes Reativos**: A interface utiliza os hooks `useFormState` e `useFormStatus` do React para fornecer feedback em tempo real durante o processo de upload e conversão (ex: desabilitar o botão, exibir mensagens de erro/sucesso).

### Lógica de Extração de Dados (Motor de Processamento)

O motor de extração de texto em `app/actions.ts` foi reescrito para ser robusto e lidar com as complexidades do formato do PDF de origem. A lógica final implementada inclui:

1.  **Divisão por Registros**: O texto completo do PDF é dividido em "registros" individuais, onde cada registro corresponde a um vagão.
2.  **Tratamento de Múltiplas Notas Fiscais (NFs)**: O sistema reconhece que um único vagão pode ter múltiplas NFs. Ele varre o registro do vagão, encontra **todas** as NFs associadas e cria uma linha separada no Excel para cada uma.
3.  **Extração de Dados do Vagão**: A lógica extrai corretamente a data de carregamento (`DD/MM/AAAA HH:MM:SS`) e os campos numéricos do vagão.
4.  **Processamento de Todas as Páginas**: A limitação que restringia o processamento a apenas poucas páginas foi removida, garantindo que documentos de qualquer tamanho sejam processados por completo.
5.  **Limpeza de Dados**: Códigos de vagão são normalizados (ex: 'O' -> '0'), e a chave da NFe é limpa de espaços.
6.  **Lógica de Extração de NF Robusta (Correção Final)**: Para resolver o problema de dados ausentes ou "amontoados", a lógica agora funciona em duas etapas:
    *   **a. Identificação de Bloco**: Primeiro, o sistema identifica o bloco de texto completo de cada nota fiscal, mesmo que ela se estenda por várias linhas no PDF.
    *   **b. Achatamento e Extração**: Em seguida, ele "achata" esse bloco em uma única linha de texto e só então extrai os dados, garantindo que todas as colunas (`Peso Rateio`, `Remetente`, `Destinatário`, etc.) sejam preenchidas corretamente.
7.  **Formato de Saída Agrupado**: O Excel gerado apresenta os dados do vagão apenas na primeira linha da primeira NF. As NFs subsequentes para o mesmo vagão aparecem nas linhas seguintes com as células de dados do vagão em branco, criando uma visualização limpa e agrupada.

## Próximos Passos

A funcionalidade principal está completa e robusta.
