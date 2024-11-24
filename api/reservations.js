const express = require("express");
const router = express.Router();
module.exports = router;

const prisma = require("../prisma");
// Notice we use {} when importing `authenticate` because it is not the only export
const { authenticate } = require("./auth");

router.get("/", authenticate, async (req, res, next) => {
  // TODO: Send reservations made by the logged in customer
});

// TODO: POST /
