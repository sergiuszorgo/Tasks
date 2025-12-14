import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ⚠️ ЗАМЕНИТЕ НА ВАШИ ДАННЫЕ ИЗ FIREBASE CONSOLE!
// Получить их можно: Firebase Console → Project Settings → Your apps → Web app
const firebaseConfig = {
  apiKey: "AIzaSyAHF1ekxjuxDnwhmNKdEeYxPs9Qu-WV8r8",
  authDomain: "tasks-aee13.firebaseapp.com",
  projectId: "tasks-aee13",
  storageBucket: "tasks-aee13.firebasestorage.app",
  messagingSenderId: "644815447584",
  appId: "1:644815447584:web:bf9c7c3c046f9b84a47e45"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Экспорт сервисов
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
