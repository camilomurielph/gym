const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan campos' });
  }
  const existing = User.findByUsername(username);
  if (existing) {
    return res.status(400).json({ error: 'Usuario ya existe' });
  }
  const hash = await bcrypt.hash(password, 10);
  const id = User.create(username, hash);
  const token = jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id, username } });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = User.findByUsername(username);
  if (!user) {
    return res.status(400).json({ error: 'Credenciales inválidas' });
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(400).json({ error: 'Credenciales inválidas' });
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username } });
});

module.exports = router;
