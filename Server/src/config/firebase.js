import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import "dotenv/config";

function getServiceAccount() {
  // Prefer JSON file path if provided
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
  // Otherwise use individual env vars
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}

if (!admin.apps.length) {
  const credential = getServiceAccount();
  const initConfig = {
    credential:
      typeof credential === "string"
        ? admin.credential.applicationDefault()
        : credential.projectId
          ? admin.credential.cert(credential)
          : admin.credential.applicationDefault(),
  };
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (projectId) {
    initConfig.storageBucket = `${projectId}.firebasestorage.app`;
  }
  admin.initializeApp(initConfig);
}

export const db = getFirestore();
export const auth = getAuth();
export const bucket = getStorage().bucket();
export default admin;
