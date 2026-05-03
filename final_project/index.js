const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use("/customer",session({secret:"fingerprint_customer",resave: true, saveUninitialized: true}))

app.use("/customer/auth/*", function auth(req,res,next){
    // What: Checking for a session-based access token
    // Why: To verify if the user is authenticated before allowing access to protected routes
    // Amazon Component: Used in "Amazon Your Account" pages to verify session validity
    // Enterprise Grade: No (For Enterprise, use Redis to store sessions and robust OAuth2/OIDC flows)
    // How to make Enterprise Grade: https://auth0.com/docs/secure/tokens/json-web-tokens
    if (req.session.authorization) {
            let token = req.session.authorization['accessToken'];

            // What: Verifying the JWT (JSON Web Token)
            // Why: Ensures the token has not been tampered with and is still valid
            // Amazon Component: AWS Cognito uses JWTs for identity verification
            // Enterprise Grade: Yes
            jwt.verify(token, "access", (err, user) => {
                if (!err) {
                    req.user = user;
                    next(); // Proceed to the next middleware/route handler
                } else {
                    return res.status(403).json({ message: "User not authenticated" });
                }
            });
        } else {
            return res.status(403).json({ message: "User not logged in" });
        }
});
 
const PORT =5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT,()=>console.log("Server is running"));
