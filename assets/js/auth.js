/* ============================================
   NOVA ENERGIA - Sistema de Autenticación con Firebase
   Reemplaza el sistema localStorage anterior.
   ============================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, setPersistence, browserLocalPersistence,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged,
  sendPasswordResetEmail, updatePassword
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc,
  collection, getDocs, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig, MASTER_EMAIL } from "./firebase-config.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Persistencia: mantener sesión aunque cierre el navegador
setPersistence(auth, browserLocalPersistence);

// Estado global de la sesión (cache en memoria)
let currentUser = null;
let currentProfile = null;
let authReady = false;
const authReadyCallbacks = [];

// Escuchar cambios de autenticación
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    currentProfile = await getUserProfile(user.uid);
    // Si no tiene perfil aún (primera vez con Google Sign-In), crearlo
    if (!currentProfile) {
      currentProfile = await createUserProfile(user);
    }
  } else {
    currentUser = null;
    currentProfile = null;
  }
  authReady = true;
  authReadyCallbacks.forEach(cb => cb());
  authReadyCallbacks.length = 0;
});

// Espera hasta que Firebase determine estado de auth
function waitAuthReady() {
  return new Promise(resolve => {
    if (authReady) resolve();
    else authReadyCallbacks.push(resolve);
  });
}

// Crear perfil de usuario en Firestore
async function createUserProfile(user, extra = {}) {
  const isMaster = user.email && user.email.toLowerCase() === MASTER_EMAIL.toLowerCase();
  const profile = {
    email: user.email,
    name: extra.name || user.displayName || user.email.split('@')[0],
    role: isMaster ? 'master' : 'user',
    active: true,
    createdAt: serverTimestamp()
  };
  await setDoc(doc(db, 'users', user.uid), profile);
  return profile;
}

async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// ============ API pública ============
export const Auth = {
  // Registro con email/password
  async register({ name, email, password }) {
    if (!name || !email || !password) return { ok: false, error: 'Todos los campos son obligatorios.' };
    if (password.length < 6) return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await createUserProfile(cred.user, { name: name.trim() });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: traducirErrorFirebase(err.code) };
    }
  },

  // Login con email/password
  async login({ email, password }) {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: traducirErrorFirebase(err.code) };
    }
  },

  // Login con Google (popup)
  async loginGoogle() {
    try {
      await signInWithPopup(auth, googleProvider);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: traducirErrorFirebase(err.code) };
    }
  },

  // Enviar email de reset de contraseña
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { ok: true };
    } catch (err) {
      return { ok: false, error: traducirErrorFirebase(err.code) };
    }
  },

  // Cerrar sesión
  async logout() {
    await signOut(auth);
    window.location.href = window.location.pathname.includes('/herramientas/') ? '../login.html' : 'login.html';
  },

  // Usuario actual (sync)
  current() {
    if (!currentUser || !currentProfile) return null;
    return {
      uid: currentUser.uid,
      email: currentUser.email,
      name: currentProfile.name,
      role: currentProfile.role
    };
  },

  // Requiere autenticación (para proteger páginas)
  async requireAuth(redirect = 'login.html') {
    await waitAuthReady();
    if (!currentUser) {
      window.location.href = redirect;
      return null;
    }
    return this.current();
  },

  isMaster() {
    return currentProfile && currentProfile.role === 'master';
  },

  // Listar todos los usuarios (solo master)
  async listUsers() {
    const snap = await getDocs(collection(db, 'users'));
    const users = [];
    snap.forEach(d => users.push({ uid: d.id, ...d.data() }));
    return users;
  },

  async setUserRole(uid, role) {
    await updateDoc(doc(db, 'users', uid), { role });
    return { ok: true };
  },

  async setUserActive(uid, active) {
    await updateDoc(doc(db, 'users', uid), { active });
    return { ok: true };
  },

  async deleteUserProfile(uid) {
    await deleteDoc(doc(db, 'users', uid));
    return { ok: true };
  },

  db, auth
};

function traducirErrorFirebase(code) {
  const traducciones = {
    'auth/email-already-in-use': 'Ya existe un usuario con ese correo.',
    'auth/invalid-email': 'Formato de correo inválido.',
    'auth/weak-password': 'La contraseña es demasiado débil.',
    'auth/user-not-found': 'Usuario no encontrado.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
    'auth/network-request-failed': 'Error de red. Verifica tu conexión.',
    'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de completar.',
    'auth/popup-blocked': 'El navegador bloqueó la ventana emergente.',
  };
  return traducciones[code] || ('Error: ' + code);
}

// ============ Render del sidebar ============
export function renderSidebar(activeKey) {
  const session = Auth.current();
  if (!session) return '';

  const initials = session.name.split(' ').map(p => p[0]).slice(0, 2).join('');

  const links = [
    { key: 'factor-planta', href: 'factor-planta.html', label: 'Factor de planta',
      icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z' }
  ];

  const isRoot = !window.location.pathname.includes('/herramientas/');

  const navHtml = links.map(l => {
    let href = l.href;
    if (isRoot) href = 'herramientas/' + href;
    const active = l.key === activeKey ? 'active' : '';
    return `<a class="nav-link ${active}" href="${href}">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${l.icon}"/></svg>
      <span>${l.label}</span>
    </a>`;
  }).join('');

  const adminLink = session.role === 'master'
    ? `<a class="nav-link ${activeKey === 'admin' ? 'active' : ''}" href="${isRoot ? 'herramientas/admin.html' : 'admin.html'}">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg><span>Administración</span></a>`
    : '';

  const logoSrc = isRoot ? 'assets/img/logo.png' : '../assets/img/logo.png';

  return `
    <aside class="sidebar">
      <div class="logo-area">
        <img src="${logoSrc}" alt="NOVA ENERGIA" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
        <div style="display:none"><div class="logo-text">NOVA</div><div class="logo-sub">ENERGIA</div></div>
      </div>
      <nav>${navHtml}${adminLink}</nav>
      <div class="user-area">
        <div class="user-info">
          <div class="user-avatar">${initials}</div>
          <div class="user-details">
            <div class="user-name">${session.name}</div>
            <div class="user-role">${session.role === 'master' ? 'Administrador' : 'Usuario'}</div>
          </div>
        </div>
        <button class="logout-btn" onclick="Auth.logout()">Cerrar sesión</button>
      </div>
    </aside>
  `;
}

export async function mountSidebar(activeKey) {
  const session = await Auth.requireAuth(
    window.location.pathname.includes('/herramientas/') ? '../login.html' : 'login.html'
  );
  if (!session) return;
  const slot = document.getElementById('sidebar-slot');
  if (slot) slot.outerHTML = renderSidebar(activeKey);
}

// Exponer globalmente para onclick="Auth.logout()"
window.Auth = Auth;
window.mountSidebar = mountSidebar;
