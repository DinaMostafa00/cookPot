/// loading
const express = require("express");
const expressHandlebars = require("express-handlebars");
// const data = require("./datanomore.js");
const sqlite3 = require("sqlite3");

const minCommenterNameLength = 2;
const minTitleLength = 2;
const minCommentLength = 2;

const correctUsername = "admin";
const correctPassword = "1234567";

const db = new sqlite3.Database("recipesDatabase.db");

db.run(
  "CREATE TABLE IF NOT EXISTS recipes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, ingredients TEXT, directions TEXT, duration TEXT, calories TEXT)"
);

db.run(
  "CREATE TABLE IF NOT EXISTS blogPosts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT, source TEXT)"
);

db.run(
  "CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, commenterName TEXT, title TEXT, comment TEXT, blogPostId INTEGER, FOREIGN KEY (blogPostId) REFERENCES blogPosts(id) ON DELETE CASCADE)"
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

///QQQQQQQQQQQQQ
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

////// POST REQUESTSSSSS

function getValidationErrorsForBlogs(commenterName, title, comment) {
  const validationErrors = [];

  if (commenterName.length < minCommenterNameLength) {
    validationErrors.push(
      "Name should be at least" + minCommenterNameLength + " characters long."
    );
  }
  if (title.length < minTitleLength) {
    validationErrors.push(
      "Title should be at least" + minCommenterNameLength + " characters long."
    );
  }
  if (comment.length < minCommentLength) {
    validationErrors.push(
      "Comment should be at least" + minCommentLength + " characters long."
    );
  }
  return validationErrors;
}

app.post("/blogs/:id", function (request, response) {
  const commenterName = request.body.commenterName;
  const title = request.body.title;
  const comment = request.body.comment;
  const blogPostId = request.params.id;

  const validationErrors = getValidationErrorsForBlogs(
    commenterName,
    title,
    comment
  );
  ////we also pass it the update when you get there just pass it new parameters to watch this again tutorial 3 (33:35)

  if (validationErrors.length == 0) {
    const query =
      "INSERT INTO comments (commenterName, title, comment, blogPostId) values (?,?,?,?) ";
    const values = [commenterName, title, comment, blogPostId];

    db.run(query, values, function (error) {
      console.log(error);

      response.redirect("/blogs/" + blogPostId);
    });
  } else {
    /////// the same from the get request to fetc
    const querySelectBlogPost = "SELECT * FROM blogPosts WHERE id= ? ";
    const querySelectComments = "SELECT * FROM comments WHERE blogPostId= ? ";
    const values = [blogPostId];
    db.get(querySelectBlogPost, values, function (error, blogPost) {
      db.all(querySelectComments, values, function (error, comments) {
        // const model = { blogPost, comments };
        const model = {
          validationErrors,
          commenterName,
          title,
          comment,
          comments,
          blogPost,
        };

        response.render("singleBlog.hbs", model);
      });
    });
  }
});

app.post("/deleteComment/:id", function (request, response) {
  const id = request.params.id;
  response.redirect("/blogs/" + id);
});

///post for login
app.post("/login", function (request, response) {
  const enteredUsername = request.body.username;
  const enteredPassword = request.body.password;

  if (
    enteredUsername == correctUsername &&
    enteredPassword == correctPassword
  ) {
  } else {
  }
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
  const querySelectBlogPost = "SELECT * FROM blogPosts WHERE id= ? ";
  const querySelectComments = "SELECT * FROM comments WHERE blogPostId= ? ";
  const values = [id];
  db.get(querySelectBlogPost, values, function (error, blogPost) {
    db.all(querySelectComments, values, function (error, comments) {
      const model = { blogPost, comments };
      response.render("singleBlog.hbs", model);
    });

    // const model = { blogPost, comments };
  });
});

app.get("/login", function (request, response) {
  response.render("login.hbs");
});

app.listen(8080);
