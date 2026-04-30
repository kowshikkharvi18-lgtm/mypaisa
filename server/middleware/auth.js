const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  const h = req.headers['authorization'];
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const d = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
    req.userId = d.userId;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};
