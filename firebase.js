// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyD4_h3WU2tkzE5G6jXimQUjYj2bUVliYUk",
    authDomain: "iedc-ux.firebaseapp.com",
    projectId: "iedc-ux",
    storageBucket: "iedc-ux.firebasestorage.app",
    messagingSenderId: "362260352304",
    appId: "1:362260352304:web:27374dbb9b51182807ccf5",
    measurementId: "G-2KH08MNGSX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);