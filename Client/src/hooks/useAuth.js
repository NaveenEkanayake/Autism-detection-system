import { useState } from "react";

const DEMO_USER = { id: "demo-user-1", email: "parent@demo.com", name: "Demo Parent" };

export function useAuth() {
  const [user, setUser] = useState(DEMO_USER);

  return { user, setUser };
}
