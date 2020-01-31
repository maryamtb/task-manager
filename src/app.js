const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const hbs = require("hbs");
var cookieParser = require('cookie-parser')
const methodOverride = require('method-override');

var jsonParser = bodyParser.json();

// var urlencodedParser = bodyParser.urlencoded({ extended: false })
const dotenv = require("dotenv");

dotenv.config('env');

require("./db/mongoose.js");


const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

app.use(methodOverride('_method'));

const publicDirectoryPath = path.join(__dirname, "../public");
const viewsPath = path.join(__dirname, "./templates/views");
const partialsPath = path.join(__dirname, "./templates/partials");

app.set("view engine", "hbs");
app.set("views", viewsPath);
hbs.registerPartials(partialsPath);

app.use(express.static(publicDirectoryPath));
app.use(cookieParser())


app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

module.exports = app;