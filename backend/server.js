import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import crypto from 'crypto';
import pkg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Pool } = pkg;
dotenv.config();



const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // IMPORTANT: service role key (server only)
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

/* ------------------------------------------------------------------
   DATABASE (SUPABASE / POSTGRES)
------------------------------------------------------------------ */

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false
});

async function query(sql, params = []) {
    const client = await pool.connect();
    try {
        const result = await client.query(sql, params);
        return result.rows;
    } finally {
        client.release();
    }
}

/* ------------------------------------------------------------------
   EMAIL
------------------------------------------------------------------ */

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: { rejectUnauthorized: false }
});

/* ------------------------------------------------------------------
   HELPERS
------------------------------------------------------------------ */

function hashPassword(password) {
    return crypto.createHash('sha256').update(password || '').digest('hex');
}

// const UPLOADS_PATH = process.env.UPLOADS_PATH || path.join(__dirname, 'uploads');
// app.use('/uploads', express.static(UPLOADS_PATH));

/* ------------------------------------------------------------------
   AUTH & USERS
------------------------------------------------------------------ */

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    const users = await query(
        `SELECT id, username, email, role, password_hash, name
         FROM users_react
         WHERE username = $1`,
        [username]
    );

    if (!users.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = users[0];
    const hash = hashPassword(password);

    if (user.password_hash !== hash && user.password_hash !== password)
        return res.status(401).json({ error: 'Invalid credentials' });

    delete user.password_hash;
    res.json(user);
});

app.post('/api/users/add', async (req, res) => {
    const { username, password, email, name, role } = req.body;

    await query(
        `INSERT INTO users_react
         (username, password_hash, email, name, role)
         VALUES ($1,$2,$3,$4,$5)`,
        [username, hashPassword(password), email, name, role || 'user']
    );

    res.json({ success: true });
});

app.post('/api/users/update-password', async (req, res) => {
    const { userId, newPassword } = req.body;

    await query(
        `UPDATE users_react
         SET password_hash = $1
         WHERE id = $2`,
        [hashPassword(newPassword), userId]
    );

    res.json({ success: true });
});

/* ------------------------------------------------------------------
   PASSWORD RESET
------------------------------------------------------------------ */

app.post('/api/forgot-password', async (req, res) => {
    const { identifier } = req.body;

    const users = await query(
        `SELECT id, username, email
         FROM users_react
         WHERE username = $1 OR email = $1`,
        [identifier]
    );

    if (!users.length)
        return res.json({ message: "If account exists, email sent." });

    const token = crypto.randomBytes(20).toString('hex');

    await query(
        `UPDATE users_react
         SET reset_token = $1,
             reset_expires = NOW() + INTERVAL '1 hour'
         WHERE id = $2`,
        [token, users[0].id]
    );

    const link = `${process.env.FRONTEND_URL}/#/reset-password/${token}`;

    if (process.env.SMTP_USER) {
        await transporter.sendMail({
            to: users[0].email,
            subject: 'Password Reset',
            text: `Reset link: ${link}`
        });
    }

    res.json({ message: "Email sent" });
});

app.post('/api/reset-password', async (req, res) => {
    const { token, password } = req.body;

    const users = await query(
        `SELECT id
         FROM users_react
         WHERE reset_token = $1
           AND reset_expires > NOW()`,
        [token]
    );

    if (!users.length)
        return res.status(400).json({ error: "Invalid or expired token" });

    await query(
        `UPDATE users_react
         SET password_hash = $1,
             reset_token = NULL,
             reset_expires = NULL
         WHERE id = $2`,
        [hashPassword(password), users[0].id]
    );

    res.json({ message: "Password updated" });
});

/* ------------------------------------------------------------------
   RECORD UPDATE
------------------------------------------------------------------ */

app.post('/api/record/update', async (req, res) => {
    const { ID, ...updates } = req.body;

    const keys = Object.keys(updates)
        .filter(k => !['images', 'has_pdf', 'has_map'].includes(k));

    if (!ID || !keys.length)
        return res.json({ message: "No changes" });

    const setClause = keys
        .map((k, i) => `"${k}" = $${i + 1}`)
        .join(', ');

    const values = keys.map(k =>
        updates[k] === '' || updates[k] === undefined ? null : updates[k]
    );

    values.push(ID);

    await query(
        `UPDATE all_data SET ${setClause} WHERE "ID" = $${values.length}`,
        values
    );

    res.json({ message: "Record updated successfully" });
});

