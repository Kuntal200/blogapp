const jwt = require("jsonwebtoken");
const HttpError = require("../models/errorModel");

const authMiddleware = async (req, res, next) => {
  const Authorization = req.headers.authorization;

  if (Authorization && Authorization.startsWith("Bearer")) {
    const token = Authorization.split(" ")[1];
    console.log("Authorization Header:", Authorization);
    console.log("Token:", token);

    jwt.verify(token, process.env.JWT_SECRET, (err, info) => {
      if (err) {
        console.log(err);
        return next(new HttpError("Unauthorized,Invalid Token", 401));
      }
      req.user = info;
      next();
    });
  } else {
    return next(new HttpError("Unauthorized,NoToken", 403));
  }
};

module.exports = authMiddleware;
