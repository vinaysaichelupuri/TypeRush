// import { initializeApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore';

// const firebaseConfig = {
//   apiKey: "AIzaSyDJH7o6R2q9Ujs9zvw13nVjJMXIChzci2M",
//   authDomain: "typerush-edb26.firebaseapp.com",
//   projectId: "typerush-edb26",
//   storageBucket: "typerush-edb26.firebasestorage.app",
//   messagingSenderId: "314664644257",
//   appId: "1:314664644257:web:41e38228d2b8a923790ae0",
//   measurementId: "G-XF1R2CB3CP"
// };


// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// // Initialize Firestore
// export const db = getFirestore(app);
// export default app;


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDJH7o6R2q9Ujs9zvw13nVjJMXIChzci2M",
  authDomain: "typerush-edb26.firebaseapp.com",
  projectId: "typerush-edb26",
  storageBucket: "typerush-edb26.firebasestorage.app",
  messagingSenderId: "314664644257",
  appId: "1:314664644257:web:41e38228d2b8a923790ae0",
  measurementId: "G-XF1R2CB3CP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const analytics = getAnalytics(app);