const express = require('express')
const router = express.Router()

const { getUserDetails, transferFunds } = require('../controllers/account')

router.route('/').get(getUserDetails)
router.route('/transfer').post(transferFunds)

module.exports = router
