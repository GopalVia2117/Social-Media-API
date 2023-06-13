const mongoose = require("mongoose");

const TokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      unique: true,
    },
    token: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, expires: 1000 * 60 * 10 }
);

module.exports = mongoose.model("Token", TokenSchema);
