let usuario = null;

/* ================= USUÁRIOS ================= */

function carregarUsuarios(){
  return JSON.parse(localStorage.getItem("usuarios") || "{}");
}

function salvarUsuarios(u){
  localStorage.setItem("usuarios", JSON.stringify(u));
}

// cria admin automaticamente
(function init(){
  let u = carregarUsuarios();
  if(!u["Admim"]){
    u["Admim"] = { senha:"Admin_Admin", admin:true };
    salvarUsuarios(u);
  }
})();

/* ================= LOGIN ================= */

function login(){
  const user = loginUser.value;
  const pass = loginPass.value;
  const usuarios = carregarUsuarios();

  if(!usuarios[user] || usuarios[user].senha !== pass){
    alert("Login inválido");
    return;
  }

  usuario = user;
  loginBox.style.display="none";
  app.style.display="block";
  usuarioLogado.innerText = "👤 " + user;

  if(usuarios[user].admin){
    adminSenha.style.display="block";
    adminFiltro.style.display="block";
    carregarFiltroUsuarios();
  }

  carregar();
}

function registrar(){
  const user = loginUser.value;
  const pass = loginPass.value;
  let usuarios = carregarUsuarios();

  if(usuarios[user]){
    alert("Usuário já existe");
    return;
  }

  usuarios[user] = { senha:pass, admin:false };
  salvarUsuarios(usuarios);
  alert("Usuário cadastrado!");
}

function logout(){
  location.reload();
}

/* ================= ADMIN ================= */

function alterarSenhaAdmin(){
  const nova = novaSenha.value;
  if(!nova) return alert("Digite a nova senha");

  let u = carregarUsuarios();
  u["Admim"].senha = nova;
  salvarUsuarios(u);
  alert("Senha alterada!");
}

function carregarFiltroUsuarios(){
  let u = carregarUsuarios();
  filtroUsuario.innerHTML = `<option value="todos">Todos</option>`;
  Object.keys(u).forEach(nome=>{
    filtroUsuario.innerHTML += `<option>${nome}</option>`;
  });
}

/* ================= REGISTROS ================= */

function obterDados(){
  return JSON.parse(localStorage.getItem("pontos")||"[]");
}

function salvarDados(d){
  localStorage.setItem("pontos",JSON.stringify(d));
}

/* ================= GEO ================= */

async function buscarEndereco(lat,lon){
  try{
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
    const d = await r.json();
    return d.display_name || "";
  }catch{
    return "";
  }
}

/* ================= REGISTRO ================= */

function registrarPonto(tipo){
  navigator.geolocation.getCurrentPosition(async pos=>{
    let dados = obterDados();
    const hoje = new Date().toLocaleDateString();

    if((tipo==="almoco_saida" || tipo==="almoco_retorno") &&
      dados.some(r=>r.usuario===usuario && r.tipo===tipo && r.data===hoje)){
        alert("Este registro já foi feito hoje.");
        return;
    }

    const endereco = await buscarEndereco(pos.coords.latitude,pos.coords.longitude);

    dados.push({
      usuario,
      tipo,
      data:hoje,
      hora:new Date().toLocaleTimeString(),
      endereco
    });

    salvarDados(dados);
    mostrarPopup(tipo);
    carregar();
  }, ()=> alert("Erro ao obter localização"));
}

/* ================= LISTAGEM ================= */

function carregar(){
  const dados = obterDados();
  const usuarios = carregarUsuarios();
  let filtro = usuario;

  if(usuarios[usuario].admin && filtroUsuario.value!=="todos"){
    filtro = filtroUsuario.value;
  }

  lista.innerHTML = dados
    .filter(r=> usuarios[usuario].admin ? (filtro==="todos"||r.usuario===filtro) : r.usuario===usuario)
    .map(r=>`
      <div>
      👤 ${r.usuario}<br>
      ${r.tipo} - ${r.data} ${r.hora}<br>
      📍 ${r.endereco}
      </div><hr>
    `).join("");
}

/* ================= POPUP ================= */

function mostrarPopup(tipo){
  const msg={
    entrada:"Entrada registrada",
    saida:"Saída registrada",
    almoco_saida:"Saída Almoço registrada",
    almoco_retorno:"Retorno Almoço registrada"
  };
  popupTexto.innerText = msg[tipo];
  popup.style.display="flex";
  setTimeout(()=>popup.style.display="none",1500);
}

/* ================= FILTRO ================= */

function filtrarPeriodo(){
  const ini = dataInicio.value;
  const fim = dataFim.value;
  const dados = obterDados();
  return dados.filter(r=>{
    const d = new Date(r.data.split("/").reverse().join("-"));
    if(ini && d < new Date(ini)) return false;
    if(fim && d > new Date(fim)) return false;
    return true;
  });
}

/* ================= PDF ================= */

function gerarPDF(){
  const {jsPDF} = window.jspdf;
  const pdf = new jsPDF();
  let y=10;

  filtrarPeriodo().forEach(r=>{
    pdf.text(`${r.usuario} - ${r.tipo}`,10,y); y+=6;
    pdf.text(`${r.data} ${r.hora}`,10,y); y+=6;
    pdf.text(r.endereco,10,y); y+=10;
  });

  pdf.save("relatorio.pdf");
}

/* ================= EXCEL ================= */

function gerarExcel(){
  let csv="Usuario,Tipo,Data,Hora,Endereco\n";
  filtrarPeriodo().forEach(r=>{
    csv+=`${r.usuario},${r.tipo},${r.data},${r.hora},"${r.endereco}"\n`;
  });

  const blob = new Blob([csv],{type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download="relatorio.csv";
  a.click();
}
