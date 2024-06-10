const express = require('express');
const router = express.Router();
const authService = require('../services/auth/auth-service');
const aslService = require('../services/sign-challenge/asl-service');
const saveScoreService = require('../services/sign-challenge/save-score-service');
const verifyToken = require('../middleware/index');
const multer = require('multer');
const upload = multer({ storage:multer.memoryStorage()});

router.post('/register', authService.register);
router.post('/login', authService.login);
router.post('/logout', verifyToken, authService.logout);
router.post('/forgot-password', authService.resetPassword);
router.get('/user-info', verifyToken, authService.getUserInfo);
router.get('/leaderboard', authService.getAllUserScores);
router.put('/change-username', verifyToken, authService.changeUsername);
router.put('/change-email', verifyToken, authService.changeEmail);
router.put('/change-photo', verifyToken, upload.single('newPhoto'), authService.changePhotoProfile);
router.get('/random-asl-sentence', aslService.getASLRandomSentences);
router.put('/update-score', verifyToken, saveScoreService.updateScore);

module.exports = router;