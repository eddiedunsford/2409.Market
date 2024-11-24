const { faker } = require("@faker-js/faker");
const prisma = require("../prisma");

async function seed() {
  try {
    // Create some users
    const users = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        prisma.user.create({
          data: {
            username: `user${i + 1}`,
            email: `user${i + 1}@example.com`,
          },
        })
      )
    );

    // Seed 20 products and assign them to random users
    const products = Array.from({ length: 20 }, (_, i) => ({
      name: `Product ${i + 1}`,
      description: `This is the description for Product ${i + 1}`,
      price: parseFloat((Math.random() * 100).toFixed(2)),
      userId: users[Math.floor(Math.random() * users.length)].id,
    }));

    await prisma.product.createMany({ data: products });

    console.log("Database has been seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
