const express = require("express");
const expressHandlebars = require("express-handlebars");
const data = require("./data.js");
const app = express();

app.engine(
  "hbs",
  expressHandlebars.engine({
    defaultLayout: "main.hbs",
  })
);

app.use(express.static("public"));

app.get("/", function (request, response) {
  response.render("start.hbs");
});

app.get("/projects", function (request, response) {
  const model = { projects: data.projects };

  response.render("projects.hbs", model);
});

app.get("/blogs", function (request, response) {
  const model = { blogs: data.blogs };

  response.render("blogs.hbs", model);
});

app.get("/projects/:id", function (request, response) {
  const id = request.params.id;
  const project = data.projects.find((project) => project.id == id);
  const model = { project: project };
  response.render("singleProject.hbs", model);
});

app.get("/blogs/:id", function (request, response) {
  const id = request.params.id;
  const blog = data.blogs.find((blog) => blog.id == id);
  const model = { blog: blog };
  response.render("singleBlog.hbs", model);
});

app.listen(8080);
