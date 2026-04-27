const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const messageRoutes = require('./routes/messageRoutes')
const { buildCorsOriginHandler } = require('./cors')

function createApp() {
  const app = express()
  const corsOriginHandler = buildCorsOriginHandler()

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

