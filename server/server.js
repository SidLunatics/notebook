// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const XLSX = require('xlsx');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// adjust this path if your model sits elsewhere (original expected ./models/Submission)
const Submission = require('./models/Submission');

const allowedOrigins = [
  'https://notebook-six-brown.vercel.app',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.log('Blocked by CORS:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB Error:', err));

/**
 * POST /submit
 * Expect payload.date to be an ISO string (UTC instant) corresponding to the
 * intended IST local time entered on the frontend.
 * Store it directly (Mongoose will cast to Date).
 */
app.post('/submit', async (req, res) => {
  try {
    // If frontend sends payload.date as ISO string already, use it.
    // Otherwise fallback to current time.
    const incoming = req.body.date;
    const dateToSave = incoming ? new Date(incoming) : new Date();

    const submission = new Submission({
      ...req.body,
      date: dateToSave,
    });

    await submission.save();
    res.status(201).json(submission);
  } catch (err) {
    console.error('Submit Error:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /submissions - return all submissions (newest first)
 */
app.get('/submissions', async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: 1 }); // keep original ordering or change as desired
    res.json(submissions);
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /download - build an Excel file (local file saved then downloaded)
 * If you prefer to stream without saving to disk, we can change this.
 */
app.get('/download', async (req, res) => {
  try {
    const submissions = await Submission.find();

    const data = submissions.map((s) => ({
      Name: s.name,
      Date: s.date ? s.date.toISOString() : '',
      Location: s.location,
      Amount: s.amount,
      PaymentMode: s.paymentMode,
      Description: s.description,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');

    const filePath = path.join(__dirname, 'Submissions.xlsx');
    XLSX.writeFile(workbook, filePath);

    res.download(filePath);
  } catch (err) {
    console.error('Excel Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.status(200).send('Backend running');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
