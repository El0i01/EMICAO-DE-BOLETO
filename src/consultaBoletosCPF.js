// Função para buscar e salvar PDF em base64 para um boleto
function buscarESalvarPDFBase64(boletoId, nomeArquivo, callback) {
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
      boletos: boletoId,
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
      if (callback) callback(error);
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
    salvarPDFBase64(base64, nomeArquivo);
    console.log('PDF salvo a partir do base64 da resposta.');
    if (callback) callback(null);
  });
}



const axios = require('axios');
const fs = require('fs');
const { salvarPDFBase64 } = require('./salvarPDFBase64');

// Configurações da API IXCSoft
const IXC_BASE_URL = 'https://ixc.zvcturbonet.com.br/webservice/v1'; // Troque para seu ambiente
const IXC_HEADERS = {
  'ixcsoft': 'listar',
  'Content-Type': 'application/json',
};

// Defina os dados diretamente aqui
const IXC_USER = '16';
const IXC_PASS = 'd0cba09af5434178bc0a4e7762cb853ea093238c7bee906e519888ddea716a72';


async function consultarBoletosPorCPF(cpf, tipo = 'boleto') {
  // LOG tempo total
  const t0 = Date.now();

  // 1. Buscar cliente pelo CPF
  const t1 = Date.now();
  const clienteResp = await axios.post(
    `${IXC_BASE_URL}/cliente`,
    {
      qtype: 'cliente.cnpj_cpf',
      query: cpf,
      oper: '=',
    },
    {
      headers: IXC_HEADERS,
      auth: {
        username: IXC_USER,
        password: IXC_PASS
      }
    }
  );
  const t2 = Date.now();
  const cliente = clienteResp.data.registros && clienteResp.data.registros[0];
  console.log('DEBUG CLIENTE RETORNADO:', cliente);
  if (!cliente) throw new Error('Cliente não encontrado.');
  // Garante que nome e cpf estejam preenchidos corretamente
  if (!cliente.nome) {
    cliente.nome = cliente.nome_razao || cliente.razao || cliente.nome_fantasia || cliente.nome_completo || '';
  }
  if (!cliente.cpf) {
    cliente.cpf = cliente.cnpj_cpf || cliente.cpf_cnpj || '';
  }

  // 2. Buscar boletos abertos do cliente
  const t3 = Date.now();
  const boletosResp = await axios.post(
    `${IXC_BASE_URL}/fn_areceber`,
    {
      qtype: 'fn_areceber.id_cliente',
      query: cliente.id,
      oper: '=',
      rp: '200000',
      sortname: 'fn_areceber.data_vencimento',
      sortorder: 'asc',
      grid_param: JSON.stringify([
        { TB: 'fn_areceber.liberado', OP: '=', P: 'S' },
        { TB: 'fn_areceber.status', OP: '!=', P: 'R', P2: 'C' }
      ])
    },
    {
      headers: IXC_HEADERS,
      auth: {
        username: IXC_USER,
        password: IXC_PASS
      }
    }
  );
  const t4 = Date.now();
  const boletos = boletosResp.data.registros || [];
  if (!boletos.length) {
    console.log(`TEMPO TOTAL: ${Date.now() - t0}ms | Cliente: ${t2-t1}ms | Boletos: ${t4-t3}ms`);
    return { cliente, boletos: [] };
  }

  // 3. Para cada boleto, buscar o PDF em base64
  // Emitir apenas o boleto mais atual (próximo vencimento)
  if (boletos.length) {
    // Ordena por data de vencimento (mais próximo primeiro)
    boletos.sort((a, b) => {
      const da = new Date(a.data_vencimento);
      const db = new Date(b.data_vencimento);
      return da - db;
    });
    const boletoAtual = boletos[0];
    const boletoId = boletoAtual.id;
    const nomeArquivo = `boleto_${boletoId}.pdf`;
    try {
      const t5 = Date.now();
      // Requisição para obter o base64 do boleto
      const resp = await axios.post(
        `${IXC_BASE_URL}/get_boleto`,
        {
          boletos: boletoId,
          juro: 'S',
          multa: 'S',
          atualiza_boleto: 'S',
          tipo_boleto: 'arquivo',
          base64: 'S'
        },
        {
          headers: IXC_HEADERS,
          auth: {
            username: IXC_USER,
            password: IXC_PASS
          }
        }
      );
      const t6 = Date.now();
      let base64 = '';
      if (resp.data && resp.data.base64) {
        base64 = resp.data.base64;
      } else if (typeof resp.data === 'string') {
        base64 = resp.data;
      }
      // Log para depuração
      console.log(`Base64 do boleto ${boletoId} (primeiros 100 caracteres):`, base64.substring(0, 100));
      console.log(`Tamanho do base64 do boleto ${boletoId}:`, base64.length);
      salvarPDFBase64(base64, nomeArquivo);
      console.log(`PDF salvo: ${nomeArquivo}`);
      // Adiciona o base64 ao objeto do boleto
      boletoAtual.pdf_base64 = base64;
      console.log(`TEMPO TOTAL: ${Date.now() - t0}ms | Cliente: ${t2-t1}ms | Boletos: ${t4-t3}ms | PDF: ${t6-t5}ms`);
    } catch (e) {
      console.error(`Erro ao buscar/salvar PDF do boleto ${boletoId}:`, e.message);
      boletoAtual.pdf_base64 = null;
    }
    return { cliente, boletos: [boletoAtual] };
  }
  console.log(`TEMPO TOTAL: ${Date.now() - t0}ms | Cliente: ${t2-t1}ms | Boletos: ${t4-t3}ms`);
  return { cliente, boletos: [] };
}

module.exports = { consultarBoletosPorCPF };
