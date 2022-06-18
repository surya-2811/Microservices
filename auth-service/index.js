const express = require("express");
const app = express();
const PORT = process.env.PORT_ONE || 7070;
const mongoose = require("mongoose");
const User = require("./user");
const jwt = require("jsonwebtoken");

mongoose
  .connect(`mongodb://127.0.0.1:27017/auth-service`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Auth-Service connected to mongodb"))
  .catch((err) => console.log(err));

app.use(express.json());

app.post("/auth/register", async (req, res) => {
  const { username, password, email } = req.body;
  try {
    if (!username || !password || !email) {
      res.json({ message: "Please fill in all fields", status: false });
    } else {
      const userExist = await User.findOne({ username });
      if (userExist) {
        res.status(400).json({ message: "User already exist", status: false });
      } else {
        const user = new User({ username, password, email });
        await user.save();
        res.status(201).json({ message: "User created", status: true });
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", status: false });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).send("User does not exist");
    } else {
      if (user.password === password) {
        const payload = {
          email,
          name: user.username,
        };
        jwt.sign(payload, "secret", (err, token) => {
          if (err) {
            console.log(err);
          } else {
            res.status(200).send({ token });
          }
        });
      } else {
        res.status(400).send("Password is incorrect");
      }
    }
  } catch {
    res.status(500).send("Something went wrong");
  }
});

app.listen(PORT, () => {
  console.log(`Auth-Service running at ${PORT}`);
});
