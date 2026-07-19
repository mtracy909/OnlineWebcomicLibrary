require('dotenv').config(); // Loads environment variables from your .env file
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());           // Allows the server to read JSON data sent from the frontend
app.use(express.static('public')); // Serves index.html and app.js automatically on port 3000

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

// 1. READ Endpoint - Get all webcomics in the library
app.get('/api/webcomics', (req, res) => {
    const sql = 'SELECT * FROM webcomics ORDER BY created_at DESC';
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Database error fetching webcomics:', err);
            return res.status(500).json({ error: 'Failed to fetch webcomics' });
        }
        res.json(results);
    });
});

// 2. CREATE Endpoint - Log a new webcomic
app.post('/api/webcomics', (req, res) => {
    const { title, chapters_available, chapters_read, platform, cover_image_url } = req.body;

    // Validation: Title is still our only strictly required field
    if (!title) {
        return res.status(400).json({ error: 'Webcomic title is required' });
    }

    const sql = `
        INSERT INTO webcomics (title, chapters_available, chapters_read, platform, cover_image_url) 
        VALUES (?, ?, ?, ?, ?)
    `;
    
    const values = [
        title, 
        chapters_available || 0, 
        chapters_read || 0, 
        platform || 'Independent', 
        cover_image_url || null
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Database error inserting webcomic:', err);
            return res.status(500).json({ error: 'Failed to save webcomic' });
        }
        
        res.status(201).json({ 
            id: result.insertId, 
            title, 
            chapters_available, 
            chapters_read, 
            platform, 
            cover_image_url 
        });
    });
});

// 3. UPDATE Endpoint - Update reading progress by ID
app.put('/api/webcomics/:id', (req, res) => {
    const { id } = req.params;
    const { title, chapters_read, chapters_available, platform, cover_image_url } = req.body;
    const sql = 'UPDATE webcomics SET title = ?, chapters_read = ?, chapters_available = ?, platform = ?, cover_image_url = ? WHERE id = ?';
    
    db.query(sql, [title, chapters_read, chapters_available, platform, cover_image_url, id], (err, result) => {
        if (err) {
            console.error('Database error updating webcomic:', err);
            return res.status(500).json({ error: 'Failed to update progress' });
        }
        res.json({ message: 'Comic updated successfully' });
    });
});

// 4. DELETE Endpoint - Remove a webcomic from the database by ID
app.delete('/api/webcomics/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM webcomics WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Database error deleting webcomic:', err);
            return res.status(500).json({ error: 'Failed to delete webcomic' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Webcomic not found' });
        }
        
        res.json({ message: 'Webcomic successfully deleted' });
    });
});

app.post('/api/scrape', async (req, res) => {
    const { url } = req.body;
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // Extract Title (OG tag or standard title tag)
        const title = $('meta[property="og:title"]').attr('content') || $('title').text();
        // Extract Image (OG image tag)
        const image = $('meta[property="og:image"]').attr('content');

        res.json({ title, cover_image_url: image });
    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({ error: 'Failed to scrape this URL' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server is humming smoothly on port ${PORT}`);
});