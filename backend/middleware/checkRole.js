module.exports = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ msg: "Not authorized" })
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ msg: "Access denied" })
  }

  next()
}
