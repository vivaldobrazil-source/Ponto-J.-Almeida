// FIREBASE CONFIG - substitua pelas suas chaves
const firebaseConfig = {
  apiKey: "COLE_SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentUser = null;

// LOGIN
async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const snapshot = await db.collection("usuarios")
      .where("username","==",username)
      .where("password","==",password)
      .get();

    if(snapshot.empty){
      document.getElementById("login-error").innerText = "Usuário ou senha incorretos!";
      return;
    }

    currentUser = snapshot.docs[0].data();
    currentUser.id = snapshot.docs[0].id;

    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("ponto-screen").classList.remove("hidden");
    document.getElementById("user-display").innerText = currentUser.username;

    if(currentUser.admin) document.getElementById("admin-controls").classList.remove("hidden");

    carregarTabela();

  } catch(err){
    document.getElementById("login-error").innerText = err.message;
  }
}

// REGISTRO
async function registrar(){
  const username = document.getElementById("reg-username").value;
  const password = document.getElementById("reg-password").value;

  try {
    const check = await db.collection("usuarios").where("username","==",username).get();
    if(!check.empty){
      document.getElementById("register-error").innerText = "Nome de usuário já existe!";
      return;
    }

    await db.collection("usuarios").add({username,password,admin:false});
    alert("Usuário registrado com sucesso!");
    voltarLogin();
  } catch(err){
    document.getElementById("register-error").innerText = err.message;
  }
}

function mostrarRegistro(){ document.getElementById("login-screen").classList.add("hidden"); document.getElementById("register-screen").classList.remove("hidden"); }
function voltarLogin(){ document.getElementById("register-screen").classList.add("hidden"); document.getElementById("login-screen").classList.remove("hidden"); }

function logout(){ currentUser = null; document.getElementById("login-screen").classList.remove("hidden"); document.getElementById("ponto-screen").classList.add("hidden"); }

function marcarPonto(tipo){
  if(!currentUser) return alert("Usuário não logado");
  navigator.geolocation.getCurrentPosition(async (pos)=>{
    const data = new Date();
    await db.collection("pontos").add({
      usuario: currentUser.username,
      tipo,
      data: data.toISOString(),
      localizacao: `Lat:${pos.coords.latitude.toFixed(5)},Lng:${pos.coords.longitude.toFixed(5)}`
    });
    carregarTabela();
  },()=>alert("Não foi possível obter localização."));
}

async function carregarTabela(){
  if(!currentUser) return;
  let snapshot;
  if(currentUser.admin) snapshot = await db.collection("pontos").orderBy("data","desc").get();
  else snapshot = await db.collection("pontos").where("usuario","==",currentUser.username).orderBy("data","desc").get();

  const tbody = document.querySelector("#tabela-pontos tbody");
  tbody.innerHTML = "";
  snapshot.forEach(doc=>{
    const r = doc.data();
    tbody.innerHTML += `<tr>
      <td>${r.usuario}</td>
      <td>${r.tipo}</td>
      <td>${new Date(r.data).toLocaleString()}</td>
      <td>${r.localizacao}</td>
      <td>${currentUser.admin || r.usuario===currentUser.username ? `<button onclick="excluir('${doc.id}')">🗑️</button>`:""}</td>
    </tr>`;
  });
}

function excluir(id){ if(confirm("Deseja excluir este registro?")) db.collection("pontos").doc(id).delete().then(()=> carregarTabela()); }

// PDF / Excel podem ser mantidos iguais
