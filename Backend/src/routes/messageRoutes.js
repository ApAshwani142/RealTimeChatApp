const express = require('express')
const requireUserId = require('../middleware/requireUserId')
const { getMessages, postMessage } = require('../controllers/messageController')

const router = express.Router()

router.get('/messages/:userId', requireUserId, getMessages)
router.post('/messages', requireUserId, postMessage)

module.exports = router

