const { Router } = require("express");
const { pool } = require("../config/database");
const { requireAuth } = require("../middleware/requireAuth");

const router = Router();

router.use(requireAuth);

// Create an organization and make the logged-in user its owner.
router.post("/organizations", async (req, res) => {
  const { name } = req.body || {};
  const cleanName = typeof name === "string" ? name.trim() : "";

  if (!cleanName || cleanName.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Organization name is required and must be 100 characters or fewer"
    });
  }

  const connection = await pool.getConnection();
  console.log("conncetion", connection);
  try {
    await connection.beginTransaction();
    const [organization] = await connection.execute(
      "INSERT INTO organizations (name) VALUES (?)",
      [cleanName]
    );
    await connection.execute(
      "INSERT INTO organization_members (organization_id, user_id, role) VALUES (?, ?, 'owner')",
      [organization.insertId, req.userId]
    );
    await connection.commit();

    return res.status(201).json({
      success: true,
      data: { id: organization.insertId, name: cleanName, role: "owner" }
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

// List organizations the logged-in user belongs to.
router.get("/organizations", async (req, res) => {
  const [organizations] = await pool.execute(
    `SELECT o.id, o.name, m.role, o.created_at
     FROM organizations o
     JOIN organization_members m ON m.organization_id = o.id
     WHERE m.user_id = ?
     ORDER BY o.id DESC`,
    [req.userId]
  );

  return res.json({ success: true, data: organizations });
});

// Create a project in an organization the user belongs to.
router.post("/projects", async (req, res) => {
  const { organizationId, name } = req.body || {};
  const cleanName = typeof name === "string" ? name.trim() : "";
  const parsedOrganizationId = Number(organizationId);

  if (
    !Number.isSafeInteger(parsedOrganizationId) ||
    parsedOrganizationId < 1 ||
    !cleanName ||
    cleanName.length > 100
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid organizationId and project name (up to 100 characters) are required"
    });
  }

  const [memberships] = await pool.execute(
    "SELECT organization_id FROM organization_members WHERE organization_id = ? AND user_id = ? LIMIT 1",
    [parsedOrganizationId, req.userId]
  );
  if (memberships.length === 0) {
    return res.status(404).json({ success: false, message: "Organization not found" });
  }

  const [result] = await pool.execute(
    "INSERT INTO projects (organization_id, name) VALUES (?, ?)",
    [parsedOrganizationId, cleanName]
  );

  return res.status(201).json({
    success: true,
    data: { id: result.insertId, organizationId: parsedOrganizationId, name: cleanName }
  });
});

// List projects in organizations the logged-in user belongs to.
router.get("/projects", async (req, res) => {
  const [projects] = await pool.execute(
    `SELECT p.id, p.organization_id AS organizationId, p.name, p.created_at
     FROM projects p
     JOIN organization_members m ON m.organization_id = p.organization_id
     WHERE m.user_id = ?
     ORDER BY p.id DESC`,
    [req.userId]
  );

  return res.json({ success: true, data: projects });
});

module.exports = { organizationsRouter: router };
