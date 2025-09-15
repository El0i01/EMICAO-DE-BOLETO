function consultar() {
  let cpf = document.getElementById('cpf').value.trim();
  const erroDiv = document.getElementById('cpf-erro');
  const loadingDiv = document.getElementById('cpf-loading');
  erroDiv.style.display = 'none';
  erroDiv.textContent = '';
  loadingDiv.style.display = 'none';
  // Se for um CPF só com números (11 dígitos), aplica a máscara padrão
  if (/^\d{11}$/.test(cpf)) {
    cpf = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (!cpf) {
    erroDiv.textContent = 'Digite um CPF válido.';
    erroDiv.style.display = 'block';
    return;
  }
  loadingDiv.style.display = 'block';
  fetch('/consultar-boleto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpf })
  })
    .then(res => res.json())
    .then(data => {
      loadingDiv.style.display = 'none';
      if (data.error) {
        erroDiv.textContent = 'Erro: ' + data.error;
        erroDiv.style.display = 'block';
        return;
      }
      localStorage.setItem('dadosBoletos', JSON.stringify(data));
      window.location.href = '/boletos.html';
    })
    .catch(() => {
      loadingDiv.style.display = 'none';
      erroDiv.textContent = 'Erro ao consultar boletos.';
      erroDiv.style.display = 'block';
    });
}
