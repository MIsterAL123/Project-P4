const express = require('express');
const router = express.Router();
const kuotaController = require('../controllers/kuotaController');

// Public API endpoints
router.get('/kuota/info', kuotaController.getKuotaInfo);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;