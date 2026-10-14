const express = require('express')
const router = express.Router()

const { listUsers, adjustBalance, deleteUser } = require('../controllers/admin')

router.route('/users').get(listUsers)
router.route('/users/:userId/balance').patch(adjustBalance)
router.route('/users/:userId').delete(deleteUser)

module.exports = router
