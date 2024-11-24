const express = require("express");
const router = express.Router();
module.exports = router;

const prisma = require("../prisma");
const { authenticate } = require("./auth");

// GET /products - Get products purchased by the logged-in user
router.get("/", authenticate, async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { userId: req.user.id },
    });
    res.json(products);
  } catch (e) {
    next(e);
  }
});

// POST /products - Create a new product associated with the logged-in user
router.post("/", authenticate, async (req, res, next) => {
  const { name, description, price } = req.body;
  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: +price,
        userId: req.user.id,
      },
    });
    res.status(201).json(product);
  } catch (e) {
    next(e);
  }
});
