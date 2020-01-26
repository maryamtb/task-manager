const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");
const router = new express.Router();
var cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path");

router.use(cookieParser());
router.use(bodyParser.urlencoded({ extended: false }));

router.use(bodyParser.json());

const publicDirectoryPath = path.join(__dirname, "../public");
const viewsPath = path.join(__dirname, "./src/templates/views");
const partialsPath = path.join(__dirname, "./src/templates/partials");

router.use(express.static(publicDirectoryPath));
router.use(express.static(viewsPath));
router.use(express.static(partialsPath));

router.get('/tasks', auth, async (req, res) => {
  const match = {}
  const sort = {}

  if (req.query.completed) {
      match.completed = req.query.completed === 'true'
  }
  
  if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':')
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
  }

  try {
      await req.user.populate({
          path: 'tasks',
          match,
          options: {
              limit: parseInt(req.query.limit),
              skip: parseInt(req.query.skip),
              sort
          }
      }).execPopulate()
      // res.send(req.user.tasks)
      // const task = req.user.tasks
      // res.sendFile("tasks", {
      //   title: "Tasks",
      //   description: task.description,
      //   status: task.completed,
      //   owner: task.owner
      // });
      res.sendFile(path.resolve(__dirname, "..", "templates", "views/tasks.hbs"));

  } catch (e) {
      res.status(500).send()
  }
})

router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  });

  try {
    await task.save();
    res.render("add task", {
      title: "Add Task",
      description: task.description,
      status: task.completed,
      owner: task.owner
    });
  } catch (e) {
    res.status(400).send(e);
  }
});


router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  const user = req.user
  try {
    const task = await Task.findOne({ _id, owner: user._id });

    if (!task) {
      return res.status(404).send();
    }

    res.send(task);
  } catch (e) {
    res.status(500).send();
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

    res.send(task);
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

  if (!isValidOperation) {
    res.status(400).send({ error: "Invalid Operation" });
  }

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

    res.send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.use(express.json());

module.exports = router;