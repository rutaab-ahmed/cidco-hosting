import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables from .env file immediately
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// --- Database Configuration ---
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'root',
    database: process.env.DB_NAME || 'project_cidco'
};

// --- Email Configuration ---
console.log("--- SMTP Configuration Check ---");
console.log("Host:", process.env.SMTP_HOST || 'smtp.gmail.com');
console.log("User:", process.env.SMTP_USER || 'NOT SET');
console.log("Pass:", process.env.SMTP_PASS ? "******" : 'NOT SET');
console.log("--------------------------------");

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    },
    logger: true,
    debug: true
});

if (process.env.SMTP_USER) {
    transporter.verify(function (error, success) {
        if (error) {
            console.error("❌ SMTP Connection Error:", error);
        } else {
            console.log("✅ SMTP Server is ready to take messages");
        }
    });
} else {
    console.warn("⚠️ SMTP_USER is not set in .env. Emails will be logged to console only.");
}

// --- Helper: Simple SHA256 Hash ---
function hashPassword(password) {
    if (!password) return '';
    return crypto.createHash('sha256').update(password).digest('hex');
}

// --- Configuration for Uploads Directory ---
// Allow override via environment variable for network paths (e.g., Z:/images or \\Server\Share)
const UPLOADS_PATH = process.env.UPLOADS_PATH || path.join(__dirname, 'uploads');
console.log(`📂 Serving uploads from: ${UPLOADS_PATH}`);

// --- Serve Static Files ---
app.use('/uploads', express.static(UPLOADS_PATH));

// --- Database Connection Helper ---
async function query(sql, params) {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [results, ] = await connection.execute(sql, params);
        return results;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

// --- Routes ---

// 1. Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const users = await query(
            "SELECT id, username, email, role, password_hash, name FROM users_react WHERE username = ?", 
            [username]
        );
        
        if (users.length > 0) {
            const user = users[0];
            const inputHash = hashPassword(password);
            // Allow login if hash matches OR if plain text matches (legacy support)
            const isMatch = (user.password_hash === inputHash) || (user.password_hash === password);

            if (isMatch) {
                const { password_hash, ...cleanUser } = user;
                res.json(cleanUser);
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Database error: ' + e.message });
    }
});

// 2. Add User
app.post('/api/users/add', async (req, res) => {
    const { username, password, email, name, role } = req.body;
    try {
        const password_hash = hashPassword(password);
        await query(
            "INSERT INTO users_react (username, password_hash, email, name, role) VALUES (?, ?, ?, ?, ?)",
            [username, password_hash, email, name, role || 'user']
        );
        res.json({ success: true, message: "User created successfully" });
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
             return res.status(400).json({ error: "Username or Email already exists" });
        }
        res.status(500).json({ error: e.message });
    }
});

