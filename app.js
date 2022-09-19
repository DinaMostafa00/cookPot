/// loading
const express = require("express");
const expressHandlebars = require("express-handlebars");
const data = require("./data.js");
const app = express();

////engine
app.engine(
  "hbs",
  expressHandlebars.engine({
    defaultLayout: "main.hbs",
  })
);

/// dstatic files
app.use(express.static("public"));

///QQQ
app.use(
  express.urlencoded({
    extended: false,
  })
);

///////
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

app.get("/contactme", function (request, response) {
  response.render("contactMe.hbs");
});

app.get("/aboutme", function (request, response) {
  response.render("aboutMe.hbs");
});

//////post

app.post("/blogs/:id", function (request, response) {
  const name = request.body.name;
  const title = request.body.title;
  const comment = request.body.comment;

  data.comments.push({
    commentId: data.comments.length + 1,
    name: name,
    title: title,
    comment: comment,
  });
  console.log(data.comments);

  response.redirect("/blogs/:id");
});

////get
app.get("/projects/:id", function (request, response) {
  const id = request.params.id; //to get the actual value of the id
  const project = data.projects.find((project) => project.id == id); // we call a method on this array (find) to find a project whose id is equal to what stored in the id variable
  const model = { project: project };
  response.render("singleProject.hbs", model);
});

app.get("/blogs/:id", function (request, response) {
  const id = request.params.id;
  const blog = data.blogs.find((blog) => blog.id == id);
  const model = { blog: blog, comments: data.comments };
  response.render("singleBlog.hbs", model);
});

app.listen(8080);
