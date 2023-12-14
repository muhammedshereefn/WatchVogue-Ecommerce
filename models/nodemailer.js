const nodemailer = require("nodemailer");
require("dotenv").config();
const randomString = require("randomstring");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "muhammedshereefshaz@gmail.com",
    pass: "xgcv qigy kjwz ivjr",
  },
});

function sendOtp(email) {
  const otp = randomString.generate({
    length: 6,
    charset: "numeric",
  });

  const mailOptions = {
    from: "muhammedshereefshaz@gmail.com",
    to: email,
    subject: "Otp Verification",
    text: `Your OTP : ${otp} `,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
  return otp;
}

module.exports = { sendOtp };
