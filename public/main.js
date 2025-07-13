const translations = {
  en: {
    login: 'Login',
    email: 'Email',
    password: 'Password',
    register: 'Register',
    haveAccount: 'Already have an account?',
    name: 'Name',
    plan: 'Plan',
    free: 'Free',
    pro: 'Pro',
    dashboardTitle: 'Dashboard',
    welcome: 'Welcome',
    manageScripts: 'Create Script',
    logout: 'Logout',
    createScript: 'Create Script',
    script: 'Script',
    frequency: 'Frequency',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    hour: 'Hour',
    emails: 'Emails',

    continue: 'Continue',
    select: 'Select',
    freeLimit: '300 char input',
    freeOutput: '500 char output',
    proLimit: '600 char input',
    proOutput: 'Unlimited output',
    profile: 'Profile',
    save: 'Save',
    currentPassword: 'Current password',
    newPassword: 'New password',
    deleteAccount: 'Delete account',
    changePlan: 'Change plan',

    create: 'Create',
    myScripts: 'My Scripts',
    update: 'Update',
    noScripts: 'No scripts found',
    history: 'History',
    noHistory: 'No history',
    test: 'Test'

  },
  es: {
    login: 'Iniciar sesión',
    email: 'Correo',
    password: 'Contraseña',
    register: 'Registrarse',
    haveAccount: '¿Ya tienes una cuenta?',
    name: 'Nombre',
    plan: 'Plan',
    free: 'Gratis',
    pro: 'Pro',
    dashboardTitle: 'Panel',
    welcome: 'Bienvenido',
    manageScripts: 'Crear Script',
    logout: 'Cerrar sesión',
    createScript: 'Crear Script',
    script: 'Script',
    frequency: 'Frecuencia',
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    hour: 'Hora',
    emails: 'Correos',

    continue: 'Continuar',
    select: 'Seleccionar',
    freeLimit: '300 caracteres de entrada',
    freeOutput: '500 caracteres de salida',
    proLimit: '600 caracteres de entrada',
    proOutput: 'Sin límite de salida',
    profile: 'Perfil',
    save: 'Guardar',
    currentPassword: 'Contraseña actual',
    newPassword: 'Nueva contraseña',
    deleteAccount: 'Eliminar cuenta',
    changePlan: 'Cambiar plan',

    create: 'Crear',
    myScripts: 'Mis Scripts',
    update: 'Actualizar',
    noScripts: 'No hay scripts',
    history: 'Historial',
    noHistory: 'Sin historial',
    test: 'Probar'

  }
};

function setLang(lang) {
  const dict = translations[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });
  document.documentElement.lang = lang;
  localStorage.setItem('lang', lang);
}

function initLang() {
  const lang = localStorage.getItem('lang') || 'en';
  const select = document.getElementById('langToggle');
  if (select) {
    select.value = lang;
    select.addEventListener('change', () => setLang(select.value));
  }
  setLang(lang);
}

function setDark(on) {
  if (on) document.body.classList.add('dark');
  else document.body.classList.remove('dark');
  localStorage.setItem('dark', on ? '1' : '');
}

function initDark() {
  const btn = document.getElementById('darkToggle');
  const on = localStorage.getItem('dark') === '1';
  setDark(on);
  if (btn) {
    btn.textContent = on ? '☀️' : '🌙';
    btn.addEventListener('click', () => {
      const active = document.body.classList.contains('dark');
      setDark(!active);
      btn.textContent = !active ? '☀️' : '🌙';
    });
  }
}

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('menuToggle');
  if (sidebar && toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggle) {
        sidebar.classList.remove('open');
      }
    });
  }
}

async function checkSession(redirect) {
  try {
    const res = await fetch('/api/auth/session');
    const data = await res.json();
    if (!data.user && redirect) {
      window.location.href = '/index.html';
    }
    return data.user;
  } catch (e) {
    if (redirect) window.location.href = '/index.html';
    return null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initLang();
  initDark();
  initSidebar();
});
