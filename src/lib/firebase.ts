import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

// Debug: Log environment variables (excluding sensitive data)
console.log('Firebase Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log('Environment Variables Present:', {
  hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
  hasAuthDomain: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
  hasStorageBucket: !!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  hasMessagingSenderId: !!import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  hasAppId: !!import.meta.env.VITE_FIREBASE_APP_ID,
});

// Construct database URL with region
const databaseURL = `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: databaseURL, // Updated database URL format
};

// Debug: Log the constructed database URL
console.log('Constructed Database URL:', databaseURL);

// Initialize Firebase with error handling
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

// Initialize Auth with error handling
let auth;
try {
  auth = getAuth(app);
  console.log('Auth initialized successfully');
} catch (error) {
  console.error('Error initializing Auth:', error);
  throw error;
}

// Initialize Realtime Database with error handling
let database;
try {
  database = getDatabase(app);
  console.log('Realtime Database initialized successfully');
} catch (error) {
  console.error('Error initializing Realtime Database:', error);
  throw error;
}

// Initialize Firestore with error handling
let firestore;
try {
  firestore = getFirestore(app);
  console.log('Firestore initialized successfully');
} catch (error) {
  console.error('Error initializing Firestore:', error);
  throw error;
}

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Set persistence to LOCAL with better error handling
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Auth persistence set successfully');
  })
  .catch((error) => {
    console.error('Error setting auth persistence:', error);
  });

export { auth, database, firestore, googleProvider };
