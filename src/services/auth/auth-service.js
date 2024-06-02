const {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    db
} = require("../../config/firebase");

const auth = getAuth();

class AuthService {
    register(req, res) {
        const { email, password, username } = req.body;
        if (!email || !password) {
            return res.status(422).json({
                email: "Email is required",
                password: "Password is required",
            });
        }
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                db.collection("users").doc(userCredential.user.uid).set({
                    username: username,
                    email: userCredential.user.email,
                    createdAt: new Date(),
                    score: 0,
                    url_photo: "",
                })
                sendEmailVerification(auth.currentUser)
                    .then(() => {
                        res.status(201).json({ message: "Verification email sent! User created successfully!" });
                    })
                .catch((error) => {
                    console.error(error);
                    res.status(500).json({ error: "Error sending email verification" });
                });
            })
        .catch((error) => {
            const errorMessage = error.message || "An error occurred while registering user";
            res.status(500).json({ error: errorMessage });
        });
    }

    login(req, res) {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(422).json({
                email: "Email is required",
                password: "Password is required",
            });
        }
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => { 
                const idToken = userCredential._tokenResponse.idToken
                    if (idToken) {
                    res.cookie('access_token', idToken, {
                        httpOnly: true
                    });
                    res.status(200).json({ message: "User logged in successfully", user: userCredential.user });
                } else {
                    res.status(500).json({ error: "Internal Server Error" });
                }
            })
        .catch((error) => {
            console.error(error);
            const errorMessage = error.message || "An error occurred while logging in";
            res.status(500).json({ error: errorMessage });
        });
    }

    logout(req, res) {
        signOut(auth)
        .then(() => {
                res.clearCookie('access_token');
                res.status(200).json({ message: "User logged out successfully" });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: "Internal Server Error" });
        });
    }


    resetPassword(req, res){
        const { email } = req.body;
        if (!email ) {
            return res.status(422).json({
                email: "Email is required"
            });
        }
        sendPasswordResetEmail(auth, email)
        .then(() => {
            res.status(200).json({ message: "Password reset email sent successfully!" });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: "Internal Server Error" });
        });
    }

    getUserInfo(req, res) {
        const user = auth.currentUser;
        if (user) {
            const user_ref = db.collection("users").doc(user.uid);
            user_ref.get().then((user_info) => {
                if (!user_info.exists) {
                    res.status(404).json({ error: "User not found" });
                } else {
                    res.status(200).json({ user: user_info.data() });
                }
            }).catch((error) => {
                console.error(error);
                res.status(500).json({ error: "Internal Server Error" });
            });
        } else {
            res.status(401).json({ error: "No user signed in" });
        }
    }

    getAllUserScores(req, res) {
        db.collection("users").where("score", ">", 0).orderBy("score", "desc").get()
        .then((snapshot) => {
            if (snapshot.empty) {
                return res.status(200).json({ error: "No users found" });
            }
            const users = [];
            snapshot.forEach((doc) => {
                const userData = doc.data();
                users.push({
                    username: userData.username,
                    score: userData.score,
                    url_photo: userData.url_photo,
                });
            });
            res.status(200).json({ users: users });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: "Internal Server Error" });
        });
    }
}

module.exports = new AuthService();