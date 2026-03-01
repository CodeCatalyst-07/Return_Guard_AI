// /**
//  * ReturnGuardAI | Senior Dashboard Integration
//  * Logic & Stabilization Patch
//  */

// const API_URL = "https://return-guard-ai.onrender.com";

// let initialized = false;
// document.addEventListener('DOMContentLoaded', () => {
//     if (initialized) return;
//     initialized = true;
//     initDashboard();
// });

// const state = {
//     currentAnalysisResult: null,
//     returns: [],
//     transactions: [],
//     patterns: [],
//     loading: true,
//     activeView: 'dashboard',
//     filterLevel: 'all',
//     kpis: { total: 0, threats: 0, avgRisk: 0, flagged: 0 }
// };

// async function initDashboard() {
//     setupNavigation();
//     setupEventListeners();
//     await fetchData();
// }

// function setupNavigation() {
//     const navItems = document.querySelectorAll('.nav-item');
//     navItems.forEach(item => {
//         item.addEventListener('click', (e) => {
//             e.preventDefault();
//             const viewId = item.getAttribute('data-view');
//             navItems.forEach(ni => ni.classList.remove('active'));
//             item.classList.add('active');
//             if (viewId !== state.activeView) {
//                 state.activeView = viewId;
//                 document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
//                 const targetView = document.getElementById(`${viewId}-view`);
//                 if (targetView) targetView.classList.add('active');
//             }
//         });
//     });
// }

// function setupEventListeners() {
//     const modal = document.getElementById('fraud-modal');
//     const closeBtn = document.querySelector('.close-modal');
//     if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));

//     const fileInput = document.getElementById('csv-upload');
//     const browseBtn = document.getElementById('browse-btn');
//     if (browseBtn && fileInput) {
//         browseBtn.addEventListener('click', () => fileInput.click());
//         fileInput.addEventListener('change', (e) => {
//             const file = e.target.files[0];
//             if (file) handleUpload(file);
//         });
//     }

//     const filterBtns = document.querySelectorAll('#table-filters .filter-btn');
//     filterBtns.forEach(btn => {
//         btn.addEventListener('click', () => {
//             filterBtns.forEach(b => b.classList.remove('active'));
//             btn.classList.add('active');
//             state.filterLevel = btn.getAttribute('data-filter');
//             renderTable();
//         });
//     });

//     const viewAlertsBtn = document.getElementById('view-alerts-btn');
//     if (viewAlertsBtn) {
//         viewAlertsBtn.addEventListener('click', () => {
//             document.querySelector('.nav-item[data-view="dashboard"]').click();
//         });
//     }
// }

// async function handleUpload(file) {
//     const progressDiv = document.getElementById('upload-progress');
//     const bar = document.getElementById('upload-bar');
//     const status = document.getElementById('upload-status');
//     const resultsDiv = document.getElementById('import-results');
//     const progressVal = document.getElementById('progress-val');

//     progressDiv.style.display = 'block';
//     resultsDiv.style.display = 'none';
//     bar.style.width = '0%';
//     progressVal.textContent = '0%';
//     status.textContent = 'Uploading dataset...';

//     const formData = new FormData();
//     formData.append('file', file);

//     try {
//         const response = await fetch('/api/upload', {
//             method: 'POST',
//             body: formData
//         });

//         if (!response.ok) throw new Error("Connection failed");

//         const { uploadId } = await response.json();
//         pollProgress(uploadId);

//     } catch (err) {
//         status.textContent = "Error: " + err.message;
//         bar.style.background = "#ef4444";
//     }
// }

// async function pollProgress(uploadId) {
//     const bar = document.getElementById('upload-bar');
//     const status = document.getElementById('upload-status');
//     const resultsDiv = document.getElementById('import-results');
//     const progressVal = document.getElementById('progress-val');

//     const interval = setInterval(async () => {
//         try {
//             const res = await fetch(`/api/progress/${uploadId}`);
//             if (!res.ok) return;
//             const data = await res.json();

//             bar.style.width = `${data.progress}%`;
//             progressVal.textContent = `${data.progress}%`;
//             status.textContent = `Analyzing risk vectors: ${data.processed || 0} / ${data.total || 0}`;

