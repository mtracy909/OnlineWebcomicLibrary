require('dotenv').config(); // Loads environment variables from your .env file
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows the server to read JSON data sent from the frontend

// Create a MySQL Connection Pool (efficient way to handle multiple requests)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 1. READ Endpoint - Fetch all notes from database
app.get('/api/notes', (req, res) => {
    db.query('SELECT * FROM notes ORDER BY created_at DESC', (err, results) => {
        if (err) {
            console.error('Database error fetching notes:', err);
            return res.status(500).json({ error: 'Database error fetching notes' });
        }
        res.json(results);
    });
});

// 2. WRITE Endpoint - Save a new note to the database
app.post('/api/notes', (req, res) => {
    const { title, content } = req.body;
    
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    // Using '?' placeholders prevents SQL injection attacks
    const sql = 'INSERT INTO notes (title, content) VALUES (?, ?)';
    db.query(sql, [title, content], (err, result) => {
        if (err) {
            console.error('Database error saving note:', err);
            return res.status(500).json({ error: 'Database error saving note' });
        }
        res.status(201).json({ id: result.insertId, title, content });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server is humming smoothly on port ${PORT}`);
});