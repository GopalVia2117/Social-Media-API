const router = require("express").Router();
const bcrypt = require("bcrypt");

const User = require("../models/User");

//Register
router.post("/register", async (req, res) => {
  try {
    // generate hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // create new user
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(200).json({ newUser });
  } catch (err) {
    console.log(err);
    res.status(400).send("error occurred");
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    const isValid = await bcrypt.compare(req.body.password, user.password);
    return isValid
      ? res.status(200).json(user)
      : res.status(500).json("Credential do not match...");
  } catch (err) {
    console.log(err);
    res.status(400).send("error occurred");
  }
});

module.exports = router;
