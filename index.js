const express = require("express");
const router = require("./src/routes/routes");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
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