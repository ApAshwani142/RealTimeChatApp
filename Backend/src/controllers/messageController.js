const Message = require('../models/Message')
const { emitReceiveMessageToParticipants } = require('../socket')

async function getMessages(req, res) {
  const currentUserId = req.userId
  const otherUserId = req.params.userId

  const messages = await Message.find({
    $or: [
      { senderId: currentUserId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: currentUserId },
    ],
  })
    .sort({ timestamp: 1 })
    .lean()

  const normalized = messages.map((m) => ({
    messageId: String(m._id),
    senderId: String(m.senderId),
    receiverId: String(m.receiverId),
    text: m.text,
    timestamp: m.timestamp,
  }))

  return res.json({ messages: normalized })
}

async function postMessage(req, res) {
  const currentUserId = req.userId
  const { receiverId, text } = req.body || {}

  if (!receiverId || typeof text !== 'string') {
    return res.status(400).json({ error: 'receiverId and text are required' })
  }

  const normalized = text.trim()
  if (!normalized) return res.status(400).json({ error: 'text cannot be empty' })

  const message = await Message.create({
    senderId: currentUserId,
    receiverId,
    text: normalized,
  })

  // If sockets are connected, deliver in realtime as well.
  await emitReceiveMessageToParticipants(message)

  return res.json({ message })
}
module.exports = { getMessages, postMessage }

