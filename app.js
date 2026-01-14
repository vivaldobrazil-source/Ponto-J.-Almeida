// Usuários padrão
const defaultUsers = [{ username: "J.ALMEIDA", password: "J.ALMEIDA", admin: true }];
if(!localStorage.getItem('users')) localStorage.setItem('users', JSON.stringify(defaultUsers));

function showScreen(screenId){
    document.querySelectorAll('.screen').forEach(s => s.style.display='none');
    document.getElementById(screenId).style.display='block';
}

function togglePassword(id){
    const input = document.getElementById(id);
    input.type = input.type==='password'?'text':'password';
}

// Cadastro
function registerUser(){
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-password-confirm').value;
    if(password!==confirm){ alert("Senhas não conferem!"); return; }
    let users = JSON.parse(localStorage.getItem('users'));
    if(users.find(u=>u.username===username)){ alert("Usuário já existe!"); return; }
    users.push({username,password,admin:false});
    localStorage.setItem('users',JSON.stringify(users));
    alert("Usuário cadastrado com sucesso!");
    showScreen('login-screen');
}

// Login
function login(){
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    let users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u=>u.username===username && u.password===password);
    if(!user){ alert("Usuário ou senha inválidos!"); return; }
    document.getElementById('user-name').innerText=username;
    showScreen('main-screen');
    document.getElementById('admin-buttons').style.display=user.admin?'block':'none';
    localStorage.setItem('currentUser',JSON.stringify(user));
    updateTable();
}

// Logout
function logout(){ localStorage.removeItem('currentUser'); showScreen('login-screen'); }

// Adicionar ponto (com Nominatim)
async function addPonto(tipo){
    if(!navigator.geolocation){ alert("Geolocalização não disponível!"); return; }
    navigator.geolocation.getCurrentPosition(async pos=>{
        let registros=JSON.parse(localStorage.getItem('registros')||"[]");
        const currentUser=JSON.parse(localStorage.getItem('currentUser'));
        const now=new Date();

        if(tipo==='almoco' && registros.find(r=>r.user===currentUser.username && r.tipo==='almoco' && r.data===now.toLocaleDateString())){
            alert("Você já registrou a saída para almoço hoje!"); return;
        }
        if(tipo==='retorno' && registros.find(r=>r.user===currentUser.username && r.tipo==='retorno' && r.data===now.toLocaleDateString())){
            alert("Você já registrou o retorno do almoço hoje!"); return;
        }

        const lat=pos.coords.latitude;
        const lon=pos.coords.longitude;
        const endereco=await getEnderecoNominatim(lat,lon);

        const ponto={user:currentUser.username,tipo,data:now.toLocaleDateString(),hora:now.toLocaleTimeString(),
            rua:endereco.road||"",numero:endereco.house_number||"",bairro:endereco.suburb||"",
            cidade:endereco.city||endereco.town||endereco.village||"",cep:endereco.postcode||""};

        registros.push(ponto);
        localStorage.setItem('registros',JSON.stringify(registros));
        document.getElementById('message').innerText="Registro gravado com Sucesso!";
        setTimeout(()=>{document.getElementById('message').innerText='';},3000);
        updateTable();
    },()=>{ alert("Erro ao obter geolocalização!"); });
}

// Nominatim
async function getEnderecoNominatim(lat,lon){
    try{
        const res=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`);
        const data=await res.json();
        return data.address||{};
    }catch(e){ console.error("Erro Nominatim:",e); return {}; }
}

// Atualizar tabela
function updateTable(){
    const tableBody=document.querySelector('#pontos-table tbody');
    tableBody.innerHTML='';
    const registros=JSON.parse(localStorage.getItem('registros')||"[]");
    const currentUser=JSON.parse(localStorage.getItem('currentUser'));
    const userFilter=document.getElementById('filter-user').value.trim();
    const startDate=document.getElementById('filter-start').value;
    const endDate=document.getElementById('filter-end').value;

    registros.forEach((r,index)=>{
        if(!currentUser.admin && r.user!==currentUser.username) return;
        if(userFilter && r.user!==userFilter) return;
        const rDate=new Date(r.data.split('/').reverse().join('-'));
        if(startDate && rDate<new Date(startDate)) return;
        if(endDate && rDate>new Date(endDate)) return;

        const row=document.createElement('tr');
        row.className=r.tipo;
        row.innerHTML=`
            <td>${r.user}</td>
            <td>${tipoIcon(r.tipo)} ${r.tipo}</td>
            <td>${r.data}</td>
            <td>${r.hora}</td>
            <td>${r.rua}</td>
            <td>${r.numero}</td>
            <td>${r.bairro}</td>
            <td>${r.cidade}</td>
            <td>${r.cep}</td>
            <td>${currentUser.admin?`<button class="delete-btn" onclick="deleteRegistro(${index})">Excluir</button>`:""}</td>
        `;
        tableBody.appendChild(row);
    });
}

function tipoIcon(tipo){
    switch(tipo){
        case 'entrada': return '🚩';
        case 'saida': return '🏁';
        case 'almoco': return '🍔';
        case 'retorno': return '☕';
        default: return '';
    }
}

// Excluir registro
function deleteRegistro(index){
    if(!confirm("Deseja realmente excluir este registro?")) return;
    let registros=JSON.parse(localStorage.getItem('registros')||"[]");
    registros.splice(index,1);
    localStorage.setItem('registros',JSON.stringify(registros));
    updateTable();
}

// Gerar PDF/Excel
function generateReport(type){
    const registros=JSON.parse(localStorage.getItem('registros')||"[]");
    const username=prompt("Informe o usuário ou deixe em branco para todos:");
    const startDate=prompt("Informe data inicial (dd/mm/aaaa):");
    const endDate=prompt("Informe data final (dd/mm/aaaa):");

    let filtered=registros.filter(r=>{
        const rDate=new Date(r.data.split('/').reverse().join('-'));
        const start=startDate?new Date(startDate.split('/').reverse().join('-')):null;
        const end=endDate?new Date(endDate.split('/').reverse().join('-')):null;
        return (!username || r.user===username)&&(!start||rDate>=start)&&(!end||rDate<=end);
    });

    if(type==='pdf'){
        const { jsPDF }=window.jspdf;
        const doc=new jsPDF();
        doc.text("Relatório de Pontos",10,10);
        filtered.forEach((r,i)=>{
            doc.text(`${r.user} | ${r.tipo} | ${r.data} ${r.hora} | ${r.rua}, ${r.numero}, ${r.bairro}, ${r.cidade}, ${r.cep}`,10,20+i*10);
        });
        doc.save("relatorio.pdf");
    }else if(type==='excel'){
        const ws=XLSX.utils.json_to_sheet(filtered);
        const wb=XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb,ws,"Relatório");
        XLSX.writeFile(wb,"relatorio.xlsx");
    }
}

// Inicializar tabela
document.addEventListener('DOMContentLoaded',()=>{
    if(localStorage.getItem('currentUser')){
        showScreen('main-screen');
        updateTable();
    }
});