//             if (data.status === 'completed') {
//                 clearInterval(interval);
//                 bar.style.width = '100%';
//                 status.textContent = 'Analysis complete!';
//                 state.currentAnalysisResult = data.result;

//                 document.getElementById('result-count').textContent = data.result.total_records;
//                 document.getElementById('result-threats').textContent = data.result.threats_detected;
//                 resultsDiv.style.display = 'block';

//                 await fetchData(); // Refresh all views
//             } else if (data.status === 'error') {
//                 clearInterval(interval);
//                 status.textContent = 'Error: ' + data.error;
//             }
//         } catch (e) {
//             console.error(e);
//         }
//     }, 800);
// }

// function animateNumber(id, start, end, duration, suffix = '') {
//     const el = document.querySelector(`#${id} .kpi-value`);
//     if (!el) return;
//     let startTimestamp = null;
//     const step = (timestamp) => {
//         if (!startTimestamp) startTimestamp = timestamp;
//         const progress = Math.min((timestamp - startTimestamp) / duration, 1);
//         const val = progress * (end - start) + start;
//         el.textContent = (id.includes('prob') ? val.toFixed(1) : Math.floor(val).toLocaleString()) + suffix;
//         if (progress < 1) window.requestAnimationFrame(step);
//     };
//     window.requestAnimationFrame(step);
// }

// async function fetchData() {
//     try {
//         const [alerts, trans, patterns] = await Promise.all([
//             fetch('/api/fraud/alerts').then(r => r.json()),
//             fetch('/api/transactions').then(r => r.json()),
//             fetch('/api/risk/patterns').then(r => r.json())
//         ]);

//         state.transactions = trans;
//         state.patterns = patterns;
//         state.returns = alerts.map(a => ({
//             id: a.order_id,
//             userId: a.user_id,
//             reason: a.explanation,
//             riskScore: a.score,
//             level: a.level.toLowerCase()
//         }));

//         if (!state.currentAnalysisResult && alerts.length > 0) {
//             state.currentAnalysisResult = {
//                 total_records: trans.length,
//                 threats_detected: alerts.filter(a => a.score >= 60).length,
//                 average_risk_score: alerts.reduce((s, a) => s + a.score, 0) / Math.max(1, alerts.length),
//                 high_risk_count: alerts.filter(a => a.score >= 60).length,
//                 medium_risk_count: alerts.filter(a => a.score >= 30 && a.score < 60).length,
//                 low_risk_count: trans.length - alerts.length
//             };
//         }

//         syncUI();
//     } catch (e) {
//         console.error(e);
//     }
// }

// function syncUI() {
//     const data = state.currentAnalysisResult;
//     if (!data) return;

//     animateNumber('kpi-total-returns', state.kpis.total, data.total_records, 1000);
//     animateNumber('kpi-high-risk', state.kpis.threats, data.threats_detected, 1000);
//     animateNumber('kpi-fraud-prob', state.kpis.avgRisk, data.average_risk_score, 1000, '%');
//     animateNumber('kpi-flagged-users', state.kpis.flagged, data.high_risk_count, 1000);

//     state.kpis = { total: data.total_records, threats: data.threats_detected, avgRisk: data.average_risk_score, flagged: data.high_risk_count };

//     renderTable();
//     renderCharts(data);
//     renderAlerts();
//     renderReturnsView();
//     renderRiskView();
// }

// function renderTable() {
//     const tbody = document.getElementById('fraud-table-body');
//     if (!tbody) return;
//     tbody.innerHTML = '';

//     const filtered = state.returns.filter(r => state.filterLevel === 'all' || r.level === state.filterLevel);
//     if (filtered.length === 0) {
//         tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: var(--text-muted);">No signals detected.</td></tr>';
//         return;
//     }

//     filtered.forEach(item => {
//         const row = document.createElement('tr');
//         row.innerHTML = `
//             <td><span class="order-id">${item.id}</span></td>
//             <td>${item.userId}</td>
//             <td class="reason-cell">${item.reason}</td>
//             <td>
//                 <div class="risk-meter">
//                     <div class="risk-bar" style="width: ${item.riskScore}%; background: ${getRiskColor(item.level)}"></div>
//                     <span>${Math.round(item.riskScore)}%</span>
//                 </div>
//             </td>
//             <td><span class="risk-badge ${item.level}">${item.level.toUpperCase()}</span></td>
//             <td><button class="action-btn" onclick="openDetailModalById('${item.id}')">View</button></td>
//         `;
//         tbody.appendChild(row);
//     });
// }

