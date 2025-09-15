
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { consultarBoletosPorCPF } = require('./consultaBoletosCPF');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public'), { index: 'index.html' }));

// Endpoint para salvar PDF a partir de base64
app.post('/salvarPDF', (req, res) => {
  const { id, pdf_base64 } = req.body;
  if (!id || !pdf_base64) return res.status(400).json({ error: 'id e pdf_base64 obrigatórios' });
  try {
    const dir = path.join(__dirname, '../public/boletos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `boleto-${id}.pdf`);
    const buffer = Buffer.from(pdf_base64, 'base64');
    fs.writeFileSync(filePath, buffer);
    // URL relativa para o frontend baixar
    const url = `/boletos/boleto-${id}.pdf`;
    res.json({ url });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao salvar PDF' });
  }
});

// Endpoint para salvar o base64 do PDF como .txt
app.get('/baixar-base64-txt', async (req, res) => {
  const { cpf, id } = req.query;
  if (!cpf || !id) return res.status(400).send('CPF e id obrigatórios');
  try {
    const resultado = await consultarBoletosPorCPF(cpf);
    const boleto = resultado.boletos.find(b => b.id == id);
    if (!boleto || !boleto.pdf_base64) return res.status(404).send('Base64 não encontrado');
    const txtPath = require('path').join(__dirname, `../public/pdf_base64_${id}.txt`);
    fs.writeFileSync(txtPath, boleto.pdf_base64, 'utf8');
    res.download(txtPath, `pdf_base64_${id}.txt`, (err) => {
      fs.unlink(txtPath, () => {});
    });
  } catch (e) {
    res.status(500).send('Erro ao salvar base64');
  }
});
//
// Página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});


// Endpoint para consulta de boletos por CPF
app.post('/consultar-boleto', async (req, res) => {
  const { cpf } = req.body;
  if (!cpf) return res.status(400).json({ error: 'CPF é obrigatório.' });
  try {
    const resultado = await consultarBoletosPorCPF(cpf);
    res.json(resultado);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Endpoint para baixar PDF direto (opcional)
app.get('/baixar-pdf', async (req, res) => {
  const { cpf, id } = req.query;
  if (!cpf || !id) return res.status(400).send('CPF e id obrigatórios');
  try {
    const resultado = await consultarBoletosPorCPF(cpf);
    const boleto = resultado.boletos.find(b => b.id == id);
    if (!boleto || !boleto.pdf_base64) return res.status(404).send('PDF não encontrado');
    const buffer = Buffer.from(boleto.pdf_base64, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="boleto-${id}.pdf"`);
    res.send(buffer);
  } catch (e) {
    res.status(500).send('Erro ao gerar PDF');
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
