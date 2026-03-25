const express = require('express')
const requireUserId = require('../middleware/requireUserId')
const { getUsers } = require('../controllers/userController')

const router = express.Router()

router.get('/users', requireUserId, getUsers)

module.exports = router

