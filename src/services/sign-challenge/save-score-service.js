const {
    getAuth,
    db
} = require("../../config/firebase");

const auth = getAuth();

class UpdateScoreService {
    async updateScore(req, res) {
        const user = auth.currentUser;
        if (!user) {
            return res.status(401).json({ error: "No user logged in" });
        }

        const { score } = req.body;
        if (!score) {
            return res.status(400).json({ error: "Score is required" });
        }
        
        try {
            const userRef = db.collection("users").doc(user.uid);
            const userData = (await userRef.get()).data();

            if (!userData) {
                return res.status(404).json({ error: "User not found" });
            }
            
            const oldScore = userData.score;
            const newScore = parseInt(score) + parseInt(oldScore);

            await userRef.update({
                score : newScore
            });

            return res.status(200).json({ message: "Score saved successfully!" });
        } catch (error) {
            console.error("Error updating score:", error.message);
            res.status(500).json({ error: "Internal Server Error" })
        }
    }
}

module.exports = new UpdateScoreService();