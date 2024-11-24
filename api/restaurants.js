const express = require("express");
const router = express.Router();
module.exports = router;

const prisma = require("../prisma");

// Note: this route is not protected! Anyone can get all restaurants!
router.get("/", async (req, res, next) => {
  try {
    const restaurants = await prisma.restaurant.findMany();
    res.json(restaurants);
  } catch (e) {
    next(e);
  }
});

// Note: this route is also not protected, but what changes if a customer is logged in?
router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  const includeReservations = req.customer
    ? { where: { customerId: req.customer.id } }
    : false;
  try {
    const restaurant = await prisma.restaurant.findUniqueOrThrow({
      where: { id: +id },
      include: { reservations: includeReservations },
    });
    res.json(restaurant);
  } catch (e) {
    next(e);
  }
});
