<div align="center">

# ReturnGuard AI

### AI-Powered Return Fraud Detection for Indian E-Commerce

[![Live Demo](https://img.shields.io/badge/Live%20Demo-return--guard--ai.vercel.app-blue?style=for-the-badge&logo=vercel)](https://return-guard-ai.vercel.app/)
[![Demo Video](https://img.shields.io/badge/Demo%20Video-Watch%20Now-red?style=for-the-badge&logo=youtube)](YOUR_DEMO_VIDEO_LINK)
[![Presentation](https://img.shields.io/badge/Presentation-View%20Slides-orange?style=for-the-badge&logo=googleslides)](YOUR_PRESENTATION_LINK)
[![GitHub](https://img.shields.io/badge/GitHub-CodeCatalyst--07-black?style=for-the-badge&logo=github)](https://github.com/CodeCatalyst-07/Return_Guard_AI)
[![Python](https://img.shields.io/badge/Python-3.9+-yellow?style=for-the-badge&logo=python)](https://python.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)

> An intelligent, real-time fraud surveillance system that detects and prevents return abuse — including wardrobing, serial returners, and fake receipts — tailored for Indian e-commerce platforms.

</div>

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Deployed Link](#deployed-link)
- [Demo Video](#demo-video)
- [Presentation](#presentation)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
- [API Reference](#api-reference)
- [Screenshots](#screenshots)
- [Future Roadmap](#future-roadmap)
- [Hackathon Context](#hackathon-context)
- [Team](#team)
- [License](#license)

---

## Problem Statement

Return fraud is one of the most underestimated threats to Indian e-commerce, costing the industry billions annually. Common fraud patterns include:

- **Wardrobing** — Buying products for short-term use and returning them after
- **Serial Returners** — Users with abnormally high return rates
- **Fake Receipts** — Fraudulent return claims backed by forged documentation
- **Item Switching** — Returning a different or damaged item in the original box
- **Collusive Fraud** — Coordinated fraudulent behavior across multiple accounts

Traditional rule-based systems fail to catch sophisticated, evolving fraud patterns. **ReturnGuard AI** solves this using machine learning and behavioral heuristics.

---

## Solution Overview

ReturnGuard AI is a full-stack fraud intelligence platform that:

1. **Ingests** return transaction data (manual entry or CSV upload)
2. **Analyzes** each transaction using an AI/ML scoring engine
3. **Flags** high-risk returns in real-time with a fraud probability score
4. **Visualizes** patterns through an intuitive Fraud Intelligence Dashboard
5. **Alerts** administrators to extreme-risk events instantly

---

## Deployed Link

**[https://return-guard-ai.vercel.app/](https://return-guard-ai.vercel.app/)**

The application runs in Demo Mode — generate synthetic transaction data and explore all fraud detection features without any backend setup required.

---

## Demo Video

**[Watch the Demo Video](YOUR_DEMO_VIDEO_LINK)**

A full walkthrough of ReturnGuard AI — from uploading a transaction CSV to real-time fraud scoring, risk alerts, and dashboard analytics.

<!-- Replace YOUR_DEMO_VIDEO_LINK with your actual YouTube / Google Drive / Loom link -->

---

## Presentation

**[View the Presentation Slides](YOUR_PRESENTATION_LINK)**

Our hackathon pitch deck covering the problem statement, solution architecture, ML approach, market opportunity, and live demo highlights.

<!-- Replace YOUR_PRESENTATION_LINK with your actual Google Slides / Canva / PDF link -->

---

## Key Features

### Fraud Intelligence Dashboard
Real-time overview of all return activity with four core KPI cards:
- **Total Returns** — Aggregate return volume with trend indicators
- **High Risk Returns** — Count of flagged transactions
- **Average Fraud Probability** — System-wide risk score
- **Flagged Users** — Unique users currently under suspicion

### Volume and Risk Trend Charts
Interactive charts visualizing return volumes and risk levels over time, enabling pattern recognition across daily, weekly, and monthly windows.

### Risk Distribution Analysis
Visual breakdown of returns across all risk tiers — Low, Moderate, High, and Extreme — providing an at-a-glance view of overall platform fraud health.

### Security Alerts Panel
Live feed of high-risk activity filterable by severity level (Extreme / Moderate / All), displaying Order ID, User ID, Return Reason, Risk Score, and recommended Action for each flagged event.

### Return Management Ledger
Full transaction audit log with detailed metadata for every return event, enabling thorough compliance reviews and investigative workflows.

### Risk Intelligence Engine
Deep pattern matching and behavioral heuristic analysis that scores each return based on:
- Historical return frequency per user
- Time elapsed between purchase and return
- Return reason classification
- Order value and product category patterns
- Deviation from established behavioral baselines

### CSV Bulk Import
Upload transaction datasets for batch risk scoring. Supports drag-and-drop file selection with a downloadable CSV template. A processing summary shows total records analyzed and threats detected upon completion.

### Configurable Settings
- Adjustable risk threshold percentage to tune detection sensitivity
- Backend API connectivity status monitor
- Demo data generation for testing and evaluation purposes

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), TypeScript |
| **Backend** | Python (FastAPI / Flask) |
| **ML / AI** | Python ML libraries (scikit-learn / custom heuristics) |
| **API Layer** | RESTful API (`/api` directory) |
| **Deployment** | Vercel (Frontend), Python server (Backend) |
| **Package Management** | npm (Node.js), pip (Python) |

**Language Breakdown**

| Language | Share |
|---|---|
| JavaScript | 52.0% |
| HTML | 19.0% |
| CSS | 14.2% |
| TypeScript | 13.9% |
| Python | 0.9% |

---

## Project Structure

```
Return_Guard_AI/
|
|-- frontend/               # Frontend application (HTML/CSS/JS/TS)
|   └── ...                 # Dashboard UI, charts, alert panels
|
|-- api/                    # API endpoints and route handlers
|   └── ...                 # REST API definitions
|
|-- server/                 # Backend server logic
|   └── ...                 # Python server, ML model, scoring engine
|
|-- __pycache__/            # Python cache files
|
|-- main.py                 # Application entry point (Python backend)
|-- requirements.txt        # Python dependencies
|-- package.json            # Node.js dependencies
|-- package-lock.json       # Locked Node.js dependency tree
|-- vercel.json             # Vercel deployment configuration
|-- .gitignore              # Git ignore rules
└── README.md               # Project documentation
```

---

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 16+
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/CodeCatalyst-07/Return_Guard_AI.git
cd Return_Guard_AI
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Install Node Dependencies

```bash
npm install
```

### 4. Run the Backend Server

```bash
python main.py
```

The backend API will be available at `http://localhost:8000` (or your configured port).

### 5. Serve the Frontend

Open `frontend/index.html` directly in your browser, or use a local development server:

```bash
npx serve frontend
```

### 6. Deploy to Vercel (Optional)

```bash
npm install -g vercel
vercel
```

The `vercel.json` configuration is pre-set for seamless one-command deployment.

---

## How It Works

```
User uploads CSV / Transaction occurs
           |
           v
   +------------------+
   |  Data Ingestion  |  <- CSV Upload or API call
   +--------+---------+
            |
            v
   +--------------------------+
   |  Feature Extraction      |  <- Return frequency, timing, reason,
   |                          |     order value, user history
   +--------+-----------------+
            |
            v
   +--------------------------+
   |  AI Risk Scoring Engine  |  <- ML model + behavioral heuristics
   +--------+-----------------+
            |
            v
   +--------------------------+
   |  Risk Classification     |  <- Low / Moderate / High / Extreme
   +--------+-----------------+
            |
            v
   +--------------------------+
   |  Dashboard & Alerts      |  <- Real-time visualization & notifications
   +--------------------------+
```

### Risk Score Interpretation

| Score Range | Risk Level | Recommended Action |
|---|---|---|
| 0 – 30% | Low | Auto-approve return |
| 31 – 60% | Moderate | Flag for manual review |
| 61 – 85% | High | Investigation required |
| 86 – 100% | Extreme | Block return and escalate |

---

## API Reference

The backend exposes a REST API for transaction scoring and data retrieval.

### Base URL

```
http://localhost:8000/api
```

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | API health check |
| `POST` | `/analyze` | Score a single return transaction |
| `POST` | `/upload` | Bulk CSV upload for batch scoring |
| `GET` | `/returns` | Fetch all return records |
| `GET` | `/alerts` | Fetch active security alerts |
| `GET` | `/stats` | Fetch dashboard KPI statistics |

### Sample Request — Analyze a Return

```json
POST /api/analyze
{
  "order_id": "ORD-20240115-001",
  "user_id": "USR-9874",
  "product_category": "Electronics",
  "order_value": 12999,
  "days_since_purchase": 25,
  "return_reason": "product_defective",
  "previous_returns": 7
}
```

### Sample Response

```json
{
  "order_id": "ORD-20240115-001",
  "risk_score": 78.4,
  "risk_level": "High",
  "fraud_indicators": ["high_return_frequency", "near_policy_limit"],
  "recommended_action": "Manual Investigation Required"
}
```

---

## Screenshots

### Fraud Intelligence Dashboard
Real-time KPI overview with volume trends, risk distribution, and live security alerts.

### Return Management Ledger
Full audit trail of all return transactions with sortable columns and risk-level tags.

### CSV Data Import
Drag-and-drop bulk upload with instant processing summary and threat detection count.

### Security Alerts Panel
Filterable alert feed showing flagged orders with risk scores and actionable recommendations.

---

## Future Roadmap

- [ ] **Graph-based Fraud Network Detection** — Identify organized fraud rings using network graph analysis
- [ ] **NLP-Powered Reason Analysis** — Classify return reasons from free-text input using large language models
- [ ] **Mobile Application** — Push notifications and alerts for fraud investigation teams on the go
- [ ] **Seller Dashboard** — Granular seller-level fraud analytics and reporting
- [ ] **Integration APIs** — Plug-and-play connectors for Shopify, WooCommerce, and Magento
- [ ] **Explainable AI** — Transparent reasoning for each flagged return using SHAP values
- [ ] **Multi-language Support** — Hindi and regional language UI for broader accessibility
- [ ] **Real-time Kafka Streaming** — Event-driven fraud detection pipeline for high-volume platforms

---

## Hackathon Context

This project was built for a hackathon focused on solving real-world problems in Indian e-commerce using AI/ML. ReturnGuard AI addresses a critical and often overlooked pain point — return fraud — that costs Indian e-commerce platforms significant revenue and operational overhead each year.

**Problem Domain:** E-Commerce Fraud Prevention  
**Target Market:** Indian E-Commerce Platforms (Flipkart, Meesho, Myntra, Amazon India, and others)  
**Approach:** AI/ML + Behavioral Heuristics + Real-time Fraud Intelligence Dashboard

---

## Team

**CodeCatalyst-07**

Built for the hackathon community.

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

[![GitHub stars](https://img.shields.io/github/stars/CodeCatalyst-07/Return_Guard_AI?style=social)](https://github.com/CodeCatalyst-07/Return_Guard_AI/stargazers)

If you found this project useful, consider giving it a star.

</div>
