require('dotenv').config()
const connectDB = require('../db/connect')
const User = require('../models/auth')

const email = process.argv[2] || process.env.ADMIN_EMAIL

if (!email) {
  console.error('Usage: node scripts/promote-admin.js admin@example.com')
  process.exit(1)
}

const run = async () => {
  await connectDB(process.env.MONGO_URI)
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { $set: { role: 'admin' } },
    { new: true },
  ).select('email role')

  if (!user) {
    throw new Error(`No user found for ${email}`)
  }

  console.log(`Promoted ${user.email} to ${user.role}`)
  process.exit(0)
}

run().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