// function getRiskColor(level) {
//     if (level === 'high') return '#ef4444';
//     if (level === 'medium') return '#f59e0b';
//     return '#22c55e';
// }

// function renderCharts(dist) {
//     const barCanvas = document.getElementById('bar-chart-canvas');
//     if (barCanvas) {
//         const ctx = barCanvas.getContext('2d');
//         const labels = ['Safe', 'Medium', 'High'];
//         const values = [dist.low_risk_count, dist.medium_risk_count, dist.high_risk_count];
//         const max = Math.max(...values, 1);
//         const w = barCanvas.width = barCanvas.parentElement.clientWidth;
//         const h = barCanvas.height = 160;
//         ctx.clearRect(0, 0, w, h);
//         values.forEach((v, i) => {
//             const barH = (v / max) * (h - 40);
//             const x = 40 + i * (w - 80) / 3;
//             ctx.fillStyle = i === 2 ? '#ef4444' : (i === 1 ? '#f59e0b' : '#3b82f6');
//             ctx.fillRect(x, h - barH - 20, (w - 120) / 3, barH);
//         });
//     }
// }

// function renderAlerts() {
//     const container = document.getElementById('alerts-container');
//     if (!container) return;
//     const high = state.returns.filter(r => r.level === 'high').slice(0, 5);
//     container.innerHTML = high.map(a => `<div class="alert-card glass-card"><h4>High Risk: ${a.id}</h4><p>${a.reason}</p></div>`).join('') || '<p class="empty-msg">No alerts.</p>';
// }

// function renderReturnsView() {
//     const container = document.getElementById('returns-view');
//     if (container) {
//         const body = container.querySelector('.glass-card');
//         body.innerHTML = `<div class="table-responsive"><table><thead><tr><th>ORDER</th><th>USER</th><th>DATE</th><th>STATUS</th></tr></thead><tbody>${state.transactions.slice(0, 20).map(t => `<tr><td>${t.order_id}</td><td>${t.user_id}</td><td>${new Date(t.purchase_date).toLocaleDateString()}</td><td>${t.return_date ? 'Returned' : 'Safe'}</td></tr>`).join('')}</tbody></table></div>`;
//     }
// }

// function renderRiskView() {
//     const container = document.getElementById('risk-view');
//     if (container) {
//         const body = container.querySelector('.glass-card');
//         body.innerHTML = `<div class="risk-matrix">${state.patterns.map(p => `<div class="pattern-card glass-card"><h4>${p.pattern}</h4><span>Target Count: ${p.count}</span></div>`).join('')}</div>`;
//     }
// }

// window.openDetailModalById = (id) => {
//     const item = state.returns.find(r => r.id === id);
//     if (!item) return;
//     const modal = document.getElementById('fraud-modal');
//     const content = document.getElementById('modal-details');
//     content.innerHTML = `<h3>Analysis: ${item.id}</h3><p>${item.reason}</p><strong>Risk: ${item.riskScore}%</strong>`;
//     modal.classList.add('active');
// };
/**
 * ReturnGuardAI | Senior Dashboard Integration
 * Backend Connected Version
 */

// In dev, Vite proxies /api → localhost:5001.
// In production (Vercel), call the Render backend directly.
const API_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? '/api'
    : 'https://return-guard-ai.onrender.com/api';

let initialized = false;
document.addEventListener('DOMContentLoaded', () => {
    if (initialized) return;
    initialized = true;
    initDashboard();
});

const state = {
    currentAnalysisResult: null,
    returns: [],
    transactions: [],
    patterns: [],
    loading: true,
    activeView: 'dashboard',
    filterLevel: 'all',
    kpis: { total: 0, threats: 0, avgRisk: 0, flagged: 0 }
};

async function initDashboard() {
    setupNavigation();
    setupEventListeners();
    await fetchData();
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = item.getAttribute('data-view');
            navItems.forEach(ni => ni.classList.remove('active'));
            item.classList.add('active');
            if (viewId !== state.activeView) {
                state.activeView = viewId;
                document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
                const targetView = document.getElementById(`${viewId}-view`);
                if (targetView) targetView.classList.add('active');
            }
        });
    });
}

