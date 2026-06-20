import { Router } from "express";
import { db, bucket } from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.js";
import multer from "multer";
import { v4 as uuid } from "uuid";

const router = Router();
const VISIONS = "vision_analyses";
const upload = multer({ storage: multer.memoryStorage() });

// Get all vision analyses for a patient
router.get("/:patientId", verifyToken, async (req, res) => {
  try {
    const snap = await db
      .collection(VISIONS)
      .where("patientId", "==", req.params.patientId)
      .where("parentUid", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .get();
    const analyses = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(analyses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload image for vision analysis
router.post("/upload", verifyToken, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file provided" });

    const { patientId } = req.body;
    const fileId = uuid();
    const ext = req.file.originalname.split(".").pop();
    const fileName = `visions/${patientId}/${fileId}.${ext}`;

    const file = bucket.file(fileName);
    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
    });
    await file.makePublic();

    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Create analysis record (processing status)
    const ref = await db.collection(VISIONS).add({
      patientId,
      parentUid: req.user.uid,
      imageUrl,
      status: "processing",
      results: null,
      createdAt: new Date().toISOString(),
    });

    const doc = await ref.get();
    res.status(201).json({ id: ref.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update analysis results (called by vision pipeline / manually)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const doc = await db.collection(VISIONS).doc(req.params.id).get();
    if (!doc.exists || doc.data().parentUid !== req.user.uid) {
      return res.status(404).json({ error: "Analysis not found" });
    }
    await doc.ref.update({ status: "completed", results: req.body.results });
    const updated = await doc.ref.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
