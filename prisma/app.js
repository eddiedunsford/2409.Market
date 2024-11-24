const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

app.use(express.json()); // Middleware for parsing JSON

/** Utility function to generate tokens */
function createToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1d" });
}

/** Middleware to authenticate user based on the token */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1]; // Bearer <token>
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

// ---------------------------------
// Authentication Routes
// ---------------------------------

/** Register a new user */
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { username, password: hashedPassword },
    });
    const token = createToken(user.id);
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ error: "Could not register user" });
  }
});

/** Login a user */
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { username },
    });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error();

    const token = createToken(user.id);
    res.json({ token });
  } catch {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// ---------------------------------
// Product Routes
// ---------------------------------

/** Get all products */
app.get("/products", async (req, res) => {
  const products = await prisma.product.findMany();
  res.json(products);
});

/** Get a specific product */
app.get("/products/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: +id },
    });

    if (req.headers.authorization) {
      authenticate(req, res, async () => {
        const orders = await prisma.order.findMany({
          where: {
            userId: req.userId,
            products: { some: { id: +id } },
          },
          include: { products: true },
        });
        res.json({ ...product, userOrders: orders });
      });
    } else {
      res.json(product);
    }
  } catch {
    res.status(404).json({ error: "Product not found" });
  }
});

// ---------------------------------
// Order Routes
// ---------------------------------

/** Get all orders by the logged-in user 🔒 */
app.get("/orders", authenticate, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.userId },
    include: { products: true },
  });
  res.json(orders);
});

/** Create a new order 🔒 */
app.post("/orders", authenticate, async (req, res) => {
  const { date, note, productIds } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: "Product IDs are required" });
  }

  try {
    const order = await prisma.order.create({
      data: {
        date,
        note,
        userId: req.userId,
        products: {
          connect: productIds.map((id) => ({ id: +id })),
        },
      },
    });
    res.status(201).json(order);
  } catch {
    res.status(500).json({ error: "Could not create order" });
  }
});

/** Get a specific order 🔒 */
app.get("/orders/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: +id },
      include: { products: true },
    });

    if (order.userId !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json(order);
  } catch {
    res.status(404).json({ error: "Order not found" });
  }
});

// ---------------------------------
// Start the Server
// ---------------------------------

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
