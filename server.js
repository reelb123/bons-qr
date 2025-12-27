const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const db = new sqlite3.Database("db.sqlite");
db.run(`CREATE TABLE IF NOT EXISTS vouchers (
  id TEXT PRIMARY KEY,
  used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

app.post("/admin/generate", async (req, res) => {
  const id = uuidv4();
  db.run("INSERT INTO vouchers (id) VALUES (?)", [id]);
  const qr = await QRCode.toDataURL(`https://https://bons-qr.vercel.app/verify.html?id=${id}`);
  res.json({ id, qr });
});

app.get("/verify/:id", (req, res) => {
  db.get("SELECT * FROM vouchers WHERE id = ?", [req.params.id], (e, row) => {
    if (!row) return res.json({ status: "INVALIDE" });
    if (row.used) return res.json({ status: "UTILISÉ" });
    db.run("UPDATE vouchers SET used = 1 WHERE id = ?", [req.params.id]);
    res.json({ status: "VALIDE" });
  });
});

app.listen(process.env.PORT || 3000);
