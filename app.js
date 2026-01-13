// FIREBASE CONFIG
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

// MOSTRAR / VOLTAR
function mostrarRegistro(){
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("register-screen").classList.remove("hidden");
}
function voltarLogin(){
  document.getElementById("register-screen").classList.add("hidden");
  document.getElementById("login-screen").classList.remove("hidden");
}

// LOGOUT
function logout(){
  currentUser = null;
  document.getElementById("login-screen").classList.remove("hidden");
  document.getElementById("ponto-screen").classList.add("hidden");
}

// MARCAR PONTO
function marcarPonto(tipo){
  if(!currentUser) return alert("Usuário não logado");
  navigator.geolocation.getCurrentPosition(async (pos)=>{
    const data = new Date();
    await db.collection("pontos").add({
      usuario: currentUser.username,
