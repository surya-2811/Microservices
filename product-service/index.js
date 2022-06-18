const express = require("express");
const app = express();
const PORT = process.env.PORT_ONE || 8080;
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
app.use(express.json());
const amqp = require("amqplib/callback_api");
const Product = require("./product");
const isAuthenticated = require("../isAuthenticated");

var channel, connection;
var order;

mongoose
  .connect(`mongodb://127.0.0.1:27017/product-service`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Product-Service connected to mongodb"))
  .catch((err) => console.log(err));

async function connect() {
  const amqpServer = "amqp://guest:guest@localhost:49154";
  connection = await amqp.connect(amqpServer, (err, conn) => {
    if (err) {
      console.log(err);
    } else {
      connection = conn;
      channel = connection.createChannel();
      channel.assertQueue("PRODUCT");
    }
  });
  //   channel = await connection.createChannel();
  //   await channel.assertQueue("PRODUCT");
}
connect();

// Create a new product.
//Buy a product

app.post("/product/create", isAuthenticated, async (req, res) => {
  const { name, description, price } = req.body;
  try {
    if (!name || !description || !price) {
      res.json({ message: "Please fill in all fields", status: false });
    } else {
      const product = new Product({ name, description, price });
      await product.save();
      res
        .status(201)
        .json({ message: "Product created", status: true, product });
    }
  } catch (error) {
    res.status(500).json({ message: error.message, status: false });
  }
});

// User sends a list of product's IDs to buy.
// Creating an order with those products and a total  value of sum of product's prices.

app.post("/product/buy", isAuthenticated, async (req, res) => {
  console.log(req.user.email, "dsdsdsdsdsd");
  const { ids } = req.body;
  try {
    if (!ids) {
      res.json({ message: "Please fill in all fields", status: false });
    } else {
      const products = await Product.find({ _id: { $in: ids } });
      channel.sendToQueue(
        "ORDER",
        Buffer.from(JSON.stringify({ products, userEmail: req.user.email }))
      );
      channel.consume("PRODUCT", (data) => {
        order = JSON.parse(data.content);
        console.log("Consuming Product Queue ", order);

        channel.ack(data);
      });
      return res.json({ message: "Order created", status: true, order });
    }
  } catch (error) {
    res.status(500).json({ message: error.message + "dsd", status: false });
  }
});

app.listen(PORT, () => {
  console.log(`Product-Service running at ${PORT}`);
});
