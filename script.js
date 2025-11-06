// === Importações do Firebase (versão modular) ===
import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";

import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  collection, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


// === Configuração do seu projeto Firebase ===
const firebaseConfig = {
  apiKey: "AIzaSyB6yomHyxKUVYCNjDVzK_ruFO8RYMZvl_k",
  authDomain: "sistema-rid-001.firebaseapp.com",
  projectId: "sistema-rid-001",
  storageBucket: "sistema-rid-001.firebasestorage.app",
  messagingSenderId: "875061628205",
  appId: "1:875061628205:web:46dda695f0aa0b611157a4"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// === LOGIN / CADASTRO ===

// Substitui o CPF por um e-mail falso (Firebase exige e-mail para Auth)
function cpfToEmail(cpf) {
  return cpf.replace(/\D/g, '') + "@ridapp.fake";
}

// Cadastro
async function registerUser(nome, cpf, senha) {
  const email = cpfToEmail(cpf);
  const cred = await createUserWithEmailAndPassword(auth, email, senha);
  
  // Salva dados adicionais no Firestore
  await setDoc(doc(db, "usuarios", cred.user.uid), {
    nome,
    cpf,
    tipoUsuario: "funcionario",
    dataCadastro: new Date().toISOString()
  });
  
  alert("Cadastro realizado com sucesso!");
}

// Login
async function loginUser(cpf, senha) {
  const email = cpfToEmail(cpf);
  await signInWithEmailAndPassword(auth, email, senha);
}

// Observa se há usuário logado
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
    const dados = userDoc.data();
    
    if (dados.tipoUsuario === "admin") {
      showPage("adminPanel");
    } else {
      showPage("employeePanel");
    }
  } else {
    showPage("loginPage");
  }
});

// Logout
async function logoutUser() {
  await signOut(auth);
  showPage("loginPage");
}


// === CRUD DE RIDs ===

// Criação
async function criarRID(ridData) {
  await addDoc(collection(db, "rids"), {
    ...ridData,
    criadoPor: auth.currentUser.uid,
    criadoEm: new Date().toISOString()
  });
  alert("RID criado com sucesso!");
}

// Listagem
async function listarRIDs() {
  const snapshot = await getDocs(collection(db, "rids"));
  const lista = [];
  snapshot.forEach(doc => lista.push({ id: doc.id, ...doc.data() }));
  console.log(lista);
  return lista;
}


// === CONTROLE DE TELAS ===

function showPage(pageId) {
  const pages = document.querySelectorAll("body > div[id]");
  pages.forEach(p => p.classList.add("hidden"));
  
  const active = document.getElementById(pageId);
  if (active) active.classList.remove("hidden");
}

// === EVENTOS DE FORMULÁRIOS ===

// Login
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const cpf = document.getElementById("loginCpf").value;
  const senha = document.getElementById("loginPassword").value;
  try {
    await loginUser(cpf, senha);
  } catch (err) {
    alert("Erro ao fazer login: " + err.message);
  }
});

// Cadastro
document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = document.getElementById("registerName").value;
  const cpf = document.getElementById("registerCpf").value;
  const senha = document.getElementById("registerPassword").value;
  try {
    await registerUser(nome, cpf, senha);
  } catch (err) {
    alert("Erro no cadastro: " + err.message);
  }
});

// Logout (Admin / Funcionário)
document.querySelectorAll("[id^='logout']").forEach(btn => {
  btn.addEventListener("click", logoutUser);
});

// --- Botão UI-only: ocultar RIDs da tela (não apaga do banco) ---

const hideRidsBtn = document.getElementById("hideRidsBtn");

function hideRidsUI() {
  const ridTable = document.getElementById("ridTableBody");
  if (ridTable) {
    ridTable.style.display = "none";
    alert("RIDs ocultos apenas da visualização. Nenhum dado foi apagado.");
  }
  // salva a preferência no navegador
  localStorage.setItem("rid_hide_ui", "1");
}

function restoreRidsUI() {
  const ridTable = document.getElementById("ridTableBody");
  if (ridTable) ridTable.style.display = "";
  localStorage.removeItem("rid_hide_ui");
}

// Mostrar/ocultar botão e estado ao carregar
document.addEventListener("DOMContentLoaded", () => {
  const adminPanel = document.getElementById("adminPanel");
  if (adminPanel && !adminPanel.classList.contains("hidden")) {
    hideRidsBtn?.classList.remove("hidden");
  }

  if (localStorage.getItem("rid_hide_ui") === "1") {
    hideRidsUI();
  }
});

// Ação do botão
hideRidsBtn?.addEventListener("click", () => {
  const confirmHide = confirm("Deseja apenas ocultar os RIDs da tela? Nenhum dado será apagado.");
  if (confirmHide) hideRidsUI();
});
