const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMode: { type: String, enum: ["Online", "Cash"], required: true },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Submission", submissionSchema);
