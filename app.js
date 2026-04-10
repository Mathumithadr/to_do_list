const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// ======================
// CONFIG
// ======================
const SECRET_KEY = "wakeup_sunless_your_nightmare_is_over";

// ======================
// DATABASE CONNECTION
// ======================
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    port: 3306,
    password: "Mathu@123",
    database: "novellife",
});
db.query("SELECT DATABASE()", (err, result) => {
    console.log("Connected to DB:", result);
});
db.connect((err) => {
    if (err) {
        console.error("DB connection failed:", err);
    } else {
        console.log("MySQL Connected!");
    }
});

// ======================
// TOKEN MIDDLEWARE
// ======================
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.sendStatus(401);

    const token = authHeader.split(" ")[1];

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// ======================
// SIGNUP
// ======================
app.post("/signup", async(req, res) => {
    const { username, password } = req.body;

    console.log("Signup attempt:", username);

    const hashed = await bcrypt.hash(password, 10);

    db.query(
        "INSERT INTO users (username, password) VALUES (?, ?)", [username, hashed],
        (err, result) => {
            if (err) {
                console.log("Signup error:", err);
                return res.status(400).json({ message: "Error" });
            }

            console.log("Inserted ID:", result.insertId); // 👈 IMPORTANT
            res.json({ message: "User created" });
        }
    );
});
// ======================
// LOGIN
// ======================
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.query("SELECT * FROM users WHERE username = ?", [username], async(err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = results[0];

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ user_id: user.id },
            SECRET_KEY, { expiresIn: "2h" }
        );

        res.json({ token });
    });
});

// ======================
// GET BOOKS
// ======================
app.get("/books", authenticateToken, (req, res) => {
    const user_id = req.user.user_id;

    db.query("SELECT * FROM books WHERE user_id = ?", [user_id], (err, results) => {
        if (err) return res.sendStatus(500);
        res.json(results);
    });
});

// ======================
// ADD BOOK
// ======================
app.post("/books", authenticateToken, (req, res) => {
    const user_id = req.user.user_id;
    const { title, author, detail } = req.body;

    const query = "INSERT INTO books (user_id, title, author, detail) VALUES (?, ?, ?, ?)";

    db.query(query, [user_id, title, author, detail], (err) => {
        if (err) return res.sendStatus(500);
        res.json({ message: "Book added" });
    });
});

// ======================
// DELETE BOOK
// ======================
app.delete("/books/:id", authenticateToken, (req, res) => {
    const user_id = req.user.user_id;
    const bookId = req.params.id;

    const query = "DELETE FROM books WHERE id = ? AND user_id = ?";

    db.query(query, [bookId, user_id], (err) => {
        if (err) return res.sendStatus(500);
        res.json({ message: "Deleted" });
    });
});

// ======================
// RUN SERVER
// ======================
app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});