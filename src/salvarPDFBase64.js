// Exemplo funcional de requisição e salvamento de PDF em base64
// Basta configurar seu .env com IXC_USER e IXC_PASS
let base64String = '';

if (require.main === module) {
  require('dotenv').config();
  const request = require('request');
  const IXC_USER = '16';
  const IXC_PASS = 'd0cba09af5434178bc0a4e7762cb853ea093238c7bee906e519888ddea716a72';
  const IXC_HEADERS = {
    'Content-Type': 'application/json',
    'ixcsoft': 'listar'
  };
  const options = {
    method: 'POST',
    url: 'https://ixc.zvcturbonet.com.br/webservice/v1/get_boleto',
    headers: IXC_HEADERS,
    auth: {
      username: IXC_USER,
      password: IXC_PASS
    },
    body: JSON.stringify({
      boletos: '156652', // Troque pelo ID desejado
      juro: 'S',
      multa: 'S',
      atualiza_boleto: 'S',
      tipo_boleto: 'arquivo',
      base64: 'S'
    })
  };
  request(options, function (error, response) {
    if (error) {
      console.error('Erro na requisição:', error);
      return;
    }
    let base64 = '';
    try {
      const data = JSON.parse(response.body);
      if (data.base64) {
        base64 = data.base64;
      } else {
        base64 = response.body;
      }
    } catch (e) {
      base64 = response.body;
    }
    // Log para depuração
    console.log('Base64 recebido (primeiros 100 caracteres):', base64.substring(0, 100));
    console.log('Tamanho do base64:', base64.length);
    salvarPDFBase64(base64, 'boleto.pdf');
    console.log('PDF salvo a partir do base64 da resposta.');
  });
}
const fs = require('fs');

// Função para converter base64 em PDF
function salvarPDFBase64(base64, nomeArquivo = 'boleto.pdf') {
    const buffer = Buffer.from(base64, 'base64');
    fs.writeFileSync(nomeArquivo, buffer);
}


module.exports = { salvarPDFBase64 };
