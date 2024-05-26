const express = require("express");
const router = require("./src/routes/routes");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(router);

app.get("/", (req, res) => {
    res.status(200).send({
        status: "success",
        message: "Hello World!",
    });
});

app.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
});