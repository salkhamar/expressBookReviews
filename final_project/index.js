const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

// Mounted at root to ensure session cookies are sent for all routes
app.use("/", session({secret:"fingerprint_customer", resave: true, saveUninitialized: true}))

// Middleware updated to "/auth/*" to match the new routing structure
app.use("/auth/*", function auth(req,res,next){
    if (req.session.authorization) {
        let token = req.session.authorization['accessToken'];

        // Verifying the JWT ensures the token is valid
        jwt.verify(token, "access", (err, user) => {
            if (!err) {
                req.user = user;
                next(); 
            } else {
                return res.status(403).json({ message: "User not authenticated" });
            }
        });
    } else {
        return res.status(403).json({ message: "User not logged in" });
    }
});
 
const PORT = 5000;

// Mount customer routes at root so endpoints like /login and /review are accessible
app.use("/", customer_routes);
app.use("/", genl_routes);

app.listen(PORT, () => console.log("Server is running"));