const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/usr_management_system");

//------------Express importing-------------------
const express = require("express");
const app = express();
const puppeteer = require('puppeteer');

app.use(express.static("public"));

const userRouter = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter");

app.use("/", userRouter);
app.use("/admin", adminRouter);

// 404 handler for the entire application
app.use((req, res) => {
  res.status(404).send("404 Not Found");
});




app.listen(7000, () => console.log("Server running...7000"));
