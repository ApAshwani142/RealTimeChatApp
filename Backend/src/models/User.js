const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    // Legacy field (from older versions). Keep optional to avoid breaking old data,
    // but do NOT enforce uniqueness/required in the new system.
    username: { type: String, default: null, trim: true },
    userId: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      trim: true,
      maxlength: 120,
    },
    socketId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model('User', userSchema)

