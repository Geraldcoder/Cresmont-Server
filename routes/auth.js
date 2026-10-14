const express = require('express')
const router = express.Router()

const {
  register,
  login,
  logout,
  getUser,
  resetPass,
  passResetLink,
  upload,
  updateProfile,
} = require('../controllers/auth')
const authMiddleWare = require('../middleware/authMiddleWare')

router.route('/register').post(register)
router.route('/login').post(login)
router.route('/logout').post(logout)
router.route('/forgot-password').post(passResetLink)
router.route('/reset-password/:token').post(resetPass)
router
  .route('/profile')
  .get(authMiddleWare, getUser)
  .patch(authMiddleWare, upload.single('profileImg'), updateProfile)

module.exports = router
