import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBLOLTvrI35YTgRm0yrkS7YGD3eRVN1tbM",
  authDomain: "typerush-2bb49.firebaseapp.com",
  projectId: "typerush-2bb49",
  storageBucket: "typerush-2bb49.firebasestorage.app",
  messagingSenderId: "930187000694",
  appId: "1:930187000694:web:c125b5f9920f2372689857",
  measurementId: "G-S54NS2D6VD"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const analytics = getAnalytics(app);