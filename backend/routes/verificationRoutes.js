const express = require('express');
const { redirectEmailVerification } = require('../controllers/authController');

const router = express.Router();

router.get('/verify-email', redirectEmailVerification);

module.exports = router;
