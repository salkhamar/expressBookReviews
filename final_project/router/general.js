const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

public_users.post("/register", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (username && password) {
        // What: Using the isValid function imported from auth_users.js
        // Why: To check for duplicates before adding to the shared users array[cite: 1, 3]
        // Amazon Component: Account creation validation
        // Enterprise Grade: Yes
        if (!isValid(username)) {
            users.push({ "username": username, "password": password });
            return res.status(200).json({ message: "User successfully registered. Now you can login" });
        } else {
            return res.status(404).json({ message: "User already exists!" });
        }
    }
    return res.status(404).json({ message: "Unable to register user." });
});

// Get the book list available in the shop
public_users.get('/', function (req, res) {
  // What: Wrapping the book retrieval in a Promise
  // Why: To demonstrate asynchronous programming as per Task 10 requirements
  // Amazon Component: How the homepage loads different product widgets asynchronously
  // Enterprise Grade: Yes
  const getBooks = new Promise((resolve, reject) => {
    resolve(books);
  });

  getBooks.then((bookList) => {
    res.status(200).send(JSON.stringify(bookList, null, 4));
  }).catch((err) => {
    res.status(500).json({ message: "Error retrieving books" });
  });
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;

  // What: Wrapping the retrieval in a Promise
  // Why: To simulate an asynchronous database lookup
  // Amazon Component: How a Product Page fetches detailed specs from a separate microservice
  const getBookByISBN = new Promise((resolve, reject) => {
    const book = books[isbn];
    if (book) {
      resolve(book);
    } else {
      reject("Book not found");
    }
  });

  getBookByISBN
    .then((book) => res.status(200).send(JSON.stringify(book, null, 4)))
    .catch((err) => res.status(404).json({ message: err }));
});
  
// Get book details based on author
public_users.get('/author/:author', function (req, res) {
  const author = req.params.author;

  const getBooksByAuthor = new Promise((resolve, reject) => {
    const bookKeys = Object.keys(books);
    const filteredBooks = bookKeys
      .filter(key => books[key].author === author)
      .map(key => books[key]);

    if (filteredBooks.length > 0) {
      resolve(filteredBooks);
    } else {
      reject("No books found by this author");
    }
  });

  getBooksByAuthor
    .then((results) => res.status(200).send(JSON.stringify(results, null, 4)))
    .catch((err) => res.status(404).json({ message: err }));
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
  const title = req.params.title;

  const getBooksByTitle = new Promise((resolve, reject) => {
    const bookKeys = Object.keys(books);
    const filteredBooks = bookKeys
      .filter(key => books[key].title === title)
      .map(key => books[key]);

    if (filteredBooks.length > 0) {
      resolve(filteredBooks);
    } else {
      reject("No books found with this title");
    }
  });

  getBooksByTitle
    .then((results) => res.status(200).send(JSON.stringify(results, null, 4)))
    .catch((err) => res.status(404).json({ message: err }));
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  // What: Extracting the ISBN from the URL parameters
  // Why: To identify the specific book whose reviews we need to retrieve
  // Amazon Component: Used to filter the global reviews database for a specific ASIN
  // Enterprise Grade: Yes
  const isbn = req.params.isbn;

  // What: Accessing the specific book from our database
  // Why: To check if the book exists before attempting to access its reviews property
  // Amazon Component: Ensuring the product is valid before loading social proof data
  // Enterprise Grade: No (Logic depends on local object; use a relational DB for faster lookups)
  // How to make Enterprise Grade: https://aws.amazon.com/rds/
  const book = books[isbn];

  if (book) {
    // What: Returning only the 'reviews' field of the book object
    // Why: To fulfill Task 5 requirements for displaying book reviews specifically
    // Amazon Component: The data source for the "Top Reviews" and "Star Rating" UI
    // Enterprise Grade: Yes
    return res.status(200).send(JSON.stringify(book.reviews, null, 4));
  } else {
    return res.status(404).json({ message: "Book not found" });
  }
});

module.exports.general = public_users;
