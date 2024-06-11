const {
    getAuth,
    db
} = require("../../config/firebase");

const auth = getAuth();

class UpdateScoreService {
    async updateASLScore(req, res) {
        const user = auth.currentUser;
        if (!user) {
            return res.status(401).json({ error: "No user logged in" });
        }

        const { asl_score } = req.body;
        if (!asl_score || asl_score === "0") {
            return res.status(400).json({ error: "Score is required" });
        }
        
        try {
            const userRef = db.collection("users").doc(user.uid);
            const userData = (await userRef.get()).data();

            if (!userData) {
                return res.status(404).json({ error: "User not found" });
            }
            
            const oldASLScore = userData.asl_score;
            const newASLScore = parseInt(asl_score) + parseInt(oldASLScore);

            await userRef.update({
                asl_score : newASLScore
            });

            return res.status(200).json({ 
                message: "Score saved successfully!",
                new_asl_score: newASLScore
            });
        } catch (error) {
            console.error("Error updating score:", error.message);
            res.status(500).json({ error: "Internal Server Error" })
        }
    }
}

module.exports = new UpdateScoreService();