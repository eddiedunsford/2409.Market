const express = require("express");
const router = express.Router();

// TODO: Import jwt and JWT_SECRET

// TODO: createToken

const prisma = require("../prisma");

// This token-checking middleware should run before any other routes.
// It's the first in this file, and this router is imported first in `server.js`.
router.use(async (req, res, next) => {
  // Grab token from headers only if it exists
  const authHeader = req.headers.authorization;
  const token = authHeader?.slice(7); // "Bearer <token>"
  if (!token) return next();

  // TODO: Find customer with ID decrypted from the token and attach to the request
});

// TODO: POST /register

// TODO: POST /login

/** Checks the request for an authenticated customer. */
function authenticate(req, res, next) {
  if (req.customer) {
    next();
  } else {
    next({ status: 401, message: "You must be logged in." });
  }
}

// Notice how we export the router _and_ the `authenticate` middleware!
module.exports = {
  router,
  authenticate,
};
