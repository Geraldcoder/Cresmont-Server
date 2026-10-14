const notFound = (req, res) => {
  res.json({ msg: 'Route does not exist' })
}

module.exports = notFound
