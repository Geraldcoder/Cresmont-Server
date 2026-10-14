const { StatusCodes } = require('http-status-codes')

class CustomError extends Error {
  constructor(message) {
    super(message)
  }
}

class NotFoundError extends CustomError {
  constructor(message) {
    super(message)
    this.statusCode = StatusCodes.NOT_FOUND
  }
}

class BadRequestError extends NotFoundError {
  constructor(message) {
    super(message)
    this.statusCode = StatusCodes.BAD_REQUEST
  }
}

class UnAuthorizedError extends BadRequestError {
  constructor(message) {
    super(message)
    this.statusCode = StatusCodes.UNAUTHORIZED
  }
}

module.exports = { NotFoundError, BadRequestError, UnAuthorizedError }
