const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const { validate } = require("deep-email-validator");
const sendMail = require("./utils/nodemailer");
const crypto = require("node:crypto");

const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");
const conversationRoute = require("./routes/conversations");
const messageRoute = require("./routes/messages");
const User = require("./models/User");
const Token = require("./models/Token");

dotenv.config();

const PORT = process.env.PORT || 8001;

const corsOptions = {
  origin: process.env.ORIGIN || "*",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// database connection
mongoose
  .connect(process.env.MONGO_CONNECT_URL)
  .then(() => console.log("Connected!"));

// middleware
app.use(express.json());
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan("common"));

app.use("/images", express.static(path.join(__dirname, "public/images")));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);

app.get("/", (req, res) => {
  res.send("welcome to homepage..");
});

app.post("/api/upload", (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json("No files were uploaded.");
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file

  const result = cloudinary.uploader.upload(req.files.file.tempFilePath, {
    public_id: req.body.name.split(".")[0],
  });

  result
    .then((data) => {
      return res.status(200).json({ url: data.secure_url });
    })
    .catch((err) => {
      return res.status(500).json(err);
    });
});

app.post("/api/send-mail", async (req, res) => {
  try {
    console.log(req.body.email);
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send("Invalid email");
    const { valid } = await validate(req.body.email);
    if (!valid) return res.status(400).send("Invalid Email");

    const token = new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    });
    await token.save();

    const subject = "Socio Verification";
    const html = `
        <h2>Verify your Email Adress</h2>
        <button style="padding: 4px 8px 4px 8px; background-color:green; color: white">
         <a style="text-decoration:none" href="${process.env.CLIENT_URL}/users/${user._id}/verify/${token.token}/password/update">Verify your account</a>
        </button>
        `;
    await sendMail(user.email, subject, html);
    return res
      .status(200)
      .send("An email has been sent to your account, please verify");
  } catch (error) {
    return res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log("Backend server is running at " + PORT);
});
