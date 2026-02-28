const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const routes = require('./routes');

const app = express();
const port = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// API Mounting
app.use('/api', routes);

// Static Client Serving
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// Fallback for SPA
app.use((req, res, next) => {
    // If request starts with /api, it's a 404 for API
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: "Route not found" });
    }

    // Otherwise serve index.html
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // Fallback landing page if no dist
        res.send("<h1>ReturnGuardAI Nucleus</h1><p>API is active. Waiting for frontend build...</p>");
    }
});

app.listen(port, () => {
    console.log(`
    =========================================
    ReturnGuardAI | Backend Nucleus
    STATUS: Operational
    PORT: ${port}
    =========================================
    `);
});
