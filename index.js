const express = require("express");
const expressHandlebars = require("express-handlebars");

app.engine(
  express(),
  "hbs",
  expressHandlebars.engine({
    defaultLayout: "main.hbs",
  })
);

app.get("/", function (request, response) {
  response.render("start.hbs");
});
