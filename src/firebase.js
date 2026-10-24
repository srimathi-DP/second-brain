import { getAuth } from "firebase/auth";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAkph6rGbt3XiJ83doJ6lQ4llxHTpUctyE",
  authDomain: "second-brain-c59dc.firebaseapp.com",
  projectId: "second-broain-c59dc",
  storageBucket: "second-brain-c59dc.firebasestorage.app",
  messagingSenderId: "210790570171",
  appId: "1:210790570171:web:bb9a9e4ef4751ac9d8319e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);