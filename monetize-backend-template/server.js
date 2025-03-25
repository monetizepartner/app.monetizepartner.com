
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const XLSX = require("xlsx");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = "monetize_secret_key";

const db = new sqlite3.Database("monetize.db");
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT,
    role TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    publisher_id TEXT,
    campaign_id TEXT,
    searches INTEGER,
    monetized_searches INTEGER,
    clicks INTEGER,
    coverage TEXT,
    ctr TEXT,
    rpc TEXT,
    rpm TEXT,
    revenue TEXT
  )`);

  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`,
    ["monetizepartner", "monetizepartner২৫@", "admin"]);
});

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send("Access Denied");
  try {
    const verified = jwt.verify(token, SECRET);
    req.user = verified;
    next();
  } catch {
    res.status(400).send("Invalid Token");
  }
}

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, user) => {
    if (err || !user) return res.status(401).send("Invalid credentials");
    const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, SECRET);
    res.json({ token, role: user.role });
  });
});

const upload = multer({ dest: "uploads/" });

app.post("/api/upload", authenticate, upload.single("file"), (req, res) => {
  if (req.user.role !== "admin") return res.status(403).send("Forbidden");
  const workbook = XLSX.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  const stmt = db.prepare(`INSERT INTO reports (date, publisher_id, campaign_id, searches, monetized_searches, clicks, coverage, ctr, rpc, rpm, revenue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  db.serialize(() => {
    data.forEach((row) => {
      stmt.run([
        row["Date"],
        row["Publisher ID"],
        row["Campaign ID"],
        row["Searches"],
        row["Monetized Searches"],
        row["Clicks"],
        row["Coverage"],
        row["CTR"],
        row["RPC"],
        row["RPM"],
        row["Revenue"],
      ]);
    });
  });

  fs.unlinkSync(req.file.path);
  res.send("File processed successfully");
});

app.get("/api/reports", authenticate, (req, res) => {
  const publisherId = req.query.publisher_id;
  const query = publisherId ? `SELECT * FROM reports WHERE publisher_id = ?` : `SELECT * FROM reports`;
  const params = publisherId ? [publisherId] : [];
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).send("DB error");
    res.json(rows);
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
