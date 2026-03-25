const express = require('express')
const requireUserId = require('../middleware/requireUserId')
const { addContact, getContacts, updateContact, deleteContact } = require('../controllers/contactController')

const router = express.Router()

router.get('/contacts', requireUserId, getContacts)
router.post('/contacts', requireUserId, addContact)
router.patch('/contacts/:contactId', requireUserId, updateContact)
router.delete('/contacts/:contactId', requireUserId, deleteContact)

module.exports = router

