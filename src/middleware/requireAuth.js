const { createHash } = require("node:crypto");
const { pool } = require("../config/database");

async function requireAuth(req, res, next) {
  const authorization = req.get("authorization") || "";
  const match = /^Bearer ([^\s]+)$/i.exec(authorization);

  if (!match) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const tokenHash = createHash("sha256").update(match[1]).digest("hex");
  const [rows] = await pool.execute(
    `SELECT user_id FROM auth_sessions
     WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP
     LIMIT 1`,
    [tokenHash]
  );

  if (rows.length === 0) {
    return res.status(401).json({ success: false, message: "Invalid or expired session" });
  }

  req.tokenHash = tokenHash;
  req.userId = rows[0].user_id;
  return next();
}

module.exports = { requireAuth };
