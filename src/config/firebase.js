import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Puedes sobrescribir estos valores creando un archivo .env.local con las
// variables EXPO_PUBLIC_FIREBASE_* (ver .env.example). Si no existen, se usan
// los valores por defecto del proyecto.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyD8sSxCABWpwgPYcQ-QEfl-AKkqQAf4T-E',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'escanearprecios.firebaseapp.com',
  databaseURL:
    process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ?? 'https://escanearprecios-default-rtdb.firebaseio.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'escanearprecios',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'escanearprecios.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '443648127078',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:443648127078:web:eaa752c88ac69fdc11fda7',
};

// getApps() evita el error "app ya inicializada" con Fast Refresh
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getDatabase(app);
