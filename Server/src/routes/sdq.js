import { Router } from "express";
import { db } from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();
const SDQ = "sdq_assessments";

// Get all SDQ assessments for a patient
router.get("/:patientId", verifyToken, async (req, res) => {
  try {
    const snap = await db
      .collection(SDQ)
      .where("patientId", "==", req.params.patientId)
      .where("parentUid", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .get();
    const assessments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit a new SDQ assessment
router.post("/", verifyToken, async (req, res) => {
  try {
    const { patientId, responses, scores, notes } = req.body;
    if (!patientId || !responses || !scores) {
      return res.status(400).json({ error: "patientId, responses, and scores are required" });
    }
    const ref = await db.collection(SDQ).add({
      patientId,
      parentUid: req.user.uid,
      responses,
      scores,
      notes: notes || "",
      createdAt: new Date().toISOString(),
    });
    const doc = await ref.get();
    res.status(201).json({ id: ref.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an assessment
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const doc = await db.collection(SDQ).doc(req.params.id).get();
    if (!doc.exists || doc.data().parentUid !== req.user.uid) {
      return res.status(404).json({ error: "Assessment not found" });
    }
    await doc.ref.delete();
    res.json({ message: "Assessment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
