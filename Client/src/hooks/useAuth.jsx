import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    uid: "demo-parent-uid",
    email: "demo@auratrack.com",
    name: "Demo Parent"
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    const mockUser = {
      uid: "demo-parent-uid",
      email: email || "demo@auratrack.com",
      name: email ? email.split("@")[0] : "Demo Parent"
    };
    setUser(mockUser);
    return { user: mockUser };
  };

  const signup = async (email, password, name) => {
    const mockUser = {
      uid: "demo-parent-uid",
      email: email,
      name: name || "Demo Parent"
    };
    setUser(mockUser);
    return { user: mockUser };
  };

  const logout = async () => {
    setUser(null);
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
