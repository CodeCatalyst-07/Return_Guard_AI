/**
 * Antigravity | Fraud Intelligence Console
 * Pure Vanilla JavaScript (ES6)
 */

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

// --- State Management ---
const state = {
    stats: {
        totalReturns: 1284,
        highRiskReturns: 42,
        avgFraudProb: 18.5,
        flaggedUsers: 86
    },
    returns: [],
    loading: true,
    activeView: 'dashboard',
    filterLevel: 'all'
};

// --- Initialization ---
async function initDashboard() {
    setupNavigation();
    setupEventListeners();
    await fetchData();
    renderStats();
    renderCharts();
    renderTable();
    animateNumbers();
}

// --- Navigation ---
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = item.getAttribute('data-view');

            // UI Update
            navItems.forEach(ni => ni.classList.remove('active'));
            item.classList.add('active');

            // Switch Views
            if (viewId !== state.activeView) {
                state.activeView = viewId;

                // Hide all views, show active one
                document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
                const targetView = document.getElementById(`${viewId}-view`);
                if (targetView) targetView.classList.add('active');

                // Close mobile sidebar after click
                document.querySelector('.sidebar').classList.remove('open');
            }
        });
    });
}

// --- Event Listeners ---
function setupEventListeners() {
    // Modal closure
    const modal = document.getElementById('fraud-modal');
    const closeBtn = document.querySelector('.close-modal');

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // Theme toggle (demo)
    document.querySelector('.theme-toggle').addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        // Update charts colors if theme changes
        renderCharts();
    });

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Table Filters
    const filterBtns = document.querySelectorAll('#table-filters .filter-btn');
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.filterLevel = btn.getAttribute('data-filter');
                renderTable();
            });
        });
    }

    setupImportView();
}

function setupImportView() {
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('csv-upload');
    const browseBtn = document.getElementById('browse-btn');

    if (!uploadZone || !fileInput) return;

    browseBtn.addEventListener('click', () => fileInput.click());

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) handleUpload(file);
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleUpload(file);
    });

    const viewAlertsBtn = document.getElementById('view-alerts-btn');
    if (viewAlertsBtn) {
        viewAlertsBtn.addEventListener('click', () => {
            const dashboardTab = document.querySelector('.nav-item[data-view="dashboard"]');
            if (dashboardTab) dashboardTab.click();

            // clear upload state
            document.getElementById('upload-progress').style.display = 'none';
            document.getElementById('import-results').style.display = 'none';
            document.getElementById('upload-bar').style.width = '0%';
        });
        const downloadBtn = document.getElementById('download-template');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const csvContent = "user_id,order_id,item_id,purchase_date,return_date,return_reason,item_price,refund_amount,payment_method,receipt_id\n" +
                    "user_101,ORD_5521,PROD_99,2026-02-15,2026-02-17,Defective,250.00,250.00,Credit Card,REC_001\n" +
                    "user_102,ORD_5522,PROD_42,2026-02-10,,,120.00,0,PayPal,REC_002";
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.setAttribute('href', url);
                a.setAttribute('download', 'returnguard_template.csv');
                a.click();
            });
        }
    }
}

async function handleUpload(file) {
    const progress = document.getElementById('upload-progress');
    const bar = document.getElementById('upload-bar');
    const status = document.getElementById('upload-status');
    const results = document.getElementById('import-results');

    progress.style.display = 'block';
    results.style.display = 'none';
    bar.style.width = '20%';

    const formData = new FormData();
    formData.append('file', file);

    try {
        status.textContent = `Uploading ${file.name}...`;
        const response = await fetch('/api/transactions/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            const detail = errorData.detail || `Upload failed (${response.status})`;
            console.error('Upload Error Response:', response.status, detail);
            throw new Error(detail);
        }

        const data = await response.json();
        bar.style.width = '100%';
        status.textContent = 'Upload complete! Processing scores...';

        // Refresh data to show new risk scores
        await fetchData();

        // Show results
        document.getElementById('result-count').textContent = data.message.match(/\d+/)[0];
        document.getElementById('result-threats').textContent = state.returns.filter(r => r.level === 'extreme' || r.level === 'moderate').length;
        results.style.display = 'block';
        status.textContent = 'Data processed successfully';

    } catch (error) {
        console.error(error);
        status.textContent = 'Error: ' + error.message;
        bar.style.background = 'var(--danger)';
    }
}

