/**
 * Antigravity | Fraud Intelligence Console
 * Pure Vanilla JavaScript (ES6)
 */

let initialized = false;
document.addEventListener('DOMContentLoaded', () => {
    if (initialized) return;
    initialized = true;
    console.log("DOM CONTENT LOADED - Initializing Dashboard...");
    initDashboard();
});

// --- State Management ---
const state = {
    currentAnalysisResult: null,
    returns: [],
    transactions: [],
    patterns: [],
    loading: true,
    activeView: 'dashboard',
    filterLevel: 'all'
};

// --- Initialization ---
async function initDashboard() {
    setupNavigation();
    setupEventListeners();
    await fetchData();
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

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    }

    // Theme toggle (demo)
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            renderCharts();
        });
    }

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle && sidebar) {
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
    console.log("Setting up Import View...");
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('csv-upload');
    const browseBtn = document.getElementById('browse-btn');

    if (!uploadZone) console.warn("UPLOAD ZONE MISSING");
    if (!fileInput) console.warn("FILE INPUT MISSING");
    if (!browseBtn) console.warn("BROWSE BUTTON MISSING");

    if (!uploadZone || !fileInput || !browseBtn) return;

    browseBtn.addEventListener('click', () => {
        console.log("Browse button clicked - triggering file input");
        fileInput.click();
    });

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
        if (file) {
            console.log("File selected:", file.name);
            handleUpload(file);
        }
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

            syncUIWithState();
        });
    }

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
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', 'return_guard_template.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }
}

async function handleUpload(file) {
    const progress = document.getElementById('upload-progress');
    const bar = document.getElementById('upload-bar');
    const status = document.getElementById('upload-status');
    const results = document.getElementById('import-results');

    console.log("Handling upload for:", file.name);

    state.currentAnalysisResult = null;
    document.getElementById('result-count').textContent = '0';
    document.getElementById('result-threats').textContent = '0';

    const tbody = document.getElementById('fraud-table-body');
    if (tbody) tbody.innerHTML = '';
    const alertsBox = document.getElementById('alerts-container');
    if (alertsBox) alertsBox.innerHTML = '';

    renderCharts({ low: 0, medium: 0, high: 0 });
    updateKPIs(0, 0, 0, 0);

    progress.style.display = 'block';
    results.style.display = 'none';
    bar.style.width = '10%';
    bar.style.background = 'var(--primary)';

    const formData = new FormData();
    formData.append('file', file);

    try {
        status.textContent = `Uploading ${file.name}...`;
        bar.style.width = '40%';

        const response = await fetch('/api/analyze-transactions', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            let detail = `Error ${response.status}`;
            try {
                const errorData = JSON.parse(errorText);
                detail = errorData.detail || detail;
            } catch (e) {
                detail = errorText || detail;
            }
            throw new Error(detail);
        }

        const data = await response.json();
        console.log("REAL BACKEND ANALYSIS RESPONSE:", data);
        state.currentAnalysisResult = data;

        bar.style.width = '100%';
        status.textContent = 'Upload complete! Processing scores...';

        document.getElementById('result-count').textContent = data.totalRecords;
        document.getElementById('result-threats').textContent = data.threatsDetected;

        results.style.display = 'block';
        status.textContent = 'Data processed successfully';

        // REFRESH GLOBAL PATTERNS AFTER NEW DATA IMPORT
        await fetchData();

    } catch (error) {
        console.error("Upload Error:", error);
        status.textContent = 'Error: ' + error.message;
        bar.style.background = 'var(--danger)';
    }
}

function syncUIWithState() {
    if (!state.currentAnalysisResult) {
        updateKPIs(0, 0, 0, 0);
        state.returns = [];
        renderCharts(null);
        renderTable();
        renderAlerts();
        return;
    }

    const data = state.currentAnalysisResult;
    updateKPIs(
        data.totalRecords,
        data.threatsDetected,
        data.averageRiskScore,
        data.threatsDetected
    );

    if (data.flaggedTransactions) {
        state.returns = data.flaggedTransactions.map(alert => ({
            id: alert.order_id || alert.id,
            userId: alert.user_id,
            reason: alert.explanation,
            riskScore: alert.score,
            level: alert.level.toLowerCase(),
            indicators: alert.explanation.split(', ')
        }));
    } else {
        state.returns = [];
    }

    renderTable();
    renderAlerts();
    renderCharts(data.distribution);
    renderRiskView();
}

async function fetchData() {
    try {
        state.loading = true;
        const [alertsData, transData, patternsData] = await Promise.all([
            fetch('/api/fraud/alerts').then(res => res.json()).catch(() => null),
            fetch('/api/transactions').then(res => res.json()).catch(() => []),
            fetch('/api/risk/patterns').then(res => res.json()).catch(() => [])
        ]);

        state.transactions = transData;
        state.patterns = patternsData;

        if (alertsData && transData && transData.length > 0) {
            const threats = alertsData.filter(a => a.score >= 71).length;
            const avgScore = alertsData.reduce((s, a) => s + a.score, 0) / Math.max(1, alertsData.length);

            state.currentAnalysisResult = {
                totalRecords: transData.length,
                threatsDetected: threats,
                averageRiskScore: avgScore,
                flaggedTransactions: alertsData,
                distribution: {
                    low: Math.max(0, transData.length - alertsData.length),
                    medium: alertsData.filter(a => a.score >= 31 && a.score < 71).length,
                    high: threats
                }
            };
        } else {
            state.currentAnalysisResult = {
                totalRecords: 0,
                threatsDetected: 0,
                averageRiskScore: 0,
                flaggedTransactions: [],
                distribution: { low: 0, medium: 0, high: 0 }
            };
        }

        state.loading = false;
        syncUIWithState();
        renderReturnsView();
        renderRiskView();
    } catch (error) {
        console.error("API Fetch Error:", error);
        state.loading = false;
    }
}

