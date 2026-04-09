// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCLNlQG4-16KNzQpFdC4L2fFhtyVEiSrkY",
  authDomain: "emnlcarrental.firebaseapp.com",
  projectId: "emnlcarrental",
  storageBucket: "emnlcarrental.firebasestorage.app",
  messagingSenderId: "539513947059",
  appId: "1:539513947059:web:bd4c76fc3c4cb717e201c6",
  measurementId: "G-0DC12T8REX",
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with unlimited local cache
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export { auth, provider, app };
export { db };