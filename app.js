// CONFIGURAÇÃO FIREBASE
const firebaseConfig = {
  apiKey: "COLE_SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;

// LOGIN
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      currentUser = userCredential.user;
      document.getElementById("login-screen").classList.add("hidden");
      document.getElementById("ponto-screen").classList.remove("hidden");
      document.getElementById("user-display").innerText = currentUser.email;

      // Mostrar controles Admin
      if(currentUser.email === "admin@admin.com"){
        document.getElementById("admin-controls").classList.remove("hidden");
      }

      carregarTabela();
    })
    .catch(error => {
      document.getElementById("login-error").innerText = error.message;
    });
}

// MOSTRAR TELA DE REGISTRO
function mostrarRegistro(){
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("register-screen").classList.remove("hidden");
}

// VOLTAR LOGIN
function voltarLogin(){
  document.getElementById("register-screen").classList.add("hidden");
  document.getElementById("login-screen").classList.remove("hidden");
}

// REGISTRAR NOVO USUÁRIO
function registrar(){
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;
  auth.createUserWithEmailAndPassword(email,password)
    .then(()=> {
      alert("Usuário registrado com sucesso!");
      voltarLogin();
    })
    .catch(error=>{
      document.getElementById("register-error").innerText = error.message;
    });
}

// LOGOUT
function logout() {
  auth.signOut();
  currentUser = null;
  document.getElementById("login-screen").classList.remove("hidden");
  document.getElementById("ponto-screen").classList.add("hidden");
}

// MARCAR PONTO
function marcarPonto(tipo) {
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const data = new Date();
    const registro = {
      usuario: currentUser.email,
      tipo: tipo,
      data: data.toISOString(),
      localizacao: `Lat: ${pos.coords.latitude.toFixed(5)}, Lng: ${pos.coords.longitude.toFixed(5)}`
    };
    await db.collection("pontos").add(registro);
    carregarTabela();
  }, () => alert("Não foi possível obter localização."));
}

// CARREGAR TABELA
async function carregarTabela() {
  let snapshot;
  if(currentUser.email === "admin@admin.com"){
    snapshot = await db.collection("pontos").orderBy("data", "desc").get();
  } else {
    snapshot = await db.collection("pontos").where("usuario","==",currentUser.email).orderBy("data","desc").get();
  }

  const tbody = document.querySelector("#tabela-pontos tbody");
  tbody.innerHTML = "";
  snapshot.forEach(doc => {
    const r = doc.data();
    tbody.innerHTML += `<tr>
      <td>${r.usuario}</td>
      <td>${r.tipo}</td>
      <td>${new Date(r.data).toLocaleString()}</td>
      <td>${r.localizacao}</td>
      <td>${currentUser.email==="admin@admin.com" || r.usuario===currentUser.email ? `<button onclick="excluir('${doc.id}')">🗑️</button>`:""}</td>
    </tr>`;
  });
}

// EXCLUIR REGISTRO
function excluir(id){
  if(confirm("Deseja excluir este registro?")){
    db.collection("pontos").doc(id).delete().then(()=> carregarTabela());
  }
}

// GERAR PDF
async function gerarPDF(admin=false){
  let snapshot;
  if(admin){
    snapshot = await filtrarPontosAdmin();
  } else {
    snapshot = await db.collection("pontos").where("usuario","==",currentUser.email).orderBy("data","desc").get();
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Relatório de Ponto",10,10);
  let y = 20;
  snapshot.forEach(docSnap => {
    const r = docSnap.data();
    doc.text(`${r.usuario} - ${r.tipo} - ${new Date(r.data).toLocaleString()} - ${r.localizacao}`,10,y);
    y+=10;
  });
  doc.save("relatorio_ponto.pdf");
}

// GERAR EXCEL
async function gerarExcel(admin=false){
  let snapshot;
  if(admin){
    snapshot = await filtrarPontosAdmin();
  } else {
    snapshot = await db.collection("pontos").where("usuario","==",currentUser.email).orderBy("data","desc").get();
  }
  const dados = snapshot.docs.map(d => d.data());
  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pontos");
  XLSX.writeFile(wb, "relatorio_ponto.xlsx");
}

// FILTRAR PARA ADMIN
async function filtrarPontosAdmin(){
  const inicio = document.getElementById("data-inicio").value;
  const fim = document.getElementById("data-fim").value;
  const usuario = document.getElementById("usuario-rel").value;

  let query = db.collection("pontos");
  if(usuario) query = query.where("usuario","==",usuario);
  if(inicio) query = query.where("data",">=",new Date(inicio).toISOString());
  if(fim) query = query.where("data","<=",new Date(fim+"T23:59:59").toISOString());

  return await query.orderBy("data","desc").get();
}

// WHATSAPP
async function compartilharWhatsApp(){
  const snapshot = await db.collection("pontos").where("usuario","==",currentUser.email).orderBy("data","desc").get();
  let mensagem = "📋 Relatório de Ponto:\n";
  snapshot.forEach(doc => {
    const r = doc.data();
    mensagem += `${r.tipo} - ${new Date(r.data).toLocaleString()} - ${r.localizacao}\n`;
  });
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`,"_blank");
}
