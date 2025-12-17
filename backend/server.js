import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import crypto from "crypto";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

/* ================= DATABASE ================= */

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT 1")
  .then(() => console.log("✅ PostgreSQL connected"))
  .catch(err => console.error("❌ DB error", err));

/* ================= UPLOADS ================= */

const UPLOADS_PATH = process.env.UPLOADS_PATH;
app.use("/uploads", express.static(UPLOADS_PATH));

/* ================= HELPERS ================= */

function hashPassword(password) {
  return crypto.createHash("sha256").update(password || "").digest("hex");
}

/* ================= LOGIN ================= */

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT id, username, email, role, password_hash, name
       FROM users_react
       WHERE username = $1`,
      [username]
    );

    if (!result.rows.length)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = result.rows[0];
    const valid =
      user.password_hash === hashPassword(password) ||
      user.password_hash === password;

    if (!valid)
      return res.status(401).json({ error: "Invalid credentials" });

    delete user.password_hash;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= USERS ================= */

app.post("/api/users/add", async (req, res) => {
  const { username, password, email, name, role } = req.body;

  try {
    await pool.query(
      `INSERT INTO users_react
       (username, password_hash, email, name, role)
       VALUES ($1,$2,$3,$4,$5)`,
      [username, hashPassword(password), email, name, role || "user"]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ================= DROPDOWNS ================= */

app.get("/api/nodes", async (_, res) => {
  const result = await pool.query(`
    SELECT DISTINCT "NAME_OF_NODE"
    FROM all_data
    WHERE "NAME_OF_NODE" IS NOT NULL AND "NAME_OF_NODE" <> ''
    ORDER BY "NAME_OF_NODE"
  `);

  res.json(result.rows.map(r => r.NAME_OF_NODE));
});

app.get("/api/sectors", async (req, res) => {
  const result = await pool.query(`
    SELECT DISTINCT "SECTOR_NO_"
    FROM all_data
    WHERE "NAME_OF_NODE" = $1
    ORDER BY "SECTOR_NO_"`,
    [req.query.node]
  );

  res.json(result.rows.map(r => r.SECTOR_NO_));
});

app.get("/api/blocks", async (req, res) => {
  const result = await pool.query(`
    SELECT DISTINCT "BLOCK_ROAD_NAME"
    FROM all_data
    WHERE "NAME_OF_NODE" = $1 AND "SECTOR_NO_" = $2
    ORDER BY "BLOCK_ROAD_NAME"`,
    [req.query.node, req.query.sector]
  );

  res.json(result.rows.map(r => r.BLOCK_ROAD_NAME));
});

app.get("/api/plots", async (req, res) => {
  const result = await pool.query(`
    SELECT DISTINCT "PLOT_NO_"
    FROM all_data
    WHERE "NAME_OF_NODE" = $1 AND "SECTOR_NO_" = $2
    ORDER BY "PLOT_NO_"`,
    [req.query.node, req.query.sector]
  );

  res.json(result.rows.map(r => r.PLOT_NO_));
});

/* ================= SEARCH ================= */

app.post("/api/search", async (req, res) => {
  const { node, sector, block, plot } = req.body;

  let sql = `
    SELECT "ID","NAME_OF_NODE","SECTOR_NO_","BLOCK_ROAD_NAME",
           "PLOT_NO_","PLOT_NO_AFTER_SURVEY"
    FROM all_data
    WHERE "NAME_OF_NODE" = $1
  `;

  const params = [node];
  let i = 2;

  if (sector) { sql += ` AND "SECTOR_NO_" = $${i++}`; params.push(sector); }
  if (block)  { sql += ` AND "BLOCK_ROAD_NAME" = $${i++}`; params.push(block); }
  if (plot)   { sql += ` AND "PLOT_NO_" = $${i++}`; params.push(plot); }

  const result = await pool.query(sql, params);
  res.json(result.rows);
});

/* ================= RECORD DETAILS ================= */

app.get("/api/record/:id", async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM all_data WHERE "ID" = $1`,
    [req.params.id]
  );

  if (!result.rows.length)
    return res.status(404).json({ error: "Not found" });

  const record = result.rows[0];
  const id = String(record.ID);

  const imgDir = path.join(UPLOADS_PATH, "images", id);
  const images = fs.existsSync(imgDir)
    ? fs.readdirSync(imgDir).map(f => `/uploads/images/${id}/${f}`)
    : [];

  res.json({
    ...record,
    images,
    has_pdf: fs.existsSync(path.join(UPLOADS_PATH, "pdfs", `${id}.pdf`)),
    has_map: fs.existsSync(path.join(UPLOADS_PATH, "maps", `${id}.pdf`))
  });
});

/* ================= SUMMARY ================= */

