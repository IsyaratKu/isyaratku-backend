const express = require('express');
const router = express.Router();
const authService = require('../services/auth/auth-service');

router.post('/register', authService.register);
router.post('/login', authService.login);
router.post('/logout', authService.logout);
router.post('/forgot-password', authService.resetPassword);

module.exports = router;