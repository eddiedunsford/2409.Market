const bcrypt = require("bcrypt");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient().$extends({
  model: {
    user: {
      /**
       * Creates a new user with the provided credentials.
       * The password is hashed with bcrypt before the user is saved.
       */
      async register(email, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
          data: { email, password: hashedPassword },
        });
        return user;
      },

      /**
       * Finds the user with the provided email,
       * as long as the provided password matches what's saved in the database.
       */
      async login(email, password) {
        const user = await prisma.user.findUniqueOrThrow({
          where: { email },
        });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw Error("Invalid password");
        return user;
      },
    },

    product: {
      /**
       * Creates a new product associated with a specific user.
       */
      async createProduct(userId, name, description, price) {
        const product = await prisma.product.create({
          data: {
            name,
            description,
            price,
            userId,
          },
        });
        return product;
      },

      /**
       * Finds all products created by a specific user.
       */
      async getUserProducts(userId) {
        const products = await prisma.product.findMany({
          where: { userId },
        });
        return products;
      },
    },
  },
});

module.exports = prisma;
