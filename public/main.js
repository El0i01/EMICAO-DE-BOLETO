function consultar() {
  let cpf = document.getElementById('cpf').value.trim();
  const erroDiv = document.getElementById('cpf-erro');
  const loadingDiv = document.getElementById('cpf-loading');
  erroDiv.style.display = 'none';
  erroDiv.textContent = '';
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

function mascaraCpfCnpj(valor) {
  valor = valor.replace(/\D/g, '');
  if (valor.length <= 11) {
    // CPF: 000.000.000-00
    valor = valor.slice(0, 11);
    if (valor.length > 9) {
      return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (valor.length > 6) {
      return valor.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (valor.length > 3) {
      return valor.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }
    return valor;
  } else {
    // CNPJ: 00.000.000/0000-00
    valor = valor.slice(0, 14);
    if (valor.length > 12) {
      return valor.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    } else if (valor.length > 8) {
      return valor.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4');
    } else if (valor.length > 5) {
      return valor.replace(/(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (valor.length > 2) {
      return valor.replace(/(\d{2})(\d{1,3})/, '$1.$2');
    }
    return valor;
  }
}

window.addEventListener('DOMContentLoaded', function() {
  const cpfInput = document.getElementById('cpf');
  if (cpfInput) {
    cpfInput.value = "";
    function aplicarMascara(e) {
      e.target.value = mascaraCpfCnpj(e.target.value);
    }
    cpfInput.addEventListener('input', aplicarMascara);
    cpfInput.addEventListener('paste', function(e) {
      setTimeout(() => aplicarMascara(e), 0);
    });
  }
});
