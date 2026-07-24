import { initializeApp } from "firebase/app";
import {getAuth,GoogleAuthProvider} from  "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxYQBX_ubPoyxGhJ3rZ-nMszFnOrZJ0eo",
  authDomain: "chat-flow-41057.firebaseapp.com",
  projectId: "chat-flow-41057",
  storageBucket: "chat-flow-41057.firebasestorage.app",
  messagingSenderId: "177577408640",
  appId: "1:177577408640:web:6f5a174950be669f54ce65",
  measurementId: "G-2VYSJMS0PE"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 
  