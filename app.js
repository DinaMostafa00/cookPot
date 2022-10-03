/// loading section
const express = require("express");
const expressHandlebars = require("express-handlebars");
const sqlite3 = require("sqlite3");
const expressSession = require("express-session");

///variables
const minCommenterNameLength = 2;
const minTitleLength = 2;
const minCommentLength = 2;
const correctUsername = "dina";
const correctPassword = "123";
const app = express();

///database and SQLITE
const db = new sqlite3.Database("recipesDatabase.db");

db.run("PRAGMA foreign_keys = ON");

db.run(
  "CREATE TABLE IF NOT EXISTS recipes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, ingredients TEXT, directions TEXT, duration TEXT, calories TEXT)"
);

db.run(
  "CREATE TABLE IF NOT EXISTS blogPosts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT, source TEXT)"
);

db.run(
  "CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, commenterName TEXT, title TEXT, comment TEXT, blogPostId INTEGER, FOREIGN KEY (blogPostId) REFERENCES blogPosts(id) ON DELETE CASCADE)"
);

//////Middleware section

//// watch again 58:59
app.use(
  expressSession({
    secret: "asdfghjkloiuytrezxcvbnm",
    //control if the session is empty should be still stored in server side or not
    saveUninitialized: false,
    //if the new session be stored in server oor not
    resave: false,
  })
);

////engine
app.engine(
  "hbs",
  expressHandlebars.engine({
    defaultLayout: "main.hbs",
  })
);

/// static files
app.use(express.static("public"));

///QQQQQQQQQQQQQ
app.use(
  express.urlencoded({
    extended: false,
  })
);

////our own middle ware for logging in - instead of writting it everywhere
//// it will run everytime we recieve an http request

app.use(function (request, response, next) {
  const isLoggedIn = request.session.isLoggedIn;
  response.locals.isLoggedIn = isLoggedIn;
  //local is obj where we can add info to to be read by our views
  next();
  //next to invoke the next middleware
});

/////ERRORS SECTION///////////

