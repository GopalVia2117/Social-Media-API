const router = require("express").Router();
const { trusted } = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const Token = require("../models/Token");

//update user
router.put("/:id", async (req, res) => {
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    if (req.body.password) {
      try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      } catch (err) {
        return res.status(500).json(err);
      }
    }

    try {
      await User.findByIdAndUpdate(req.params.id, {
        $set: req.body,
      });
      return res.status(200).json("Account updated successfully");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can update only your account");
  }
});

// delete user
router.delete("/:id", async (req, res) => {
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    try {
      const user = await User.findByIdAndDelete(req.params.id);

      if (user) return res.status(200).json("Account has been deleted");
      return res.status(500).json("User not found");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can only delete your account");
  }
});

// get a user
router.get("/", async (req, res) => {
  const userId = req.query.userId;
  const username = req.query.username;

  try {
    const user = userId
      ? await User.findById(userId)
      : await User.findOne({ username: username });
    console.log(user);
    if (user) {
      const { password, createdAt, updatedAt, ...other } = user._doc;
      return res.status(200).json(other);
    } else return res.status(500).json("User does not exist");
  } catch (err) {
    return res.status(500).json(err);
  }
});

// get friends
router.get("/friends/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const friends = await Promise.all(
      user.followings.map((friendId) => {
        return User.findById(friendId).select("username profilePicture");
      })
    );
    return res.status(200).json(friends);
  } catch (error) {
    return res.status(500).json(error);
  }
});

// follow a user
router.put("/:id/follow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (!user.followers.includes(req.body.userId)) {
        await user.updateOne({ $push: { followers: req.body.userId } });
        await currentUser.updateOne({ $push: { followings: req.params.id } });
        return res.status(200).json("user has been followed");
      } else {
        return res.status(403).json("you already follow this user");
      }
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can't follow yourself");
  }
});

// unfollow a user
router.put("/:id/unfollow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (user.followers.includes(req.body.userId)) {
        await user.updateOne({ $pull: { followers: req.body.userId } });
        await currentUser.updateOne({ $pull: { followings: req.params.id } });
        return res.status(200).json("user has been unfollowed");
      } else {
        return res.status(403).json("you do not follow this user");
      }
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can't unfollow yourself");
  }
});

//search users
router.get("/search/:username", async (req, res) => {
  try {
    const users = await User.find();
    const response = users.filter((user) =>
      user.username.toLowerCase().includes(req.params.username.toLowerCase())
    );
    return res.status(200).json(response);
  } catch (error) {
    res.status(500).send("Internal server Error");
  }
});

router.get("/:id/verify/:token", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) return res.status(400).send("Invalid Link");

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    if (!token) return res.status(400).send("Invalid Link");

    await user.updateOne({ $set: { verified: true } });
    await token.deleteOne();
    return res.status(200).send("Email verified successfully");
  } catch (err) {
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
