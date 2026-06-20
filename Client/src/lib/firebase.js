import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD6KLsdWAhQ7mvACDvmyt5Wzq69rN-f08k",
  authDomain: "autismdetection-c0337.firebaseapp.com",
  projectId: "autismdetection-c0337",
  storageBucket: "autismdetection-c0337.firebasestorage.app",
  messagingSenderId: "416579567807",
  appId: "1:416579567807:web:bdd9dcb2e282861919460a",
  measurementId: "G-SZ9NE6PWD2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export default app;
