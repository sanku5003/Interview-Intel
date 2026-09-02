const express = require("express");
const app = express();

const cors = require("cors");
const cookieParser = require("cookie-parser");

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(cookieParser());

// Routes
const authRouter = require("./Routes/auth.routes");
const interviewRouter = require("./Routes/interview.routes");

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);

module.exports = app;
