// FormFillAI — Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDDCJQHjclB8cWnuKV2tGy87vg2Tsb7IoI",
  authDomain: "formfiller-pro-1eb71.firebaseapp.com",
  projectId: "formfiller-pro-1eb71",
  storageBucket: "formfiller-pro-1eb71.firebasestorage.app",
  messagingSenderId: "902823761371",
  appId: "1:902823761371:web:4ff86f39cd17e1db9143fe",
  measurementId: "G-ER483D6271"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