/* ------------------------------------------------------------------
   SEARCH
------------------------------------------------------------------ */

app.post('/api/search', async (req, res) => {
    const { node, sector, block, plot } = req.body;

    let sql = `
        SELECT "ID", "NAME_OF_NODE", "SECTOR_NO_", "BLOCK_ROAD_NAME",
               "PLOT_NO_", "PLOT_NO_AFTER_SURVEY"
        FROM all_data
        WHERE "NAME_OF_NODE" = $1
    `;
    const params = [node];

    if (sector) sql += ` AND "SECTOR_NO_" = $${params.push(sector)}`;
    if (block)  sql += ` AND "BLOCK_ROAD_NAME" = $${params.push(block)}`;
    if (plot)   sql += ` AND "PLOT_NO_" = $${params.push(plot)}`;

    res.json(await query(sql, params));
});

/* ------------------------------------------------------------------
   RECORD DETAILS
------------------------------------------------------------------ */
// const BASE_URL = process.env.BASE_URL || `http://localhost:9000`;

app.get('/api/record/:id', async (req, res) => {
    const rows = await query(
        `SELECT * FROM all_data WHERE "ID" = $1`,
        [req.params.id]
    );

    if (!rows.length)
        return res.status(404).json({ error: "Not found" });

    const record = rows[0];
    const id = String(record.ID);
    const submission = record.SUBMISSION_STAGE || 'SUBMISSION-III';
   


    // const imgDir = path.join(UPLOADS_PATH, 'images', id);
    // const images = fs.existsSync(imgDir)
    //     ? fs.readdirSync(imgDir)
    //         .filter(f => /\.(jpg|png|jpeg|webp)$/i.test(f))
    //         .map(f => `${BASE_URL}/uploads/images/${id}/${f}`)
    //         // .map(f => `http://localhost:8083/uploads/images/${id}/${f}`)
    //     : [];

   /* -------------------------
     LIST IMAGES
  ------------------------- */
  const { data: imageFiles, error: imgErr } = await supabase
    .storage
    .from('uploads')
    .list(`images/${submission}/${id}`, { limit: 100 });

  if (imgErr) console.error(imgErr);

  const images = await Promise.all(
    (imageFiles || [])
      .filter(f => /\.(jpg|png|jpeg|webp)$/i.test(f.name))
      .map(async (file) => {
        const { data } = await supabase
          .storage
          .from('uploads')
          .createSignedUrl(
            `images/${submission}/${id}/${file.name}`,
            60 * 60 // 1 hour
          );

        return data?.signedUrl;
      })
  );

  /* -------------------------
     PDF
  ------------------------- */
   let pdfUrl = null;
   const { data: pdfSigned } = await supabase
     .storage
     .from('uploads')
     .createSignedUrl(
       `pdfs/${submission}/${id}.pdf`,
       60 * 60
     );

   pdfUrl = pdfSigned?.signedUrl || null;

//   const { data: pdfFiles, error: pdfListErr } = await supabase
//   .storage
//   .from('uploads')
//   .list(`pdfs/${submission}`);

// console.log('PDF FILES:', pdfFiles);


  /* -------------------------
     RESPONSE
  ------------------------- */
  res.json({
    ...record,
    images: images.filter(Boolean),
    pdf: pdfUrl
  });
});

//     res.json({
//         ...record,
//         images,
//         has_pdf: fs.existsSync(path.join(UPLOADS_PATH, 'pdfs', `${id}.pdf`)),
//         has_map: fs.existsSync(path.join(UPLOADS_PATH, 'maps', `${id}.pdf`))
//     });
// });

/* ------------------------------------------------------------------
   SUMMARY (RESTORED & POSTGRES-SAFE)
------------------------------------------------------------------ */

