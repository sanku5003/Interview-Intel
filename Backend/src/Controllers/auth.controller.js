
const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const tokenBlackListModel = require("../models/blackList.model");
const {
  isTwilioConfigured,
  sendVerificationCode,
  verifyCode,
} = require("../services/twilio.service");

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "None" : "Lax",
  maxAge: 60 * 60 * 1000, // 1 hour
};

const recoveryRequestMessage =
  "If an account exists for that email, instructions will be sent to its registered contact number.";
const invalidRecoveryCodeMessage = "Invalid or expired verification code.";
const e164ContactPattern = /^\+[1-9]\d{7,14}$/;
const indianMobilePattern = /^(?:\+?91)?[6-9]\d{9}$/;

function normalizeIndianContact(contact) {
  if (typeof contact !== "string") {
    return null;
  }

  const normalizedInput = contact.trim().replace(/[\s()-]/g, "");

  if (!indianMobilePattern.test(normalizedInput)) {
    return null;
  }

  const mobileNumber = normalizedInput.startsWith("+91")
    ? normalizedInput.slice(3)
    : normalizedInput.length === 12 && normalizedInput.startsWith("91")
      ? normalizedInput.slice(2)
      : normalizedInput;
  return `+91${mobileNumber}`;
}

/**
 * @name registerUserController
 * @description Register a new user
 * @access Public
 */
async function registerUserController(req, res) {
  const { username, email, contact, password } = req.body;
  const normalizedContact = normalizeIndianContact(contact);

  if (!username || !email || !contact || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!normalizedContact) {
    return res.status(400).json({
      message: "Enter a valid 10-digit Indian mobile number",
    });
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
    contact: normalizedContact,
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
 * @name forgotPasswordController
 * @description Send a password-recovery code to the user's registered phone
 * @access Public
 */
async function forgotPasswordController(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!isTwilioConfigured()) {
    return res.status(503).json({ message: "Password recovery is temporarily unavailable" });
  }

  const user = await userModel.findOne({ email });

  if (user?.contact && e164ContactPattern.test(user.contact)) {
    await userModel.updateOne(
      { _id: user._id },
      {
        $unset: {
          passwordResetTokenHash: "",
          passwordResetTokenExpiresAt: "",
        },
      }
    );

    try {
      await sendVerificationCode(user.contact);
    } catch (_) {
      // Keep the response identical for known and unknown email addresses.
    }
  }

  return res.status(200).json({ message: recoveryRequestMessage });
}

/**
 * @name verifyPasswordResetCodeController
 * @description Verify a recovery code and issue a one-time reset token
 * @access Public
 */
async function verifyPasswordResetCodeController(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";

  if (!email || !code) {
    return res.status(400).json({ message: "Email and verification code are required" });
  }

  if (!isTwilioConfigured()) {
    return res.status(503).json({ message: "Password recovery is temporarily unavailable" });
  }

  const user = await userModel.findOne({ email });

  if (!user?.contact || !e164ContactPattern.test(user.contact)) {
    return res.status(400).json({ message: invalidRecoveryCodeMessage });
  }

  let isVerified;

  try {
    isVerified = await verifyCode(user.contact, code);
  } catch (error) {
    if (error.status === 400 || error.status === 404) {
      return res.status(400).json({ message: invalidRecoveryCodeMessage });
    }

    return res.status(503).json({ message: "Unable to verify the code right now" });
  }

  if (!isVerified) {
    return res.status(400).json({ message: invalidRecoveryCodeMessage });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.passwordResetTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  return res.status(200).json({
    message: "Code verified. You can now choose a new password.",
    resetToken,
  });
}

/**
 * @name resetPasswordController
 * @description Replace the user's password using a verified one-time token
 * @access Public
 */
async function resetPasswordController(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const resetToken = typeof body.resetToken === "string" ? body.resetToken : "";
  const { newPassword } = body;

  if (!resetToken || typeof newPassword !== "string") {
    return res.status(400).json({ message: "Verification and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }

  const resetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const user = await userModel.findOne({
    passwordResetTokenHash: resetTokenHash,
    passwordResetTokenExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({ message: "Password reset session is invalid or expired" });
  }

  if (await bcrypt.compare(newPassword, user.password)) {
    return res.status(400).json({
      message: "New password must be different from your current password",
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const updateResult = await userModel.updateOne(
    {
      _id: user._id,
      passwordResetTokenHash: resetTokenHash,
      passwordResetTokenExpiresAt: { $gt: new Date() },
    },
    {
      $set: { password: passwordHash },
      $unset: {
        passwordResetTokenHash: "",
        passwordResetTokenExpiresAt: "",
      },
    }
  );

  if (!updateResult.modifiedCount) {
    return res.status(400).json({ message: "Password reset session is invalid or expired" });
  }

  return res.status(200).json({ message: "Password reset successfully" });
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
  forgotPasswordController,
  verifyPasswordResetCodeController,
  resetPasswordController,
  logoutUserController,
  getMeController,
};

