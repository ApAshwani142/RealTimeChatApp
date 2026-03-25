const User = require('../models/User')
const Message = require('../models/Message')

// userId (string) -> socketId
const onlineUsers = new Map()
// socketId -> userId (string)
const socketIdToUserId = new Map()

let ioInstance = null

function formatMessagePayload(messageDoc) {
  return {
    messageId: String(messageDoc._id),
    senderId: String(messageDoc.senderId),
    receiverId: String(messageDoc.receiverId),
    text: messageDoc.text,
    timestamp: messageDoc.timestamp,
  }
}

async function emitReceiveMessageToParticipants(messageDoc) {
  if (!ioInstance) return

  const payload = formatMessagePayload(messageDoc)
  const senderSocketId = onlineUsers.get(payload.senderId)
  const receiverSocketId = onlineUsers.get(payload.receiverId)

  if (senderSocketId) {
    ioInstance.to(senderSocketId).emit('receive_message', payload)
  }
  if (receiverSocketId && receiverSocketId !== senderSocketId) {
    ioInstance.to(receiverSocketId).emit('receive_message', payload)
  }
}

async function handleUserConnected(socket, payload) {
  if (!ioInstance) return

  const userId = payload?.userId
  const email = payload?.email
  if (!userId) return

  let user = await User.findOne({ userId })
  if (!user) {
    if (typeof email !== 'string' || !email.trim()) {
      return
    }
    // IMPORTANT: legacy unique index on `username` still exists in MongoDB.
    // Ensure username is always non-null and unique.
    const normalizedUserId = String(userId).trim()
    user = await User.create({
      username: normalizedUserId,
      userId: normalizedUserId,
      email: email.trim(),
      socketId: socket.id,
    })
  } else {
    user.socketId = socket.id
    if (email && typeof email === 'string' && user.email !== email.trim()) {
      user.email = email.trim()
    }
    if (!user.username) user.username = user.userId
    await user.save()
  }

  const userIdStr = String(user.userId)
  onlineUsers.set(userIdStr, socket.id)
  socketIdToUserId.set(socket.id, userIdStr)

  ioInstance.emit('user_online', { userId: userIdStr, email: user.email })
}

async function handleDisconnect(socket) {
  const userIdStr = socketIdToUserId.get(socket.id)
  if (!userIdStr) return

  // If the user reconnected with a different socket, ignore stale disconnects.
  const currentSocketId = onlineUsers.get(userIdStr)
  if (currentSocketId !== socket.id) {
    socketIdToUserId.delete(socket.id)
    return
  }

  socketIdToUserId.delete(socket.id)
  onlineUsers.delete(userIdStr)

  const user = await User.findOne({ userId: userIdStr })
  if (user && user.socketId === socket.id) {
    user.socketId = null
    await user.save()
  }

  ioInstance?.emit('user_offline', { userId: userIdStr, email: user?.email })
}

function setupSocket(io) {
  ioInstance = io

  io.on('connection', (socket) => {
    socket.on('user_connected', (payload) => {
      handleUserConnected(socket, payload).catch(console.error)
    })

    socket.on('send_message', async (payload) => {
      const { senderId, receiverId, text } = payload || {}
      if (!senderId || !receiverId || typeof text !== 'string') return

      const normalized = text.trim()
      if (!normalized) return

      try {
        // senderId/receiverId are userId strings
        const message = await Message.create({
          senderId,
          receiverId,
          text: normalized,
        })

        await emitReceiveMessageToParticipants(message)
      } catch (err) {
        console.error(err)
      }
    })

    socket.on('disconnect', () => {
      handleDisconnect(socket).catch(console.error)
    })
  })
}

module.exports = {
  setupSocket,
  emitReceiveMessageToParticipants,
}