//COMMENTS
function getValidationErrorsForComments(commenterName, title, comment) {
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

///BLOG
function getValidationErrorsForBlog(title, content, source) {
  const validationErrors = [];

  if (title.length == 0) {
    validationErrors.push("Title field can't be empty");
  }
  if (content.length == 0) {
    validationErrors.push("Content field can't be empty");
  }
  if (source.length == 0) {
    validationErrors.push("Source field can't be empty");
  }
  return validationErrors;
}

//POSTS
function getValidationErrorsForRecipes(
  title,
  description,
  ingredients,
  directions,
  duration,
  calories
) {
  const validationErrors = [];

  if (title.length == 0) {
    validationErrors.push("Title field can't be empty");
  }
  if (description.length == 0) {
    validationErrors.push("description field can't be empty");
  }
  if (ingredients.length == 0) {
    validationErrors.push("ingredients field can't be empty");
  }
  if (directions.length == 0) {
    validationErrors.push("directions field can't be empty");
  }
  if (duration.length == 0) {
    validationErrors.push("duration field can't be empty");
  }
  if (calories.length == 0) {
    validationErrors.push("calories field can't be empty");
  }
  return validationErrors;
}

//////////////END OF ERRORS

////// POST REQUESTSSSSS///////////////////////

app.post("/blogs/:id", function (request, response) {
  const commenterName = request.body.commenterName;
  const title = request.body.title;
  const comment = request.body.comment;
  const blogPostId = request.params.id;

  const validationErrors = getValidationErrorsForComments(
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
    /////QQQ HERE
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

/////POST FOR CREATE
app.post("/createRecipe", function (request, response) {
  const title = request.body.title;
  const description = request.body.description;
  const ingredients = request.body.ingredients;
  const directions = request.body.directions;
  const duration = request.body.duration;
  const calories = request.body.calories;

  const errors = getValidationErrorsForRecipes(
    title,
    description,
    ingredients,
    directions,
    duration,
    calories
  );

  if (errors.length == 0) {
    const query =
      "INSERT INTO recipes (title, description, ingredients, directions, duration, calories) values (?,?,?,?,?,?) ";
    const values = [
      title,
      description,
      ingredients,
      directions,
      duration,
      calories,
    ];

    db.run(query, values, function (error) {
      console.log(error);

      response.redirect("/recipes");
    });
  } else {
    const model = {
      errors,
      title,
      description,
      ingredients,
      directions,
      duration,
      calories,
    };
    response.render("createRecipe.hbs", model);
  }
});

app.post("/createBlogPost", function (request, response) {
  const title = request.body.title;
  const content = request.body.content;
  const source = request.body.source;

  //vid 3 - 1:21:40 REMMBER TO WATCH

  const errors = getValidationErrorsForBlog(title, content, source);
  if (errors.length == 0) {
    const query =
      "INSERT INTO blogPosts (title, content, source) values (?,?,?) ";
    const values = [title, content, source];

    db.run(query, values, function (error) {
      console.log(error);

      response.redirect("/blogs");
    });
  } else {
    const model = {
      errors,
      title,
      content,
      source,
    };
    response.render("createBlogPost.hbs", model);
  }
});

app.post("/deleteRecipe/:id", function (request, response) {
  const id = request.params.id;
  const query = "DELETE FROM recipes WHERE id=?";
  const values = [id];
  console.log(values);
  db.run(query, values, function (error) {
    response.redirect("/recipes/");
  });
});

app.post("/updateRecipe/:id", function (request, response) {
  const id = request.params.id;
  const newTitle = request.body.title;
  const newDescription = request.body.description;
  const newIngredients = request.body.ingredients;
  const newDirections = request.body.directions;
  const newDuration = request.body.duration;
  const newCalories = request.body.calories;

  const errors = getValidationErrorsForRecipes(
    newTitle,
    newDescription,
    newIngredients,
    newDirections,
    newDuration,
    newCalories
  );

  if (errors.length == 0) {
    const query =
      "UPDATE recipes SET title = ?, description = ?, ingredients = ? , directions = ?, duration = ?, calories = ? WHERE id = ?";
    const values = [
      newTitle,
      newDescription,
      newIngredients,
      newDirections,
      newDuration,
      newCalories,
      id,
    ];

    db.run(query, values, function (error) {
      if (error) {
        console.log(error);
      } else {
        response.redirect("/recipes/" + id);
      }
    });
  } else {
    const model = {
      recipe: {
        title: newTitle,
        description: newDescription,
        ingredients: newIngredients,
        directions: newDirections,
        duration: newDuration,
        calories: newCalories,
      },
      errors,
      id,
    };
    response.render("updateRecipe.hbs", model);
  }
});

//////// I HAVE A QUESTION HERE why can't it read the blogPostId ?

app.post("/updateComment/:id/:blogPostId", function (request, response) {
  const id = request.params.id;
  const blogPostId = request.params.blogPostId;
  const newCommenterName = request.body.commenterName;
  const newTitle = request.body.title;
  const newComment = request.body.comment;

  const validationErrors = getValidationErrorsForComments(
    newCommenterName,
    newTitle,
    newComment
  );

  if (validationErrors.length == 0) {
    const query =
      "UPDATE comments SET commenterName = ?, title = ?, comment = ? WHERE id = ?";
    const values = [newCommenterName, newTitle, newComment, id];
    db.run(query, values, function (error) {
      if (error) {
        console.log(error);
      } else {
        response.redirect("/blogs/" + blogPostId);
      }
    });
  } else {
    const model = {
      comment: {
        commenterName: newCommenterName,
        title: newTitle,
        comment: newComment,
        blogPostId,
      },
      validationErrors,
    };

    response.render("updateComment.hbs", model);
  }
});

app.post("/deleteComment/:id/:blogPostId", function (request, response) {
  const id = request.params.id;
  const blogPostId = request.params.blogPostId;
  const query = "DELETE FROM comments WHERE id=?";
  const values = [id];
  // console.log(values);
  db.run(query, values, function (error) {
    response.redirect("/blogs/" + blogPostId);
  });
});

app.post("/deleteBlogPost/:id", function (request, response) {
  const id = request.params.id;
  const query = "DELETE FROM blogPosts WHERE id=?";
  const values = [id];
  // console.log(values);
  db.run(query, values, function (error) {
    response.redirect("/blogs");
  });
});

app.post("/updateBlogPost/:id", function (request, response) {
  const id = request.params.id;
  const newTitle = request.body.title;
  const newContent = request.body.content;
  const newSource = request.body.source;

  const errors = getValidationErrorsForBlog(newTitle, newContent, newSource);

  if (errors.length == 0) {
    const query =
      "UPDATE blogPosts SET title = ?, content = ?, source = ?  WHERE id = ?";
    const values = [newTitle, newContent, newSource, id];

    db.run(query, values, function (error) {
      if (error) {
        console.log(error);
      } else {
        response.redirect("/blogs/" + id);
      }
    });
  } else {
    const model = {
      blogPost: {
        title: newTitle,
        content: newContent,
        source: newSource,
      },
      errors,
      id, //it's important to add the id in the model
    };
    response.render("updateBlogPost.hbs", model);
  }
});

/// POSSTTT  for login
app.post("/login", function (request, response) {
  const enteredUsername = request.body.username;
  const enteredPassword = request.body.password;

  if (
    enteredUsername == correctUsername &&
    enteredPassword == correctPassword
  ) {
    request.session.isLoggedIn = true;
    response.redirect("/");
  } else {
    response.redirect("/login"); /// WITH AN ERROR MSG THAT I WILL ADD LATER
  }
});

///post for logout
/////SHOULD BE POST NOT GET BECAUSE THERE'S CHANGES MADE TO THE SESSION
app.post("/logout", function (request, response) {
  request.session.isLoggedIn = false;
  response.redirect("/");
});

/////// ALLL THE GET REQ ARE HERE////////////////////////////

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

//BLOG PAGE
app.get("/blogs", function (request, response) {
  const query = "SELECT * FROM blogPosts";
  db.all(query, function (error, blogPosts) {
    const model = { blogPosts };
    response.render("blogs.hbs", model);
  });
});

app.get("/contactme", function (request, response) {
  response.render("contactMe.hbs");
});

app.get("/aboutme", function (request, response) {
  response.render("aboutMe.hbs");
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
  });
});

app.get("/login", function (request, response) {
  response.render("login.hbs");
});

app.get("/logout", function (request, response) {
  response.render("logout.hbs");
});

app.get("/createRecipe", function (request, response) {
  response.render("createRecipe.hbs");
});

app.get("/createBlogPost", function (request, response) {
  response.render("createBlogPost.hbs");
});

app.get("/deleteComment/:id/:blogPostId", function (request, response) {
  const id = request.params.id;
  const blogPostId = request.params.blogPostId;
  const model = {
    id,
    blogPostId,
  };
  response.render("deleteComment.hbs", model);
});

app.get("/updateComment/:id/:blogPostId/", function (request, response) {
  const id = request.params.id;
  const blogPostId = request.params.blogPostId;

  const query = "SELECT * FROM comments WHERE id=?";
  const values = [id];
  db.get(query, values, function (error, comment) {
    const model = {
      id,
      comment,
    };
    response.render("updateComment.hbs", model);
  });
});

app.get("/updateRecipe/:id", function (request, response) {
  const id = request.params.id;
  const query = "SELECT * FROM recipes WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, recipe) {
    const model = { recipe, id };
    response.render("updateRecipe.hbs", model);
  });
});

app.get("/deleteRecipe/:id", function (request, response) {
  const id = request.params.id;
  const model = {
    id,
  };
  response.render("deleteRecipe.hbs", model);
});

app.get("/deleteBlogPost/:id", function (request, response) {
  const id = request.params.id;
  const model = {
    id,
  };
  response.render("deleteBlogPost.hbs", model);
});

app.get("/updateBlogPost/:id", function (request, response) {
  const id = request.params.id;
  const query = "SELECT * FROM blogPosts WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, blogPost) {
    const model = { blogPost, id };
    response.render("updateBlogPost.hbs", model);
  });
});

app.listen(8080);
