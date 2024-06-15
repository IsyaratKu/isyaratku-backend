const express = require('express');
const router = express.Router();
const authService = require('../services/auth/auth-service');
const aslService = require('../services/challenge/asl-service');
const bisindoService = require('../services/challenge/bisindo-service');
const leaderboardService = require('../services/challenge/leaderboard-service');
const saveScoreService = require('../services/challenge/save-score-service');
const verifyToken = require('../middleware/index');
const multer = require('multer');

const upload = multer({ storage:multer.memoryStorage()});

router.post('/auth/register', authService.register);
router.post('/auth/login', authService.login);
router.post('/auth/logout', verifyToken, authService.logout);
router.post('/auth/forgot-password', authService.resetPassword);
router.get('/auth/user-info', verifyToken, authService.getUserInfo);
router.put('/auth/change-username', verifyToken, authService.changeUsername);
router.put('/auth/change-email', verifyToken, authService.changeEmail);
router.put('/auth/change-photo', verifyToken, upload.single('newPhoto'), authService.changePhotoProfile);
router.get('/challenge/random-asl-sentence', aslService.getASLRandomSentences);
router.get('/challenge/random-bisindo-sentence', bisindoService.getBisindoRandomSentences);
router.get('/challenge/leaderboard-asl', verifyToken, leaderboardService.getASLLeaderboard);
router.get('/challenge/leaderboard-bisindo', verifyToken, leaderboardService.getBisindoLeaderboard);
router.put('/challenge/update-asl-score', verifyToken, saveScoreService.updateASLScore);
router.put('/challenge/update-bisindo-score', verifyToken, saveScoreService.updateBisindoScore);

module.exports = router;