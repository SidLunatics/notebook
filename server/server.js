const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const XLSX = require("xlsx");
const Submission = require("./models/Submission");

dotenv.config();

const app = express();

// ========================= CORS FIX =========================

// Allow your frontend (Vercel), localhost, and no-origin tools like POSTMAN
const allowedOrigins = [
  process.env.FRONTEND_URL,   // Your Vercel URL from .env
  "http://localhost:3000",    // Local frontend
  undefined,                  // For Postman / server-side calls
  null
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(null, false); // No error—just block silently
      }
    },
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// ============================================================

app.use(express.json());

const PORT = process.env.PORT || 5000;

// ==================== MONGO CONNECT ==========================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ==================== ROUTES ================================

// ➤ POST /submit
app.post("/submit", async (req, res) => {
  try {
    const submission = new Submission(req.body);
    await submission.save();
    res.status(201).json(submission);
  } catch (err) {
    console.error("❌ Submit Error:", err);
    res.status(400).json({ error: err.message });
  }
});

// ➤ GET /submissions
app.get("/submissions", async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    console.error("❌ Fetch Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ➤ GET /download
app.get("/download", async (req, res) => {
  try {
    const submissions = await Submission.find();

    const data = submissions.map((s) => ({
      Name: s.name,
      Date: s.date,
      Location: s.location,
      Amount: s.amount,
      PaymentMode: s.paymentMode,
      Description: s.description,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

    const filePath = "Submissions.xlsx";
    XLSX.writeFile(workbook, filePath);

    res.download(filePath);
  } catch (err) {
    console.error("❌ Excel Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ➤ Health Route
app.get("/", (req, res) => {
  res.status(200).send("Backend running successfully 🚀");
});

// ==================== START SERVER ===========================
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
