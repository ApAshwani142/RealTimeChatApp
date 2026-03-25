const User = require('../models/User')

async function login(req, res) {
  const { userId, email } = req.body || {}
  const normalizedUserId = typeof userId === 'string' ? userId.trim() : ''
  const normalizedEmail = typeof email === 'string' ? email.trim() : ''

  if (!normalizedUserId) return res.status(400).json({ error: 'userId is required' })
  if (!normalizedEmail) return res.status(400).json({ error: 'email is required' })

  let user = await User.findOne({ userId: normalizedUserId })
  if (!user) {
    // IMPORTANT: your MongoDB still has a legacy unique index on `username`.
    // To prevent E11000 dup key `{ username: null }`, always set username.
    user = await User.create({ username: normalizedUserId, userId: normalizedUserId, email: normalizedEmail })
  } else {
    // Keep userId stable; update email if changed.
    if (user.email !== normalizedEmail) {
      user.email = normalizedEmail
      await user.save()
    }

    // If old document has username missing/null, fix it once.
    if (!user.username) {
      user.username = user.userId
      await user.save()
    }
  }

  return res.json({ userId: user.userId, email: user.email })
}

module.exports = {
  login,
}

