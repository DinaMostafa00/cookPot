# Cook Pot Project

## Introduction

Cook Pot is a web application designed to help users easily find quick and healthy recipes. This project was developed as a course project at Jönköping University School of Engineering, addressing the challenge of maintaining nutritious eating habits amidst busy schedules.

## CRUD Operations

The application implements the following CRUD (Create, Read, Update, Delete) operations:

- **Create:** only admin can create/delete/update new recipes and blog posts. Meanwhile users can view them. user can create a comment.
- **Read:** both users and admin can read recipes, blog posts, and comments .
- **Update:** Admin only can modify existing recipes and blog posts.
- **Delete:** Admin only can remove recipes and blog posts.

## Features

- **Recipe Browsing:** Users can explore a variety of recipes.
- **Blog Interaction:** Users can read blog posts and interact through comments.
- **Admin Interface:** Allows for creating and managing recipes and blog posts.

## Architecture

- Utilizes a relational database with resources for recipes, blog posts, and comments.
- The web application's architecture facilitates efficient HTTP request handling.

## Technologies Used

- **Languages:** JavaScript, HTML, CSS, SQL.
- **Frameworks:** Node.js, Spectre CSS.
- **Libraries and Middleware:** Express, Express-handlebars, SQLite3, Bcrypt, Multer, Body-parser.

## Security

The application incorporates multiple security measures to handle vulnerabilities like injection, broken authentication, and cross-site scripting.

## Setup and Installation

to run the application write node app.js in the terminal
the app runs on http://localhost:8080

