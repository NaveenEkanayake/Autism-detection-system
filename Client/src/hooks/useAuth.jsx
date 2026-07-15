import { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        console.log("[Auth] User logged in:", firebaseUser.email);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0],
        });
      } else {
        console.log("[Auth] User logged out");
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("[Auth] Login successful:", result.user.email);
      return result;
    } catch (err) {
      console.error("[Auth] Login failed:", err.code, err.message);
      throw err;
    }
  };

  const signup = async (email, password, name) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      console.log("[Auth] Signup successful:", cred.user.email);
      await updateProfile(cred.user, { displayName: name });
      console.log("[Auth] Profile updated with name:", name);
      return cred;
    } catch (err) {
      console.error("[Auth] Signup failed:", err.code, err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      console.log("[Auth] Logged out successfully");
    } catch (err) {
      console.error("[Auth] Logout failed:", err.code, err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
