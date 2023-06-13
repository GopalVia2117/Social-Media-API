const nodemailer = require("nodemailer");

function sendMail(to, subject, html) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    name: "Socio",
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  const promise = new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) reject("Email could not be sent.");
      else resolve("Email sent successfully.");
    });
  });

  return promise;
}

module.exports = sendMail;
