const express = require("express");
const expressHandlebars = require("express-handlebars");
const expressSession = require("express-session");
const SQLiteStore = require("connect-sqlite3")(expressSession);
const like = require("like");
const multer = require("multer");
const bcrypt = require("bcrypt");
const db = require("../db.js");
const storage = multer.diskStorage({
  destination(request, file, cb) {
    cb(null, "public/imgUploaded");
  },
  filename(request, file, cb) {
    console.log(file);
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });
const minCommenterNameLength = 2;
const minTitleLength = 2;
const minCommentLength = 2;
const correctUsername = "dina";
const correctHashedPassword =
  "$2b$10$HDJEaJ8/aNL2rwlQWYKeo.zOrZ7QGzRZwAYJQRalKiZ5DM/kUXe5u";
const app = express();
app.use(
  expressSession({
    secret: "asdfghjkloiuytrezxcvbnm",
    saveUninitialized: false,
    resave: false,
    store: new SQLiteStore(),
  })
);

app.engine(
  "hbs",
  expressHandlebars.engine({
    defaultLayout: "main.hbs",
  })
);

app.use(express.static("public"));

app.use(
  express.urlencoded({
    extended: false,
  })
);

app.use(function (request, response, next) {
  const isLoggedIn = request.session.isLoggedIn;
  response.locals.isLoggedIn = isLoggedIn;
  next();
});

let indexRouter = require("../routes/index");
app.use("/", indexRouter);

////ERRORS
function getErrorsForSearch(search, calories, duration) {
  const errors = [];
  if (calories == "" && duration == "" && search == "") {
    errors.push("fields cant be empty!");
  }
  return errors;
}

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

function getErrorsForLogIn(enteredUsername, isHashed) {
  const errors = [];
  if (enteredUsername != correctUsername || isHashed == false) {
    errors.push("Incorrect User name or Password!");
  }
  return errors;
}

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

    db.createRecipe(
      title,
      description,
      ingredients,
      directions,
      duration,
      calories,
      caloriesCategory,
      durationCategory,
      imageURL,
      function (error) {
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
      }
    );
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

      db.updateRecipe(
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
        function (error) {
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
        }
      );
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
    db.deleteRecipe(id, function (error) {
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
  db.getAllRecipes(function (error, recipes) {
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
  const id = request.params.id;

  db.getRecipeById(id, function (error, recipe) {
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

  db.getRecipeById(id, function (error, recipe) {
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

/////BLOG
//post
app.post("/blogPosts/:id", function (request, response) {
  const commenterName = request.body.commenterName;
  const title = request.body.title;
  const comment = request.body.comment;
  const blogPostId = request.params.id;

  const errors = getValidationErrorsForComments(commenterName, title, comment);

  /////// the same from the get request to fetc
  db.getBlogPostbyId(blogPostId, function (error, blogPost) {
    if (error) {
      errors.push("can't load due to internal server error");
    }
    db.getCommentbyPostId(blogPostId, function (error, comments) {
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
        db.createComment(
          commenterName,
          title,
          comment,
          blogPostId,
          function (error) {
            if (error) {
              console.log(error);
              errors.push("can't load due to internal server error");
              response.render("singleBlog.hbs", model);
            } else {
              response.redirect("/blogPosts/" + blogPostId);
            }
          }
        );
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
    db.createBlogPost(title, content, source, function (error) {
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
    db.deleteBlogPost(id, function (error) {
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
    db.updateBlogPost(newTitle, newContent, newSource, id, function (error) {
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
  db.getAllBlogPosts(function (error, blogPosts) {
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

app.get("/blogPosts/:PostId", function (request, response) {
  const PostId = request.params.PostId;

  const errors = [];
  db.getBlogPostbyId(PostId, function (error, blogPost) {
    if (error) {
      errors.push("can't load due to internal server error");
    }

    db.getCommentbyPostId(PostId, function (error, comments) {
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
  db.getBlogPostbyId(id, function (error, blogPost) {
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

/////COMMENTTTT//////////
//post
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
    db.updateComment(
      newCommenterName,
      newTitle,
      newComment,
      id,
      function (error) {
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
      }
    );
  } else {
    const model = {
      comment: {
        commenterName: newCommenterName,
        title: newTitle,
        comment: newComment,
        blogPostId,
      },
      errors,
      id,
    };

    response.render("updateComment.hbs", model);
  }
});

app.post("/deleteComment/:id/:blogPostId", function (request, response) {
  const id = request.params.id;
  const blogPostId = request.params.blogPostId;
  if (request.session.isLoggedIn) {
    db.deleteComment(id, function (error) {
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

  db.getCommentbyId(id, function (error, comment) {
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

///login
/// post
app.post("/login", function (request, response) {
  const enteredUsername = request.body.username;
  const enteredPassword = request.body.password;

  const isHashed = bcrypt.compareSync(enteredPassword, correctHashedPassword);

  const errors = getErrorsForLogIn(enteredUsername, isHashed);

  if (errors.length == 0) {
    request.session.isLoggedIn = true;
    response.redirect("/");
  } else {
    const model = { errors };
    response.render("login.hbs", model);
  }
});

///post for logout
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
    db.getResultsForSearchAndDurationAndCalories(
      duration,
      calories,
      search,
      function (error, recipes) {
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
      }
    );
  } else if (search) {
    db.getResultsForSearch(search, function (error, recipes) {
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
    db.getResultsForDuration(duration, function (error, recipes) {
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
    db.getResultsForCalories(calories, function (error, recipes) {
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
module.exports = app;
