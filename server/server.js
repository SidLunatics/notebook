const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const XLSX = require("xlsx");
const Submission = require("./models/Submission");

dotenv.config();

const app = express();

// ✅ FIXED CORS for Vercel + Localhost
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://notebook-frontend.vercel.app",   // <-- UPDATE this to your real Vercel domain
      "https://*.vercel.app",                   // allow all vercel preview domains
    ],
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Routes -----------------------------------------------------

// Submit new entry
app.post("/submit", async (req, res) => {
  try {
    const submission = new Submission(req.body);
    await submission.save();
    res.status(201).json(submission);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all submissions
app.get("/submissions", async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download Excel file
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
    res.status(500).json({ error: err.message });
  }
});

// Default route
app.get("/", (req, res) => {
  res.send("Backend running successfully 🚀");
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
