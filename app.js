/// loading section
const express = require("express");
const expressHandlebars = require("express-handlebars");
const sqlite3 = require("sqlite3");
const expressSession = require("express-session");
const SQLiteStore = require("connect-sqlite3")(expressSession);
const like = require("like");
const multer = require("multer");

// here we determind where we gonna store the imgs and their name
//null refer to the errors we dont care here so much
//I understod that sytex here in cb is standrad but why only req not require ?///Q
const storage = multer.diskStorage({
  destination(request, file, cb) {
    cb(null, "public/imgUploaded");
  },
  filename(request, file, cb) {
    console.log(file);
    cb(null, file.originalname);
  },
});

//This is object that have every thing related to the storage
const upload = multer({ storage: storage });

///variables
const minCommenterNameLength = 2;
const minTitleLength = 2;
const minCommentLength = 2;
const correctUsername = "dina";
const correctPassword = "123";
const app = express();

///database and SQLITE
const db = new sqlite3.Database("cookPotDatabase.db");

db.run("PRAGMA foreign_keys = ON");

db.run(
  "CREATE TABLE IF NOT EXISTS recipes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, ingredients TEXT, directions TEXT, duration INTEGER, calories INTEGER, caloriesCategory TEXT, durationCategory TEXT, imageURL TEXT )"
);

db.run(
  "CREATE TABLE IF NOT EXISTS blogPosts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT, source TEXT)"
);

db.run(
  "CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, commenterName TEXT, title TEXT, comment TEXT, blogPostId INTEGER, FOREIGN KEY (blogPostId) REFERENCES blogPosts(id) ON DELETE CASCADE)"
);

//////Middleware section

