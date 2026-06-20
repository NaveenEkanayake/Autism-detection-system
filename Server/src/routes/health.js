import { Router } from "express";
import { db } from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

// ── Milestones ──
router.get("/milestones/:patientId", verifyToken, async (req, res) => {
  try {
    const snap = await db
      .collection("milestones")
      .where("patientId", "==", req.params.patientId)
      .where("parentUid", "==", req.user.uid)
      .orderBy("date", "desc")
      .get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/milestones", verifyToken, async (req, res) => {
  try {
    const { patientId, category, title, date, notes } = req.body;
    if (!patientId || !title || !date) {
      return res.status(400).json({ error: "patientId, title, and date are required" });
    }
    const ref = await db.collection("milestones").add({
      patientId,
      parentUid: req.user.uid,
      category: category || "general",
      title,
      date,
      notes: notes || "",
      createdAt: new Date().toISOString(),
    });
    const doc = await ref.get();
    res.status(201).json({ id: ref.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Growth Records ──
router.get("/growth/:patientId", verifyToken, async (req, res) => {
  try {
    const snap = await db
      .collection("growth_records")
      .where("patientId", "==", req.params.patientId)
      .where("parentUid", "==", req.user.uid)
      .orderBy("date", "asc")
      .get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/growth", verifyToken, async (req, res) => {
  try {
    const { patientId, date, height, weight, headCircumference } = req.body;
    if (!patientId || !date) {
      return res.status(400).json({ error: "patientId and date are required" });
    }
    const ref = await db.collection("growth_records").add({
      patientId,
      parentUid: req.user.uid,
      date,
      height: height || null,
      weight: weight || null,
      headCircumference: headCircumference || null,
      createdAt: new Date().toISOString(),
    });
    const doc = await ref.get();
    res.status(201).json({ id: ref.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Sleep Logs ──
router.get("/sleep/:patientId", verifyToken, async (req, res) => {
  try {
    const snap = await db
      .collection("sleep_logs")
      .where("patientId", "==", req.params.patientId)
      .where("parentUid", "==", req.user.uid)
      .orderBy("date", "desc")
      .get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/sleep", verifyToken, async (req, res) => {
  try {
    const { patientId, date, bedtime, wakeTime, naps, quality } = req.body;
    if (!patientId || !date || !bedtime || !wakeTime) {
      return res.status(400).json({ error: "patientId, date, bedtime, and wakeTime are required" });
    }
    const ref = await db.collection("sleep_logs").add({
      patientId,
      parentUid: req.user.uid,
      date,
      bedtime,
      wakeTime,
      naps: naps || 0,
      quality: quality || 3,
      createdAt: new Date().toISOString(),
    });
    const doc = await ref.get();
    res.status(201).json({ id: ref.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
