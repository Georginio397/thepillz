
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; 

const firebaseConfig = {
  apiKey: "xxx",
  authDomain: "xxx",
  databaseURL: "https://xxx.firebaseio.com", 
  projectId: "xxx",
  storageBucket: "xxx",
  messagingSenderId: "xxx",
  appId: "xxx"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
