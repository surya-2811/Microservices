const express = require("express");
const app = express();
const PORT = process.env.PORT_ONE || 9090;
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
app.use(express.json());
const amqp = require("amqplib/callback_api");
const Order = require("./order");
const isAuthenticated = require("../isAuthenticated");

var channel, connection;

mongoose
  .connect(`mongodb://127.0.0.1:27017/order-service`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Order-Service connected to mongodb"))
  .catch((err) => console.log(err));

function createOrder(products, userEmail) {
  let total = 0;
  for (let t = 0; t < products.length; t++) {
    total += products[t].price;
  }
  const newOrder = new Order({
    products,
    user: userEmail,
    total_price: total,
  });
  newOrder.save();
}

async function connect() {
  const amqpServer = "amqp://guest:guest@localhost:49154";
  connection = await amqp.connect(amqpServer, (err, conn) => {
    if (err) {
      console.log(err);
    } else {
      connection = conn;
      channel = connection.createChannel();

      channel.assertQueue("ORDER");

      channel.consume("ORDER", (data) => {
        const { products, userEmail } = JSON.parse(data.content);
        console.log("Consuming ORDER service", products, userEmail);

        const newOrder = createOrder(products, userEmail);
        console.log(newOrder);
        channel.ack(data);
        channel.sendToQueue(
          "PRODUCT",
          Buffer.from(JSON.stringify({ newOrder }))
        );
      });
    }
  });
  //   channel = await connection.createChannel();
  //   await channel.assertQueue("PRODUCT");
}
connect();

app.listen(PORT, () => {
  console.log(`Order-Service running at ${PORT}`);
});
