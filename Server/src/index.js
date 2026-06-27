import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import forgotPasswordRoutes from "./routes/forgotPassword.js";
import patientRoutes from "./routes/patients.js";
import sdqRoutes from "./routes/sdq.js";
import visionRoutes from "./routes/vision.js";
import healthRoutes from "./routes/health.js";
import documentRoutes from "./routes/documents.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
}));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/auth/forgot", forgotPasswordRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/sdq", sdqRoutes);
app.use("/api/vision", visionRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/documents", documentRoutes);

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Aura Track server running on port ${PORT}`);
});
