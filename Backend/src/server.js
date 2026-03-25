require('dotenv').config()

const http = require('http')
const mongoose = require('mongoose')
const { Server } = require('socket.io')

const createApp = require('./app')
const { setupSocket } = require('./socket')

async function main() {
  const PORT = process.env.PORT || 5000
  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) throw new Error('Missing MONGODB_URI in environment')

  try {
    await mongoose.connect(MONGODB_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 10000,
    })
    console.log(`MongoDB connected: ${mongoose.connection?.db?.databaseName} (auth OK)`)

    // Startup migration: remove legacy unique index that breaks new auth model.
    // Old versions created a unique index on `username`. In the new model we don't require `username`,
    // so inserts can fail with E11000 dup key `{ username: null }`.
    try {
      const usersColl = mongoose.connection.db.collection('users')
      const indexes = await usersColl.indexes()
      const hasUsernameIndex = indexes.some((idx) => idx?.name === 'username_1')
      if (hasUsernameIndex) {
        await usersColl.dropIndex('username_1')
        console.log('Dropped legacy index: username_1')
      }
    } catch (e) {
      // Non-fatal: if we can't drop (permissions/doesn't exist), continue.
      console.warn('Index migration skipped:', e?.message || e)
    }
  } catch (err) {
    console.error('MongoDB connection failed:')
    // Avoid leaking secrets: log only username+host.
    const match = String(MONGODB_URI).match(/^mongodb\+srv:\/\/([^:]+):.*@([^\/?]+)/i)
    if (match) console.error(`Trying auth as "${match[1]}" on host "${match[2]}"`)
    console.error(err?.message || err)
    process.exit(1)
  }

  const app = createApp()

  const httpServer = http.createServer(app)

  const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  function corsOriginHandler(origin, callback) {
    if (!origin) return callback(null, true)
    if (allowedOrigins.length === 0) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    return callback(null, false)
  }

  const io = new Server(httpServer, {
    cors: {
      origin: corsOriginHandler,
      credentials: true,
    },
  })

  // Allow controllers to access io if needed
  app.locals.io = io

  setupSocket(io)

  httpServer.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

