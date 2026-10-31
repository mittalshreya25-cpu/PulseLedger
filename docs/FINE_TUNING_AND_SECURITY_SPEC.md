# PulseLedger: AI Coach Fine-Tuning & Zero-Leakage Security Specification

> **Mentor & Lead Architect Review**: Hackathon Submission Master Guide  
> **Target Audience**: Hackathon Judges, Security Auditors, and Production ML Engineers  
> **Author**: PulseLedger Architecture Team

---

## 1. The Core Philosophy: Why We Never Let an LLM Do Math

In consumer fintech, the single most common mistake teams make is asking a raw or fine-tuned LLM to compute bank balances or calculate remaining daily budgets.

### The Fundamental Flaw of LLM Arithmetic
Large Language Models are probabilistic next-token predictors. Even fine-tuned models:
- **Hallucinate arithmetic** (e.g. asserting $1,200 - 450 = 850$ on one turn and $750$ on another).
- **Drift over dates** (confusing leap years, months with 30 vs 31 days).
- **Cannot guarantee regulatory compliance** (risk of leaking speculative stock advice).

### PulseLedger's Hybrid Workstation Architecture
PulseLedger enforces a strict architectural boundary (**Rule 1 of `RULES.md`**):
```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER INCOMING PROMPT                            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: INBOUND COMPLIANCE FIREWALL (`backend/engines/guardrails.py`) │
│ • Regex screening for 33+ blocked tickers (Nifty, Tata, Reliance, BTC) │
│ • Intercepts speculative asset recommendation intent                   │
│ • Pivots immediately to educational asset classes if breached          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (If clean)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LAYER 2: DETERMINISTIC PYTHON ENGINE (`backend/engines/coach.py`)      │
│ • Safe-to-Spend Runway (`safe_spend.py` - integer paise math)         │
│ • Goal Ripple Delay Engine (`simulate.py` - Monte Carlo bootstrap)    │
│ • Subscription Detector (`recurring.py` - median interval analysis)    │
│ • Monthly Category Breakdown (`report.py` - verified double-entry)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Exact verified numbers)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LAYER 3: CONTEXT-GROUNDED AI COACH (Gemini 2.5 Flash / Fine-Tuned SLM) │
│ • Synthesizes empathetic, concise, actionable advice                   │
│ • Grounded strictly in Python-verified figures                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LAYER 4: OUTBOUND COMPLIANCE AUDITOR (`validate_model_output`)         │
│ • Verifies no unauthorized securities or ticker symbols escaped        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Step-by-Step Hand-Holding: How to Fine-Tune the Coach

Fine-tuning is used exclusively to adapt the **conversational tone, empathy, persona, and intent alignment**—not to teach it arithmetic.

### Step 1: Generate the Training Dataset
Run our automated dataset generator in the repo:
```powershell
.\.venv\Scripts\python.exe scripts/generate_finetune_dataset.py
```
This generates two production-ready datasets:
1. `data/training/pulseledger_finetune_gemini.jsonl` (Google Gemini / Vertex AI format)
2. `data/training/pulseledger_finetune_chatml.jsonl` (OpenAI / Hugging Face ChatML format)

Each training sample contains a structured pair:
- **System Instruction**: Enforcing the persona, zero-math rule, and compliance boundaries.
- **User Prompt**: Realistic financial questions (affordability, goal progress, subscription hikes).
- **Model Target**: Exact, empathetic answers grounded in Python metrics.

---

### Step 2: Uploading & Fine-Tuning in Google AI Studio (Gemini)

If you wish to trigger a fine-tuned Gemini model checkpoint:

1. **Open Google AI Studio**: Navigate to [aistudio.google.com](https://aistudio.google.com).
2. **Access Tuned Models**: Click on **"Tuned Models"** in the left sidebar navigation.
3. **Create New Tuning Job**:
   - Click **"Create Tuned Model"**.
   - Select Base Model: `gemini-1.5-flash` or `gemini-2.0-flash`.
4. **Upload Dataset**:
   - Select `data/training/pulseledger_finetune_gemini.jsonl`.
5. **Hyperparameter Configuration**:
   - **Epochs**: `4` (prevents catastrophic forgetting of general reasoning).
   - **Learning Rate**: `0.001` with cosine decay.
   - **Batch Size**: `4`.
6. **Deploy**:
   - Once training completes (~10-15 minutes), Google AI Studio gives you a model endpoint ID (e.g. `tunedModels/pulseledger-coach-v1`).
   - Add this ID to your `.env` file:
     ```env
     GEMINI_COACH_MODEL_ID=tunedModels/pulseledger-coach-v1
     ```

---

### Step 3: Local Edge Fine-Tuning (Qwen-2.5-Coder / Llama-3 via Unsloth)

For a 100% on-device private model running locally via Ollama or ONNX:

```python
from unsloth import FastLanguageModel
import torch