async function getSummary(req, column) {
  const { node, sector } = req.query;

  let sql = `
    SELECT
      COALESCE("${column}", 'Unknown') AS category,
      SUM(NULLIF(REGEXP_REPLACE("PLOT_AREA_FOR_INVOICE",'[^0-9.]','','g'),'')::NUMERIC) AS area,
      SUM(NULLIF(REGEXP_REPLACE("Additional_Plot_Count",'[^0-9.]','','g'),'')::NUMERIC) AS additional_count
    FROM all_data
    WHERE 1=1
  `;

  const params = [];
  let i = 1;

  if (node)   { sql += ` AND "NAME_OF_NODE" = $${i++}`; params.push(node); }
  if (sector) { sql += ` AND "SECTOR_NO_" = $${i++}`; params.push(sector); }

  sql += `
    GROUP BY category
    HAVING SUM(NULLIF(REGEXP_REPLACE("PLOT_AREA_FOR_INVOICE",'[^0-9.]','','g'),'')::NUMERIC) > 0
    ORDER BY category
  `;

  const result = await pool.query(sql, params);
  const rows = result.rows;

  const total = rows.reduce((a, r) => a + Number(r.area || 0), 0);

  return rows.map(r => ({
    category: r.category,
    area: Number(r.area || 0),
    additionalCount: Number(r.additional_count || 0),
    percent: total ? Number(((r.area / total) * 100).toFixed(2)) : 0
  }));
}

app.get("/api/summary", async (req, res) => {
  res.json(await getSummary(req, "PLOT_USE_FOR_INVOICE"));
});

app.get("/api/summary/department", async (req, res) => {
  res.json(await getSummary(req, "Department_Remark"));
});

/* ================= UPDATE RECORD ================= */

// app.put("/api/record/:id", async (req, res) => {
//   const { id } = req.params;
//   const updates = req.body;

//   try {
//     // Remove ID from update payload
//     delete updates.ID;

//     const fields = Object.keys(updates);

//     if (fields.length === 0) {
//       return res.status(400).json({ error: "No fields to update" });
//     }

//     // Build SET clause safely
//     const setClause = fields
//       .map((field, index) => `"${field}" = $${index + 1}`)
//       .join(", ");

//     const values = fields.map(f => updates[f]);

//     const sql = `
//       UPDATE all_data
//       SET ${setClause}
//       WHERE "ID" = $${fields.length + 1}
//       RETURNING *
//     `;

//     const result = await pool.query(sql, [...values, id]);

//     if (result.rowCount === 0) {
//       return res.status(404).json({ error: "Record not found" });
//     }

//     res.json({ success: true, record: result.rows[0] });

//   } catch (err) {
//     console.error("❌ Update error:", err);
//     res.status(500).json({ error: "Update failed" });
//   }
// });

