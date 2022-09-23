/// loading
const express = require("express");
const expressHandlebars = require("express-handlebars");
const data = require("./data.js");

const sqlite3 = require("sqlite3");
const db = new sqlite3.Database("recipesDatabase.db");

db.run(
  "CREATE TABLE IF NOT EXISTS recipes (id INTEGER PRIMARY KEY, title TEXT, description TEXT, ingredients TEXT, directions TEXT)"
);

db.run(
  "CREATE TABLE IF NOT EXISTS blogPosts (id INTEGER PRIMARY KEY, title TEXT, content TEXT, source TEXT)"
);

db.run(
  "CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY, commenterName TEXT, title TEXT, comment TEXT, blogPostId INTEGER, FOREIGN KEY (blogPostId) REFERENCES blogPosts(id) )"
);

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

///recipes
app.get("/recipes", function (request, response) {
  const query = "SELECT * FROM recipes";
  db.all(query, function (error, recipes) {
    const model = { recipes };
    response.render("recipes.hbs", model);
  });
});

////////

app.get("/blogs", function (request, response) {
  const query = "SELECT * FROM blogPosts";
  db.all(query, function (error, blogPosts) {
    const model = { blogPosts };

    response.render("blogs.hbs", model);
  });
});
////////

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
  const id = request.params.id;

  data.comments.push({
    commentId: data.comments.length + 1,
    name: name,
    title: title,
    comment: comment,
  });
  console.log(data.comments);

  response.redirect("/blogs/" + id);
});

////get IDs

app.get("/recipes/:id", function (request, response) {
  const id = request.params.id; //to get the actual value of the id
  const query = "SELECT * FROM recipes WHERE id= ?";
  const values = [id];
  db.get(query, values, function (error, recipe) {
    const model = { recipe };
    response.render("singleRecipe.hbs", model);
  });

  // const recipe = data.recipes.find((recipe) => recipe.id == id); // we call a method on this array (find) to find a project whose id is equal to what stored in the id variable
});

////////
app.get("/blogs/:id", function (request, response) {
  const id = request.params.id;
  const query = "SELECT * FROM blogPosts WHERE id= ?";
  const values = [id];
  db.get(query, values, function (error, blogPosts) {
    const model = { blog };
    response.render("singleBlog.hbs", model);
  });

  // const model = { blog: blog, comments: data.comments };
  // const blog = data.blogs.find((blog) => blog.id == id);
});

app.listen(8080);
