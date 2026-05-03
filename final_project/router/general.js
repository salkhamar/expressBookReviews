const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios'); // Ensure axios is required

// Task 10: Get all books using Async/Await with Axios
public_users.get('/', async function (req, res) {
    try {
        // We simulate calling our own local endpoint to get the book list
        const response = await axios.get("http://localhost:5000/");
        return res.status(200).json(response.data);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching books" });
    }
});

// Task 11: Get book details based on ISBN using Promises with Axios
public_users.get('/isbn/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    axios.get(`http://localhost:5000/isbn/${isbn}`)
        .then(response => {
            return res.status(200).json(response.data);
        })
        .catch(err => {
            return res.status(404).json({ message: "Book not found" });
        });
});

// Task 12: Get book details based on Author using Async/Await
public_users.get('/author/:author', async function (req, res) {
    const author = req.params.author;
    try {
        const response = await axios.get(`http://localhost:5000/author/${author}`);
        return res.status(200).json(response.data);
    } catch (error) {
        return res.status(404).json({ message: "No books found by this author" });
    }
});

// Task 13: Get book details based on Title using Promises
public_users.get('/title/:title', function (req, res) {
    const title = req.params.title;
    axios.get(`http://localhost:5000/title/${title}`)
        .then(response => {
            return res.status(200).json(response.data);
        })
        .catch(err => {
            return res.status(404).json({ message: "Book not found" });
        });
});

module.exports.general = public_users;