const express = require("express");
const multer = require("multer");
// var upload = multer().single('avatar')
const sharp = require("sharp");
const User = require("../models/user");
const auth = require("../middleware/auth");
const { sendWelcomeEmail, sendByeEmail } = require("../emails/account");
const path = require("path");
const router = express.Router();
const bodyParser = require("body-parser");

// var jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

router.use(cookieParser());

var storage = multer.diskStorage({
  destination: function (req, file, cb){
    cb(null, 'public/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname + '-' +Date.now())
  }
});

// require('../../config/.dev.env')
// var isAuthenticated = jws.isAuthenticated(process.env.JWT_SECRET);

// var jsonParser = bodyParser.json();

// var urlencodedParser = bodyParser.urlencoded({ extended: false });

router.use(bodyParser.urlencoded({ extended: false }));

router.use(bodyParser.json());

const publicDirectoryPath = path.join(__dirname, "../public");
const viewsPath = path.join(__dirname, "./src/templates/views");
const partialsPath = path.join(__dirname, "./src/templates/partials");


router.use(express.static(publicDirectoryPath));
router.use(express.static(viewsPath));
router.use(express.static(partialsPath));

router.post("/users", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    // sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.cookie("auth_token", token);
    res.sendFile(path.resolve(__dirname, "..", "views", "private.html"));
    // res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.cookie("auth_token", token);
    res.sendFile(path.resolve(__dirname, "..", "views", "private.html"));
  } catch (e) {
    res.send("Hey, you didn't sign up.")
  }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.sendFile(path.resolve(__dirname, "..", "views", "logout.html"));
  } catch (e) {
    res.status(500).send();
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.render("profile", {
    name: req.user.name,
    email: req.user.email,
    id: req.user.id,
    avatar: req.user.avatar
  });
});

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    updates.forEach(update => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    sendCancelationEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (e) {
    res.status(500).send("Account Deleted.");
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image in jpg, jpeg, or png format."));
    }

    cb(undefined, true);
  }
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 150, height: 150 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.render("modified", {
      title: "Modified"
    });
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.render("modified", {
    title: "Modified"
  });
});

router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set("Content-Type", "image/jpg");
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

module.exports = router;