const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const routes = require('./routes');

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors({
    origin: [
        'https://return-guard-ai-j3n4.vercel.app',
        'http://localhost:5173',
        'http://localhost:5175'
    ],
    credentials: true
}));
app.use(express.json());

// API Mounting - ensure the router is mounted on /api
app.use('/api', routes);

const distPath = path.join(__dirname, '../../frontend/dist');

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

app.listen(port, () => {
    console.log(`
    =========================================
    ReturnGuardAI | Backend Nucleus
    STATUS: Operational
    PORT: ${port}
    =========================================
    `);
});

// Patch for Node v25 early exit issue
setInterval(() => { }, 1000 * 60 * 60);

module.exports = app;
