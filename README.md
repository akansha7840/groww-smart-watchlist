# Chronos — Context-Aware Smart Market Watchlist
### Built for Groww CODE 2026 Engineering Challenge

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Available%20Online-00D09C?style=for-the-badge&logo=render&logoColor=white)](https://groww-smart-watchlist-nu8h.onrender.com/)

**🌐 Working Application URL:** [https://groww-smart-watchlist-nu8h.onrender.com/](https://groww-smart-watchlist-nu8h.onrender.com/)

> **"Traditional watchlists show what changed from yesterday's close. Chronos tells you what meaningfully changed since *you* were away, why it happened, and what demands your attention right now."**

---

##  The Problem We Are Solving

Most market watchlists act like passive price boards:
* They anchor changes to an arbitrary fixed point (yesterday's 4:00 PM closing price).
* They treat all price ticks identically—a $+0.2\%$ drift triggers the same blinking green lights as an institutional $4\times$ volume breakout.
* When a user opens their app during lunch after checking in the morning, they have **zero context** on what transpired in their absence.

**Chronos introduces the Temporal Delta & Attention Engine**:
Instead of dumping raw numbers, Chronos remembers when you last checked, filters out baseline market noise, and surfaces high-signal changes with plain-English catalyst explanations.

---

## 📐 Architecture & Key Design Decisions

```
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND (React + Vite + Tailwind)          │
│  - Groww Dark/Light Theme   - "While You Were Away" Briefing│
│  - Attention Badges         - Judge Sandbox & Time-Travel   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP REST + Real-time SSE Stream
┌──────────────────────────▼──────────────────────────────────┐
│                 BACKEND (Python / FastAPI)                  │
│                                                             │
│  ┌───────────────────────┐       ┌────────────────────────┐ │
│  │   Watchlist API       │       │  Temporal Diff Engine  │ │
│  │   (CRUD, Reorder)     │       │  (Z-Score, Vol, Alpha) │ │
│  └───────────┬───────────┘       └────────────▲───────────┘ │
│              │                                │             │
│  ┌───────────▼───────────┐       ┌────────────┴───────────┐ │
│  │   SQLAlchemy ORM      │       │  Market Service        │ │
│  │   (MySQL 8.0)         │       │  + In-Memory TTL Cache │ │
│  └───────────────────────┘       └────────────▲───────────┘ │
│                                               │             │
│                                  ┌────────────┴───────────┐ │
│                                  │  Yahoo Finance Feed    │ │
│                                  │  (NSE Indian Tickers)  │ │
│                                  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1. What Counts as a "Meaningful Change"?
Chronos defines meaningful change using a 4-factor mathematical scoring model:

$$\text{Attention Score} = 0.35 \cdot Z_{\Delta\text{Price}} + 0.30 \cdot \left(\frac{V_{\text{actual}}}{V_{\text{expected}}}\right) + 0.20 \cdot |\text{Alpha}_{\text{sector}}| + 0.15 \cdot \text{MilestoneWeight}$$

1. **Normalized Volatility ($Z$-Score):** Computes $\frac{|\Delta \%|}{\sigma_{\text{sector}}}$. Moves on low-beta utility stocks are weighted more heavily than noise on volatile small-caps.
2. **Volume Anomaly Ratio ($V_{\text{act}} / V_{\text{exp}}$):** Identifies institutional volume accumulation ($>2\times$ average volume).
3. **Idiosyncratic Alpha vs Sector Beta:** Compares stock move against its sector benchmark. (e.g., If Nifty IT fell $-2\%$, but TCS gained $+0.5\%$, TCS possesses $+2.5\%$ company-specific strength).
4. **Structural Milestone Breaks:** Flags tests or breaches of 52-week High/Low and Day High/Low boundaries.

Stocks are dynamically categorized into:
* 🔴 **HIGH ATTENTION (Action Required):** Score $\ge 0.60$ or milestone breach or volume $\ge 2.2\times$.
* 🟡 **DEVELOPING (Momentum Drift):** Score between $0.35$ and $0.60$.
* 🟢 **NOISE (Calm / In-Line):** Score $< 0.35$ (Normal intraday wiggle, collapsed by default).

---

##  Edge Cases & Resilience Engineering

| Edge Case | How Chronos Handles It |
|---|---|
| **Upstream API Rate Limiting (HTTP 429)** | In-memory 5-second TTL cache ensures simultaneous user requests reuse cached quotes rather than hammering Yahoo Finance. |
| **Out-of-Order Packets** | Monotonic sequence counters on ticks ensure delayed network packets never overwrite newer prices. |
| **Feed Stagnation / Latency (>15s)** | Backend detects stale feeds and marks `is_stale = true`. The UI gracefully dims prices and displays an amber warning badge. |
| **Offline / Network Outage** | Embedded resilient fallback generator provides deterministic quotes if external networks fail. |
| **Market Circuit Breakers** | Circuit halt flags (`UPPER_CIRCUIT`, `HALTED`) freeze execution state and present specialized visual badges. |

---

##  The Judge Sandbox & Chaos Drawer
During the 5-minute live demo, judges can test all edge cases directly on screen:
* **Time-Travel Scrubber:** Drag the slider from 0 to 4 hours ago to watch the Diff Engine dynamically recalculate what changed in that exact duration.
* **Simulate Stale Feed:** Demonstrates graceful degradation when data lag occurs.
* **Inject Flash Shock:** Spikes a stock by $+4.5\%$ on high volume to showcase real-time re-ranking into 🔴 High Attention.

---

##  Quick Setup & Run Instructions

### Prerequisites
* **Python 3.10+** (tested on Python 3.14)
* **Node.js 18+** & **npm**
* **MySQL 8.0** running on `localhost:3306`

### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate      # Windows (or: source venv/bin/activate on Mac/Linux)

# Install dependencies
pip install -r requirements.txt

# Run migrations & start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
* **Interactive API Documentation:** Open `http://localhost:8000/docs` in your browser.

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
* **Application URL:** Open `http://localhost:5173` in your browser.

---

##  Automated Testing
Run the backend test suite verifying noise rejection, volume anomalies, and milestone flags:
```bash
cd backend
.\venv\Scripts\pytest tests
```

---


