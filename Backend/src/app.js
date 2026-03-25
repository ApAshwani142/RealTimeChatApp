const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const messageRoutes = require('./routes/messageRoutes')

function createApp() {
  const app = express()

  const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  function corsOriginHandler(origin, callback) {
    // Requests without an Origin header (like curl/postman) should work.
    if (!origin) return callback(null, true)

    // If no origins configured, allow all.
    if (allowedOrigins.length === 0) return callback(null, true)

    if (allowedOrigins.includes(origin)) return callback(null, true)
    return callback(null, false)
  }

  app.use(
    cors({
      origin: corsOriginHandler,
      credentials: true,
    }),
  )
  app.use(express.json())

  app.get('/health', (req, res) => {
    res.json({ ok: true })
  })

  app.use('/api', authRoutes)
  app.use('/api', userRoutes)
  app.use('/api', messageRoutes)

  return app
}

module.exports = createApp

