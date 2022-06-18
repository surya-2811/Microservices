const jwt = require("jsonwebtoken");
module.exports = async function isAuthenticated(req, res, next) {
  try {
    const token = req.headers.token;
    if (!token) {
      res.json({ message: "Authentication failed", status: false });
    } else {
      const decode = jwt.verify(token, "secret", (err, decoded) => {
        if (err) {
          res.json({ message: "Authentication failed", status: false });
        } else {
          console.log(decoded);
          req.user = decoded;
          next();
        }
      });
    }
  } catch (error) {
    res.json({ message: "Authentication failed", status: false });
  }
};
