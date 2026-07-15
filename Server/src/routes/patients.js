import { Router } from "express";
import { db, bucket } from "../config/firebase.js";
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

// Delete a patient (with cascading delete of medical records, logs, and files)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const patientId = req.params.id;
    const doc = await db.collection(PATIENTS).doc(patientId).get();
    if (!doc.exists || doc.data().parentUid !== req.user.uid) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // 1. Delete associated Documents metadata and Storage files
    const docsSnap = await db
      .collection("documents")
      .where("patientId", "==", patientId)
      .where("parentUid", "==", req.user.uid)
      .get();
    
    for (const d of docsSnap.docs) {
      const data = d.data();
      if (data.fileUrl) {
        const bucketPrefix = `https://storage.googleapis.com/${bucket.name}/`;
        const fileName = data.fileUrl.replace(bucketPrefix, "");
        await bucket.file(fileName).delete().catch((err) => {
          console.error(`Failed to delete doc file ${fileName}:`, err.message);
        });
      }
      await d.ref.delete();
    }

    // 2. Delete associated Vision Analyses metadata and Storage files
    const visionSnap = await db
      .collection("vision_analyses")
      .where("patientId", "==", patientId)
      .where("parentUid", "==", req.user.uid)
      .get();

    for (const d of visionSnap.docs) {
      const data = d.data();
      if (data.imageUrl) {
        const bucketPrefix = `https://storage.googleapis.com/${bucket.name}/`;
        const fileName = data.imageUrl.replace(bucketPrefix, "");
        await bucket.file(fileName).delete().catch((err) => {
          console.error(`Failed to delete vision file ${fileName}:`, err.message);
        });
      }
      await d.ref.delete();
    }

    // 3. Delete SDQ assessments
    const sdqSnap = await db
      .collection("sdq_assessments")
      .where("patientId", "==", patientId)
      .where("parentUid", "==", req.user.uid)
      .get();
    for (const d of sdqSnap.docs) {
      await d.ref.delete();
    }

    // 4. Delete Milestones
    const milestonesSnap = await db
      .collection("milestones")
      .where("patientId", "==", patientId)
      .where("parentUid", "==", req.user.uid)
      .get();
    for (const d of milestonesSnap.docs) {
      await d.ref.delete();
    }

    // 5. Delete Growth Records
    const growthSnap = await db
      .collection("growth_records")
      .where("patientId", "==", patientId)
      .where("parentUid", "==", req.user.uid)
      .get();
    for (const d of growthSnap.docs) {
      await d.ref.delete();
    }

    // 6. Delete Sleep Logs
    const sleepSnap = await db
      .collection("sleep_logs")
      .where("patientId", "==", patientId)
      .where("parentUid", "==", req.user.uid)
      .get();
    for (const d of sleepSnap.docs) {
      await d.ref.delete();
    }

    // 7. Delete the Patient profile itself
    await doc.ref.delete();

    res.json({ message: "Patient and all associated records deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