app.put("/api/record/:id", async (req, res) => {
  const { id } = req.params;
  const d = req.body;

  try {
    const query = `
      UPDATE all_data SET
        "NAME_OF_NODE" = $1,
        "SECTOR_NO_" = $2,
        "BLOCK_ROAD_NAME" = $3,
        "PLOT_NO_AFTER_SURVEY" = $4,
        "PLOT_NO_" = $5,
        "SUB_PLOT_NO_" = $6,
        "UID" = $7,
        "DATE_OF_ALLOTMENT" = $8,
        "NAME_OF_ORIGINAL_ALLOTTEE" = $9,
        "PLOT_AREA_SQM_" = $10,
        "BUILTUP_AREA_SQM_" = $11,
        "USE_OF_PLOT_ACCORDING_TO_FILE" = $12,
        "TOTAL_PRICE_RS_" = $13,
        "RATE_SQM_" = $14,
        "LEASE_TERM_YEARS_" = $15,
        "FSI" = $16,
        "COMENCEMENT_CERTIFICATE" = $17,
        "OCCUPANCY_CERTIFICATE" = $18,

        "NAME_OF_2ND_OWNER" = $19,
        "_2ND_OWNER_TRANSFER_DATE" = $20,
        "NAME_OF_3RD_OWNER" = $21,
        "_3RD_OWNER_TRANSFER_DATE" = $22,
        "NAME_OF_4TH_OWNER" = $23,
        "_4TH_OWNER_TRANSFER_DATE" = $24,
        "NAME_OF_5TH_OWNER" = $25,
        "_5TH_OWNER_TRANSFER_DATE" = $26,
        "NAME_OF_6TH_OWNER" = $27,
        "_6TH_OWNER_TRANSFER_DATE" = $28,
        "NAME_OF_7TH_OWNER" = $29,
        "_7TH_OWNER_TRANSFER_DATE" = $30,
        "NAME_OF_8TH_OWNER" = $31,
        "_8TH_OWNER_TRANSFER_DATE" = $32,
        "NAME_OF_9TH_OWNER" = $33,
        "_9TH_OWNER_TRANSFER_DATE" = $34,
        "NAME_OF_10TH_OWNER" = $35,
        "_10TH_OWNER_TRANSFER_DATE" = $36,
        "NAME_OF_11TH_OWNER" = $37,
        "_11TH_OWNER_TRANSFER_DATE" = $38,

        "INVESTIGATOR_REMARKS" = $39,
        "INVESTIGATOR_NAME" = $40,
        "FILE_LOCATION" = $41,
        "FILE_NAME" = $42,

        "TOTAL_AREA_SQM" = $43,
        "USE_OF_PLOT" = $44,
        "SUB_USE_OF_PLOT" = $45,
        "PLOT_STATUS" = $46,
        "SURVEY_REMARKS" = $47,
        "PHOTO_FOLDER" = $48,
        "PLANNING_USE" = $49,

        "PLOT_AREA_FOR_INVOICE" = $50,
        "PLOT_USE_FOR_INVOICE" = $51,
        "Tentative_Plot_Count" = $52,
        "Minimum_Plot_Count" = $53,
        "Additional_Plot_Count" = $54,
        "Percentage_Match" = $55,
        "Department_Remark" = $56,
        "MAP_AREA" = $57,
        "SUBMISSION" = $58,
        "IMAGES_PRESENT" = $59,
        "PDFS_PRESENT" = $60
      WHERE "ID" = $61
      RETURNING *;
    `;

    const values = [
      d.NAME_OF_NODE,
      d.SECTOR_NO_,
      d.BLOCK_ROAD_NAME,
      d.PLOT_NO_AFTER_SURVEY,
      d.PLOT_NO_,
      d.SUB_PLOT_NO_,
      d.UID,
      d.DATE_OF_ALLOTMENT,
      d.NAME_OF_ORIGINAL_ALLOTTEE,
      d.PLOT_AREA_SQM_,
      d.BUILTUP_AREA_SQM_,
      d.USE_OF_PLOT_ACCORDING_TO_FILE,
      d.TOTAL_PRICE_RS_,
      d.RATE_SQM_,
      d.LEASE_TERM_YEARS_,
      d.FSI,
      d.COMENCEMENT_CERTIFICATE,
      d.OCCUPANCY_CERTIFICATE,

      d.NAME_OF_2ND_OWNER,
      d._2ND_OWNER_TRANSFER_DATE,
      d.NAME_OF_3RD_OWNER,
      d._3RD_OWNER_TRANSFER_DATE,
      d.NAME_OF_4TH_OWNER,
      d._4TH_OWNER_TRANSFER_DATE,
      d.NAME_OF_5TH_OWNER,
      d._5TH_OWNER_TRANSFER_DATE,
      d.NAME_OF_6TH_OWNER,
      d._6TH_OWNER_TRANSFER_DATE,
      d.NAME_OF_7TH_OWNER,
      d._7TH_OWNER_TRANSFER_DATE,
      d.NAME_OF_8TH_OWNER,
      d._8TH_OWNER_TRANSFER_DATE,
      d.NAME_OF_9TH_OWNER,
      d._9TH_OWNER_TRANSFER_DATE,
      d.NAME_OF_10TH_OWNER,
      d._10TH_OWNER_TRANSFER_DATE,
      d.NAME_OF_11TH_OWNER,
      d._11TH_OWNER_TRANSFER_DATE,

      d.INVESTIGATOR_REMARKS,
      d.INVESTIGATOR_NAME,
      d.FILE_LOCATION,
      d.FILE_NAME,

      d.TOTAL_AREA_SQM,
      d.USE_OF_PLOT,
      d.SUB_USE_OF_PLOT,
      d.PLOT_STATUS,
      d.SURVEY_REMARKS,
      d.PHOTO_FOLDER,
      d.PLANNING_USE,
      d.PLOT_AREA_FOR_INVOICE,
      d.PLOT_USE_FOR_INVOICE,
      d.Tentative_Plot_Count,
      d.Minimum_Plot_Count,
      d.Additional_Plot_Count,
      d.Percentage_Match,
      d.Department_Remark,
      d.MAP_AREA,
      d.SUBMISSION,
      d.IMAGES_PRESENT,
      d.PDFS_PRESENT,
      id
    ];

    const result = await pool.query(query, values);
    res.json(result.rows[0]);

  } catch (err) {
    console.error("❌ Update error:", err);
    res.status(500).json({ message: "Update failed" });
  }
});





/* ================= SERVER ================= */

// app.listen(8083, () =>
//   console.log("🚀 Server running on http://localhost:8083")
// );

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

