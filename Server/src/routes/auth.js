import { Router } from "express";
import { auth } from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

// Get current user profile (including linked patients)
router.get("/me", verifyToken, async (req, res) => {
  try {
    const userRecord = await auth.getUser(req.user.uid);
    res.json({
      uid: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName || userRecord.email?.split("@")[0],
      photoURL: userRecord.photoURL,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile
router.put("/me", verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    await auth.updateUser(req.user.uid, { displayName: name });
    res.json({ message: "Profile updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
