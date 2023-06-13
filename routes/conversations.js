const router = require("express").Router();
const Conversation = require("../models/Conversation");

// new conv
router.post("/", async (req, res) => {
  const newConversation = new Conversation({
    members: [req.body.senderId, req.body.receiverId],
  });

  try {
    const response = await newConversation.save();
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const conversation = await Conversation.find({
      members: { $in: req.params.userId },
    });
    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json(error);
  }
});

// get conv including two userId
router.get("/find/:firstUserId/:secondUserId", async (req, res) => {
  try {
    let conversation = await Conversation.findOne({
      members: { $all: [req.params.firstUserId, req.params.secondUserId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        members: [req.params.firstUserId, req.params.secondUserId],
      });
      await conversation.save();
    }
    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json(error);
  }
});
module.exports = router;
