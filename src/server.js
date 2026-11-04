const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { env } = require("./config/env");
const { pool } = require("./config/database");
const { authRouter } = require("./routes/auth");
const { organizationsRouter } = require("./routes/organizations");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/v1/auth", authRouter);
app.use("/v1", organizationsRouter);

// Health check API
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Tripwise backend is running!"
  });
});

// Flight search API
app.post("/api/flights/search", (req, res) => {
  const { from, to, departureDate, passengers } = req.body;

  res.json({
    success: true,
    message: "Flight search request received",
    data: { from, to, departureDate, passengers }
  });
});

app.use((error, req, res, next) => {
  console.error("Request failed:", error);
  if (res.headersSent) {
    return next(error);
  }
  return res.status(500).json({ success: false, message: "Internal server error" });
});

async function startServer() {
  try {
    await pool.query("SELECT 1");
    app.listen(env.PORT, () => console.log(`Backend running at http://localhost:${env.PORT}`));
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
    process.exitCode = 1;
  }
}
void startServer();