# 1. Load 4-bit quantized base model
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="Qwen/Qwen2.5-1.5B-Instruct",
    max_seq_length=2048,
    load_in_4bit=True,
)

# 2. Add LoRA Adapters
model = FastLanguageModel.get_peft_model(
    model,
    r=16,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_alpha=32,
    lora_dropout=0,
    bias="none",
)

# 3. Train with SFTTrainer
from trl import SFTTrainer
from transformers import TrainingArguments

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset="data/training/pulseledger_finetune_chatml.jsonl",
    dataset_text_field="text",
    max_seq_length=2048,
    args=TrainingArguments(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=5,
        max_steps=60,
        learning_rate=2e-4,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=1,
        output_dir="data/models/pulseledger-lora",
    ),
)
trainer.train()
```

---

## 3. Privacy & Zero-Knowledge Security Guarantees

PulseLedger's primary differentiator is **absolute privacy**. The user's financial life never becomes training fodder for public LLMs.

### 1. On-Device Deterministic Regex Parser
- Inbound bank SMS messages (Canara, HDFC, SBI, Paytm) are processed locally on the client/local server by [`backend/app/parsers/canara_sms.py`](file:///c:/Users/hp1/Downloads/pulseledger/backend/app/parsers/canara_sms.py).
- Zero raw SMS text is ever transmitted over the network for parsing.

### 2. Strict OTP & PII Immunity
- The parser explicitly filters and drops all OTPs, personal messages, and passwords.
- Account numbers are masked (`XXXXXXXX1234`).

### 3. Encrypted Local SQLite Vault
- All monetary amounts are recorded in integer paise inside an encrypted local database.
- PulseLedger requires zero bank login credentials, passwords, or MPINs.

---

## 4. Hackathon Submission Strategy (With 1.5 Hours Left)

As a hackathon judge, here is the golden rule for the final 90 minutes:
> **Never risk breaking a working build by waiting on a live cloud GPU queue right before the deadline.**

### How to Pitch This to Win:
1. **Show the Working Product**:
   - Demonstrate the live Safe-to-Spend runway (`₹120`), the 1-click autonomous SMS simulation (`Swiggy -₹180`), and the tabular financial ledger.
2. **Demonstrate the Coach**:
   - Click `"🍔 Can I afford dinner (₹1,200)?"` to show how the coach computes the exact overage, goal ripple delay, and self-healing daily cap.
   - Click `"⚡ Test: Buy Reliance?"` to show the 3-layer regulatory guardrail intercepting speculative assets with educational asset pivots.
3. **Show the Machine Learning Rigor**:
   - Point to `scripts/generate_finetune_dataset.py` and `docs/FINE_TUNING_AND_SECURITY_SPEC.md`.
   - Explain to the judges: *"We designed the complete synthetic fine-tuning pipeline for Gemini and local SLMs, but enforced a strict architectural separation: all arithmetic is verified by Python engines to ensure 100% precision and SEBI compliance."*

Judges give highest marks to teams that understand **why** architecture and compliance matter in production fintech.

