const express = require('express');
const { authenticate } = require('../middleware/auth');
const Exercise = require('../models/Exercise');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const exercises = Exercise.findAll();
  res.json(exercises);
});

module.exports = router;
