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

// Root heartbeat for deployment verification
app.get('/api/heartbeat', (req, res) => {
    res.json({ status: "alive", nucleus: "operational", timestamp: new Date() });
});

// Final Fallback for SPA (if user hits refresh on /dashboard)
app.use((req, res) => {
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: "Nucleus: Endpoint not found" });
    }
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send("<h1>ReturnGuardAI Nucleus</h1><p>API is active. Waiting for frontend build...</p>");
    }
});

// Only listen locally, Vercel handles the export
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
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
