import { auth } from "../config/firebase.js";

export async function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  try {
    const idToken = header.split("Bearer ")[1];
    const decoded = await auth.verifyIdToken(idToken);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
