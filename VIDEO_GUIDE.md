# PulseLedger — Remotion Video Production & Recording Guide

This directory contains the automated **Remotion** video production suite for **PulseLedger**, built with React, TypeScript, and the `@remotion/cli` framework (`https://github.com/remotion-dev/remotion.git`).

---

## 🚀 Quick Start: Remotion Video Studio

### 1. Launch Interactive Video Player / Studio
To preview the entire 3.5-minute video, scrub frame-by-frame, and inspect all scenes:
```bash
cd video
npm start
```
This opens the **Remotion Studio** in your browser at `http://localhost:3000`. You can play, pause, jump between timestamps, and adjust speed.

### 2. Render Full HD MP4 Video
To render the complete video (`1920x1080` @ 30 FPS, 6,300 frames) to an MP4 file:
```bash
cd video
npm run render
```
The rendered video will be saved to `video/out/video.mp4`.

---

## 📜 Voiceover Script & Timing
The complete, word-for-word voiceover script with on-screen visual directions is located in:
👉 [`VOICEOVER_SCRIPT.md`](file:///c:/Users/hp1/Downloads/pulseledger/VOICEOVER_SCRIPT.md)

### Scene Timeline Breakdown (Total: 3m 30s):
- **Scene 1 `[00:00 - 00:30]`**: Introduction & The Local-First Philosophy (Zero-cloud privacy, integer-paise math, mobile + desktop framing)
- **Scene 2 `[00:30 - 01:15]`**: The Overview Dashboard (Dynamic Safe-to-Spend gauge, Autonomous SMS ingestion feed, instant Goal Ripple delay)
- **Scene 3 `[01:15 - 02:00]`**: Audited Ledger Table 1 & Self-Learning Rule Replay (Replaying reclassified rules across historical entries, Netflix subscription price-creep alert)
- **Scene 4 `[02:00 - 02:45]`**: 365-Day Monte Carlo Cash-Flow Trajectory (Probabilistic P10–P90 fan cone, live What-If sliders, Reverse Income CTC Tax Solver)
- **Scene 5 `[02:45 - 03:15]`**: Guarded AI Financial Coach (Local Ollama Qwen SLM inference, SEBI 3-layer intent firewall blocking speculative stock tips)
- **Scene 6 `[03:15 - 03:30]`**: Mobile Experience Showcase & Outro (Full smartphone walkthrough with floating navigation dock, GitHub repository link)

---

## 🛠️ Video Architecture (`video/src/`)
- `Root.tsx`: Registers the master composition `PulseLedgerWalkthrough` (6,300 frames = 210s @ 30fps).
- `Walkthrough.tsx`: Sequencer connecting all 6 timed scenes using Remotion's `<Sequence>`.
- `scenes/Scene1Intro.tsx`: Kinetic brand reveal, floating feature tags, and 3D device preview.
- `scenes/Scene2Overview.tsx`: Desktop workstation mockup showing live Safe-to-Spend dial and incoming Canara Bank SMS.
- `scenes/Scene3Ledger.tsx`: Table 1 register, integer paise precision, and rule learning toast.
- `scenes/Scene4Plan.tsx`: 365-day Monte Carlo fan chart, P10–P90 shaded bands, and what-if sliders.
- `scenes/Scene5Coach.tsx`: Conversational local AI coach and SEBI regulatory firewall intervention.
- `scenes/Scene6Outro.tsx`: Smartphone mockup with mobile layout, floating dock, and GitHub links.
- `components/PhoneMockup.tsx`: iPhone device frame with dynamic island and home bar.
- `components/DesktopFrame.tsx`: Studio desktop browser frame with window controls.

