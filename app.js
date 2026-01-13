let registros = [];

function registrarPonto() {
  const nome = document.getElementById("nome").value.trim();
  const tipo = document.getElementById("tipo").value;

  if (!nome) {
    alert("Digite seu nome completo.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async pos => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    const endereco = await buscarEndereco(lat, lon);
    const dataHora = new Date().toLocaleString();

    const registro = {
      nome,
      tipo,
      dataHora,
      endereco
    };

    registros.push(registro);
    atualizarTela();
  }, () => {
    alert("Não foi possível obter a localização.");
  });
}

async function buscarEndereco(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const resp = await fetch(url);
  const data = await resp.json();
  return data.display_name || "Endereço não encontrado";
}

function atualizarTela() {
  const div = document.getElementById("lista");
  div.innerHTML = "";

  registros.forEach(r => {
    div.innerHTML += `
      <div>
        <strong>${r.nome}</strong><br>
        Tipo: ${r.tipo}<br>
        Data/Hora: ${r.dataHora}<br>
        Endereço: ${r.endereco}
        <hr>
      </div>
    `;
  });
}

function gerarExcel() {
  if (registros.length === 0) {
    alert("Nenhum registro para exportar.");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(registros);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Registros");
  XLSX.writeFile(wb, "controle_ponto.xlsx");
}

function gerarPDF() {
  if (registros.length === 0) {
    alert("Nenhum registro para exportar.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;

  registros.forEach((r, i) => {
    doc.text(`Nome: ${r.nome}`, 10, y);
    y += 6;
    doc.text(`Tipo: ${r.tipo}`, 10, y);
    y += 6;
    doc.text(`Data/Hora: ${r.dataHora}`, 10, y);
    y += 6;
    doc.text(`Endereço: ${r.endereco}`, 10, y);
    y += 10;

    if (y > 270) {
      doc.addPage();
      y = 10;
    }
  });

  doc.save("controle_ponto.pdf");
}
