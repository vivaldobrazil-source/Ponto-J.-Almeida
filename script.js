/*************************
 * CONFIGURAÇÕES
 *************************/
const ADMIN_CPF = "00000000000";
let usuarioLogado = null;

/*************************
 * CPF VALIDAÇÃO
 *************************/
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += cpf[i] * (10 - i);
    let dig1 = (soma * 10) % 11;
    if (dig1 === 10) dig1 = 0;
    if (dig1 != cpf[9]) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += cpf[i] * (11 - i);
    let dig2 = (soma * 10) % 11;
    if (dig2 === 10) dig2 = 0;

    return dig2 == cpf[10];
}

/*************************
 * CADASTRO
 *************************/
function cadastrar() {
    const cpf = cadUsuario.value.replace(/\D/g, '');
    const senha = cadSenha.value;

    if (!validarCPF(cpf)) {
        msgCadastro.innerText = "CPF inválido";
        return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(senha)) {
        msgCadastro.innerText = "Senha deve ter letras e números";
        return;
    }

    let users = JSON.parse(localStorage.getItem("usuarios") || "{}");
    users[cpf] = btoa(senha);

    localStorage.setItem("usuarios", JSON.stringify(users));

    msgCadastro.innerText = "Cadastro realizado com sucesso";
    cadastro.classList.add("hidden");
    login.classList.remove("hidden");
}

/*************************
 * LOGIN
 *************************/
function entrar() {
    const cpf = loginUsuario.value.replace(/\D/g, '');
    const senha = loginSenha.value;
    const users = JSON.parse(localStorage.getItem("usuarios") || "{}");

    if (
        (users[cpf] && atob(users[cpf]) === senha) ||
        (cpf === ADMIN_CPF && senha === "J.ALMEIDA")
    ) {
        usuarioLogado = cpf;
        login.classList.add("hidden");
        sistema.classList.remove("hidden");
        carregarUsuarios();
        listarHistorico();
    } else {
        msgLogin.innerText = "CPF ou senha inválidos";
    }
}

/*************************
 * LOGOUT
 *************************/
function logout() {
    usuarioLogado = null;
    sistema.classList.add("hidden");
    login.classList.remove("hidden");
}

/*************************
 * REGISTROS
 *************************/
function registrar(tipo) {
    navigator.geolocation.getCurrentPosition(async pos => {
        const geo = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
        ).then(r => r.json());

        salvarRegistro(tipo, geo.display_name);
    });
}

function registrarAlmoco(tipo) {
    const hoje = new Date().toLocaleDateString();
    if (obterRegistros().some(r => r.usuario === usuarioLogado && r.tipo === tipo && r.data === hoje)) {
        msgSistema.innerText = "Registro já realizado hoje";
        return;
    }
    registrar(tipo);
}

function salvarRegistro(tipo, endereco) {
    const registros = obterRegistros();
    const agora = new Date();

    registros.push({
        usuario: usuarioLogado,
        tipo,
        data: agora.toLocaleDateString(),
        hora: agora.toLocaleTimeString(),
        endereco
    });

    localStorage.setItem("registros", JSON.stringify(registros));
    listarHistorico();
    msgSistema.innerText = "Registro gravado com sucesso!";
}

function obterRegistros() {
    return JSON.parse(localStorage.getItem("registros") || "[]");
}

/*************************
 * CÁLCULO DE HORAS
 *************************/
function calcularHoras(registros) {
    let total = 0;

    for (let i = 0; i < registros.length; i += 4) {
        const entrada = registros[i];
        const saida = registros[i + 3];
        if (!entrada || !saida) continue;

        const h1 = new Date(`1970-01-01 ${entrada.hora}`);
        const h2 = new Date(`1970-01-01 ${saida.hora}`);
        total += (h2 - h1) / 3600000;
    }
    return total.toFixed(2);
}

/*************************
 * HISTÓRICO
 *************************/
function listarHistorico() {
    historico.innerHTML = "";
    const registros = obterRegistros().filter(r => r.usuario === usuarioLogado);

    registros.forEach(r => {
        const li = document.createElement("li");
        li.innerText = `${r.data} ${r.hora} - ${r.tipo}\n${r.endereco}`;
        historico.appendChild(li);
    });
}

/*************************
 * ADMIN
 *************************/
function carregarUsuarios() {
    if (usuarioLogado !== ADMIN_CPF) return;
    admin.classList.remove("hidden");

    const users = JSON.parse(localStorage.getItem("usuarios") || "{}");
    filtroUsuario.innerHTML = "<option value=''>Todos</option>";

    Object.keys(users).forEach(u => {
        filtroUsuario.innerHTML += `<option value="${u}">${u}</option>`;
    });
}
