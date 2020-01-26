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
const hbs = require("hbs");
var jwt = require("jsonwebtoken");
var cookieParser = require("cookie-parser");

router.use(cookieParser());

// require('../../config/dev.env')
// var jws = require('express-jwt-session')
// var isAuthenticated = jws.isAuthenticated(PROCESS.ENV.JWT_SECRET);

var jsonParser = bodyParser.json();

var urlencodedParser = bodyParser.urlencoded({ extended: false });

router.use(bodyParser.urlencoded({ extended: false }));

router.use(bodyParser.json());

//Define paths for Express config
const publicDirectoryPath = path.join(__dirname, "../public");
const viewsPath = path.join(__dirname, "./src/templates/views");
const partialsPath = path.join(__dirname, "./src/templates/partials");

//Setup handlebars engine and views location

//Setup static directory to serve
router.use(express.static(publicDirectoryPath));
router.use(express.static(viewsPath));
router.use(express.static(partialsPath));

router.get("/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (e) {
    res.status(500).send();
  }
});

router.post("/users", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.cookie("auth_token", token);
    res.sendFile(path.resolve(__dirname, "..", "views", "private.html"));
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get("/users/login", async (req, res) => {
  try {
    const user = await User.find({});
    res.send(user);
  } catch (e) {
    res.status(500).send();
  }
});

router.post("/users/login", async (req, res) => {
  const avatar = req.file;
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.cookie("auth_token", token);
    res.render("dashboard", {
      title: "Dashboard",
      name: user.name,
      avatar: avatar
    });
  } catch (e) {
    res.status(400).send();
  }
});

router.get("/users/me", auth, async (req, res) => {
  try {
    const user = req.user;
    const avatar = req.file;

    res.render("profile", {
      title: "Profile",
      name: user.name,
      id: user.id,
      email: user.email,
      avatar: avatar
    });
  } catch (e) {
    res.status(400).send();
  }
});

const FILE_PATH = "uploads";

const upload = multer({
  dest: `${FILE_PATH}/`,
  limits: {
    files: 5,
    fieldSize: 2 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error("Only image are allowed."), false);
    }
    cb(null, true);
  }
});

router.post("/users/me/avatar", upload.single("avatar"), async (req, res) => {
  try {
    const avatar = req.file;

    if (!avatar) {
      res.status(400).send({
        status: false,
        data: "No file is selected."
      });
    } else {
      // res.sendFile(path.resolve(__dirname, "..", "views", "avatar.html"));

      res.send({
        status: true,
        message: "File is uploaded.",
        data: {
          name: avatar.originalname,
          mimetype: avatar.mimetype,
          size: avatar.size
        }
      });
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    }
    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

router.delete(
  "/users/me/avatar",
  auth,
  async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password"];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    res.status(400).send({ error: "Invalid Operation" });
  }

  try {
    updates.forEach(update => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/logout", async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token != req.token;
    });
    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    sendByeEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});

// router.post("/users/logoutAll", auth, async (req, res) => {
//   try {
//     req.user.tokens = [];
//     await req.user.save();
//     res.send();
//   } catch (e) {
//     res.status(500).send();
//   }
// });

// router.set("view engine", "hbs");
// router.set("views", viewsPath);
hbs.registerPartials(partialsPath);

router.use(express.json());

module.exports = router;
