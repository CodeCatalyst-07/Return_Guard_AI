const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const routes = require('./routes');

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// API Mounting - ensure the router is mounted on /api
app.use('/api', routes);

// Final Fallback for SPA (if user hits refresh on /dashboard)
app.use((req, res) => {
    // If it's an API request that wasn't caught by internal routers
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: "Nucleus: Endpoint not found", path: req.url });
    }
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send("<h1>ReturnGuardAI Nucleus</h1><p>API is active. Waiting for frontend build...</p>");
    }
});

// Only listen if not handled by Vercel
if (!process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`
        =========================================
        ReturnGuardAI | Backend Nucleus
        STATUS: Operational
        PORT: ${port}
        =========================================
        `);
    });
}

module.exports = app;