// 2.1 Update Password (For User Info Tab)
app.post('/api/users/update-password', async (req, res) => {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) return res.status(400).json({ error: 'Missing data' });
    
    try {
        const newHash = hashPassword(newPassword);
        await query("UPDATE users_react SET password_hash = ? WHERE id = ?", [newHash, userId]);
        res.json({ success: true, message: 'Password updated' });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. Forgot Password
app.post('/api/forgot-password', async (req, res) => {
    const { identifier } = req.body;
    try {
        const users = await query(
            "SELECT id, username, email FROM users_react WHERE username = ? OR email = ?", 
            [identifier, identifier]
        );

        if (users.length === 0) {
            return res.json({ message: "If account exists, email sent." });
        }

        const user = users[0];
        const token = crypto.randomBytes(20).toString('hex');
        const expires = new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' ');

        await query(
            "UPDATE users_react SET reset_token = ?, reset_expires = ? WHERE id = ?",
            [token, expires, user.id]
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/#/reset-password/${token}`;
        
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: user.email,
            subject: 'Password Reset Request',
            text: `Hello ${user.username},\n\nClick here to reset your password: ${resetLink}\n\nThis link expires in 1 hour.`,
            html: `<p>Hello ${user.username},</p><p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
        };

        if (process.env.SMTP_USER) {
            await transporter.sendMail(mailOptions);
        } else {
            console.log("📧 [MOCK EMAIL] Password Reset Link:", resetLink);
        }
        res.json({ message: "Email sent" });
    } catch (e) {
        res.status(500).json({ error: "Server error during email sending: " + e.message });
    }
});

// 4. Reset Password
app.post('/api/reset-password', async (req, res) => {
    const { token, password } = req.body;
    try {
        const users = await query(
            "SELECT id FROM users_react WHERE reset_token = ? AND reset_expires > NOW()",
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }

        const newHash = hashPassword(password);
        await query(
            "UPDATE users_react SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?",
            [newHash, users[0].id]
        );

        res.json({ message: "Password updated successfully" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 5. Update Record (Admin)
app.post('/api/record/update', async (req, res) => {
    const { ID, ...updates } = req.body;
    if (!ID) return res.status(400).json({ error: "ID required" });

    try {
        const keys = Object.keys(updates);
        if (keys.length === 0) return res.json({ message: "No changes" });

        const computedKeys = ['images', 'has_pdf', 'has_map'];
        const validKeys = keys.filter(k => !computedKeys.includes(k));

        if (validKeys.length === 0) {
             return res.json({ message: "No valid columns to update" });
        }

        const setClause = validKeys.map(key => `\`${key}\` = ?`).join(', ');
        const values = validKeys.map(key => {
            const val = updates[key];
            return (val === '' || val === undefined) ? null : val;
        });
        
        values.push(ID);

        const sql = `UPDATE all_data SET ${setClause} WHERE ID = ?`;
        
        await query(sql, values);

        res.json({ message: "Record updated successfully" });
    } catch (e) {
        console.error("[Update] Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// 6. Dropdowns
app.get('/api/nodes', async (req, res) => {
    try {
        const rows = await query("SELECT DISTINCT NAME_OF_NODE FROM all_data WHERE NAME_OF_NODE IS NOT NULL AND NAME_OF_NODE != '' ORDER BY NAME_OF_NODE");
        res.json(rows.map(r => r.NAME_OF_NODE));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/sectors', async (req, res) => {
    const { node } = req.query;
    try {
        // Changed SECTOR_NO to SECTOR_NO_
        const rows = await query("SELECT DISTINCT SECTOR_NO_ FROM all_data WHERE NAME_OF_NODE = ? ORDER BY CAST(SECTOR_NO_ AS UNSIGNED)", [node]);
        res.json(rows.map(r => r.SECTOR_NO_));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/blocks', async (req, res) => {
    const { node, sector } = req.query;
    try {
        // Changed SECTOR_NO to SECTOR_NO_
        const rows = await query("SELECT DISTINCT BLOCK_ROAD_NAME FROM all_data WHERE NAME_OF_NODE = ? AND SECTOR_NO_ = ? ORDER BY BLOCK_ROAD_NAME", [node, sector]);
        res.json(rows.map(r => r.BLOCK_ROAD_NAME));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/plots', async (req, res) => {
    const { node, sector } = req.query;
    try {
        // Changed SECTOR_NO to SECTOR_NO_ and PLOT_NO to PLOT_NO_
        const rows = await query("SELECT DISTINCT PLOT_NO_ FROM all_data WHERE NAME_OF_NODE = ? AND SECTOR_NO_ = ? ORDER BY PLOT_NO_", [node, sector]);
        res.json(rows.map(r => r.PLOT_NO_));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 7. Search
app.post('/api/search', async (req, res) => {
    const { node, sector, block, plot } = req.body;
    // Updated columns: SECTOR_NO_, PLOT_NO_
    let sql = `SELECT ID, NAME_OF_NODE, SECTOR_NO_, BLOCK_ROAD_NAME, PLOT_NO_, PLOT_NO_AFTER_SURVEY FROM all_data WHERE NAME_OF_NODE = ?`;
    const params = [node];

    if (sector) { sql += " AND SECTOR_NO_ = ?"; params.push(sector); }
    if (block) { sql += " AND BLOCK_ROAD_NAME = ?"; params.push(block); }
    if (plot) { sql += " AND PLOT_NO_ = ?"; params.push(plot); }

    try {
        const rows = await query(sql, params);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 8. Details
app.get('/api/record/:id', async (req, res) => {
    try {
        const rows = await query("SELECT * FROM all_data WHERE ID = ?", [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: "Not found" });
        
        const record = rows[0];
        const id = String(record.ID);

        // Check Files using the configured UPLOADS_PATH
        const imgDir = path.join(UPLOADS_PATH, 'images', id);
        let images = [];
        if (fs.existsSync(imgDir)) {
            images = fs.readdirSync(imgDir)
                .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
                .map(file => `http://localhost:8083/uploads/images/${id}/${file}`);
        }
        const has_pdf = fs.existsSync(path.join(UPLOADS_PATH, 'pdfs', `${id}.pdf`));
        const has_map = fs.existsSync(path.join(UPLOADS_PATH, 'maps', `${id}.pdf`));

        const responseData = {
            ...record, 
            images,
            has_pdf,
            has_map
        };

        res.json(responseData);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 9. Summary (Generic Helper)
async function getSummary(req, groupByColumn) {
    const { node, sector } = req.query;
    // We clean PLOT_AREA_FOR_INVOICE to ensure valid numbers, similarly for Additional_Plot_Count if it's string based
    let sql = `
        SELECT 
            IFNULL(${groupByColumn}, 'Unknown') AS category,
            SUM(CAST(NULLIF(REGEXP_REPLACE(PLOT_AREA_FOR_INVOICE, '[^0-9.]', ''), '') AS DECIMAL(15,2))) AS area,
            SUM(CAST(NULLIF(REGEXP_REPLACE(Additional_Plot_Count, '[^0-9.]', ''), '') AS DECIMAL(15,2))) AS additional_count
        FROM all_data WHERE 1=1
    `;
    const params = [];
    if (node) { sql += " AND NAME_OF_NODE = ?"; params.push(node); }
    if (sector) { sql += " AND SECTOR_NO_ = ?"; params.push(sector); }
    
    // Group and basic order (specific sorting happens in frontend)
    sql += " GROUP BY category HAVING area > 0 ORDER BY category ASC";

    const rows = await query(sql, params);
    
    // Calculate totals for percentage
    const totalArea = rows.reduce((acc, curr) => acc + (parseFloat(curr.area) || 0), 0);
    
    return rows.map(r => ({
        category: r.category,
        area: parseFloat(r.area) || 0,
        additionalCount: parseFloat(r.additional_count) || 0,
        percent: totalArea > 0 ? parseFloat(((r.area / totalArea) * 100).toFixed(2)) : 0
    }));
}

// 9a. Use of Plot Summary
app.get('/api/summary', async (req, res) => {
    try {
        const data = await getSummary(req, 'PLOT_USE_FOR_INVOICE');
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 9b. Department Summary
app.get('/api/summary/department', async (req, res) => {
    try {
        // Changed DEPARTMENT_REMARK to Department_Remark
        const data = await getSummary(req, 'Department_Remark');
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = 8083;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});