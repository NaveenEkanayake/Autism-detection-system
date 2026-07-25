import { auth } from "./firebase";

export const API = ""; // No backend API base URL needed

export async function getToken() {
  return await auth.currentUser?.getIdToken() || "";
}

// LocalStorage based mock api database
export function getLocal(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

export function setLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Seed mock database if empty to provide a beautiful pre-populated experience
if (getLocal("db_patients").length === 0) {
  setLocal("db_patients", [
    { id: "patient-1", name: "Ethan", dob: "2022-04-12", sex: "male", createdAt: new Date().toISOString() },
    { id: "patient-2", name: "Lily", dob: "2024-08-20", sex: "female", createdAt: new Date().toISOString() }
  ]);
  setLocal("db_milestones", [
    { id: "m-1", patientId: "patient-1", title: "Spoke first full sentence", category: "language", date: "2025-06-15", notes: "Clear pronunciation of 4 words together." },
    { id: "m-2", patientId: "patient-1", title: "Responded to name consistently", category: "social", date: "2025-07-02", notes: "Improved eye contact when calling from distance." }
  ]);
  setLocal("db_growth", [
    { id: "g-1", patientId: "patient-1", date: "2026-01-10", height: 95, weight: 14, headCircumference: 50 },
    { id: "g-2", patientId: "patient-1", date: "2026-05-15", height: 98, weight: 15, headCircumference: 50.5 }
  ]);
  setLocal("db_sleep", [
    { id: "s-1", patientId: "patient-1", date: "2026-07-24", bedtime: "20:30", wakeTime: "06:30", naps: 1, quality: 4 }
  ]);
}

export async function api(path, options = {}) {
  const method = options.method || "GET";
  const body = options.body ? JSON.parse(options.body) : null;

  // Clean path by removing leading/trailing slashes and query params
  const cleanPath = path.split("?")[0].replace(/^\/|\/$/g, "");
  const parts = cleanPath.split("/");

  // 1. PATIENTS ENDPOINTS
  if (parts[0] === "patients") {
    // GET /patients
    if (parts.length === 1 && method === "GET") {
      return getLocal("db_patients");
    }
    // POST /patients
    if (parts.length === 1 && method === "POST") {
      const dbPatients = getLocal("db_patients");
      const newPatient = {
        id: "patient-" + Date.now(),
        name: body.name,
        dob: body.dob,
        sex: body.sex,
        createdAt: new Date().toISOString()
      };
      dbPatients.push(newPatient);
      setLocal("db_patients", dbPatients);
      return newPatient;
    }
    // DELETE /patients/:id
    if (parts.length === 2 && method === "DELETE") {
      const patientId = parts[1];
      let dbPatients = getLocal("db_patients");
      dbPatients = dbPatients.filter(p => p.id !== patientId);
      setLocal("db_patients", dbPatients);

      // Cascade delete related records
      const tables = ["db_sdq", "db_milestones", "db_growth", "db_sleep", "db_documents", "db_vision"];
      tables.forEach(table => {
        let items = getLocal(table);
        items = items.filter(item => item.patientId !== patientId);
        setLocal(table, items);
      });

      return { message: "Patient deleted successfully" };
    }
  }

  // 2. SDQ ENDPOINTS
  if (parts[0] === "sdq") {
    // GET /sdq/:patientId
    if (parts.length === 2 && method === "GET") {
      const patientId = parts[1];
      return getLocal("db_sdq").filter(item => item.patientId === patientId);
    }
    // POST /sdq
    if (parts.length === 1 && method === "POST") {
      const dbSdq = getLocal("db_sdq");
      const newItem = {
        id: "sdq-" + Date.now(),
        patientId: body.patientId,
        responses: body.responses,
        scores: body.scores,
        notes: body.notes || "",
        createdAt: new Date().toISOString()
      };
      dbSdq.push(newItem);
      setLocal("db_sdq", dbSdq);
      return newItem;
    }
  }

  // 3. HEALTH ENDPOINTS
  if (parts[0] === "health") {
    const sub = parts[1]; // milestones, growth, sleep
    const patientId = parts[2];

    // GET /health/milestones/:patientId
    if (sub === "milestones" && method === "GET") {
      return getLocal("db_milestones")
        .filter(item => item.patientId === patientId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    // POST /health/milestones
    if (sub === "milestones" && method === "POST") {
      const dbMilestones = getLocal("db_milestones");
      const newItem = {
        id: "m-" + Date.now(),
        patientId: body.patientId,
        category: body.category || "general",
        title: body.title,
        date: body.date,
        notes: body.notes || "",
        createdAt: new Date().toISOString()
      };
      dbMilestones.push(newItem);
      setLocal("db_milestones", dbMilestones);
      return newItem;
    }

    // GET /health/growth/:patientId
    if (sub === "growth" && method === "GET") {
      return getLocal("db_growth")
        .filter(item => item.patientId === patientId)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    // POST /health/growth
    if (sub === "growth" && method === "POST") {
      const dbGrowth = getLocal("db_growth");
      const newItem = {
        id: "g-" + Date.now(),
        patientId: body.patientId,
        date: body.date,
        height: body.height || null,
        weight: body.weight || null,
        headCircumference: body.headCircumference || null,
        createdAt: new Date().toISOString()
      };
      dbGrowth.push(newItem);
      setLocal("db_growth", dbGrowth);
      return newItem;
    }

    // GET /health/sleep/:patientId
    if (sub === "sleep" && method === "GET") {
      return getLocal("db_sleep")
        .filter(item => item.patientId === patientId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    // POST /health/sleep
    if (sub === "sleep" && method === "POST") {
      const dbSleep = getLocal("db_sleep");
      const newItem = {
        id: "s-" + Date.now(),
        patientId: body.patientId,
        date: body.date,
        bedtime: body.bedtime,
        wakeTime: body.wakeTime,
        naps: body.naps || 0,
        quality: body.quality || 3,
        createdAt: new Date().toISOString()
      };
      dbSleep.push(newItem);
      setLocal("db_sleep", dbSleep);
      return newItem;
    }
  }

  // 4. DOCUMENTS ENDPOINTS
  if (parts[0] === "documents") {
    // GET /documents/:patientId
    if (parts.length === 2 && method === "GET") {
      const patientId = parts[1];
      return getLocal("db_documents").filter(item => item.patientId === patientId);
    }
    // POST /documents
    if (parts.length === 1 && method === "POST") {
      const dbDocs = getLocal("db_documents");
      const newItem = {
        id: "doc-" + Date.now(),
        patientId: body.patientId,
        parentUid: body.parentUid || "",
        name: body.name,
        type: body.type,
        fileUrl: body.fileUrl,
        size: body.size,
        createdAt: body.createdAt || new Date().toISOString()
      };
      dbDocs.push(newItem);
      setLocal("db_documents", dbDocs);
      return newItem;
    }
    // DELETE /documents/:id
    if (parts.length === 2 && method === "DELETE") {
      const docId = parts[1];
      let dbDocs = getLocal("db_documents");
      dbDocs = dbDocs.filter(d => d.id !== docId);
      setLocal("db_documents", dbDocs);
      return { message: "Document deleted" };
    }
  }

  // 5. VISION ENDPOINTS
  if (parts[0] === "vision") {
    // GET /vision/:patientId
    if (parts.length === 2 && method === "GET") {
      const patientId = parts[1];
      return getLocal("db_vision").filter(item => item.patientId === patientId);
    }
    // POST /vision
    if (parts.length === 1 && method === "POST") {
      const dbVision = getLocal("db_vision");
      const newItem = {
        id: "vision-" + Date.now(),
        patientId: body.patientId,
        parentUid: body.parentUid || "",
        imageUrl: body.imageUrl,
        status: body.status || "processing",
        results: body.results || null,
        createdAt: body.createdAt || new Date().toISOString()
      };
      dbVision.push(newItem);
      setLocal("db_vision", dbVision);
      return newItem;
    }
    // PUT /vision/:id
    if (parts.length === 2 && method === "PUT") {
      const analysisId = parts[1];
      let dbVision = getLocal("db_vision");
      let updatedRecord = null;
      dbVision = dbVision.map(item => {
        if (item.id === analysisId) {
          updatedRecord = { ...item, status: "completed", results: body.results };
          return updatedRecord;
        }
        return item;
      });
      setLocal("db_vision", dbVision);
      return updatedRecord || { id: analysisId, status: "completed", results: body.results };
    }
  }

  throw new Error(`Unsupported offline client API path: ${method} ${path}`);
}

