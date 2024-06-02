const { admin } = require("../config/firebase");

const verifyToken = async (req, res, next) => {
    const idToken = req.cookies.access_token;
    console.log('Received token:', idToken);

    if (!idToken) {
        return res.status(403).json({ error: 'No token provided' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken); 
        req.user = decodedToken;
        console.log('Token verified, user:', req.user);
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(403).json({ error: 'Unauthorized' });
    }
};

module.exports = verifyToken;