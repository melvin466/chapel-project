const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { protect, admin } = require('../middleware/auth');

router.use(protect, admin);

router.get('/', getAuditLogs);

module.exports = router;
