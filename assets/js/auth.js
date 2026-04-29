/* ============================================
   NOVA ENERGIA - Sistema de Autenticación
   Almacenamiento local (localStorage) — Fase 1
   ============================================ */

const AUTH_KEY = 'nova_users_v1';
const SESSION_KEY = 'nova_session_v1';

// Usuario master de Ricardo (siempre disponible)
const MASTER_USER = {
  email: 'ricardo.lozada.or@gmail.com',
  name: 'Ricardo Lozada',
  password: 'NovaMaster2026', // Cambia esto desde el panel de administración
  role: 'master',
  createdAt: '2026-01-01T00:00:00.000Z'
};

// --- Helpers de almacenamiento ---
function getUsers() {
  const raw = localStorage.getItem(AUTH_KEY);
  let users = raw ? JSON.parse(raw) : [];
  // Asegura que el master siempre exista
  if (!users.find(u => u.email === MASTER_USER.email)) {
    users.unshift(MASTER_USER);
    localStorage.setItem(AUTH_KEY, JSON.stringify(users));
  }
  return users;
}

function saveUsers(users) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(users));
}

function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function setSession(user) {
  const session = {
    email: user.email,
    name: user.name,
    role: user.role,
    loggedAt: new Date().toISOString()
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// --- API pública ---
const Auth = {
  register({ name, email, password }) {
    if (!name || !email || !password) {
      return { ok: false, error: 'Todos los campos son obligatorios.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }
    const users = getUsers();
    const emailLower = email.toLowerCase().trim();
    if (users.find(u => u.email.toLowerCase() === emailLower)) {
      return { ok: false, error: 'Ya existe un usuario con ese correo.' };
    }
    const newUser = {
      email: emailLower,
      name: name.trim(),
      password, // En producción debería estar hasheado. Para Fase 1 local es aceptable.
      role: 'user',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);
    setSession(newUser);
    return { ok: true, user: newUser };
  },

  login({ email, password }) {
    const users = getUsers();
    const emailLower = (email || '').toLowerCase().trim();
    const user = users.find(u => u.email.toLowerCase() === emailLower);
    if (!user) return { ok: false, error: 'Usuario no encontrado.' };
    if (user.password !== password) return { ok: false, error: 'Contraseña incorrecta.' };
    setSession(user);
    return { ok: true, user };
  },

  logout() {
    clearSession();
    window.location.href = 'login.html';
  },

  current() {
    return getSession();
  },

  // Protege una página: si no hay sesión, redirige al login
  requireAuth(redirect = 'login.html') {
    const session = getSession();
    if (!session) {
      window.location.href = redirect;
      return null;
    }
    return session;
  },

  isMaster() {
    const s = getSession();
    return s && s.role === 'master';
  },

  listUsers() {
    return getUsers();
  },

  deleteUser(email) {
    if (email.toLowerCase() === MASTER_USER.email.toLowerCase()) {
      return { ok: false, error: 'No se puede eliminar al usuario master.' };
    }
    const users = getUsers().filter(u => u.email.toLowerCase() !== email.toLowerCase());
    saveUsers(users);
    return { ok: true };
  }
};

// --- Render del sidebar (común a todas las páginas internas) ---
function renderSidebar(activeKey) {
  const session = Auth.current();
  if (!session) return '';

  const initials = session.name
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('');

  const links = [
    { key: 'inicio',           href: '../index.html',                          label: 'Inicio',                   icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
    { section: 'Herramientas activas' },
    { key: 'geoportales',      href: 'geoportales.html',                       label: 'Geoportales',              icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20' },
    { key: 'caida-voltaje',    href: 'caida-voltaje.html',                     label: 'Caída de voltaje',         icon: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z' },
    { key: 'factor-planta',    href: 'factor-planta.html',                     label: 'Factor de planta',         icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z' },
    { section: 'En desarrollo' },
    { key: 'dimensionamiento', href: 'dimensionamiento.html',                  label: 'Dimensionamiento PV',      icon: 'M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM3 9h18M9 3v18' },
    { key: 'planilla-ocr',     href: 'planilla-ocr.html',                      label: 'Análisis de planilla',     icon: 'M9 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2h-3M9 2v4h6V2M9 14h6M9 18h6M9 10h6' },
  ];

  // Si estamos en la raíz (index.html), los hrefs son distintos
  const isRoot = !window.location.pathname.includes('/herramientas/');

  const navHtml = links.map(l => {
    if (l.section) {
      return `<div class="nav-section">${l.section}</div>`;
    }
    let href = l.href;
    if (isRoot) {
      href = href.startsWith('../') ? href.substring(3) : 'herramientas/' + href;
    }
    const active = l.key === activeKey ? 'active' : '';
    return `<a class="nav-link ${active}" href="${href}">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="${l.icon}"/>
      </svg>
      <span>${l.label}</span>
    </a>`;
  }).join('');

  const adminLink = session.role === 'master'
    ? `<a class="nav-link ${activeKey === 'admin' ? 'active' : ''}" href="${isRoot ? 'admin.html' : 'admin.html'}">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
        <span>Administración</span>
      </a>`
    : '';

  const logoSrc = isRoot ? 'assets/img/logo.png' : '../assets/img/logo.png';

  return `
    <aside class="sidebar">
      <div class="logo-area">
        <img src="${logoSrc}" alt="NOVA ENERGIA" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
        <div style="display:none">
          <div class="logo-text">NOVA</div>
          <div class="logo-sub">ENERGIA</div>
        </div>
      </div>
      <nav>
        ${navHtml}
        ${adminLink}
      </nav>
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

// Inyecta el sidebar en cualquier página que lo invoque
function mountSidebar(activeKey) {
  const session = Auth.requireAuth(
    window.location.pathname.includes('/herramientas/') ? '../login.html' : 'login.html'
  );
  if (!session) return;
  const slot = document.getElementById('sidebar-slot');
  if (slot) slot.outerHTML = renderSidebar(activeKey);
}