// --- Data Fetching ---
async function fetchData() {
    try {
        state.loading = true;

        // Parallel fetching for all views
        const [statsData, alertsData, transData, patternsData] = await Promise.all([
            fetch('/api/metrics/summary').then(res => res.json()).catch(() => null),
            fetch('/api/fraud/alerts').then(res => res.json()).catch(() => null),
            fetch('/api/transactions').then(res => res.json()).catch(() => []),
            fetch('/api/risk/patterns').then(res => res.json()).catch(() => [])
        ]);

        state.transactions = transData; // Store full transaction list
        state.patterns = patternsData; // Store risk patterns

        // Map Status Data to Dashboard Stats
        if (statsData) {
            state.stats = {
                totalReturns: Math.floor(statsData.total_transactions * statsData.return_rate),
                highRiskReturns: statsData.high_risk_count,
                avgFraudProb: Math.round(statsData.average_risk_score * 10) / 10,
                flaggedUsers: statsData.high_risk_count
            };
        }

        if (alertsData && alertsData.length > 0) {
            state.returns = alertsData.map(alert => {
                let level = (alert.level || 'Moderate').toLowerCase();
                if (level === 'high' || level === 'extreme') level = 'extreme';
                else if (level === 'medium' || level === 'moderate') level = 'moderate';
                else level = 'normal';

                return {
                    id: alert.order_id || alert.id,
                    userId: alert.user_id,
                    reason: alert.explanation?.split(',')[0] || "Suspicious Pattern",
                    riskScore: Math.round(alert.score || 0),
                    level: level,
                    indicators: alert.explanation?.split(',') || ["High risk signal"]
                };
            });
        } else {
            // Empties the table if there is no pending data.
            state.returns = [];
        }

        state.loading = false;

        // Populate Views
        renderStats();
        renderTable();
        renderAlerts();
        renderReturnsView();  // New
        renderRiskView();     // New
        renderCharts();       // Re-draw dynamic pie chart
        animateNumbers();
    } catch (error) {
        console.error("API Fetch Error:", error);
        // Do not generate mock returns on error.
        state.returns = [];
        state.loading = false;
    }
}

// --- Rendering ---
function renderStats() {
    // Number animation is handled separately, but we could update targets here
    Object.keys(state.stats).forEach(key => {
        const el = document.querySelector(`#kpi-${key.replace(/([A-Z])/g, "-$1").toLowerCase()} .kpi-value`);
        if (el) {
            el.setAttribute('data-target', state.stats[key]);
        }
    });
}

