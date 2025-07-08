// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCmsPVdcipdwHUfVk1yKs8eVUFC_60Iv7M",
  authDomain: "space-anon.firebaseapp.com",
  projectId: "space-anon",
  storageBucket: "space-anon.firebasestorage.app",
  messagingSenderId: "45172400492",
  appId: "1:45172400492:web:403387357265b6cf585349",
  measurementId: "G-1HGNB3D8S8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db };