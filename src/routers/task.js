const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");
const router = new express.Router();
var cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path");

router.use(cookieParser());
router.use(bodyParser.urlencoded({ extended: true }));

router.use(bodyParser.json());


const publicDirectoryPath = path.join(__dirname, "../public");
const viewsPath = path.join(__dirname, "./src/templates/views");
const partialsPath = path.join(__dirname, "./src/templates/partials");

// require('../../config/.dev.env')

router.use(express.static(publicDirectoryPath));
router.use(express.static(viewsPath));
router.use(express.static(partialsPath));

router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  });

  try {
    await task.save();
    res.render("update", {
      title: "update",
      taskList: req.user.tasks
    });
  } catch (e) {
    res.status(400).send(e);
  }
});


router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort
        }
      })
      .execPopulate();
    res.render("taskhub", {
      title: "tasks",
      taskList: req.user.tasks,
      name: req.user.name
    });
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }

    res.render("modified", {
      title: "Modified",
      taskList: req.user.tasks
    });

  } catch (e) {
    res.status(500).send();
  }
});



router.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );

  // if (!isValidOperation) {
  //   return res.status(400).send({ error: "Invalid updates!" });
  // }

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!task) {
      return res.status(404).send();
    }

    updates.forEach(update => (task[update] = req.body[update]));
    await task.save();

  } catch (e) {
    res.status(400).send(e);
  }
});


router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!task) {
      res.status(404).send();
    }
    await task.save();
    res.render("modified", {
      title: "Modified"
    });
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;