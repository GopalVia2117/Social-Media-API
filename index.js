const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");
const conversationRoute = require("./routes/conversations");
const messageRoute = require("./routes/messages");

dotenv.config();

const PORT = process.env.PORT || 8001;

const corsOptions = {
  origin: process.env.ORIGIN,
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
// console.log(path.join(__dirname, "public/images"));
// app.get("/images", (req, res) => {
//   res.sendFile(path.join(__dirname, "public/images/ad.png"));
// });

app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);

app.get("/", (req, res) => {
  res.send("welcome to homepage..");
});

// multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "public/images"));
  },
  filename: (req, file, cb) => {
    cb(null, req.body.name);
  },
});
const upload = multer({ storage });
app.post("/api/upload", upload.single("file"), (req, res, next) => {
  try {
    return res.status(200).json("File uploaded successfully");
  } catch (error) {
    console.log(error);
  }
});

app.listen(PORT, () => {
  console.log("Backend server is running at " + PORT);
});
