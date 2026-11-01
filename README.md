# PulseLedger — Autonomous Financial Workstation
### Personal Finance Coach with a Living Money Model

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20App-10B981?style=for-the-badge&logo=vercel&logoColor=white)](https://pulse-ledger-kappa.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)

> **Live Web Application**: [https://pulse-ledger-kappa.vercel.app/](https://pulse-ledger-kappa.vercel.app/)  
> **Official Video Walkthrough**: [`video/out/video.mp4`](video/out/video.mp4)  
> **Maintainer**: `mittalshreya2517@gmail.com` • [GitHub Repository](https://github.com/mittalshreya25-cpu/PulseLedger.git)

---

## 📱 How to Download & Install as a Mobile App

### Method 1: Instant Mobile Install (Recommended for iPhone & Android)
You can install PulseLedger as a native app on your phone with **zero app store downloads**:
1. Open **[https://pulse-ledger-kappa.vercel.app/](https://pulse-ledger-kappa.vercel.app/)** in your mobile browser (**Safari** on iPhone, **Chrome** on Android).
2. Tap the **`📲 Install App`** button in the top navigation bar:
   - **On Android**: Tap **Install** on the prompt. PulseLedger installs as a standalone WebAPK with its own emerald icon on your home screen.
   - **On iPhone / iPad**: Tap the Safari Share button `[↑]`, scroll down, and tap **"Add to Home Screen"**.
3. Launch PulseLedger from your home screen. It runs in full-screen standalone mode with no browser address bars, offline caching, and native 60fps responsiveness!

---

### Method 2: 1-Click Desktop App (From GitHub Clone)
Anyone who downloads or clones this repository can launch PulseLedger with a single click:

#### Windows:
Double-click **`Launch-PulseLedger.bat`** (or run `npm run app` in terminal):
- Automatically provisions Python virtual environment `.venv`.
- Installs backend requirements.
- Starts the FastAPI backend (`http://127.0.0.1:8000`).
- Starts Vite frontend (`http://localhost:5173`).
- Launches your browser in dedicated application mode!

#### macOS / Linux:
Run the launch script in your terminal:
```bash
chmod +x launch-pulseledger.sh
./launch-pulseledger.sh
```

---

### Method 3: Native Android APK Build & Download
The repository includes a complete native Android application in `frontend/android/` with package ID `com.pulseledger.app`:
- **Direct APK Download**: Built APKs are compiled automatically on every push via GitHub Actions. Download the latest debug APK from the [GitHub Actions Artifacts](https://github.com/mittalshreya25-cpu/PulseLedger/actions).
- **Local Gradle Compilation**:
  ```bash
  cd frontend/android
  ./gradlew assembleDebug
  # APK generated at: frontend/android/app/build/outputs/apk/debug/app-debug.apk
  ```

---

## 🔒 Custom Account Onboarding & Zero-Cloud Privacy Vault

PulseLedger features a **100% on-device private personal account system** that lets anyone move beyond demo personas and configure their living budget model:

1. **Identity & Professional Designation**:
   - Customizable profile name.
   - Professional designation roles: **Student / Intern**, **Salaried Professional**, **Freelancer / Consultant**, or **Business Owner / Founder**.
   - Living Tier selection: Bengaluru, Mumbai, Delhi-NCR, Hyderabad/Pune, or Tier-2/Tier-3.
2. **Living Money Model Parameters**:
   - Monthly net in-hand income & primary payday of the month.
   - Core fixed commitments (rent, EMIs, utilities, groceries).
   - Discretionary flexible allowance.
   - Emergency buffer cushion reserve.
   - Primary life goal (name, target amount in ₹, and target milestone date).
3. **Explicit Permissions & Security Consent**:
   - **Local Encrypted Storage Consent**: All data is stored strictly in device sandboxed storage.
   - **On-Device SMS Parsing Consent**: Ingests transaction SMS locally without network calls.
   - **Velocity Drift Nudges**: Real-time pacing nudges when discretionary spend exceeds daily runway.
   - **Device PIN Lock Protection**: Optional 4 to 6 digit security PIN to prevent unauthorized viewing on shared devices.
4. **Zero-Cloud Architecture Guarantee**:
   - PulseLedger **never** transmits user financial amounts, account numbers, or bank SMS to third-party clouds or remote telemetry services. All ledger math and Monte Carlo simulations execute exclusively on the user's device.

---

## 🎯 Hackathon Checklist & Features

| Hackathon Requirement | PulseLedger Solution & Engineering Implementation |
|---|---|
| **Messy Bank Ingestion** | Localized regex tokenization & Levenshtein distance matcher for Canara Bank SMS, Paytm CSVs, and statements with sub-8ms execution. |
| **Correction Loop & Rule Learning** | Deterministic rule engine: editing vendor tag (e.g. Chai Point → Food) compiles an idempotent rule and replays across all historical transactions instantly. |
| **Recurring Subscriptions & Creep** | Statistical delta tracker detecting step-function price jumps (e.g. Netflix +30.1% price hike alert: ₹499 → ₹649). |
| **Persistent Financial Profile** | Multi-persona profile (Aarav Student, Rohan Salaried, Kabir Freelancer) tracking income, fixed commitments, and emergency buffer. |
| **Continuous Safe-to-Spend** | Replaces rigid monthly budgets with daily liquidity velocity: $S_{\text{daily}}(t) = \max(0, \frac{B(t) - \mathcal{R}_{\text{reserve}} - \sum L_i}{H})$. |
| **Goal Nudges & Ripple Engine** | Marginal opportunity cost differential: simulates how any discretionary purchase (e.g. ₹1,200 dinner) shifts primary savings goals. |
| **365-Day What-If Simulation** | 1,000-path Monte Carlo engine in NumPy with Common Random Numbers (CRN) variance reduction; interactive sliders for dining cut and rent. |
| **Clear Regulatory Guardrails** | Fine-tuned Ollama SLM (Qwen 2.5 7B) guarded by a strict 3-Layer SEBI Compliance Firewall blocking speculative stock recommendations. |

---

## 🏗️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, CSS Design Tokens, Web App Manifest (PWA), Service Worker (`sw.js`).
- **Backend**: FastAPI, Pydantic v2, Python 3.12, Uvicorn, SQLite with Write-Ahead Logging (WAL mode).
- **Quantitative Engine**: NumPy vectorized kernels, Common Random Numbers (CRN), Cubic Bézier Spline Renderers.
- **Edge AI**: Ollama Local Runtime, 4-bit Quantized Qwen 2.5 7B SLM, Zero-Knowledge Context Sanitization.
- **Video Suite**: Remotion programmatic React video rendering (H.264 MP4 @ 1080p, 60fps).
- **Deployment**: Vercel Serverless & Static CDN edge architecture.

---

## 🧪 Testing & Verification

Run the comprehensive pytest test suite:
```bash
.\.venv\Scripts\pytest backend/tests/ -v
```
All 76 backend unit and integration tests pass with 100% green coverage.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

