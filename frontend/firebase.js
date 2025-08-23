import firebase from 'firebase/app';
import 'firebase/auth';

// IMPORTANT: PASTE YOUR FIREBASE CONFIG OBJECT HERE
const firebaseConfig = {
    apiKey: "AIzaSyD7RxU1bYcpQ3IzQuSDwayRptcBDkdG6uo",
    authDomain: "eduportal-9d3ed.firebaseapp.com",
    projectId: "eduportal-9d3ed",
    storageBucket: "eduportal-9d3ed.firebasestorage.app",
    messagingSenderId: "185373487881",
    appId: "1:185373487881:web:86ee83d70d90ff1cadd9d8"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();