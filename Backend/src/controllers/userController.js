const User = require('../models/User')

async function getUsers(req, res) {
  const currentUserId = req.userId

  // Only return users that actually have `userId` (prevents old demo docs from showing up as '?')
  const users = await User.find({
    userId: { $exists: true, $ne: null, $ne: currentUserId },
  })
    .select('userId email socketId')
    .lean()

  return res.json({
    users: users.map((u) => ({
      userId: u.userId,
      username: u.username,
      email: u.email,
      isOnline: Boolean(u.socketId),
    })),
  })
}

module.exports = { getUsers }

