// auth.js - very simple placeholder auth
const express = require('express');
const router = express.Router();

// In-memory dummy users
const users = [
  { id: 1, username: 'user1', password: 'password1', name: 'Alice' },
  { id: 2, username: 'krishna', password: 'password', name: 'Krishna' }
];

// POST /api/login {username, password}
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ ok: false, message: 'Invalid credentials' });
  // return a simple token (not secure) — in production use JWT
  const token = Buffer.from(`${user.id}:${user.username}`).toString('base64');
  res.json({ ok: true, token, user: { id: user.id, name: user.name, username: user.username } });
});

module.exports = router;
