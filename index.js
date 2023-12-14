const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/usr_management_system");

//------------Express importing-------------------
const express = require("express");
const app = express();
const puppeteer = require('puppeteer');

app.use(express.static("public"));

//------------user-----------------

const userRouter = require("./routes/userRouter");
app.use("/", userRouter);

// -----------admin-------------
const adminRouter = require("./routes/adminRouter");
app.use("/admin", adminRouter);

app.listen(7000, () => console.log("Server running...7000"));
