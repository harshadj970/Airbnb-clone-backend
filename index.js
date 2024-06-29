const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User.js");
const Place = require("./models/Place.js");
const jwt = require("jsonwebtoken");
const imgDownloader = require("image-downloader");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "amvlwo";
require("dotenv").config();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: "https://airbnb-clone-io.vercel.app",
  })
);
app.use("/uploads", express.static(__dirname + "/uploads"));
main();
async function main() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("database connected");
}

app.get("/", (req, res) => {
  res.json("test success");
});

app.post("/register", async (req, res) => {
  const { name, email, password, avatar } = req.body;
  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
      avatar,
    });
    res.json(userDoc);
  } catch (error) {
    res.status(422).json("error occured");
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const userDoc = await User.findOne({ email });
  if (userDoc) {
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      jwt.sign({ email, id: userDoc._id }, jwtSecret, {}, (err, token) => {
        if (err) throw err;
        res.cookie("token", token).json(userDoc);
      });
    } else {
      res.status(422).json("pass not ok");
    }
  } else {
    res.json("not found");
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, user) => {
      if (err) throw err;
      const { _id, name, email, avatar } = await User.findById(user.id);
      res.json({ _id, name, email, avatar });
    });
  } else {
    res.json(null);
  }
});

app.get("/user", async (req, res) => {
  const { id } = req.query;
  const user = await User.findById(id);
  if (user) {
    res.json({ name: user.name, email: user.email, avatar: user.avatar });
  } else {
    res.json("no user found");
  }
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").send(true);
});

app.post("/upload-by-link", async (req, res) => {
  const { link } = req.body;
  const newName = Date.now() + ".jpg";
  await imgDownloader.image({
    url: link,
    dest: __dirname + "/uploads/" + newName,
  });
  res.json(newName);
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});

const upload = multer({ storage });
app.post("/upload-profile", upload.single("profile"), (req, res) => {
  if (!req.file) {
    return res.json("no files uploaded");
  }
  res.status(200).json(req.file);
});
app.post("/upload", upload.array("photos"), (req, res) => {
  if (req.files.length === 0) {
    return res.json("no files uploaded");
  }
  res.status(200).json(req.files);
});

app.post("/places", (req, res) => {
  const {
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
    price,
    bedroom,
    bathroom,
  } = req.body;
  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, user) => {
    if (err) throw err;
    const placeDoc = await Place.create({
      owner: user.id,
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
      price,
      bedrooms: bedroom,
      bathrooms: bathroom,
    });
    res.json(placeDoc);
  });
});

app.get("/user-places", async (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, user) => {
    const { id } = user;
    res.json(await Place.find({ owner: id }));
  });
});

app.get("/places", async (req, res) => {
  const places = await Place.find();
  res.json(places);
});

app.put("/places", async (req, res) => {
  const { token } = req.cookies;
  const {
    id,
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
    price,
    bedroom,
    bathroom,
  } = req.body;
  const updatedDoc = {
    title,
    address,
    photos: addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
    price,
    bedrooms: bedroom,
    bathrooms: bathroom,
  };
  jwt.verify(token, jwtSecret, {}, async (err, user) => {
    const placeDoc = await Place.findById(id);
    const { id: userId } = user;
    if (userId === placeDoc.owner.toString()) {
      await Place.findByIdAndUpdate(id, updatedDoc);
      res.json("document updated");
    }
  });
});

app.get("/places/:id", async (req, res) => {
  const { id } = req.params;
  res.json(await Place.findById(id));
});

app.get("/place/:id", async (req, res) => {
  const { id } = req.params;
  res.json(await Place.findById(id));
});
app.listen(process.env.PORT, () => {
  console.log("server is listening");
});
