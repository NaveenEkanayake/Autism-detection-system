import { Router } from "express";
import { db, bucket } from "../config/firebase.js";
import { verifyToken } from "../middleware/auth.js";
import multer from "multer";
import { v4 as uuid } from "uuid";

const router = Router();
const DOCUMENTS = "documents";
const upload = multer({ storage: multer.memoryStorage() });

// Get all documents for a patient
router.get("/:patientId", verifyToken, async (req, res) => {
  try {
    const snap = await db
      .collection(DOCUMENTS)
      .where("patientId", "==", req.params.patientId)
      .where("parentUid", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .get();
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload a document
router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const { patientId, type } = req.body;
    const fileId = uuid();
    const ext = req.file.originalname.split(".").pop();
    const fileName = `documents/${patientId}/${fileId}.${ext}`;

    const file = bucket.file(fileName);
    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
    });
    await file.makePublic();

    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    const ref = await db.collection(DOCUMENTS).add({
      patientId,
      parentUid: req.user.uid,
      name: req.file.originalname,
      type: type || "other",
      fileUrl,
      size: req.file.size,
      createdAt: new Date().toISOString(),
    });

    const doc = await ref.get();
    res.status(201).json({ id: ref.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a document
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const doc = await db.collection(DOCUMENTS).doc(req.params.id).get();
    if (!doc.exists || doc.data().parentUid !== req.user.uid) {
      return res.status(404).json({ error: "Document not found" });
    }
    await doc.ref.delete();
    res.json({ message: "Document deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
