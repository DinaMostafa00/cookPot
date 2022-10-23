const sqlite3 = require("sqlite3");
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

///DB QUARIES
///Recipe

//GET
exports.getAllRecipes = function (callback) {
  const query = "SELECT * FROM recipes";
  db.all(query, function (error, recipes) {
    callback(error, recipes);
  });
};

exports.getRecipeById = function (id, callback) {
  const query = "SELECT * FROM recipes WHERE id= ?";
  const values = [id];
  db.get(query, values, function (error, recipe) {
    callback(error, recipe);
  });
};

//POST
exports.createRecipe = function (
  title,
  description,
  ingredients,
  directions,
  duration,
  calories,
  caloriesCategory,
  durationCategory,
  imageURL,
  callback
) {
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
    callback(error);
  });
};

exports.updateRecipe = function (
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
  callback
) {
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
    callback(error);
  });
};

exports.deleteRecipe = function (id, callback) {
  const query = "DELETE FROM recipes WHERE id=?";
  const values = [id];
  db.run(query, values, function (error) {
    callback(error);
  });
};

////BLOGS AND COMMENT
//get
exports.getAllBlogPosts = function (callback) {
  const query = "SELECT * FROM blogPosts";
  db.all(query, function (error, blogPosts) {
    callback(error, blogPosts);
  });
};

exports.getBlogPostbyId = function (id, callback) {
  const querySelectBlogPost = "SELECT * FROM blogPosts WHERE id= ? ";
  const values = [id];
  db.get(querySelectBlogPost, values, function (error, blogPost) {
    callback(error, blogPost);
  });
};

exports.getCommentbyPostId = function (PostId, callback) {
  const querySelectComments = "SELECT * FROM comments WHERE blogPostId= ? ";
  const values = [PostId];
  db.all(querySelectComments, values, function (error, comments) {
    callback(error, comments);
  });
};

exports.getCommentbyId = function (id, callback) {
  const querySelectComments = "SELECT * FROM comments WHERE id= ? ";
  const values = [id];
  db.get(querySelectComments, values, function (error, comment) {
    callback(error, comment);
  });
};

exports.deleteComment = function (id, callback) {
  const query = "DELETE FROM comments WHERE id=?";
  const values = [id];
  db.run(query, values, callback);
};

exports.updateComment = function (
  newCommenterName,
  newTitle,
  newComment,
  id,
  callback
) {
  const query =
    "UPDATE comments SET commenterName = ?, title = ?, comment = ? WHERE id = ?";
  const values = [newCommenterName, newTitle, newComment, id];
  db.run(query, values, callback);
};

//POST///
exports.createBlogPost = function (title, content, source, callback) {
  const query =
    "INSERT INTO blogPosts (title, content, source) values (?,?,?) ";
  const values = [title, content, source];

  db.run(query, values, callback);
};

exports.deleteBlogPost = function (id, callback) {
  const query = "DELETE FROM blogPosts WHERE id=?";
  const values = [id];
  db.run(query, values, function (error) {
    callback(error);
  });
};

exports.updateBlogPost = function (
  newTitle,
  newContent,
  newSource,
  id,
  callback
) {
  const query =
    "UPDATE blogPosts SET title = ?, content = ?, source = ?  WHERE id = ?";
  const values = [newTitle, newContent, newSource, id];

  db.run(query, values, callback);
};

exports.createComment = function (
  commenterName,
  title,
  comment,
  blogPostId,
  callback
) {
  const query =
    "INSERT INTO comments (commenterName, title, comment, blogPostId) values (?,?,?,?) ";
  const values = [commenterName, title, comment, blogPostId];

  db.run(query, values, function (error) {
    callback(error);
  });
};
/////

///SEARCH
exports.getResultsForSearchAndDurationAndCalories = function (
  duration,
  calories,
  search,
  callback
) {
  const query =
    "SELECT * FROM recipes WHERE durationCategory LIKE ? AND caloriesCategory LIKE ? AND title LIKE ? ";

  const values = [
    "%" + duration + "%",
    "%" + calories + "%",
    "%" + search + "%",
  ];
  db.all(query, values, callback);
};

exports.getResultsForSearch = function (search, callback) {
  const query = "SELECT * FROM recipes WHERE title LIKE ?";
  const values = ["%" + search + "%"];
  db.all(query, values, callback);
};

exports.getResultsForDuration = function (duration, callback) {
  const query = "SELECT * FROM recipes WHERE durationCategory LIKE ?";
  const values = ["%" + duration + "%"];
  db.all(query, values, callback);
};

exports.getResultsForCalories = function (calories, callback) {
  const query = "SELECT * FROM recipes WHERE caloriesCategory LIKE ?";
  const values = ["%" + calories + "%"];
  db.all(query, values, callback);
};
///
