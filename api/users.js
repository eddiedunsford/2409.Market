const express = require("express");
const router = express.Router();
module.exports = router;

const prisma = require("../prisma");

// GET /users - Get all users
router.get("/", async (req, res, next) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (e) {
    next(e);
  }
});

// GET /users/:id - Get a specific user and their products
router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  const includeProducts = req.user
    ? { where: { userId: req.user.id } }
    : false;
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: +id },
      include: { products: includeProducts },
    });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

