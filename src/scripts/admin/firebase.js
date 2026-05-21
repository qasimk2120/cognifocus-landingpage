import { initializeApp, getApps } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";

const readEnv = (key) => String(import.meta.env[key] || "").trim();

const firebaseConfig = {
  apiKey: readEnv("PUBLIC_FIREBASE_API_KEY"),
  authDomain: readEnv("PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: readEnv("PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: readEnv("PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: readEnv("PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: readEnv("PUBLIC_FIREBASE_APP_ID"),
  measurementId: readEnv("PUBLIC_FIREBASE_MEASUREMENT_ID"),
};

const requiredConfigKeys = [
  "apiKey",
  "authDomain",
  "projectId",
  "appId",
];

let authPromise;

function assertFirebaseConfig() {
  const missing = requiredConfigKeys.filter((key) => !firebaseConfig[key]);

  if (missing.length > 0) {
    throw new Error(
      `Firebase admin config is missing: ${missing.join(", ")}.`,
    );
  }
}

export async function getAdminAuth() {
  if (!authPromise) {
    authPromise = (async () => {
      assertFirebaseConfig();
      const app =
        getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      const auth = getAuth(app);

      await setPersistence(auth, browserLocalPersistence);
      return auth;
    })();
  }

  return authPromise;
}
