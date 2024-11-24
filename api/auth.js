const express = require("express");
const router = express.Router();

// Import jwt and JWT_SECRET
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

// Function to create a JWT token for a user
function createToken(id) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: "1d" });
}

const prisma = require("../prisma");

// Token-checking middleware: Runs before other routes
router.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.slice(7); // Extract token after "Bearer "
  if (!token) return next();

  try {
    const { id } = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUniqueOrThrow({
      where: { id },
    });
    req.user = user; // Attach the user to the request
    next();
  } catch (e) {
    next(e);
  }
});

// POST /register - Register a new user
router.post("/register", async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.register(email, password);
    const token = createToken(user.id);
    res.status(201).json({ token });
  } catch (e) {
    next(e);
  }
});

// POST /login - Login an existing user
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.login(email, password);
    const token = createToken(user.id);
    res.json({ token });
  } catch (e) {
    next(e);
  }
});

/** Middleware: Ensures the request is made by an authenticated user */
function authenticate(req, res, next) {
  if (req.user) {
    next();
  } else {
    next({ status: 401, message: "You must be logged in." });
  }
}

// Export both the router and the authenticate middleware
module.exports = {
  router,
  authenticate,
};
