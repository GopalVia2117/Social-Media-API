const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

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

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

cloudinary.config({
  cloud_name: "djop9ubq6",
  api_key: "612891234139542",
  api_secret: "M6L4hKyr0nt9LoVXSSKcgSMHuj0",
});

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

app.post("/api/upload", (req, res, next) => {
  let sampleFile;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json("No files were uploaded.");
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  sampleFile = req.files.file;
  const result = cloudinary.uploader.upload(req.files.file.tempFilePath);

  result
    .then((data) => {
      return res.status(200).json({ url: data.secure_url });
    })
    .catch((err) => {
      return res.status(500).json(err);
    });
});

app.listen(PORT, () => {
  console.log("Backend server is running at " + PORT);
});
