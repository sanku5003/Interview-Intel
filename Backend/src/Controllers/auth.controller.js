
const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const tokenBlackListModel = require("../models/blackList.model");

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "None" : "Lax",
  maxAge: 60 * 60 * 1000, // 1 hour
};

/**
 * @name registerUserController
 * @description Register a new user
 * @access Public
 */
async function registerUserController(req, res) {
  const { username, email, contact, password } = req.body;

  if (!username || !email || !contact || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters long",
    });
  }

  const emailExists = await userModel.findOne({ email });
  if (emailExists) {
    return res.status(400).json({ message: "Email already registered" });
  }

  const usernameExists = await userModel.findOne({ username });
  if (usernameExists) {
    return res.status(400).json({ message: "Username already taken" });
  }

  const hash = await bcrypt.hash(password, 10);

  const newUser = await userModel.create({
    username,
    email,
    contact,
    password: hash,
  });

  const token = jwt.sign(
    { id: newUser._id, username: newUser.username },
    process.env.SECRET_KEY,
    { expiresIn: "1h" }
  );

  res.cookie("token", token, cookieOptions);

  res.status(201).json({
    message: "User registered successfully",
    newUser: {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      contact: newUser.contact,
      token,
    },
  });
}

/**
 * @name loginUserController
 * @description Login a user
 * @access Public
 */
async function loginUserController(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(400).json({
      message: "Invalid email or password",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(400).json({
      message: "Invalid email or password",
    });
  }

  const token = jwt.sign(
    { id: user._id, username: user.username },
    process.env.SECRET_KEY,
    { expiresIn: "1h" }
  );

  res.cookie("token", token, cookieOptions);

  res.status(200).json({
    message: "Login successful",
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      contact: user.contact,
      token,
    },
  });
}

/**
 * @name logoutUserController
 * @description Logout a user
 * @access Public
 */
async function logoutUserController(req, res) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(400).json({
      message: "No token found",
    });
  }

  await tokenBlackListModel.create({ token });

  res.clearCookie("token", cookieOptions);

  return res.status(200).json({
    message: "Logout successful",
  });
}

/**
 * @name getMeController
 * @description Get current user
 * @access Private
 */
async function getMeController(req, res) {
  const user = await userModel.findById(req.user.id);

  res.status(200).json({
    message: "User fetched successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      contact: user.contact,
    },
  });
}

module.exports = {
  registerUserController,
  loginUserController,
  logoutUserController,
  getMeController,
};

