import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyD3VIZjYjvZxyVSoNrs3FUZxep5r3AXeFA",
  authDomain: "guerreiro-concursos-oficial.firebaseapp.com",
  projectId: "guerreiro-concursos-oficial",
  storageBucket: "guerreiro-concursos-oficial.appspot.com",
  messagingSenderId: "176980973078",
  appId: "1:176980973078:web:110816ab0d4a92d62dc737"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;