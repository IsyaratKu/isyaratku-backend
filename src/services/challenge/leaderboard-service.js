const { db } = require("../../config/firebase");

class LeaderboardService {
    async getASLLeaderboard(req, res) {
        try {
        const snapshot = await db.collection("users").where("asl_score", ">", 0).orderBy("asl_score", "desc").get();
        if (snapshot.empty) {
            return res.status(200).json({ error: "No users found" });
        }
        const users = [];
        snapshot.forEach((doc) => {
            const userData = doc.data();
            users.push({
            username: userData.username,
            asl_score: userData.asl_score,
            url_photo: userData.url_photo,
            });
        });
        res.status(200).json({ users: users });
        } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal Server Error" });
        }
    }

    async getBisindoLeaderboard(req, res) {
        try {
        const snapshot = await db.collection("users").where("bisindo_score", ">", 0).orderBy("bisindo_score", "desc").get();
        if (snapshot.empty) {
            return res.status(200).json({ error: "No users found" });
        }
        const users = [];
        snapshot.forEach((doc) => {
            const userData = doc.data();
            users.push({
            username: userData.username,
            bisindo_score: userData.bisindo_score,
            url_photo: userData.url_photo,
            });
        });
        res.status(200).json({ users: users });
        } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

module.exports = new LeaderboardService();