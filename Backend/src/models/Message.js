const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true, index: true },
    receiverId: { type: String, required: true, index: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    timestamp: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true },
)

messageSchema.index({ senderId: 1, receiverId: 1, timestamp: 1 })

module.exports = mongoose.model('Message', messageSchema)

