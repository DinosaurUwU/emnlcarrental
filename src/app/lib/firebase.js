// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCLNlQG4-16KNzQpFdC4L2fFhtyVEiSrkY",
  authDomain: "emnlcarrental.firebaseapp.com",
  projectId: "emnlcarrental",
  storageBucket: "emnlcarrental.firebasestorage.app",
  messagingSenderId: "539513947059",
  appId: "1:539513947059:web:bd4c76fc3c4cb717e201c6",
  measurementId: "G-0DC12T8REX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
  } else if (err.code === "unimplemented") {
    console.warn("The current browser does not support persistence.");
  }
});

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export { auth, provider, app };







// // firebase.js
// import { initializeApp } from "firebase/app";
// import { getAuth, GoogleAuthProvider } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey: "AIzaSyAtz60siT7lG573a1LTvWyAGrodZKUmBPE",
//   authDomain: "emnl-car-rental-ormoc.firebaseapp.com",
//   projectId: "emnl-car-rental-ormoc",
//   storageBucket: "emnl-car-rental-ormoc.firebasestorage.app",
//   messagingSenderId: "1098566374959",
//   appId: "1:1098566374959:web:109acde0e82be02fc7d8da",
//   measurementId: "G-RRHTE0HH4W",
// };

// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// export const db = getFirestore(app);
// const provider = new GoogleAuthProvider();
// provider.setCustomParameters({ prompt: "select_account" });

// export { auth, provider, app };
