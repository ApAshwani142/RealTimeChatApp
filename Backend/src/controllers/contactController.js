const mongoose = require('mongoose')

const User = require('../models/User')
const Contact = require('../models/Contact')

function normalizeUsername(value) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

function normalizeMobile(value) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

async function addContact(req, res) {
  const ownerId = req.userId
  const username = normalizeUsername(req.body?.username)
  const mobile = normalizeMobile(req.body?.mobile)

  if (!username || !mobile) {
    return res.status(400).json({ error: 'username and mobile are required' })
  }

  const owner = await User.findById(ownerId).select('username mobile').lean()
  if (owner) {
    const sameUsername = owner.username?.toLowerCase() === username.toLowerCase()
    const sameMobile = owner.mobile && owner.mobile === mobile
    if (sameUsername || sameMobile) return res.status(400).json({ error: 'You cannot add yourself' })
  }

  // Resolve contact user by mobile first, then username.
  let contactUser = await User.findOne({ mobile })
  if (!contactUser) contactUser = await User.findOne({ username })

  if (!contactUser) {
    contactUser = await User.create({ username, mobile })
  } else {
    // If user exists but missing/old mobile, sync it.
    if (mobile && contactUser.mobile !== mobile) {
      contactUser.mobile = mobile
      contactUser = await contactUser.save()
    }
    if (username && contactUser.username !== username) {
      // Keep username stable-ish; only overwrite if it's different.
      contactUser.username = username
      contactUser = await contactUser.save()
    }
  }

  if (!contactUser._id) {
    return res.status(400).json({ error: 'Invalid contact user' })
  }

  // If contact already exists, just return it.
  const existing = await Contact.findOne({ ownerId, contactId: contactUser._id }).lean()
  if (!existing) {
    await Contact.create({ ownerId, contactId: contactUser._id })
  }

  return res.json({
    contact: {
      contactId: String(contactUser._id),
      username: contactUser.username,
      mobile: contactUser.mobile,
    },
  })
}

async function getContacts(req, res) {
  const ownerId = req.userId

  if (!mongoose.isValidObjectId(ownerId)) {
    return res.status(400).json({ error: 'Invalid user id' })
  }

  const contacts = await Contact.find({ ownerId })
    .populate('contactId', '_id username mobile socketId')
    .sort({ createdAt: -1 })
    .lean()

  return res.json({
    contacts: contacts
      .filter((c) => c.contactId)
      .map((c) => ({
        contactId: String(c.contactId._id),
        userId: String(c.contactId._id), // backward-friendly naming
        username: c.contactId.username,
        mobile: c.contactId.mobile,
        isOnline: Boolean(c.contactId.socketId),
      })),
  })
}

async function updateContact(req, res) {
  const ownerId = req.userId
  const contactId = req.params.contactId

  const username = normalizeUsername(req.body?.username)
  const mobile = normalizeMobile(req.body?.mobile)

  if (!mongoose.isValidObjectId(ownerId) || !mongoose.isValidObjectId(contactId)) {
    return res.status(400).json({ error: 'Invalid ids' })
  }

  const existing = await Contact.findOne({ ownerId, contactId }).lean()
  if (!existing) return res.status(404).json({ error: 'Contact not found' })

  const contactUser = await User.findById(contactId)
  if (!contactUser) return res.status(404).json({ error: 'Contact user not found' })

  if (!username && !mobile) return res.status(400).json({ error: 'username and/or mobile are required' })

  if (username) contactUser.username = username
  if (mobile) contactUser.mobile = mobile

  try {
    await contactUser.save()
  } catch (err) {
    // Duplicate key errors (e.g. mobile already used)
    if (err?.code === 11000) return res.status(400).json({ error: 'Mobile already exists' })
    return res.status(500).json({ error: 'Failed to update contact' })
  }

  return res.json({
    contact: {
      contactId: String(contactUser._id),
      username: contactUser.username,
      mobile: contactUser.mobile,
    },
  })
}

async function deleteContact(req, res) {
  const ownerId = req.userId
  const contactId = req.params.contactId

  if (!mongoose.isValidObjectId(ownerId) || !mongoose.isValidObjectId(contactId)) {
    return res.status(400).json({ error: 'Invalid ids' })
  }

  const result = await Contact.deleteOne({ ownerId, contactId })
  if (!result.deletedCount) return res.status(404).json({ error: 'Contact not found' })

  return res.json({ ok: true })
}

module.exports = { addContact, getContacts, updateContact, deleteContact }

