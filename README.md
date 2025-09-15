# Projeto: Emissão e Consulta de Boletos ZVCturbonet

## Visão Geral
Este projeto permite ao usuário consultar boletos pelo CPF, visualizar informações detalhadas do boleto e baixar o PDF do boleto gerado via integração com a API IXCSoft. O sistema é composto por uma interface web responsiva e scripts Node.js para integração e manipulação dos dados.

## Estrutura de Pastas
- **public/**: Frontend (HTML, CSS, JS) para consulta e exibição dos boletos.
  - `index.html`: Tela de consulta de boletos por CPF.
  - `boletos.html`: Exibe os dados do boleto e permite baixar/copiar a linha digitável.
  - `styles.css`: Estilos responsivos e modernos para as telas.
  - `main.js`: Scripts de interação frontend.
  - `img/`: Imagens e logotipo.
- **src/**: Scripts Node.js para integração com a API IXCSoft.
  - `consultaBoletosCPF.js`: Consulta cliente e boletos pelo CPF, busca PDF em base64 e salva localmente.
  - `salvarPDFBase64.js`: Função utilitária para converter base64 em PDF.
  - `server.js`: (opcional) Servidor para servir os arquivos e endpoints.
- **boleto_*.pdf**: PDFs de boletos gerados.
- **boleto_base64.txt**: Base64 de boletos para testes.
- **.env**: Variáveis de ambiente (login, senha, CPF de teste).

## Fluxo de Funcionamento
1. **Consulta pelo Frontend**: Usuário acessa `index.html`, digita o CPF e consulta.
2. **Busca de Dados**: O backend (Node.js) consulta a API IXCSoft, retorna dados do cliente e boletos.
3. **Exibição**: `boletos.html` mostra os dados do boleto, status, valor, vencimento, linha digitável e botões para copiar/baixar PDF.
4. **Download PDF**: O PDF é gerado a partir do base64 retornado pela API e salvo localmente.

## Principais Arquivos e Funções
- **consultaBoletosCPF.js**: Consulta cliente e boletos, busca PDF em base64, salva PDF e retorna dados para o frontend.
- **salvarPDFBase64.js**: Converte string base64 em arquivo PDF.
- **boletos.html**: Renderiza informações do boleto, status, valor, vencimento, linha digitável, botões de copiar e baixar PDF.
- **styles.css**: Responsividade, layout moderno, centralização e espaçamento dos elementos.

## Observações
- As credenciais da API estão em `.env`.
- O projeto é responsivo e funciona bem em mobile e desktop.
- O botão "Copiar" usa fallback para funcionar em dispositivos móveis.
- O código está comentado para facilitar manutenção e entendimento.

## Como rodar
1. Instale as dependências Node.js (`npm install`).
2. Configure o `.env` com as credenciais da API e CPF de teste.
3. Execute o script de consulta ou o servidor.
4. Acesse o frontend pelo navegador.

---

Dúvidas ou sugestões? Fale com o desenvolvedor!
# EMICAO-DE-BOLETO
