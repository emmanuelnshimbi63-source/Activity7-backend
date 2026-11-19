const router = require("express").Router();
const pool = require("../db");

const STATUSES = ["Pending", "In progress", "Completed"];
const COLUMNS = "id, title, category, description, status";

function parseId(value) {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) return null;
  return id;
}

function validate(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { message: "Request body must be a JSON object." };
  }
  const { title, category, description, status } = body;
  for (const [name, value] of Object.entries({ title, category, description, status })) {
    if (typeof value !== "string") {
      return { message: `${name} is required and must be text.` };
    }
  }
  const data = {
    title: title.trim(),
    category: category.trim(),
    description: description.trim(),
    status: status.trim()
  };
  if (data.title.length < 3 || data.title.length > 80) {
    return { message: "Title must have 3 to 80 characters." };
  }
  if (data.category.length < 2 || data.category.length > 40) {
    return { message: "Category must have 2 to 40 characters." };
  }
  if (data.description.length < 5 || data.description.length > 300) {
    return { message: "Description must have 5 to 300 characters." };
  }
  if (!STATUSES.includes(data.status)) {
    return { message: "Status must be Pending, In progress or Completed." };
  }
  return { data };
}

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT ${COLUMNS} FROM records ORDER BY id`);
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: "Id must be a positive whole number." });
    }
    const result = await pool.query(`SELECT ${COLUMNS} FROM records WHERE id = $1`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Record not found." });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { data, message } = validate(req.body);
    if (!data) return res.status(400).json({ message });

    const result = await pool.query(
      `INSERT INTO records (title, category, description, status)
       VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
      [data.title, data.category, data.description, data.status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: "Id must be a positive whole number." });
    }
    const { data, message } = validate(req.body);
    if (!data) return res.status(400).json({ message });

    const result = await pool.query(
      `UPDATE records
       SET title = $1, category = $2, description = $3, status = $4
       WHERE id = $5 RETURNING ${COLUMNS}`,
      [data.title, data.category, data.description, data.status, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Record not found." });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: "Id must be a positive whole number." });
    }
    const result = await pool.query("DELETE FROM records WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Record not found." });
    }
    res.status(200).json({ message: "Record deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