function setupEventListeners() {
    const modal = document.getElementById('fraud-modal');
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));

    const fileInput = document.getElementById('csv-upload');
    const browseBtn = document.getElementById('browse-btn');

    if (browseBtn && fileInput) {
        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleUpload(file);
        });
    }

    // "View New Alerts" button — navigate to dashboard view after upload
    const viewAlertsBtn = document.getElementById('view-alerts-btn');
    if (viewAlertsBtn) {
        viewAlertsBtn.addEventListener('click', () => {
            const dashboardNav = document.querySelector('.nav-item[data-view="dashboard"]');
            if (dashboardNav) dashboardNav.click();
        });
    }
}

/* =========================
   FILE UPLOAD
========================= */

async function handleUpload(file) {
    const progressDiv = document.getElementById('upload-progress');
    const bar = document.getElementById('upload-bar');
    const status = document.getElementById('upload-status');
    const progressVal = document.getElementById('progress-val');

    progressDiv.style.display = 'block';
    bar.style.width = '0%';
    progressVal.textContent = '0%';
    status.textContent = 'Uploading and analyzing dataset...';
    bar.style.background = 'var(--primary)';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.detail || errBody.error || "Connection failed");
        }

        const { uploadId } = await response.json();
        pollProgress(uploadId);

    } catch (err) {
        status.textContent = "Error: " + err.message;
        bar.style.background = "#ef4444";
    }
}

async function pollProgress(uploadId) {
    const bar = document.getElementById('upload-bar');
    const status = document.getElementById('upload-status');
    const resultsDiv = document.getElementById('import-results');
    const progressVal = document.getElementById('progress-val');

    const interval = setInterval(async () => {
        try {
            const res = await fetch(`${API_URL}/progress/${uploadId}`);
            if (!res.ok) return;
            const data = await res.json();

            bar.style.width = `${data.progress}%`;
            progressVal.textContent = `${data.progress}%`;
            status.textContent = `Analyzing risk vectors: ${data.processed || 0} / ${data.total || 0}`;

            if (data.status === 'completed') {
                clearInterval(interval);
                bar.style.width = '100%';
                status.textContent = 'Analysis complete!';

                // Use upload result as source of truth for KPIs and charts
                state.currentAnalysisResult = data.result;

                document.getElementById('result-count').textContent = data.result.total_records;
                document.getElementById('result-threats').textContent = data.result.threats_detected;
                resultsDiv.style.display = 'block';

                // Refresh table rows from DB but keep upload result for KPIs
                await fetchData(true);

            } else if (data.status === 'error') {
                clearInterval(interval);
                status.textContent = 'Error: ' + data.error;
            }
        } catch (e) {
            console.error(e);
        }
    }, 800);
}

