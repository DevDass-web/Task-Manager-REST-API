const { pool } = require("../config/db");

const allowedStatuses = ["pending", "in_progress", "completed"];
const allowedPriorities = ["low", "medium", "high"];

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validateTask(body, partial = false) {
  const errors = [];
  const allowedFields = ["title", "description", "status", "priority", "due_date"];
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

  if (!partial || has("title")) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      errors.push("title is required and must be a non-empty string");
    } else if (body.title.trim().length > 150) {
      errors.push("title must be 150 characters or fewer");
    }
  }

  if (has("description") && body.description !== null && typeof body.description !== "string") {
    errors.push("description must be a string or null");
  }
  if (has("status") && !allowedStatuses.includes(body.status)) {
    errors.push(`status must be one of: ${allowedStatuses.join(", ")}`);
  }
  if (has("priority") && !allowedPriorities.includes(body.priority)) {
    errors.push(`priority must be one of: ${allowedPriorities.join(", ")}`);
  }
  if (has("due_date") && body.due_date !== null &&
      (typeof body.due_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.due_date) ||
       Number.isNaN(Date.parse(body.due_date)))) {
    errors.push("due_date must be a valid date in YYYY-MM-DD format or null");
  }
  if (Object.keys(body).some((key) => !allowedFields.includes(key))) {
    errors.push("Request contains unsupported fields");
  }
  return errors;
}

async function getTasks(req, res, next) {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];

    if (req.query.status) {
      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({ success: false, message: "Invalid status filter" });
      }
      conditions.push("status = ?");
      values.push(req.query.status);
    }
    if (req.query.priority) {
      if (!allowedPriorities.includes(req.query.priority)) {
        return res.status(400).json({ success: false, message: "Invalid priority filter" });
      }
      conditions.push("priority = ?");
      values.push(req.query.priority);
    }
    if (req.query.search) {
      conditions.push("(title LIKE ? OR description LIKE ?)");
      const term = `%${req.query.search}%`;
      values.push(term, term);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM tasks ${where}`, values);
    const [rows] = await pool.execute(
      `SELECT * FROM tasks ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );
    const total = countRows[0].total;

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
}

async function getTaskById(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid task ID" });

    const [rows] = await pool.execute("SELECT * FROM tasks WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Task not found" });

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
}

async function createTask(req, res, next) {
  try {
    const errors = validateTask(req.body);
    if (errors.length) return res.status(400).json({ success: false, errors });

    const { title, description = null, status = "pending", priority = "medium", due_date = null } = req.body;
    const [result] = await pool.execute(
      "INSERT INTO tasks (title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?)",
      [title.trim(), description, status, priority, due_date]
    );
    const [rows] = await pool.execute("SELECT * FROM tasks WHERE id = ?", [result.insertId]);

    res.status(201).json({ success: true, message: "Task created", data: rows[0] });
  } catch (error) {
    next(error);
  }
}

async function updateTask(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid task ID" });

    const errors = validateTask(req.body, true);
    if (errors.length) return res.status(400).json({ success: false, errors });

    const fields = [];
    const values = [];
    const fieldMap = {
      title: (value) => value.trim(),
      description: (value) => value,
      status: (value) => value,
      priority: (value) => value,
      due_date: (value) => value
    };

    for (const [field, normalize] of Object.entries(fieldMap)) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        fields.push(`${field} = ?`);
        values.push(normalize(req.body[field]));
      }
    }
    if (!fields.length) {
      return res.status(400).json({ success: false, message: "Provide at least one field to update" });
    }

    values.push(id);
    const [result] = await pool.execute(
      `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const [rows] = await pool.execute("SELECT * FROM tasks WHERE id = ?", [id]);
    res.json({ success: true, message: "Task updated", data: rows[0] });
  } catch (error) {
    next(error);
  }
}

async function deleteTask(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid task ID" });

    const [result] = await pool.execute("DELETE FROM tasks WHERE id = ?", [id]);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.json({ success: true, message: "Task deleted" });
  } catch (error) {
    next(error);
  }
}

module.exports = { getTasks, getTaskById, createTask, updateTask, deleteTask };
