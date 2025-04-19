const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/password', verifyToken, authController.updatePassword);

module.exports = router;
