const { Router } = require("express");
const { pool } = require("../config/database");
const { requireAuth } = require("../middleware/requireAuth");

const jobsRouter = Router();

jobsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const { project_id, name, taskName, payload } = req.body;

    if (!Number.isSafeInteger(project_id)) {
      return res.status(400).json({ message: "enter a valid project id" });
    }

    if (
      typeof name !== "string" ||
      name.trim().length < 3 ||
      name.trim().length > 150
    ) {
      return res.status(400).json({
        message: "Name must be between 3 and 150 characters"
      });
    }

    if (
      typeof taskName !== "string" ||
      taskName.trim() === "" ||
      taskName.length < 3 ||
      taskName.length > 100
    ) {
      return res.status(400).json({
        message: "taskname must not be empty and must be between 3 to 100 characters long."
      });
    }

    if (payload == null || typeof payload !== "object" || Array.isArray(payload)) {
      return res.status(400).json({
        message: "Payload must be a valid JSON object"
      });
    }

    const userId = req.userId;
    const [projects] = await pool.execute(
      `SELECT p.id
       FROM projects p
       INNER JOIN organization_members om ON p.organization_id = om.organization_id
       WHERE p.id = ? AND om.user_id = ?
       LIMIT 1`,
      [project_id, userId]
    );
console.log("Projects found:", projects);
    if (projects.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this project"
      });
    }

    await pool.execute(
      `INSERT INTO jobs (user_id, project_id, name, task_name, payload)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        project_id,
        name.trim(),
        taskName.trim(),
        JSON.stringify(payload)
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Job created successfully"
    });
  } catch (error) {
    console.error("Error creating job:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
jobsRouter.get("/", requireAuth, async (req, res) => {
  try {
    const [jobs] = await pool.execute(
      `SELECT j.id, j.project_id, j.name, j.task_name, j.payload,
              j.status, j.created_at, j.updated_at
       FROM jobs j
       JOIN projects p ON p.id = j.project_id
       JOIN organization_members om ON om.organization_id = p.organization_id
       WHERE om.user_id = ?
       ORDER BY j.created_at DESC`,
      [req.userId]
    );

    return res.json({ success: true, data: jobs });
  } catch (error) {
    console.error("Error listing jobs:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});




module.exports = { jobsRouter };
