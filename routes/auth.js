const router = require("express").Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const sendMail = require("../utils/nodemailer");
const crypto = require("node:crypto");
const { validate } = require("deep-email-validator");
const Token = require("../models/Token");
const _ = require("lodash");

//Register
router.post("/register", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user)
      return res.status(409).send("User with given email already exists");

    const { valid } = await validate(req.body.email);
    if (!valid) return res.status(400).send("Please enter a valid email");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    let newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    });
    await newUser.save();

    const token = new Token({
      userId: newUser._id,
      token: crypto.randomBytes(32).toString("hex"),
    });
    await token.save();

    const subject = "Socio Verification";
    const html = `
        <h2>Verify your Email Address</h2>
        <button style="padding: 4px 8px 4px 8px; background-color:green; border: none">
         <a style="text-decoration:none; color:white" href="${process.env.CLIENT_URL}/users/${newUser._id}/verify/${token.token}">Verify your account</a>
        </button>  
        `;
    await sendMail(newUser.email, subject, html);
    return res
      .status(200)
      .send("An email has been sent to your account, please verify");
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    console.log(user);
    if (!user) return res.status(400).send("Enter valid credentials");
    const isValid = await bcrypt.compare(req.body.password, user.password);
    if (!isValid) return res.status(400).send("Enter valid credentials");

    if (!user.verified) {
      let token = await Token.findOne({ userId: user._id });
      if (!token) {
        token = new Token({
          userId: user._id,
          token: crypto.randomBytes(32).toString("hex"),
        });
        await token.save();

        const subject = "Socio Verification";
        const html = `
        <h2>Verify your Email Address</h2>
        <button style="padding: 4px 8px 4px 8px; background-color:green; border: none">
         <a style="text-decoration:none; color:white" href="${process.env.CLIENT_URL}/users/${user._id}/verify/${token.token}">Verify your account</a>
        </button>
        `;
        const info = await sendMail(user.email, subject, html);
      }
      return res
        .status(400)
        .send("An email has been sent to your account, please verify");
    }
    const filteredUser = _.pick(user, [
      "_id",
      "username",
      "email",
      "profilePicture",
      "coverPicture",
      "followers",
      "followings",
      "isAdmin",
      "desc",
      "city",
      "from",
      "relationship",
      "verified",
    ]);

    return res.status(200).send(filteredUser);
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
