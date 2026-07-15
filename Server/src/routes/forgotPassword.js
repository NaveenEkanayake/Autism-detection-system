import { Router } from "express";
import { auth, db } from "../config/firebase.js";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import crypto from "crypto";

const router = Router();

// Configure Nodemailer for Email
function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

const transporter = createTransporter();

async function sendEmail(to, otp) {
  if (!transporter) {
    console.log("[DEV] OTP for", to, ":", otp);
    return;
  }

  await transporter.sendMail({
    from: `"Aura Track" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Security Verification: Your Aura Track OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <svg width="50" height="50" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#007bff;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#00d2ff;stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="14" ry="14" fill="url(#blueGradient)" />
            <path d="M32 16c-6 0-10 4-10 10v2c0 8 4 10 10 10h0c6 0 10-2 10-10v-2c0-6-4-10-10-10zM22 28a4 4 0 0 0 8 0v-4a4 4 0 0 0-8 0v4zM34 24a4 4 0 0 0 8 0v4a4 4 0 0 0-8 0v-4z" fill="white" />
          </svg>
        </div>
        <h2 style="color: #333;">Verification Code</h2>
        <p style="color: #555;">Hello,</p>
        <p style="color: #555;">To continue with your password reset, please use the following one-time password (OTP):</p>
        <div style="text-align: center; margin: 25px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; background: #f0f7ff; padding: 10px 20px; border-radius: 5px;">${otp}</span>
        </div>
        <p style="color: #555;">This code is valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email or contact our support team.</p>
        <p style="color: #555;">Best regards,<br>The Aura Track Team</p>
      </div>
    `,
  });
}

// Generate 6-digit OTP
function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

// Send OTP to user's phone/email
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch {
      return res.status(404).json({ error: "No account found with this email" });
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    await db.collection("passwordResets").doc(email).set({
      email,
      otp,
      createdAt: new Date().toISOString(),
      expiresAt,
      verified: false,
    });

    await sendEmail(email, otp);

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const doc = await db.collection("passwordResets").doc(email).get();
    if (!doc.exists) {
      return res.status(400).json({ error: "No OTP request found. Please request a new code." });
    }

    const data = doc.data();
    if (data.verified) {
      return res.status(400).json({ error: "OTP already verified. Please reset your password." });
    }
    if (Date.now() > data.expiresAt) {
      await doc.ref.delete();
      return res.status(400).json({ error: "OTP expired. Please request a new code." });
    }
    if (data.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP code." });
    }

    const resetToken = uuidv4();
    await doc.ref.update({ verified: true, resetToken, verifiedAt: new Date().toISOString() });

    res.json({ message: "Phone verified successfully", resetToken });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Reset password
router.post("/reset", async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ error: "Email, reset token, and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const doc = await db.collection("passwordResets").doc(email).get();
    if (!doc.exists) {
      return res.status(400).json({ error: "No reset request found" });
    }

    const data = doc.data();
    if (!data.verified || data.resetToken !== resetToken) {
      return res.status(400).json({ error: "Invalid or expired reset session" });
    }
    if (Date.now() > data.expiresAt) {
      await doc.ref.delete();
      return res.status(400).json({ error: "Reset session expired. Please start over." });
    }

    const user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password: newPassword });

    await doc.ref.delete();

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
