const User = require('../models/auth')
const { UnAuthorizedError } = require('../errors/customError')

const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('role')

    if (!user || user.role !== 'admin') {
      throw new UnAuthorizedError('Administrator access is required')
    }

    req.admin = user
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = adminMiddleware
