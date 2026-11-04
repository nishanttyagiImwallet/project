const { Router } = require("express");
const { createHash, randomBytes } = require("node:crypto");
const { pool } = require("../config/database");
const { hashPassword, verifyPassword } = require("../auth/password");
const { requireAuth } = require("../middleware/requireAuth");

const router = Router();

// Create an account
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const cleanName = typeof name === "string" ? name.trim() : "";

  if (
    cleanEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128 ||
    (name !== undefined &&
      (typeof name !== "string" || cleanName.length < 1 || cleanName.length > 100))
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid email, password (8-128 characters), and optional name (up to 100 characters)"
    });
  }

  try {
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name === undefined ? null : cleanName, cleanEmail, await hashPassword(password)]
    );

    return res.status(201).json({
      success: true,
      message: "Account created",
      data: { id: result.insertId, name: name === undefined ? null : cleanName, email: cleanEmail }
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }
    throw error;
  }
});

// Log in and get a token
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const [users] = await pool.execute(
    "SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1",
    [email.trim().toLowerCase()]
  );
  const user = users[0];

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  await pool.execute(
    `INSERT INTO auth_sessions (user_id, token_hash, expires_at)
     VALUES (?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY))`,
    [user.id, tokenHash]
  );

  return res.json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, email: user.email },
      token
    }
  });
});

// Log out and invalidate the token
router.post("/logout", requireAuth, async (req, res) => {
  await pool.execute("DELETE FROM auth_sessions WHERE token_hash = ?", [req.tokenHash]);
  return res.json({ success: true, message: "Logged out" });
});

module.exports = { authRouter: router };
