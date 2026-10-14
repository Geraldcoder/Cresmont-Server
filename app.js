require('dotenv').config()
const express = require('express')
const app = express()

const cors = require('cors')
const cookieParser = require('cookie-parser')

const connectDB = require('./db/connect')
const authRouter = require('./routes/auth')
const accountRouter = require('./routes/account')
const adminRouter = require('./routes/admin')
const notFound = require('./middleware/notFound')
const errorHandlerMw = require('./middleware/errorHandlerMw')
const authMiddleware = require('./middleware/authMiddleWare')
const adminMiddleware = require('./middleware/adminMiddleWare')

const allowedOrigins = (
  process.env.CLIENT_ORIGINS ||
  'https://cresmont.netlify.app,https://cresmontadmin.netlify.app'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(express.json())
app.use(cookieParser())
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error('Origin is not allowed by CORS'))
    },
    credentials: true,
  }),
)

app.use('/auth', authRouter)
app.use('/account', authMiddleware, accountRouter)
app.use('/admin', authMiddleware, adminMiddleware, adminRouter)

app.use(authMiddleware)
app.use(errorHandlerMw)
app.use(notFound)

const port = process.env.PORT || 3000
const start = async () => {
  await connectDB(process.env.MONGO_URI)
  app.listen(port, () => {
    console.log(`Server is listening on port ${port}`)
  })
}
start()
