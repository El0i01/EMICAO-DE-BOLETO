function consultar() {
  const cpf = document.getElementById('cpf').value.trim();
  if (!cpf) {
    alert('Digite um CPF válido.');
    return;
  }
  fetch('/consultar-boleto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpf })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('Erro: ' + data.error);
        return;
      }
      localStorage.setItem('dadosBoletos', JSON.stringify(data));
        window.location.href = '/boletos.html';
    })
    .catch(() => alert('Erro ao consultar boletos.'));
}
