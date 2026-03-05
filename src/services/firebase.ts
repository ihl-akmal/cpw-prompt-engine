
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// Read credentials from Vite's environment variables
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// A function to check if all required config values are present
export const isFirebaseConfigured = 
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId;

// Initialize Firebase
const app = initializeApp(isFirebaseConfigured ? firebaseConfig : {});
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app); // Export firestore instance

// --- User Profile ---
export interface UserProfile {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null; // Tambahkan photoURL
  isPro: boolean;
}

/**
 * Retrieves a user's profile from Firestore, creating it if it doesn't exist.
 * @param user The Firebase Auth user object.
 * @returns The user's profile data.
 */
export const getUserProfile = async (user: User): Promise<UserProfile> => {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  } else {
    const newUserProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      name: user.displayName,
      photoURL: user.photoURL, // Simpan photoURL saat membuat profil baru
      isPro: false, 
    };
    await setDoc(userRef, newUserProfile);
    return newUserProfile;
  }
};
