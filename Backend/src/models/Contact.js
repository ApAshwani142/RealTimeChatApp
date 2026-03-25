const mongoose = require('mongoose')

const contactSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
)

contactSchema.index({ ownerId: 1, contactId: 1 }, { unique: true })

module.exports = mongoose.model('Contact', contactSchema)

