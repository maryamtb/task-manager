const app = require("./app");
const port = process.env.PORT;
const express = require("express");

const cookieParser = require("cookie-parser");




app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.listen(port, () => {
  console.log("Server is up on port " + port);
});
