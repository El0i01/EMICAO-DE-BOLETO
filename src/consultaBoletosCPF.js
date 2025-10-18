const axios = require('axios');

// Configurações da API IXCSoft
const IXC_BASE_URL = 'https://ixc.zvcturbonet.com.br/webservice/v1';
const IXC_HEADERS = {
  'ixcsoft': 'listar',
  'Content-Type': 'application/json',
};

// As credenciais agora são lidas das variáveis de ambiente
  const IXC_USER = '16';
  const IXC_PASS = 'd0cba09af5434178bc0a4e7762cb853ea093238c7bee906e519888ddea716a72';

async function consultarBoletosPorCPF(cpf) {
  const t0 = Date.now();

  if (!IXC_USER || !IXC_PASS) {
    throw new Error('Credenciais da API IXC não configuradas no ambiente.');
  }

  // Normaliza o CPF/CNPJ para garantir o formato com pontuação
  let documentoFormatado = cpf;
  const apenasNumeros = cpf.replace(/\D/g, '');

  if (apenasNumeros.length === 11) {
    // Formata como CPF: 000.000.000-00
    documentoFormatado = apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (apenasNumeros.length === 14) {
    // Formata como CNPJ: 00.000.000/0000-00
    documentoFormatado = apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  // Se não for um CPF ou CNPJ válido, usa o valor original, assumindo que já está formatado.

  // 1. Buscar cliente pelo CPF
  const t1 = Date.now();
  const clienteResp = await axios.post(
    `${IXC_BASE_URL}/cliente`,
    // Usa o documento formatado na consulta
    { qtype: 'cliente.cnpj_cpf', query: documentoFormatado, oper: '=' },
    {
      headers: IXC_HEADERS,
      auth: { username: IXC_USER, password: IXC_PASS }
    }
  );
  const t2 = Date.now();
  const cliente = clienteResp.data.registros && clienteResp.data.registros[0];
  console.log('DEBUG CLIENTE RETORNADO:', cliente ? `ID ${cliente.id}` : 'Nenhum cliente encontrado');
  if (!cliente) {
    throw new Error('Cliente não encontrado.');
  }
  
  // Garante que nome e cpf estejam preenchidos corretamente
  cliente.nome = cliente.nome_razao || cliente.razao || cliente.fantasia || cliente.nome || '';
  cliente.cpf = cliente.cnpj_cpf || cliente.cpf || '';

  // 2. Buscar boletos abertos do cliente
  const t3 = Date.now();
  const boletosResp = await axios.post(
    `${IXC_BASE_URL}/fn_areceber`,
    {
      qtype: 'fn_areceber.id_cliente',
      query: cliente.id,
      oper: '=',
      rp: '200',
      sortname: 'fn_areceber.data_vencimento',
      sortorder: 'asc',
      grid_param: JSON.stringify([
        { TB: 'fn_areceber.liberado', OP: '=', P: 'S' },
        { TB: 'fn_areceber.status', OP: '!=', P: 'R', P2: 'C' }
      ])
    },
    {
      headers: IXC_HEADERS,
      auth: { username: IXC_USER, password: IXC_PASS }
    }
  );
  const t4 = Date.now();
  const boletos = boletosResp.data.registros || [];
  if (!boletos.length) {
    console.log(`TEMPO TOTAL: ${Date.now() - t0}ms | Cliente: ${t2 - t1}ms | Boletos: ${t4 - t3}ms`);
    return { error: 'Nenhum boleto em aberto encontrado para este cliente.' };
  }

  // Pega o boleto mais recente
  const boletoAtual = boletos[0];
  let base64 = null;

  // --- LÓGICA PARA DEFINIR O STATUS ---
  let statusBoletoCalculado = 'A VENCER'; // Padrão
  if (boletoAtual.status === 'P') {
      statusBoletoCalculado = 'PAGO';
  } else {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data
      const dataVencimento = new Date(boletoAtual.data_vencimento);
      if (dataVencimento < hoje) {
          statusBoletoCalculado = 'VENCIDO';
      }
  }

  // 3. Busca o PDF em base64 para o boleto
  try {
    const t5 = Date.now();
    const resp = await axios.post(
      `${IXC_BASE_URL}/get_boleto`,
      {
        boletos: boletoAtual.id,
        juro: 'S',
        multa: 'S',
        atualiza_boleto: 'S',
        tipo_boleto: 'arquivo',
        base64: 'S'
      },
      {
        headers: IXC_HEADERS,
        auth: { username: IXC_USER, password: IXC_PASS }
      }
    );
    const t6 = Date.now();
    
    base64 = (resp.data && resp.data.base64) ? resp.data.base64 : (typeof resp.data === 'string' ? resp.data : '');
    console.log(`PDF em Base64 para o boleto ${boletoAtual.id} recebido (Tamanho: ${base64.length})`);
    console.log(`TEMPO TOTAL: ${Date.now() - t0}ms | Cliente: ${t2 - t1}ms | Boletos: ${t4 - t3}ms | PDF: ${t6 - t5}ms`);
  } catch (e) {
    console.error(`Erro ao buscar PDF do boleto ${boletoAtual.id}:`, e.message);
  }

  // --- FILTRO APLICADO AQUI ---
  const dadosFiltrados = {
    nome_cliente: cliente.nome,
    cpf_cliente: cliente.cpf,
    numero_boleto: boletoAtual.id,
    valor: boletoAtual.valor,
    data_vencimento: boletoAtual.data_vencimento,
    linha_digitavel: boletoAtual.linha_digitavel,
    pdf_base64: base64,
    status: statusBoletoCalculado, // Status calculado (PAGO, VENCIDO, A VENCER)
    status_api: boletoAtual.status // Status original da API (A, P, etc.)
  };

  return dadosFiltrados; // Retorna o objeto filtrado
}

module.exports = { consultarBoletosPorCPF };

