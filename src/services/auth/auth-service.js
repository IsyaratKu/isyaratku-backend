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
    async register(req, res) {
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
                    asl_score: 0,
                    bisindo_score : 0,
                    url_photo: "",
                })
                sendEmailVerification(auth.currentUser)
                    .then(() => {
                        res.status(201).json({ message: "Verification email sent! User created successfully!" });
                    })
                .catch((error) => {
                    console.error(error.message);
                    res.status(500).json({ error: "Error sending email verification" });
                });
            })
        .catch((error) => {
            const errorMessage = error.message || "An error occurred while registering user";
            res.status(500).json({ error: errorMessage });
        });
    }

    async login(req, res) {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(422).json({
                email: "Email is required",
                password: "Password is required",
            });
        }
        signInWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => { 
                const idToken = await userCredential.user.getIdToken();
                if (idToken) {
                    res.status(200).json({ 
                        message: "User logged in successfully", 
                        token: idToken, 
                        user: {
                            uid: userCredential.user.uid,
                            email: userCredential.user.email,
                            emailVerified: userCredential.user.emailVerified,
                            isAnonymous: userCredential.user.isAnonymous
                        }
                    });
                    if (!userCredential.user.emailVerified) {
                        sendEmailVerification(auth.currentUser)
                        .then(() => {
                            console.log("Verification email sent!");
                        })
                        .catch((error) => {
                            console.error(error.message);
                        });
                    }
                } else {
                    res.status(500).json({ error: "Internal Server Error" });
                }
            })
            .catch((error) => {
                console.error(error.message);
                const errorMessage = error.message || "An error occurred while logging in";
                res.status(500).json({ error: errorMessage });
            });
    }

    async logout(req, res) {
        const user = auth.currentUser;
        if (!user) {
            return res.status(401).json({ error: "No user logged in" });
        }
        signOut(auth)
        .then(() => {
                res.status(200).json({ message: "User logged out successfully" });
        })
        .catch((error) => {
            console.error(error.message);
            res.status(500).json({ error: "Internal Server Error" });
        });
    }


    async resetPassword(req, res){
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
            console.error(error.message);
            res.status(500).json({ error: "Internal Server Error" });
        });
    }

    async getUserInfo(req, res) {
        const user = auth.currentUser;
        if (!user) {
            return res.status(401).json({ error: "No user logged in" });
        }
        const user_ref = db.collection("users").doc(user.uid);
        user_ref.get().then((user_info) => {
            if (!user_info.exists) {
                res.status(404).json({ error: "User not found" });
            } else {
                res.status(200).json({ user: user_info.data() });
            }
        }).catch((error) => {
            console.error(error.message);
            res.status(500).json({ error: "Internal Server Error" });
        });

    }

    async getAllUserScores(req, res) {
        db.collection("users").where("asl_score", ">", 0).orderBy("asl_score", "desc").get()
        .then((snapshot) => {
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
        })
        .catch((error) => {
            console.error(error.message);
            res.status(500).json({ error: "Internal Server Error" });
        });
    }

    async changeUsername(req, res) {
        const user = auth.currentUser;
        if (!user) {
            return res.status(401).json({ error: "No user logged in" });
        }
        const { oldUsername, newUsername } = req.body;
        if (!oldUsername || !newUsername) {
            return res.status(422).json({ error: "Invalid request" });
        }
        try {
            const userRef = db.collection("users").doc(user.uid);
            const userData = (await userRef.get()).data();
            
            // Verifikasi username lama
            if (userData.username !== oldUsername) {
                return res.status(400).json({ error: "Old username does not match" });
            }
            if (userData.username === newUsername) {
                return res.status(400).json({ error: "New username is the same as the old one" });
            }

            await userRef.update({ username: newUsername });
            res.status(200).json({ message: "Username updated successfully" });
        } catch (error) {
            console.error("Error updating username:", error.message);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    async changeEmail(req, res) {
        const user = auth.currentUser;
        
        if (!user) {
            return res.status(401).json({ error: "No user logged in" });
        }

        const { oldEmail, newEmail } = req.body;
        if (!oldEmail || !newEmail) {
            return res.status(422).json({ error: "Invalid request" });
        }
        try {
            const userRef = db.collection("users").doc(user.uid);
            const userData = (await userRef.get()).data();

            // Verifikasi email lama
            if (userData.email !== oldEmail) {
                return res.status(400).json({ error: "Old email does not match" });
            }
            if (userData.email === newEmail) {
                return res.status(400).json({ error: "New email is the same as the old one" });
            }

            await admin.auth().updateUser(user.uid, { email: newEmail, emailVerified: false});
            await db.collection("users").doc(user.uid).update({ email: newEmail });


            res.status(200).json({ message: "Email updated successfully!" });
        } catch (error) {
            console.error("Error updating email:", error.message);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    async changePhotoProfile(req, res) {
        const user = auth.currentUser;
        
        if (!user) {
            return res.status(401).json({ error: "No user logged in" });
        }

        if (!req.file) {
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
            console.error("Error updating photo profile:", error.message);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new AuthService();