function updateKPIs(total, threats, avgRisk, flagged) {
    const kpiData = {
        'kpi-total-returns': total,
        'kpi-high-risk': threats,
        'kpi-fraud-prob': avgRisk,
        'kpi-flagged-users': flagged
    };

    Object.keys(kpiData).forEach(id => {
        const el = document.querySelector(`#${id} .kpi-value`);
        if (el) {
            el.setAttribute('data-target', kpiData[id]);
            if (id === 'kpi-fraud-prob') {
                el.textContent = kpiData[id].toFixed(1) + (el.getAttribute('data-suffix') || '');
            } else {
                el.textContent = kpiData[id];
            }
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

    if (filteredReturns.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">No suspicious transactions detected.</td></tr>';
        return;
    }

    filteredReturns.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="order-id">${item.id}</span></td>
            <td>${item.userId}</td>
            <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.reason}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="risk-bar-container" style="flex: 1; height: 6px;">
                        <div class="risk-bar" style="width: ${item.riskScore}%; background: ${getRiskColor(item.level)}"></div>
                    </div>
                    <span style="font-weight: 600; font-size: 0.8rem; min-width: 30px;">${item.riskScore}%</span>
                </div>
            </td>
            <td><span class="risk-level ${item.level}">${item.level}</span></td>
            <td><button class="icon-btn" onclick="openDetailModalById(${typeof item.id === 'string' ? `'${item.id}'` : item.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            </button></td>
        `;
        tbody.appendChild(row);
    });
}

function renderAlerts() {
    const container = document.getElementById('alerts-container');
    if (!container) return;

    const alerts = state.returns.filter(r => r.level === 'high' || r.level === 'extreme');

    if (alerts.length === 0) {
        container.innerHTML = '<p style="padding: 40px; text-align: center; color: var(--text-muted);">No active security alerts.</p>';
        return;
    }

    container.innerHTML = `
        <div style="padding: 20px;">
            <div style="display: flex; flex-direction: column; gap: 15px;">
                ${alerts.slice(0, 5).map(alert => `
                    <div class="glass-card" style="padding: 15px; border-left: 4px solid var(--danger); background: rgba(239, 68, 68, 0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-weight: 700; color: var(--danger);">CRITICAL THREAT</span>
                            <span style="font-size: 0.75rem; color: var(--text-muted);">${new Date().toLocaleTimeString()}</span>
                        </div>
                        <p style="margin-bottom: 10px;">User <strong>${alert.userId}</strong> triggered pattern matching: ${alert.reason}</p>
                        <div style="display: flex; justify-content: flex-end;">
                            <button class="filter-btn active" style="background: var(--danger); border-color: var(--danger); font-size: 0.75rem; padding: 5px 12px;" onclick="openDetailModalById(${typeof alert.id === 'string' ? `'${alert.id}'` : alert.id})">Investigate</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    const badge = document.querySelector('.badge');
    if (badge) badge.textContent = alerts.length;
}

function renderReturnsView() {
    const container = document.getElementById('returns-view');
    if (!container) return;

    const tableBody = container.querySelector('.glass-card');
    if (!tableBody) return;

    if (!state.transactions || state.transactions.length === 0) {
        tableBody.innerHTML = '<p style="padding: 40px; text-align: center; color: var(--text-muted);">No transactions found. Upload a CSV to begin.</p>';
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

window.openDetailModalById = (id) => {
    const item = state.returns.find(r => r.id === id);
    if (item) openDetailModal(item);
};

function getRiskColor(level) {
    if (level === 'extreme' || level === 'high') return '#ef4444';
    if (level === 'moderate' || level === 'suspicious' || level === 'medium') return '#f59e0b';
    return '#22c55e';
}

function renderCharts(distribution = null) {
    drawBarChart(distribution);
    drawDonutChart(distribution);
}

function drawBarChart(distribution = null) {
    const canvas = document.getElementById('bar-chart-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = (rect.height - 40) * dpr;
    ctx.scale(dpr, dpr);
    const labels = ['Safe', 'Medium', 'High'];
    let data = [0, 0, 0];
    if (distribution) data = [distribution.low || 0, distribution.medium || 0, distribution.high || 0];
    const availableWidth = rect.width;
    const availableHeight = rect.height - 60;
    const barWidth = (availableWidth - 80) / 3;
    const maxVal = Math.max(...data, 1);
    ctx.clearRect(0, 0, rect.width, rect.height);
    data.forEach((val, i) => {
        const h = (val / maxVal) * (availableHeight - 50);
        const x = 40 + i * (barWidth + 20);
        const y = (availableHeight - 30) - h;
        ctx.fillStyle = i === 2 ? '#ef4444' : (i === 1 ? '#f59e0b' : '#3b82f6');
        ctx.fillRect(x, y, barWidth, h);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], x + barWidth / 2, availableHeight);
    });
}

function drawDonutChart(distribution = null) {
    const canvas = document.getElementById('donut-chart-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    let counts = { high: 0, medium: 0, low: 0 };
    if (distribution) counts = { high: distribution.high || 0, medium: distribution.medium || 0, low: distribution.low || 0 };
    const total = counts.high + counts.medium + counts.low;
    const coverageEl = document.querySelector('.donut-val');
    if (coverageEl) coverageEl.textContent = total > 0 ? 'LIVE' : '0%';
}

function openDetailModal(item) {
    const modal = document.getElementById('fraud-modal');
    const content = document.getElementById('modal-details');
    content.innerHTML = `<h3>Analysis: ${item.id}</h3><p>${item.reason}</p>`;
    modal.classList.add('active');
}
