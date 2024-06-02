const {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    db,
    admin,
    bucket
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

    async changeUsername(req, res) {

        const { oldUsername, newUsername } = req.body;
        const user = req.user;
        if (!user ||!oldUsername || !newUsername) {
            return res.status(422).json({ error: "Invalid request" });
        }

        try {
            const userRef = db.collection("users").doc(user.uid);
            const userData = (await userRef.get()).data();

            // Verifikasi username lama
            if (userData.username !== oldUsername) {
                return res.status(400).json({ error: "Old username does not match" });
            }
            await userRef.update({ username: newUsername });

            res.status(200).json({ message: "Username updated successfully" });
        } catch (error) {
            console.error("Error updating username:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    async changeEmail(req, res) {
        const user = req.user;
        const { oldEmail, newEmail } = req.body;

        if (!user || !oldEmail || !newEmail) {
            return res.status(422).json({ error: "Invalid request" });
        }

        try {
            const userRef = db.collection("users").doc(user.uid);
            const userData = (await userRef.get()).data();

            // Verifikasi email lama
            if (userData.email !== oldEmail) {
                return res.status(400).json({ error: "Old email does not match" });
            }

            await admin.auth().updateUser(user.uid, { email: newEmail });
            await userRef.update({ email: newEmail });

            res.status(200).json({ message: "Email updated successfully" });
        } catch (error) {
            console.error("Error updating email:", error);
            res.status(500).json({ error: "Invalid request" });
        }
    }

    async changePhotoProfile(req, res) {
        const user = req.user;
    
        if (!user || !req.file) {
            return res.status(422).json({ error: "Invalid request" });
        }
    
        try {
            const userRef = db.collection("users").doc(user.uid);
            const userData = (await userRef.get()).data();
            const oldPhotoURL = userData.url_photo;
    
            // Upload new photo
            const fileName = `profile_pics/${user.uid}_${req.file.originalname}`;
            const file = bucket.file(fileName);
    
            await file.save(req.file.buffer, {
                contentType: req.file.mimetype,
                predefinedAcl: 'publicRead'
            });
    
            // Get URL of new photo
            const newPhotoURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    
            // Update Firestore
            await userRef.update({ url_photo: newPhotoURL });
    
            // Delete old photo if exists and is not empty or null
            if (oldPhotoURL && oldPhotoURL.trim() !== "") {
                const oldFileName = oldPhotoURL.split('/').pop();
                await bucket.file(`profile_pics/${oldFileName}`).delete();
            }
    
            res.status(200).json({ message: "Photo profile updated successfully", url_photo: newPhotoURL });
        } catch (error) {
            console.error("Error updating photo profile:", error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new AuthService();