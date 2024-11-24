const { faker } = require("@faker-js/faker");
const prisma = require("../prisma");

/** Seeds the database with some dummy restaurants */
const seed = async (numRestaurants = 10) => {
  const restaurants = Array.from({ length: numRestaurants }, () => ({
    name: faker.food.vegetable(),
  }));
  await prisma.restaurant.createMany({ data: restaurants });
};

seed()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