function renderTable() {
    const tbody = document.getElementById('fraud-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filteredReturns = state.returns.filter(item =>
        state.filterLevel === 'all' || item.level === state.filterLevel
    );

    filteredReturns.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="order-id">${item.id}</span></td>
            <td>${item.userId}</td>
            <td>${item.reason}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-weight: 600; width: 30px;">${item.riskScore}</span>
                    <div class="risk-bar-container">
                        <div class="risk-bar" style="width: ${item.riskScore}%; background: ${getRiskColor(item.level)}"></div>
                    </div>
                </div>
            </td>
            <td><span class="risk-level ${item.level}">${item.level.toUpperCase()}</span></td>
            <td><button class="btn-view" data-id="${item.id}">Analyze</button></td>
        `;

        tr.querySelector('.btn-view').addEventListener('click', () => openDetailModal(item));
        tbody.appendChild(tr);
    });
}

function renderAlerts() {
    const alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) return;

    alertsContainer.innerHTML = '';

    // Sort high risk first
    const alerts = [...state.returns].sort((a, b) => b.riskScore - a.riskScore);

    if (alerts.length === 0) {
        alertsContainer.innerHTML = '<p style="padding: 40px; text-align: center; color: var(--text-muted);">No active security alerts.</p>';
        return;
    }

    alerts.forEach(alert => {
        const div = document.createElement('div');
        div.style.padding = '20px';
        div.style.borderBottom = '1px solid var(--glass-border)';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';

        div.innerHTML = `
            <div>
                <span class="risk-level ${alert.level}">${alert.level.toUpperCase()}</span>
                <p style="margin-top: 10px; font-weight: 500;">${alert.reason} for User ${alert.userId}</p>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Order ${alert.id} • Confidence ${alert.riskScore}%</p>
            </div>
            <button class="btn-view" onclick="openDetailModalById('${alert.id}')">Review</button>
        `;
        alertsContainer.appendChild(div);
    });

    // Update menu badge
    const badge = document.querySelector('.badge');
    if (badge) badge.textContent = alerts.filter(a => a.level === 'extreme').length;
}

function renderReturnsView() {
    const container = document.getElementById('returns-view');
    if (!container) return;

    const tableBody = container.querySelector('.glass-card');
    if (!tableBody) return;

    if (!state.transactions || state.transactions.length === 0) {
        tableBody.innerHTML = '<p style="padding: 40px; text-align: center; color: var(--text-muted);">No transactions found. Generate demo data in Settings.</p>';
        return;
    }

    tableBody.innerHTML = `
        <div class="table-responsive" style="padding: 10px;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="text-align: left; color: var(--text-muted); font-size: 0.85rem; border-bottom: 1px solid var(--glass-border);">
                        <th style="padding: 15px;">ORDER ID</th>
                        <th style="padding: 15px;">USER</th>
                        <th style="padding: 15px;">DATE</th>
                        <th style="padding: 15px;">VALUE</th>
                        <th style="padding: 15px;">STATUS</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.transactions.slice(0, 50).map(t => `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <td style="padding: 15px;"><span class="order-id">${t.order_id}</span></td>
                            <td style="padding: 15px;">${t.user_id}</td>
                            <td style="padding: 15px;">${new Date(t.purchase_date).toLocaleDateString()}</td>
                            <td style="padding: 15px;">$${(t.item_price || 0).toFixed(2)}</td>
                            <td style="padding: 15px;">
                                ${t.return_date ? '<span class="risk-level normal">RETURNED</span>' : '<span style="color: var(--text-muted)">COMPLETED</span>'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderRiskView() {
    const container = document.getElementById('risk-view');
    if (!container) return;

    const body = container.querySelector('.glass-card');
    if (!body) return;

    if (!state.patterns || state.patterns.length === 0) {
        body.innerHTML = '<p style="padding: 40px; text-align: center; color: var(--text-muted);">No risk patterns detected yet.</p>';
        return;
    }

    body.innerHTML = `
        <div style="padding: 30px;">
            <h3>Detected Behavioral Anomalies</h3>
            <p style="color: var(--text-muted); margin-bottom: 30px;">Algorithmic detection of systematic fraud vectors</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                ${state.patterns.map(p => `
                    <div class="glass-card" style="padding: 20px; border: 1px solid var(--glass-border);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                            <span class="risk-level ${p.threat_level.toLowerCase()}">${p.threat_level} THREAT</span>
                            <span style="font-size: 1.2rem; font-weight: 700;">${p.count}</span>
                        </div>
                        <h4 style="margin-bottom: 10px;">${p.pattern}</h4>
                        <div class="risk-bar-container" style="height: 4px;">
                            <div class="risk-bar" style="width: ${Math.min(p.count * 10, 100)}%; background: ${p.threat_level === 'High' ? 'var(--danger)' : 'var(--warning)'}"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Global helper for alert button
window.openDetailModalById = (id) => {
    const item = state.returns.find(r => r.id === id);
    if (item) openDetailModal(item);
};


function getRiskColor(level) {
    if (level === 'extreme') return '#ef4444';
    if (level === 'moderate' || level === 'suspicious') return '#f59e0b';
    return '#22c55e'; // normal
}

// --- Custom Canvas Charts ---
function renderCharts() {
    drawBarChart();
    drawDonutChart();
}

function drawBarChart() {
    const canvas = document.getElementById('bar-chart-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    const rect = parent.getBoundingClientRect();

    // Responsive Canvas Resizing
    canvas.width = rect.width * dpr;
    canvas.height = (rect.height - 40) * dpr; // Account for header
    ctx.scale(dpr, dpr);

    // Data from State (aggregated from transactions)
    const rawData = [45, 62, 85, 48, 72, 98, 115]; // Default mock if no data
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Attempt to get real distribution if transactions exist
    let data = rawData;
    if (state.transactions && state.transactions.length > 0) {
        const counts = new Array(7).fill(0);
        state.transactions.forEach(t => {
            const day = new Date(t.purchase_date).getDay();
            counts[(day + 6) % 7]++; // Shift so Monday is index 0
        });
        // Scale for visibility in prototype
        const max = Math.max(...counts);
        data = counts.map(c => max > 0 ? (c / max) * 100 + 10 : 20);
    }

    const availableWidth = rect.width;
    const availableHeight = rect.height - 60;
    const gap = availableWidth * 0.05;
    const barWidth = (availableWidth - 80 - (6 * gap)) / 7;
    const startX = 40;
    const chartBottom = availableHeight - 30;

    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = 20 + (i * (availableHeight - 50) / 4);
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(availableWidth - 20, y);
        ctx.stroke();
    }

    data.forEach((val, i) => {
        const x = startX + i * (barWidth + gap);
        const h = (val / 130) * (availableHeight - 50);
        const y = chartBottom - h;

        // Gradient & Styling
        const grad = ctx.createLinearGradient(x, y, x, chartBottom);
        grad.addColorStop(0, '#3b82f6');
        grad.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

        ctx.fillStyle = grad;
        drawRoundedRect(ctx, x, y, barWidth, h, 6);

        // Glow Effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(59, 130, 246, 0.2)';
        ctx.fill();
        ctx.shadowBlur = 0;

        // X-axis Labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], x + barWidth / 2, chartBottom + 25);
    });
}

function drawDonutChart() {
    const canvas = document.getElementById('donut-chart-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Dynamic Data from State
    let counts = { extreme: 30, moderate: 45, normal: 25 }; // Fallback
    if (state.returns && state.returns.length > 0) {
        counts = { extreme: 0, moderate: 0, normal: 0 };
        state.returns.forEach(r => {
            const lvl = r.level === 'suspicious' ? 'moderate' : (counts[r.level] !== undefined ? r.level : 'normal');
            counts[lvl]++;
        });
        // Relative percentages
        const total = counts.extreme + counts.moderate + counts.normal;
        if (total > 0) {
            counts.extreme = (counts.extreme / total) * 100;
            counts.moderate = (counts.moderate / total) * 100;
            counts.normal = (counts.normal / total) * 100;
        }
    }

    const data = [counts.extreme, counts.moderate, counts.normal];
    const colors = ['#ef4444', '#f59e0b', '#22c55e'];
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;
    const thickness = radius * 0.3;

    ctx.clearRect(0, 0, width, height);
    let startAngle = -Math.PI / 2;

    data.forEach((val, i) => {
        if (val === 0) return;
        const sliceAngle = (val / 100) * (Math.PI * 2);

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';

        // Slight inner shadow/depth
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.stroke();
        ctx.shadowBlur = 0;

        startAngle += sliceAngle;
    });

    // Update the center text
    const coverageEl = document.querySelector('.donut-val');
    if (coverageEl) coverageEl.textContent = state.stats.highRiskReturns > 0 ? 'LIVE' : '100%';
}

function drawRoundedRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// --- Interactions ---
function animateNumbers() {
    const numbers = document.querySelectorAll('.animate-number');
    numbers.forEach(num => {
        const target = parseFloat(num.getAttribute('data-target'));
        const suffix = num.getAttribute('data-suffix') || '';
        let current = 0;
        const duration = 1500;
        const step = target / (duration / 16);

        const update = () => {
            current += step;
            if (current >= target) {
                num.textContent = target + suffix;
            } else {
                num.textContent = Math.floor(current) + suffix;
                requestAnimationFrame(update);
            }
        };
        update();
    });
}

function openDetailModal(item) {
    const modal = document.getElementById('fraud-modal');
    const content = document.getElementById('modal-details');

    // Get user history for "All Analysis"
    const userHistory = state.transactions.filter(t => t.user_id === item.userId).reverse();

    content.innerHTML = `
        <h2 style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
            <span class="risk-level ${item.level}" style="font-size: 0.6em; padding: 4px 8px;">${item.level}</span>
            Risk Analysis: <span class="order-id">${item.id}</span>
        </h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
            <div>
                <p style="color: var(--text-muted); margin-bottom: 5px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">User Intelligence</p>
                <div class="glass-card" style="padding: 20px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.02);">
                    <p style="margin-bottom: 8px;"><strong>User ID:</strong> <span style="color: var(--primary);">${item.userId}</span></p>
                    <p style="margin-bottom: 8px;"><strong>Trust Score:</strong> ${Math.max(0, 100 - item.riskScore)}%</p>
                    <p style="margin-bottom: 8px;"><strong>Historical Return Rate:</strong> ${(userHistory.filter(t => t.return_date).length / Math.max(userHistory.length, 1) * 100).toFixed(1)}%</p>
                    <p><strong>Total Lifetime Value:</strong> $${userHistory.reduce((sum, t) => sum + (t.item_price || 0), 0).toFixed(2)}</p>
                </div>
                
                <p style="color: var(--text-muted); margin-top: 20px; margin-bottom: 5px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Decision Context</p>
                <div class="glass-card" style="padding: 20px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.02);">
                    <p style="margin-bottom: 8px;"><strong>Primary Signal:</strong> ${item.reason}</p>
                    <p><strong>Heuristic match:</strong> Systematic Pattern #412</p>
                </div>
            </div>
            
            <div>
                <p style="color: var(--text-muted); margin-bottom: 5px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Behavioral Indicators</p>
                <ul style="list-style: none; padding: 0;">
                    ${item.indicators.map(ind => `
                        <li style="margin-bottom: 12px; display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px;">
                            <span style="width: 10px; height: 10px; border-radius: 50%; background: ${getRiskColor(item.level)}; box-shadow: 0 0 10px ${getRiskColor(item.level)}"></span>
                            <span style="font-size: 0.9rem;">${ind}</span>
                        </li>
                    `).join('')}
                </ul>
                <div style="margin-top: 30px; background: rgba(0,0,0,0.2); padding: 20px; border-radius: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="font-weight: 600;">Confidence Assessment</span>
                        <span style="color: ${getRiskColor(item.level)}; font-weight: 800;">${item.riskScore}%</span>
                    </div>
                    <div class="risk-bar-container" style="width: 100%; height: 10px; background: rgba(255,255,255,0.1);">
                        <div class="risk-bar" style="width: ${item.riskScore}%; background: ${getRiskColor(item.level)}; box-shadow: 0 0 15px ${getRiskColor(item.level)}"></div>
                    </div>
                </div>
            </div>
        </div>

        <div style="margin-bottom: 30px;">
            <p style="color: var(--text-muted); margin-bottom: 10px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Transaction Timeline (All Analysis)</p>
            <div class="glass-card" style="max-height: 200px; overflow-y: auto; padding: 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead style="position: sticky; top: 0; background: var(--bg-dark); z-index: 1;">
                        <tr style="text-align: left; color: var(--text-muted); border-bottom: 1px solid var(--glass-border);">
                            <th style="padding: 12px;">Date</th>
                            <th style="padding: 12px;">Order</th>
                            <th style="padding: 12px;">Value</th>
                            <th style="padding: 12px;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${userHistory.slice(0, 10).map(t => `
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                                <td style="padding: 10px;">${new Date(t.purchase_date).toLocaleDateString()}</td>
                                <td style="padding: 10px;">${t.order_id}</td>
                                <td style="padding: 10px;">$${(t.item_price || 0).toFixed(2)}</td>
                                <td style="padding: 10px;">
                                    ${t.return_date ? '<span style="color: var(--danger)">Returned</span>' : '<span style="color: var(--success)">Kept</span>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div style="display: flex; gap: 15px; justify-content: flex-end; padding-top: 20px; border-top: 1px solid var(--glass-border);">
            <button class="filter-btn" id="modal-blacklist-btn" style="border-color: var(--danger); color: var(--danger); padding: 10px 20px;">Blacklist User</button>
            <button class="filter-btn active" id="modal-approve-btn" style="background: var(--success); border-color: var(--success); padding: 10px 20px;">Approve Return</button>
        </div>
    `;

    const handleAction = async (actionFn) => {
        try {
            const success = await actionFn();
            if (success) {
                // Immediate UI feedback: Remove from state
                state.returns = state.returns.filter(r => r.id !== item.id);
                renderTable();
                renderAlerts();
                modal.classList.remove('active');
                // Refresh full data in background
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    document.getElementById('modal-blacklist-btn').onclick = () => handleAction(async () => {
        const res = await fetch(`/api/users/${item.userId}/blacklist`, { method: 'POST' });
        if (res.ok) {
            showToast(`User ${item.userId} blacklisted. Decision logged.`, 'success');
            return true;
        }
        showToast('Failed to blacklist user', 'error');
        return false;
    });

    document.getElementById('modal-approve-btn').onclick = () => handleAction(async () => {
        const res = await fetch(`/api/transactions/${item.id}/approve`, { method: 'POST' });
        if (res.ok) {
            showToast('Return approved. Score cleared.', 'success');
            return true;
        }
        showToast('Failed to approve return', 'error');
        return false;
    });

    modal.classList.add('active');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.cssText = `
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(10px);
        border: 1px solid ${type === 'success' ? 'var(--success)' : 'var(--danger)'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        animation: slideInRight 0.3s ease forwards;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;

    toast.innerHTML = `
        <span style="color: ${type === 'success' ? 'var(--success)' : 'var(--danger)'}">
            ${type === 'success' ? '✓' : '✕'}
        </span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Window resize handling for charts
window.addEventListener('resize', () => {
    debounce(() => {
        renderCharts();
    }, 250);
});

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