function animateNumber(id, start, end, duration, suffix = '') {
    const el = document.querySelector(`#${id} .kpi-value`);
    if (!el) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const val = progress * (end - start) + start;
        el.textContent = (id.includes('prob') ? val.toFixed(1) : Math.floor(val).toLocaleString()) + suffix;
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// preserveResult = true when called after upload so KPIs stay on the upload stats
async function fetchData(preserveResult = false) {
    try {
        const alerts = await safeFetch(`${API_URL}/fraud/alerts`);
        const trans = await safeFetch(`${API_URL}/transactions`);
        const patterns = await safeFetch(`${API_URL}/risk/patterns`);

        state.transactions = trans || [];
        state.patterns = patterns || [];
        state.returns = alerts ? alerts.map(a => ({
            id: a.order_id,
            userId: a.user_id,
            reason: a.explanation,
            riskScore: a.score,
            level: a.level?.toLowerCase()
        })) : [];

        // Only recompute from DB data on initial load (not after an upload)
        if (!preserveResult) {
            const highItems = state.returns.filter(r => r.riskScore >= 60);
            const medItems = state.returns.filter(r => r.riskScore >= 30 && r.riskScore < 60);
            const avgScore = state.returns.length
                ? state.returns.reduce((s, r) => s + r.riskScore, 0) / state.returns.length
                : 0;
            state.currentAnalysisResult = {
                total_records: state.transactions.length,
                threats_detected: highItems.length,
                high_risk_count: highItems.length,
                medium_risk_count: medItems.length,
                low_risk_count: state.returns.length - highItems.length - medItems.length,
                average_risk_score: avgScore
            };
        }

        syncUI();
    } catch (e) {
        console.log('Backend routes not ready yet.', e);
    }
}

async function safeFetch(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

/* =========================
   UI
========================= */

function syncUI() {
    const data = state.currentAnalysisResult;

    // Use state.currentAnalysisResult as the single source of truth for KPIs.
    // It's set from the upload result after an upload, or computed from DB on load.
    const totalReturns = data?.total_records ?? state.transactions.length;
    const highRisk = data?.high_risk_count ?? 0;
    const flagged = data?.threats_detected ?? 0;
    const avgRisk = data?.average_risk_score ?? 0;

    animateNumber('kpi-total-returns', state.kpis.total, totalReturns, 800);
    animateNumber('kpi-high-risk', state.kpis.threats, highRisk, 800);
    animateNumber('kpi-fraud-prob', state.kpis.avgRisk, avgRisk, 800, '%');
    animateNumber('kpi-flagged-users', state.kpis.flagged, flagged, 800);

    state.kpis = { total: totalReturns, threats: highRisk, avgRisk, flagged };

    renderTable();
    renderCharts(data);
    renderReturnsView();
    renderRiskView();
}

function getRiskColor(level) {
    if (!level) return '#64748b';
    const l = level.toLowerCase();
    if (l === 'extreme' || l === 'high') return '#ef4444';
    if (l === 'moderate' || l === 'medium') return '#f59e0b';
    return '#22c55e';
}

function renderTable() {
    const tbody = document.getElementById('fraud-table-body');
    if (!tbody) return;

    const filtered = state.returns.filter(r =>
        state.filterLevel === 'all' || r.level === state.filterLevel
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">
            ${state.returns.length === 0 ? 'No data yet — upload a CSV to get started.' : 'No matches for current filter.'}
        </td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td><span class="order-id">${item.id}</span></td>
            <td>${item.userId}</td>
            <td class="reason-cell" style="max-width:280px;font-size:0.8rem;color:var(--text-muted);">${item.reason || '—'}</td>
            <td>
                <div style="display:flex;align-items:center;gap:8px;">
                    <div class="risk-bar-container" style="flex:1;height:6px;">
                        <div class="risk-bar" style="width:${Math.min(item.riskScore, 100)}%;background:${getRiskColor(item.level)};"></div>
                    </div>
                    <span style="font-size:0.8rem;font-weight:600;">${Math.round(item.riskScore)}%</span>
                </div>
            </td>
            <td>
                <span class="risk-badge ${item.level}" style="
                    padding:3px 10px;border-radius:99px;font-size:0.7rem;font-weight:700;
                    background:${getRiskColor(item.level)}22;color:${getRiskColor(item.level)};
                    text-transform:uppercase;letter-spacing:0.05em;">
                    ${item.level}
                </span>
            </td>
            <td><button class="filter-btn" style="padding:4px 12px;font-size:0.75rem;" onclick="openDetailModalById('${item.id}')">View</button></td>
        </tr>
    `).join('');
}

function renderCharts(dist) {
    // Bar chart
    const barCanvas = document.getElementById('bar-chart-canvas');
    if (barCanvas && dist) {
        const ctx = barCanvas.getContext('2d');
        const values = [dist.low_risk_count || 0, dist.medium_risk_count || 0, dist.high_risk_count || 0];
        const labels = ['Safe', 'Medium', 'High'];
        const colors = ['#3b82f6', '#f59e0b', '#ef4444'];
        const max = Math.max(...values, 1);
        const w = barCanvas.width = barCanvas.parentElement.clientWidth || 400;
        const h = barCanvas.height = 160;
        ctx.clearRect(0, 0, w, h);
        const barW = (w - 80) / 3 - 16;
        values.forEach((v, i) => {
            const barH = (v / max) * (h - 50);
            const x = 40 + i * ((w - 80) / 3);
            ctx.fillStyle = colors[i];
            ctx.beginPath();
            ctx.roundRect(x, h - barH - 20, barW, barH, 4);
            ctx.fill();
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(labels[i], x + barW / 2, h - 4);
            ctx.fillStyle = '#fff';
            ctx.fillText(v, x + barW / 2, h - barH - 25);
        });
    }

    // Donut chart
    const donutCanvas = document.getElementById('donut-chart-canvas');
    if (donutCanvas && dist) {
        const ctx = donutCanvas.getContext('2d');
        const total = (dist.low_risk_count || 0) + (dist.medium_risk_count || 0) + (dist.high_risk_count || 0) || 1;
        const slices = [
            { value: dist.low_risk_count || 0, color: '#3b82f6' },
            { value: dist.medium_risk_count || 0, color: '#f59e0b' },
            { value: dist.high_risk_count || 0, color: '#ef4444' },
        ];
        const size = 140;
        donutCanvas.width = donutCanvas.height = size;
        ctx.clearRect(0, 0, size, size);
        let startAngle = -Math.PI / 2;
        slices.forEach(s => {
            const sweep = (s.value / total) * 2 * Math.PI;
            ctx.beginPath();
            ctx.moveTo(size / 2, size / 2);
            ctx.arc(size / 2, size / 2, size / 2 - 4, startAngle, startAngle + sweep);
            ctx.closePath();
            ctx.fillStyle = s.color;
            ctx.fill();
            startAngle += sweep;
        });
        // Donut hole
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 28, 0, 2 * Math.PI);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--card-bg') || '#1a2236';
        ctx.fill();
    }
}

function renderReturnsView() {
    const container = document.getElementById('returns-view');
    if (!container) return;
    const card = container.querySelector('.glass-card');
    if (!card) return;
    if (state.transactions.length === 0) return;
    card.innerHTML = `
        <div class="table-responsive">
            <table>
                <thead><tr><th>ORDER</th><th>USER</th><th>DATE</th><th>PRICE</th><th>STATUS</th></tr></thead>
                <tbody>${state.transactions.slice(0, 50).map(t => `
                    <tr>
                        <td><span class="order-id">${t.order_id}</span></td>
                        <td>${t.user_id}</td>
                        <td>${new Date(t.purchase_date).toLocaleDateString()}</td>
                        <td>$${Number(t.item_price || 0).toFixed(2)}</td>
                        <td><span style="color:${t.return_date ? '#f59e0b' : '#22c55e'}">${t.return_date ? 'Returned' : 'Kept'}</span></td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

function renderRiskView() {
    const container = document.getElementById('risk-view');
    if (!container) return;
    const card = container.querySelector('.glass-card');
    if (!card) return;
    if (state.patterns.length === 0) return;
    card.innerHTML = `<div class="risk-matrix" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;padding:24px;">
        ${state.patterns.map(p => `
            <div class="glass-card" style="padding:20px;">
                <h4 style="margin-bottom:8px;">${p.pattern}</h4>
                <p style="color:var(--text-muted);font-size:0.85rem;">Occurrences: <strong>${p.count}</strong></p>
                <span style="font-size:0.75rem;color:${p.threat_level === 'High' ? '#ef4444' : '#f59e0b'};font-weight:700;">${p.threat_level} Threat</span>
            </div>`).join('')}
    </div>`;
}

window.openDetailModalById = (id) => {
    const item = state.returns.find(r => r.id === id);
    if (!item) return;
    const modal = document.getElementById('fraud-modal');
    const content = document.getElementById('modal-details');
    content.innerHTML = `
        <h3 style="margin-bottom:12px;">Order: ${item.id}</h3>
        <p style="color:var(--text-muted);margin-bottom:8px;">User: <strong>${item.userId}</strong></p>
        <p style="font-size:0.85rem;margin-bottom:16px;line-height:1.6;">${item.reason || 'No explanation available.'}</p>
        <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-size:1.4rem;font-weight:700;color:${getRiskColor(item.level)};">${Math.round(item.riskScore)}%</span>
            <span class="risk-badge" style="padding:4px 14px;border-radius:99px;background:${getRiskColor(item.level)}22;color:${getRiskColor(item.level)};font-weight:700;text-transform:uppercase;">${item.level}</span>
        </div>`;
    modal.classList.add('active');
};