//// watch again (3) 58:59
app.use(
  expressSession({
    secret: "asdfghjkloiuytrezxcvbnm",
    //control if the session is empty should be still stored in server side or not
    saveUninitialized: false,
    //if the new session be stored in server oor not
    resave: false,
    store: new SQLiteStore(), // to exsit the session only be logginout not restarting the progaram
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

////ERRORSSSS
//error handling for search
function getErrorsForSearch(search, calories, duration) {
  const errors = [];
  if (calories == "" && duration == "" && search == "") {
    errors.push("fields cant be empty!");
  }
  return errors;
}

//error handling for comments
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

//error handling for blogs
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

//error handling for recipes
function getValidationErrorsForRecipes(
  title,
  description,
  ingredients,
  directions,
  duration,
  calories,
  caloriesCategory,
  durationCategory
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
  if (isNaN(duration)) {
    validationErrors.push("duration must be a number");
  } else if (duration < 0) {
    validationErrors.push("duration can't be negative");
  }

  if (isNaN(calories)) {
    validationErrors.push("calories must be a number");
  } else if (calories < 0) {
    validationErrors.push("calories can't be negative");
  }
  if (caloriesCategory == "") {
    validationErrors.push("calories Category field can't be empty");
  }
  if (durationCategory == "") {
    validationErrors.push("duration Category field can't be empty");
  }
  return validationErrors;
}
//error handling for login
function getErrorsForLogIn(enteredUsername, enteredPassword) {
  const errors = [];
  if (
    enteredUsername != correctUsername ||
    enteredPassword != correctPassword
  ) {
    errors.push("Incorrect User name or Password!");
  }
  return errors;
}
//////////////END OF ERRORS

/////RECIPEEEE//////////
//post
app.post("/createRecipe", upload.single("image"), function (request, response) {
  const title = request.body.title;
  const description = request.body.description;
  const ingredients = request.body.ingredients;
  const directions = request.body.directions;
  const duration = parseInt(request.body.duration, 10);
  const calories = parseInt(request.body.calories, 10);
  const caloriesCategory = request.body.caloriesCategory;
  const durationCategory = request.body.durationCategory;

  const errors = getValidationErrorsForRecipes(
    title,
    description,
    ingredients,
    directions,
    duration,
    calories,
    caloriesCategory,
    durationCategory
  );

  if (!request.file) {
    errors.push("Please upload picture first!");
  }

  if (!request.session.isLoggedIn) {
    errors.push("You are not logged in!");
  }

  if (errors.length == 0) {
    const imageURL = request.file.filename;
    const query =
      "INSERT INTO recipes (title, description, ingredients, directions, duration, calories, caloriesCategory, durationCategory, imageURL) values (?,?,?,?,?,?,?,?,?) ";
    const values = [
      title,
      description,
      ingredients,
      directions,
      duration,
      calories,
      caloriesCategory,
      durationCategory,
      imageURL,
    ];

    db.run(query, values, function (error) {
      if (error) {
        console.log(error);
        errors.push("can't load due to internal server error");
        const model = {
          errors,
          title,
          description,
          ingredients,
          directions,
          duration: request.body.duration,
          calories: request.body.calories,
          caloriesCategory,
          durationCategory,
        };
        response.render("createRecipe.hbs", model);
      } else {
        response.redirect("/recipes");
      }
    });
  } else {
    const model = {
      errors,
      title,
      description,
      ingredients,
      directions,
      duration: request.body.duration,
      calories: request.body.calories,
      caloriesCategory,
      durationCategory,
      isSomethingQuickSelected: durationCategory == "Something quick",
      isIHaveTimeSelected: durationCategory == "I have time",
      isLowInCaloriesSelected: caloriesCategory == "Low in calories",
      isHighInCaloriesHighSelected: caloriesCategory == "High in calories",
    };
    response.render("createRecipe.hbs", model);
  }
});

app.post(
  "/updateRecipe/:id",
  upload.single("image"),
  function (request, response) {
    const id = request.params.id;
    const newTitle = request.body.title;
    const newDescription = request.body.description;
    const newIngredients = request.body.ingredients;
    const newDirections = request.body.directions;
    const newDuration = parseInt(request.body.duration, 10);
    const newCalories = parseInt(request.body.calories, 10);
    const newCaloriesCategory = request.body.caloriesCategory;
    const newDurationCategory = request.body.durationCategory;

    const errors = getValidationErrorsForRecipes(
      newTitle,
      newDescription,
      newIngredients,
      newDirections,
      newDuration,
      newCalories,
      newCaloriesCategory,
      newDurationCategory
    );

    if (!request.file) {
      errors.push("Please upload picture first!");
    }

    if (!request.session.isLoggedIn) {
      errors.push("You are not logged in!");
    }

    if (errors.length == 0) {
      const newImageURL = request.file.filename;
      const query =
        "UPDATE recipes SET title = ?, description = ?, ingredients = ? , directions = ?, duration = ?, calories = ?, caloriesCategory = ?, durationCategory = ?, imageURL =?  WHERE id = ?";
      const values = [
        newTitle,
        newDescription,
        newIngredients,
        newDirections,
        newDuration,
        newCalories,
        newCaloriesCategory,
        newDurationCategory,
        newImageURL,
        id,
      ];

      db.run(query, values, function (error) {
        if (error) {
          console.log(error);
          errors.push("can't load due to internal server error");
          const model = {
            recipe: {
              title: newTitle,
              description: newDescription,
              ingredients: newIngredients,
              directions: newDirections,
              duration: newDuration,
              calories: newCalories,
              caloriesCategory: newCaloriesCategory,
              durationCategory: newDurationCategory,
            },
            errors,
            id,
          };
          response.render("updateRecipe.hbs", model);
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
          duration: request.body.duration,
          calories: request.body.calories,
          caloriesCategory: newCaloriesCategory,
          durationCategory: newDurationCategory,
        },
        isSomethingQuickSelected: newDurationCategory == "Something quick",
        isIHaveTimeSelected: newDurationCategory == "I have time",
        isLowInCaloriesSelected: newCaloriesCategory == "Low in calories",
        isHighInCaloriesHighSelected: newCaloriesCategory == "High in calories",
        errors,
        id,
      };
      response.render("updateRecipe.hbs", model);
    }
  }
);

app.post("/deleteRecipe/:id", function (request, response) {
  const id = request.params.id;
  if (request.session.isLoggedIn) {
    const query = "DELETE FROM recipes WHERE id=?";
    const values = [id];
    console.log(values);
    db.run(query, values, function (error) {
      if (error) {
        console.log(error);
        const model = {
          id,
          errors: ["can't load due to internal server error"],
        };
        response.render("deleteRecipe.hbs", model);
      } else {
        response.redirect("/recipes");
      }
    });
  } else {
    const model = {
      id,
      errors: ["you are not logged in"],
    };
    response.render("deleteRecipe.hbs", model);
  }
});
///get

app.get("/recipes", function (request, response) {
  const query = "SELECT * FROM recipes";
  db.all(query, function (error, recipes) {
    if (error) {
      console.log(error);
      const model = {
        recipes,
        errors: ["can't load due to internal server error"],
      };
      response.render("recipes.hbs", model);
    } else {
      const model = { recipes };
      response.render("recipes.hbs", model);
    }
  });
});

app.get("/recipes/:id", function (request, response) {
  const id = request.params.id; //to get the actual value of the id
  const query = "SELECT * FROM recipes WHERE id= ?";
  const values = [id];
  db.get(query, values, function (error, recipe) {
    if (error) {
      console.log(error);
      const model = {
        recipe,
        errors: ["can't load due to internal server error"],
      };
      response.render("singleRecipe.hbs", model);
    } else {
      const model = { recipe };
      response.render("singleRecipe.hbs", model);
    }
  });

  // const recipe = data.recipes.find((recipe) => recipe.id == id); // we call a method on this array (find) to find a project whose id is equal to what stored in the id variable
});

app.get("/createRecipe", function (request, response) {
  if (request.session.isLoggedIn) {
    response.render("createRecipe.hbs");
  } else {
    response.render("authorizationErorrs.hbs");
  }
});

app.get("/updateRecipe/:id", function (request, response) {
  const id = request.params.id;
  const query = "SELECT * FROM recipes WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, recipe) {
    if (error) {
      console.log(error);
      const model = {
        recipe,
        id,
        errors: ["can't load due to internal server error"],
      };
      response.render("updateRecipe.hbs", model);
    } else {
      if (request.session.isLoggedIn) {
        const model = {
          recipe,
          id,
          isSomethingQuickSelected:
            recipe.durationCategory == "Something quick",
          isIHaveTimeSelected: recipe.durationCategory == "I have time",
          isLowInCaloriesSelected: recipe.caloriesCategory == "Low in calories",
          isHighInCaloriesHighSelected:
            recipe.caloriesCategory == "High in calories",
        };
        response.render("updateRecipe.hbs", model);
      } else {
        response.render("authorizationErorrs.hbs");
      }
    }
  });
});

app.get("/deleteRecipe/:id", function (request, response) {
  if (request.session.isLoggedIn) {
    const id = request.params.id;
    const model = {
      id,
    };
    response.render("deleteRecipe.hbs", model);
  } else {
    response.render("authorizationErorrs.hbs");
  }
});
///////

/////BLOGGGGG//////////
app.post("/blogPosts/:id", function (request, response) {
  const commenterName = request.body.commenterName;
  const title = request.body.title;
  const comment = request.body.comment;
  const blogPostId = request.params.id;

  const errors = getValidationErrorsForComments(commenterName, title, comment);

  if (!request.session.isLoggedIn) {
    errors.push("You are not logged in!");
  }

  /////// the same from the get request to fetc
  const querySelectBlogPost = "SELECT * FROM blogPosts WHERE id= ? ";
  const querySelectComments = "SELECT * FROM comments WHERE blogPostId= ? ";

  const values = [blogPostId];

  db.get(querySelectBlogPost, values, function (error, blogPost) {
    if (error) {
      errors.push("can't load due to internal server error");
    }
    db.all(querySelectComments, values, function (error, comments) {
      if (error) {
        errors.push("can't load due to internal server error");
      }

      const model = {
        errors,
        commenterName,
        title,
        comment,
        comments,
        blogPost,
      };

      if (errors.length == 0) {
        const query =
          "INSERT INTO comments (commenterName, title, comment, blogPostId) values (?,?,?,?) ";
        const values = [commenterName, title, comment, blogPostId];

        db.run(query, values, function (error) {
          if (error) {
            console.log(error);
            errors.push("can't load due to internal server error");
            response.render("singleBlog.hbs", model);
          } else {
            response.redirect("/blogPosts/" + blogPostId);
          }
        });
      } else {
        response.render("singleBlog.hbs", model);
      }
    });
  });
});

app.post("/createBlogPost", function (request, response) {
  const title = request.body.title;
  const content = request.body.content;
  const source = request.body.source;

  const errors = getValidationErrorsForBlog(title, content, source);

  if (!request.session.isLoggedIn) {
    errors.push("You are not logged in!");
  }

  if (errors.length == 0) {
    const query =
      "INSERT INTO blogPosts (title, content, source) values (?,?,?) ";
    const values = [title, content, source];

    db.run(query, values, function (error) {
      if (error) {
        console.log(error);
        errors.push("can't load due to internal server error");
        const model = { errors, title, content, source };
        response.render("createBlogPost.hbs", model);
      } else {
        response.redirect("/blogPosts");
      }
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

app.post("/deleteBlogPost/:id", function (request, response) {
  const id = request.params.id;
  if (request.session.isLoggedIn) {
    const query = "DELETE FROM blogPosts WHERE id=?";
    const values = [id];
    db.run(query, values, function (error) {
      if (error) {
        console.log(error);
        const model = {
          id,
          errors: ["can't load due to internal server error"],
        };
        response.render("deleteBlogPost.hbs", model);
      } else {
        response.redirect("/blogPosts");
      }
    });
  } else {
    const model = {
      id,
      errors: ["you are not logged in"],
    };
    response.render("deleteBlogPost.hbs", model);
  }
});

app.post("/updateBlogPost/:id", function (request, response) {
  const id = request.params.id;
  const newTitle = request.body.title;
  const newContent = request.body.content;
  const newSource = request.body.source;

  const errors = getValidationErrorsForBlog(newTitle, newContent, newSource);

  if (!request.session.isLoggedIn) {
    errors.push("You are not logged in!");
  }

  if (errors.length == 0) {
    const query =
      "UPDATE blogPosts SET title = ?, content = ?, source = ?  WHERE id = ?";
    const values = [newTitle, newContent, newSource, id];

    db.run(query, values, function (error) {
      if (error) {
        console.log(error);
        errors.push("can't load due to internal server error");
        const model = {
          blogPost: {
            title: newTitle,
            content: newContent,
            source: newSource,
          },
          errors,
          id,
        };
        response.render("updateBlogPost.hbs", model);
      } else {
        response.redirect("/blogPosts/" + id);
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

///get
app.get("/blogPosts", function (request, response) {
  const query = "SELECT * FROM blogPosts";
  db.all(query, function (error, blogPosts) {
    if (error) {
      console.log(error);
      const model = {
        blogPosts,
        errors: ["can't load due to internal server error"],
      };
      response.render("blogPosts.hbs", model);
    } else {
      const model = { blogPosts };
      response.render("blogPosts.hbs", model);
    }
  });
});

app.get("/blogPosts/:id", function (request, response) {
  const id = request.params.id;
  const querySelectBlogPost = "SELECT * FROM blogPosts WHERE id= ? ";
  const querySelectComments = "SELECT * FROM comments WHERE blogPostId= ? ";
  const values = [id];
  const errors = [];

  db.get(querySelectBlogPost, values, function (error, blogPost) {
    if (error) {
      errors.push("can't load due to internal server error");
    }
    db.all(querySelectComments, values, function (error, comments) {
      if (error) {
        errors.push("can't load due to internal server error");
      }
      const model = { blogPost, comments, errors };
      response.render("singleBlog.hbs", model);
    });
  });
});

app.get("/createBlogPost", function (request, response) {
  if (request.session.isLoggedIn) {
    response.render("createBlogPost.hbs");
  } else {
    response.render("authorizationErorrs.hbs");
  }
});

app.get("/deleteBlogPost/:id", function (request, response) {
  if (request.session.isLoggedIn) {
    const id = request.params.id;
    const model = {
      id,
    };
    response.render("deleteBlogPost.hbs", model);
  } else {
    response.render("authorizationErorrs.hbs");
  }
});

app.get("/updateBlogPost/:id", function (request, response) {
  const id = request.params.id;
  const query = "SELECT * FROM blogPosts WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, blogPost) {
    if (error) {
      console.log(error);
      const model = {
        blogPost,
        id,
        errors: ["can't load due to internal server error"],
      };
      response.render("updateBlogPost.hbs", model);
    } else {
      if (request.session.isLoggedIn) {
        const model = { blogPost, id };
        response.render("updateBlogPost.hbs", model);
      } else {
        response.render("authorizationErorrs.hbs");
      }
    }
  });
});
///////

/////COMMENTTTT//////////
app.post("/updateComment/:id/:blogPostId", function (request, response) {
  const id = request.params.id;
  const blogPostId = request.params.blogPostId;
  const newCommenterName = request.body.commenterName;
  const newTitle = request.body.title;
  const newComment = request.body.comment;

  const errors = getValidationErrorsForComments(
    newCommenterName,
    newTitle,
    newComment
  );

  if (!request.session.isLoggedIn) {
    errors.push("You are not logged in!");
  }

  if (errors.length == 0) {
    const query =
      "UPDATE comments SET commenterName = ?, title = ?, comment = ? WHERE id = ?";
    const values = [newCommenterName, newTitle, newComment, id];
    db.run(query, values, function (error) {
      if (error) {
        console.log(error);
        errors.push("can't load due to internal server error");
        const model = {
          comment: {
            commenterName: newCommenterName,
            title: newTitle,
            comment: newComment,
            blogPostId,
          },
          errors,
        };

        response.render("updateComment.hbs", model);
      } else {
        response.redirect("/blogPosts/" + blogPostId);
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
      errors,
    };

    response.render("updateComment.hbs", model);
  }
});

app.post("/deleteComment/:id/:blogPostId", function (request, response) {
  const id = request.params.id;
  const blogPostId = request.params.blogPostId;
  if (request.session.isLoggedIn) {
    const query = "DELETE FROM comments WHERE id=?";
    const values = [id];
    // console.log(values);
    db.run(query, values, function (error) {
      if (error) {
        console.log(error);
        const model = {
          id,
          blogPostId,
          errors: ["can't load due to internal server error"],
        };
        response.render("deleteComment.hbs", model);
      } else {
        response.redirect("/blogPosts/" + blogPostId);
      }
    });
  } else {
    const model = {
      id,
      blogPostId,
      errors: ["you are not logged in"],
    };
    response.render("deleteComment.hbs", model);
  }
});

///get
app.get("/deleteComment/:id/:blogPostId", function (request, response) {
  const id = request.params.id;
  const blogPostId = request.params.blogPostId;

  if (request.session.isLoggedIn) {
    const model = {
      id,
      blogPostId,
    };
    response.render("deleteComment.hbs", model);
  } else {
    response.render("authorizationErorrs.hbs");
  }
});

app.get("/updateComment/:id/:blogPostId/", function (request, response) {
  const id = request.params.id;
  const blogPostId = request.params.blogPostId;

  const query = "SELECT * FROM comments WHERE id=?";
  const values = [id];
  db.get(query, values, function (error, comment) {
    if (error) {
      console.log(error);
      const model = {
        errors: ["can't load due to internal server error"],
        id,
        comment,
      };
      response.render("updateComment.hbs", model);
    } else {
      if (request.session.isLoggedIn) {
        const model = {
          id,
          comment,
        };
        response.render("updateComment.hbs", model);
      } else {
        response.render("authorizationErorrs.hbs");
      }
    }
  });
});

///////////////////////////////////

/// POSSTTT  for login
app.post("/login", function (request, response) {
  const enteredUsername = request.body.username;
  const enteredPassword = request.body.password;

  const errors = getErrorsForLogIn(enteredUsername, enteredPassword);

  if (errors.length == 0) {
    request.session.isLoggedIn = true;
    response.redirect("/");
  } else {
    const model = { errors };
    response.render("login.hbs", model);
  }
});

///post for logout
/////SHOULD BE POST NOT GET BECAUSE THERE'S CHANGES MADE TO THE SESSION
app.post("/logout", function (request, response) {
  request.session.isLoggedIn = false;
  response.redirect("/");
});

///get log in and  out
app.get("/login", function (request, response) {
  response.render("login.hbs");
});

app.get("/logout", function (request, response) {
  response.render("logout.hbs");
});

/////// ALLL THE GET REQ ARE HERE////////////////////////////

app.get("/", function (request, response) {
  response.render("start.hbs");
});

app.get("/contactme", function (request, response) {
  response.render("contactMe.hbs");
});

app.get("/aboutme", function (request, response) {
  response.render("aboutMe.hbs");
});

app.get("/search", function (request, response) {
  const search = request.query.search;
  const duration = request.query.duration;
  const calories = request.query.calories;

  if (duration && calories && search) {
    const query =
      "SELECT * FROM recipes WHERE durationCategory LIKE ? AND caloriesCategory LIKE ? AND title LIKE ? ";

    const values = [
      "%" + duration + "%",
      "%" + calories + "%",
      "%" + search + "%",
    ];
    db.all(query, values, function (error, recipes) {
      if (error) {
        console.log(error);
        const model = {
          recipes,
          errors: ["can't load due to internal server error"],
        };
        response.render("searchResults.hbs", model);
      } else {
        const model = { recipes };
        response.render("searchResults.hbs", model);
      }
    });
  } else if (search) {
    const query = "SELECT * FROM recipes WHERE title LIKE ?";
    const values = ["%" + search + "%"];
    db.all(query, values, function (error, recipes) {
      if (error) {
        console.log(error);
        const model = {
          recipes,
          errors: ["can't load due to internal server error"],
        };
        response.render("searchResults.hbs", model);
      } else {
        const model = { recipes };
        response.render("searchResults.hbs", model);
      }
    });
  } else if (duration) {
    const query = "SELECT * FROM recipes WHERE durationCategory LIKE ?";
    const values = ["%" + duration + "%"];
    db.all(query, values, function (error, recipes) {
      if (error) {
        console.log(error);
        const model = {
          recipes,
          errors: ["can't load due to internal server error"],
        };
        response.render("searchResults.hbs", model);
      } else {
        const model = { recipes };
        response.render("searchResults.hbs", model);
      }
    });
  } else if (calories) {
    const query = "SELECT * FROM recipes WHERE caloriesCategory LIKE ?";
    const values = ["%" + calories + "%"];
    db.all(query, values, function (error, recipes) {
      if (error) {
        console.log(error);
        const model = {
          recipes,
          errors: ["can't load due to internal server error"],
        };
        response.render("searchResults.hbs", model);
      } else {
        const model = { recipes };
        response.render("searchResults.hbs", model);
      }
    });
  } else {
    const errors = getErrorsForSearch(search, calories, duration);
    const model = { errors };
    response.render("search.hbs", model);
  }
});

app.listen(8080);