async function getSummary(req, groupByColumn) {
    const { node, sector } = req.query;

    let sql = `
        SELECT
            COALESCE(${groupByColumn}, 'Unknown') AS category,

            SUM(
                CAST(
                    NULLIF(
                        REGEXP_REPLACE("PLOT_AREA_FOR_INVOICE", '[^0-9.]', '', 'g'),
                        ''
                    ) AS DECIMAL(15,2)
                )
            ) AS area,

            SUM(
                CAST(
                    NULLIF(
                        REGEXP_REPLACE("Additional_Plot_Count", '[^0-9.]', '', 'g'),
                        ''
                    ) AS DECIMAL(15,2)
                )
            ) AS additional_count

        FROM all_data
        WHERE 1=1
    `;

    const params = [];
    if (node)   sql += ` AND "NAME_OF_NODE" = $${params.push(node)}`;
    if (sector) sql += ` AND "SECTOR_NO_" = $${params.push(sector)}`;

    sql += `
        GROUP BY category
        HAVING SUM(
            CAST(
                NULLIF(
                    REGEXP_REPLACE("PLOT_AREA_FOR_INVOICE", '[^0-9.]', '', 'g'),
                    ''
                ) AS DECIMAL(15,2)
            )
        ) > 0
        ORDER BY category
    `;

    const rows = await query(sql, params);

    const totalArea = rows.reduce(
        (acc, curr) => acc + Number(curr.area || 0),
        0
    );

    return rows.map(r => ({
        category: r.category,
        area: Number(r.area || 0),
        additionalCount: Number(r.additional_count || 0),
        percent: totalArea
            ? +((r.area / totalArea) * 100).toFixed(2)
            : 0
    }));
}


// app.get('/api/summary', async (req, res) => {
//     res.json(await getSummary(req, '"PLOT_USE_FOR_INVOICE"'));
// });

// app.get('/api/summary/department', async (req, res) => {
//     res.json(await getSummary(req, '"Department_Remark"'));
// });

app.get('/api/summary', async (req, res) => {
    try {
        const data = await getSummary(req, '"PLOT_USE_FOR_INVOICE"');
        res.json(data);
    } catch (err) {
        console.error('Summary error:', err);
        res.status(500).json({ error: 'Failed to load summary' });
    }
});

app.get('/api/summary/department', async (req, res) => {
    try {
        const data = await getSummary(req, '"Department_Remark"');
        res.json(data);
    } catch (err) {
        console.error('Department summary error:', err);
        res.status(500).json({ error: 'Failed to load department summary' });
    }
});



app.get('/api/nodes', async (req, res) => {
    const rows = await query(`
        SELECT DISTINCT "NAME_OF_NODE"
        FROM all_data
        WHERE "NAME_OF_NODE" IS NOT NULL
        ORDER BY "NAME_OF_NODE"
    `);

    res.json(rows.map(r => r.NAME_OF_NODE));
});


app.get('/api/sectors', async (req, res) => {
    const { node } = req.query;

    let sql = `
        SELECT DISTINCT "SECTOR_NO_"
        FROM all_data
        WHERE "SECTOR_NO_" IS NOT NULL
    `;
    const params = [];

    if (node) {
        sql += ` AND "NAME_OF_NODE" = $1`;
        params.push(node);
    }

    sql += ` ORDER BY "SECTOR_NO_"`;

    const rows = await query(sql, params);
    res.json(rows.map(r => r.SECTOR_NO_));
});

app.get('/api/blocks', async (req, res) => {
    const { node, sector } = req.query;

    let sql = `
        SELECT DISTINCT "BLOCK_ROAD_NAME"
        FROM all_data
        WHERE "BLOCK_ROAD_NAME" IS NOT NULL
    `;
    const params = [];

    if (node)   sql += ` AND "NAME_OF_NODE" = $${params.push(node)}`;
    if (sector) sql += ` AND "SECTOR_NO_" = $${params.push(sector)}`;

    sql += ` ORDER BY "BLOCK_ROAD_NAME"`;

    const rows = await query(sql, params);
    res.json(rows.map(r => r.BLOCK_ROAD_NAME));
});

app.get('/api/plots', async (req, res) => {
    const { node, sector, block } = req.query;

    let sql = `
        SELECT DISTINCT "PLOT_NO_"
        FROM all_data
        WHERE "PLOT_NO_" IS NOT NULL
    `;
    const params = [];

    if (node) {
        sql += ` AND "NAME_OF_NODE" = $${params.push(node)}`;
    }

    if (sector) {
        sql += ` AND "SECTOR_NO_" = $${params.push(sector)}`;
    }

    if (block) {
        sql += ` AND "BLOCK_ROAD_NAME" = $${params.push(block)}`;
    }

    sql += ` ORDER BY "PLOT_NO_"`;

    const rows = await query(sql, params);

    res.json(rows.map(r => r.PLOT_NO_));
});


/* ------------------------------------------------------------------
   SERVER
------------------------------------------------------------------ */

// const PORT = 8083;
// app.listen(PORT, () => {
//     console.log(`🚀 Server running on http://localhost:${PORT}`);
// });


const PORT = process.env.PORT;

app.get('/', (req, res) => {
    res.send('CIDCO Backend is running 🚀');
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
