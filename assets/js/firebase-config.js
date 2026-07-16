/* ============================================
   NOVA ENERGIA - Configuración Firebase
   Este archivo contiene las claves públicas de Firebase.
   Las claves aquí son SEGURAS de publicar (Firebase las expone públicamente).
   La seguridad real está en las Reglas de Firestore.
   ============================================ */

export const firebaseConfig = {
  apiKey: "AIzaSyAdegWe3DIfhbftHYnN4FeLBj2Utz3KAAs",
  authDomain: "nova-energia-9ec11.firebaseapp.com",
  projectId: "nova-energia-9ec11",
  storageBucket: "nova-energia-9ec11.firebasestorage.app",
  messagingSenderId: "259230272604",
  appId: "1:259230272604:web:e47b3b3980b2da1ba0aa99",
  measurementId: "G-7F09Y6ED17"
};

// Email del usuario master (siempre queda como admin al registrarse por primera vez)
export const MASTER_EMAIL = 'ricardo.lozada.or@gmail.com';

// Dominio permitido para registro. Solo emails que terminan en este dominio pueden registrarse.
// Poner null (sin comillas) para permitir cualquier dominio.
export const ALLOWED_DOMAIN = '@nova-en.com';
