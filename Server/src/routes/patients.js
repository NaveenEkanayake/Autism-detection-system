import { Router } from "express";
import { db } from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();
const PATIENTS = "patients";

// Get all patients for the authenticated user
router.get("/", verifyToken, async (req, res) => {
  try {
    const snap = await db
      .collection(PATIENTS)
      .where("parentUid", "==", req.user.uid)
      .get();
    const patients = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a patient (child profile)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, dob, sex } = req.body;
    if (!name || !dob || !sex) {
      return res.status(400).json({ error: "name, dob, and sex are required" });
    }
    const ref = await db.collection(PATIENTS).add({
      parentUid: req.user.uid,
      name,
      dob,
      sex,
      createdAt: new Date().toISOString(),
    });
    const doc = await ref.get();
    res.status(201).json({ id: ref.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a patient
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const doc = await db.collection(PATIENTS).doc(req.params.id).get();
    if (!doc.exists || doc.data().parentUid !== req.user.uid) {
      return res.status(404).json({ error: "Patient not found" });
    }
    await doc.ref.update(req.body);
    const updated = await doc.ref.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a patient
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const doc = await db.collection(PATIENTS).doc(req.params.id).get();
    if (!doc.exists || doc.data().parentUid !== req.user.uid) {
      return res.status(404).json({ error: "Patient not found" });
    }
    await doc.ref.delete();
    res.json({ message: "Patient deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
