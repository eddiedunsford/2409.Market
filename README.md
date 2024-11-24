# Table Pro

Introducing Table Pro, the successor to Table! Customers will now need to make an account and log in before they are able to make reservations for a table at a restaurant of their choice.

The **solution** branch contains documented solution code. The commit history of that branch follows the instructions below.

## Customer Accounts in Database

<figure>

![Visualized schema. The textual representation in DBML is linked below.](/docs/schema.svg)

<figcaption>

[textual representation of schema in DBML](/docs/schema.dbml)

</figcaption>
</figure>

The schema has already been defined for you. An initial migration has also been created, along with the seed script. In this section, you'll be adding some code to ensure that a customer's plaintext password is never stored in the database.

1.  `npm install bcrypt`, which we will be using to hash customer passwords.
2.  In `prisma/index.js`, we will _extend_ the Prisma Client to [add some methods to our customer model](https://www.prisma.io/docs/orm/prisma-client/client-extensions/model#add-a-custom-method-to-a-specific-model).

    1.  Add a method named `register` to the `customer` model, which takes `email` and `password` as parameters. It will [hash the given password](https://github.com/kelektiv/node.bcrypt.js?tab=readme-ov-file#to-hash-a-password) using `bcrypt` with 10 salt rounds. Then, it will create a new customer with the provided email and the _hashed_ password. This newly created customer is returned.
        <details>
        <summary>See Solution</summary>

        ```js
        /**
         * Creates a new customer with the provided credentials.
         * The password is hashed with bcrypt before the customer is saved.
         */
        async register(email, password) {
          const hashedPassword = await bcrypt.hash(password, 10);
          const customer = await prisma.customer.create({
            data: { email, password: hashedPassword },
          });
          return customer;
        }
        ```

        </details>

    2.  Add a method named `login` to the `customer` model, which takes `email` and `password` as parameters. It will find the customer with the provided email. Then, it will [compare the given password](https://github.com/kelektiv/node.bcrypt.js?tab=readme-ov-file#to-check-a-password) to the hashed password saved in the database. If the password does not match, it will throw an error. Otherwise, it returns the found customer.
        <details>
        <summary>See Solution</summary>

        ```js
        /**
         * Finds the customer with the provided email,
         * as long as the provided password matches what's saved in the database.
         */
        async login(email, password) {
          const customer = await prisma.customer.findUniqueOrThrow({
            where: { email },
          });
          const valid = await bcrypt.compare(password, customer.password);
          if (!valid) throw Error("Invalid password");
          return customer;
        }
        ```

        </details>

3.  Rename `example.env` to `.env` and update the `DATABASE_URL` with your Postgres credentials.
4.  Apply the migration and seed your local database with `npx prisma migrate reset`. This will also generate a new Prisma Client with your newly defined customer methods.

We can now use these custom methods to handle our API's register and login routes!

## Configuring the Environment

1. `npm install dotenv`
2. In your `.env` file, change the `JWT_SECRET` to something secure. Anyone who knows this string will be able to decrypt any token this backend generates. A good minimum length is 32 characters.

   - Example: `mn8i1PhN97IJVcpo1nESf38FFZCiqHiT` (don't actually use this!)

3. Add this line to the top of `server.js`. This will allow the rest of your app to access the variables defined in your `.env` file.
   ```js
   require("dotenv").config();
   ```

## Creating the Auth Router

1. `npm install jsonwebtoken`
2. Near the top of `api/auth.js`, import `jsonwebtoken` and grab the `JWT_SECRET` from `process.env`.

   ```js
   const jwt = require("jsonwebtoken");
   const JWT_SECRET = process.env.JWT_SECRET;
   ```

3. Write a function `createToken` that takes an `id` as a parameter. We will be calling this function later. Use [`jwt.sign`](https://github.com/auth0/node-jsonwebtoken?tab=readme-ov-file#jwtsignpayload-secretorprivatekey-options-callback) to create a token with `{ id }` as the payload and `JWT_SECRET` as the key. The token should expire in 1 day. Return the token.

   - Note: `id` is wrapped in an object to prevent `jwt` from coercing it into a string
   <details>
   <summary>See Solution</summary>

   ```js
   function createToken(id) {
     return jwt.sign({ id }, JWT_SECRET, { expiresIn: "1d" });
   }
   ```

   </details>

4. Continue to the token-checking middleware. It has been partially defined for you. Make sure to read how the token is grabbed from the request headers.

   1. Use [`jwt.verify`](https://github.com/auth0/node-jsonwebtoken?tab=readme-ov-file#jwtverifytoken-secretorpublickey-options-callback) with `JWT_SECRET` to get the `id` from the token.
   2. Find the customer with that `id`.
   3. Set `req.customer` to that customer.
   4. Continue to the next middleware.
   <details>
   <summary>See Solution</summary>

   ```js
   try {
     const { id } = jwt.verify(token, JWT_SECRET);
     const customer = await prisma.customer.findUniqueOrThrow({
       where: { id },
     });
     req.customer = customer;
     next();
   } catch (e) {
     next(e);
   }
   ```

   </details>

5. Create the `POST /register` route.

   1. Pass the `email` and `password` from the request body into `prisma.customer.register`, which is the custom method that you defined earlier. Save the returned customer in a variable named `customer`.
   2. Pass the `id` of that `customer` into `createToken`, which you also defined earlier. Save the returned token in a variable named `token`.
   3. Respond with `{ token }` and a status of 201.
   <details>
   <summary>See Solution</summary>

   ```js
   router.post("/register", async (req, res, next) => {
     const { email, password } = req.body;
     try {
       const customer = await prisma.customer.register(email, password);
       const token = createToken(customer.id);
       res.status(201).json({ token });
     } catch (e) {
       next(e);
     }
   });
   ```

   </details>

6. Create the `POST /login` route.

   1. Pass the `email` and `password` into `prisma.customer.login`. Save the returned customer in a variable named `customer`.
   2. Pass the `id` of that `customer` into `createToken`. Save the returned token in a variable named `token`.
   3. Respond with `{ token }`.
   <details>
   <summary>See Solution</summary>

   ```js
   router.post("/login", async (req, res, next) => {
     const { email, password } = req.body;
     try {
       const customer = await prisma.customer.login(email, password);
       const token = createToken(customer.id);
       res.json({ token });
     } catch (e) {
       next(e);
     }
   });
   ```

   </details>

7. Read the `authenticate` function, which has already been written. Why does it check for `req.customer`?
   <details>
   <summary>See Solution</summary>

   The first token-checking middleware earlier in the file will look in the request headers for a token. It will try to grab a customer id from that token. If a customer is found with that id, it is attached to `req.customer`.

   So, if `req.customer` exists, that means the customer is successfully logged in and we can proceed to the next middleware (whatever that might happen to be). Otherwise, we will skip directly to sending a 401 error.

   </details>

To recap: we now have routes for registering a new customer and logging in as an existing customer. Both routes will send a token if successful. We also have middleware to associate a request with a specific customer according to the attached token.

## Authenticated Routes

In this section, we'll define some routes that will only work if the customer is logged in. This allows us to _protect_ our routes and limit who is allowed to access our database.

`/reservations` router

1. Notice how `authenticate` is used in the `GET /` route. What do you think it's doing?
   <details>
   <summary>See Solution</summary>

   Any requests to `GET /reservations` will first go through the `authenticate` middleware. If the customer is not logged in, then the request will automatically send an error. The customer can only access the rest of this route if they are logged in.

   </details>

2. Write the rest of the `GET /` route. Send all of the reservations made by the customer stored in `req.customer`. Include the `restaurant` of each reservation.
   <details>
   <summary>See Solution</summary>

   ```js
   try {
     const reservations = await prisma.reservation.findMany({
       where: { customerId: req.customer.id },
       include: { restaurant: true },
     });
     res.json(reservations);
   } catch (e) {
     next(e);
   }
   ```

   </details>

3. Create the `POST /` route. It should only be accessible to a customer that is logged in. It will create a new reservation under the logged in customer, according to the `partySize` and `restaurantId` specified in the request body. It then sends the newly created reservation with status 201.
   <details>
   <summary>See Solution</summary>

   ```js
   router.post("/", authenticate, async (req, res, next) => {
     const { partySize, restaurantId } = req.body;
     try {
       const reservation = await prisma.reservation.create({
         data: {
           partySize: +partySize,
           restaurantId: +restaurantId,
           customerId: req.customer.id,
         },
       });
       res.status(201).json(reservation);
     } catch (e) {
       next(e);
     }
   });
   ```

   </details>

`/restaurants` router

1. Read the `GET /:id` route. What changes if a customer is logged in?
   <details>
   <summary>See Solution</summary>

   The value of `includeReservations` changes. If a customer is not logged in, then it's simply `false`, which means that the restaurant will _not_ include any reservations in the response.

   If a customer _is_ logged in, then the response will include any reservations that the logged-in customer has made for that specific restaurant.

   </details>
