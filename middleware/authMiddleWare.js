const jwt = require('jsonwebtoken')
const { UnAuthorizedError } = require('../errors/customError')

const authMiddleware = (req, res, next) => {
  const cookieName =
    process.env.NODE_ENV === 'production'
      ? '__Host-cresmont_access'
      : 'cresmont_access'

  const token = req.cookies?.[cookieName]

  if (!token) {
    return next(new UnAuthorizedError('You have to login first'))
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = {
      id: decoded.id,
      name: decoded.name,
    }

    next()
  } catch (error) {
    next(new UnAuthorizedError('You need to login first'))
  }
}

module.exports = authMiddleware
