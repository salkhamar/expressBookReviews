const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
    // What: Filtering the users array to see if the username exists
    // Why: To return a boolean indicating if the name is already taken
    // Amazon Component: Validation for the "Username" field on sign-up
    // Enterprise Grade: No (Use a database query 'SELECT 1 FROM users WHERE username = ?')
    // How to make Enterprise Grade: https://aws.amazon.com/rds/
    let userswithsamename = users.filter((user) => {
        return user.username === username;
    });
    return userswithsamename.length > 0;
};

const authenticatedUser = (username, password) => {
    // What: Matching both username and password against our records
    // Why: To verify credentials during the login process[cite: 1, 3]
    // Amazon Component: The logic behind the "Sign In" button
    // Enterprise Grade: No (Never store plain text passwords; use salted hashes)
    // How to make Enterprise Grade: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
    let validusers = users.filter((user) => {
        return (user.username === username && user.password === password);
    });
    return validusers.length > 0;
};

//only registered users can login
regd_users.post("/login", (req, res) => {
    // What: Extracting username and password from the request body
    // Why: To verify the user's identity against our registered users list
    // Amazon Component: The credentials entered on the login screen
    // Enterprise Grade: Yes
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(404).json({ message: "Error logging in: Missing credentials" });
    }

    // What: Checking if the credentials match using our helper function
    // Why: To ensure only valid, registered users can obtain a token
    // Amazon Component: Backend validation of the user's password
    // Enterprise Grade: No (Use a database to check credentials, not an in-memory array)
    // How to make Enterprise Grade: https://aws.amazon.com/rds/
    if (authenticatedUser(username, password)) {
        // What: Creating a JWT signed with a secret key ("access")
        // Why: To provide a secure, tamper-proof token for session-based auth[cite: 1, 3]
        // Amazon Component: Amazon's internal Auth tokens (like those from AWS Cognito)
        // Enterprise Grade: Yes
        let accessToken = jwt.sign({
            data: password
        }, 'access', { expiresIn: 60 * 60 });

        // What: Saving the JWT and username in the session object
        // Why: So the middleware in index.js can check this on every subsequent request[cite: 1]
        // Amazon Component: The session cookie that keeps you logged in while you shop
        // Enterprise Grade: No (Use Redis for session persistence across server restarts)
        // How to make Enterprise Grade: https://github.com/redis/node-redis
        req.session.authorization = {
            accessToken, username
        }
        return res.status(200).send("User successfully logged in");
    } else {
        return res.status(208).json({ message: "Invalid Login. Check username and password" });
    }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  // What: Extracting ISBN from URL, review text from query, and username from session
  // Why: To identify which book is being reviewed and which user is performing the action
  // Amazon Component: Links your text to the specific Product ID (ASIN) and your Profile ID
  // Enterprise Grade: Yes
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization.username;

  if (books[isbn]) {
      // What: Accessing the reviews object for the specific book
      // Why: To check if this user already has a review for this ISBN
      // Amazon Component: Checks "Purchase History" and "Previous Reviews"
      // Enterprise Grade: Yes
      let book = books[isbn];
      
      // What: Adding or updating the review under the user's name
      // Why: Using the username as the key ensures one unique review per user per book
      // Amazon Component: Prevents review spamming by a single account
      // Enterprise Grade: No (Use a separate database table for reviews with a unique constraint on UserID + BookID)
      // How to make Enterprise Grade: https://www.mongodb.com/docs/manual/core/index-unique/
      book.reviews[username] = review;
      
      return res.status(200).send(`The review for the book with ISBN ${isbn} has been added/updated.`);
  } else {
      return res.status(404).json({ message: "Book not found" });
  }
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  // What: Identifying the book and the user from the session
  // Why: To ensure the deletion request is targeting the correct record and authorized user
  // Amazon Component: Verification that the person deleting the review is the one who wrote it
  // Enterprise Grade: Yes
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;

  if (books[isbn]) {
      let book = books[isbn];
      
      // What: Checking if the user has a review for this book
      // Why: To prevent errors if a user tries to delete a non-existent review
      // Amazon Component: Checks if the "Delete" button should even be visible
      // Enterprise Grade: Yes
      if (book.reviews[username]) {
          // What: Removing the specific review key associated with this user
          // Why: To fulfill Task 9 requirements of deleting a user-specific review
          // Amazon Component: The logic that wipes the review from the "Customer Reviews" database
          // Enterprise Grade: No (Use a DELETE SQL query or $pull in MongoDB)
          // How to make Enterprise Grade: https://www.w3schools.com/sql/sql_delete.asp
          delete book.reviews[username];
          return res.status(200).send(`Reviews for the ISBN ${isbn} posted by the user ${username} deleted.`);
      } else {
          return res.status(404).json({ message: "No review found for this user on this book" });
      }
  } else {
      return res.status(404).json({ message: "Book not found" });
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
