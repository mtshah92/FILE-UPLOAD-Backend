// server.js

import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import multer from "multer";
import cors from "cors";

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/mern_file_upload_app", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
});

const User = mongoose.model("User", userSchema);

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const existingUser = await User.findOne({ username });

  if (existingUser) {
    return res.status(400).json({ message: "Username already taken" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    username,
    password: hashedPassword,
  });

  await newUser.save();

  res.status(201).json({ message: "User registered successfully" });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.status(200).json({ message: "Login successful" });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post("/upload", upload.single("file"), (req, res) => {
  res.status(201).json({ message: "File uploaded successfully" });
});

app.get("/files", (req, res) => {
  const files = fs.readdirSync("./uploads/");
  res.status(200).json({ files });
});

app.delete("/remove/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = `./uploads/${filename}`;

  fs.unlinkSync(filePath);

  res.status(200).json({ message: "File removed successfully" });
});

app.get("/download/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = `./uploads/${filename}`;

  res.download(filePath);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
