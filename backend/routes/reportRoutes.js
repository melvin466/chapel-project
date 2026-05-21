const express = require('express');
const router = express.Router();
const { getReportSummary, exportReport } = require('../controllers/reportController');
const { protect, admin } = require('../middleware/auth');

router.get('/summary', protect, admin, getReportSummary);
router.get('/export/:type', protect, admin, exportReport);

module.exports = router;
