const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
    let userswithsamename = users.filter((user) => {
        return user.username === username;
    });
    return userswithsamename.length > 0;
};

const authenticatedUser = (username, password) => {
    let validusers = users.filter((user) => {
        return (user.username === username && user.password === password);
    });
    return validusers.length > 0;
};

// Login route updated to return JSON
regd_users.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(404).json({ message: "Error logging in: Missing credentials" });
    }

    if (authenticatedUser(username, password)) {
        let accessToken = jwt.sign({ data: password }, 'access', { expiresIn: 60 * 60 });

        // Store session data for middleware verification
        req.session.authorization = { accessToken, username };
        
        return res.status(200).json({ message: "User successfully logged in" });
    } else {
        return res.status(208).json({ message: "Invalid Login. Check username and password" });
    }
});

// PUT route for adding/modifying reviews
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization.username;

  if (books[isbn]) {
      let book = books[isbn];
      book.reviews[username] = review;
      
      return res.status(200).json({ 
          message: `The review for the book with ISBN ${isbn} has been added/updated.` 
      });
  } else {
      return res.status(404).json({ message: "Book not found" });
  }
});

// DELETE route for removing reviews
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;

  if (books[isbn]) {
      let book = books[isbn];
      
      if (book.reviews[username]) {
          delete book.reviews[username];
          return res.status(200).json({ 
              message: `Reviews for the ISBN ${isbn} posted by the user ${username} deleted.` 
          });
      } else {
          return res.status(404).json({ message: "No review found for this user on this book" });
      }
  } else {
      return res.status(404).json({ message: "Book not found" });
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid; // This is the missing piece
module.exports.users = users;     // general.js often needs this too