# MedIntel AI
### Multimodal Medical Intelligence and Predictive Healthcare Analytics System

> **AI-Assisted Clinical Decision Support System (CDSS)**
> *For Investigational Healthcare Reference Only — NOT an Autonomous Medical Diagnostic Device.*

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [ML Models & Artifacts](#3-ml-models--artifacts)
4. [Project Structure](#4-project-structure)
5. [Installation & Setup](#5-installation--setup)
6. [Running the Application](#6-running-the-application)
7. [Tab-by-Tab Usage Guide](#7-tab-by-tab-usage-guide)
8. [API Reference](#8-api-reference)
9. [Running Tests](#9-running-tests)
10. [Scripts Reference](#10-scripts-reference)
11. [Clinical Governance & Safety](#11-clinical-governance--safety)
12. [Known Limitations](#12-known-limitations)

---

## 1. Overview

**MedIntel AI** is a research-grade multimodal clinical intelligence platform that integrates three independent patient data streams — structured symptom vectors, chest radiographs, and unstructured medical transcription notes — into a unified diagnostic synthesis engine.

### Key Capabilities

| Module | What it does |
|---|---|
| **Clinical Symptom Assessment** | 174-symptom vectorisation → XGBoost 37-class classifier → TreeSHAP attribution |
| **Chest X-Ray Imaging** | Custom CNN binary classifier (Normal vs Pneumonia) → Grad-CAM visual evidence |
| **Biomedical NLP** | BioBERT NER across 11 clinical categories + S-PubMedBERT semantic case retrieval |
| **Late Evidence Fusion** | Dynamic trimodal aggregation → Evidence Index + cross-modality concordance |
| **Explainability (XAI)** | Global/local SHAP charts, Grad-CAM gallery, NLP entity attribution |
| **AI Healthcare Assistant** | Natural language copilot orchestrating 8 backend diagnostic tools |
| **Cases & Analytics** | Persistent SQLite audit registry and usage analytics |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MEDINTEL AI — REACT FRONTEND                     │
│         React 18 + TypeScript + Vite + Tailwind CSS                 │
│  Landing | Dashboard | Clinical | Imaging | NLP | Fusion |          │
│  Explainability | Assistant | Cases | Analytics | Model Info        │
└──────────┬──────────────┬───────────────┬──────────────────────────┘
           │              │               │
           ▼              ▼               ▼
    /api/clinical   /api/imaging    /api/nlp    /api/fusion
    /api/assistant  /api/cases      /api/analytics  /api/explainability
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND (port 8000)                       │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │  Clinical   │  │   Imaging    │  │     NLP      │  │ Fusion  │ │
│  │  Service    │  │   Service    │  │   Service    │  │ Service │ │
│  │  XGBoost   │  │ Custom CNN  │  │ BioBERT NER  │  │ Weights │ │
│  │  TreeSHAP  │  │  Grad-CAM   │  │ S-PubMedBERT │  │ Concord.│ │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └────┬────┘ │
│         └────────────────┴──────────────────┴───────────────┘      │
│                          │                                          │
│              ┌───────────┴───────────┐                             │
│              │    Model Manager      │  (singleton, loads at boot)  │
│              │  model_manager.py     │                             │
│              └───────────────────────┘                             │
│                          │                                          │
│         ┌────────────────┴──────────────────┐                      │
│         │       Agent Service               │                      │
│         │  8 diagnostic tool orchestrator   │                      │
│         └────────────────┬──────────────────┘                      │
│                          │                                          │
│              ┌───────────┴───────────┐                             │
│              │   SQLite Database     │  (medintel.db)              │
│              │  Cases, Interactions  │                             │
│              └───────────────────────┘                             │
└─────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     ML ARTIFACTS  (models/)                         │
│  clinical_xgboost.pkl       clinical_features.pkl                   │
│  clinical_label_encoder.pkl  clinical_class_mapping.json            │
│  custom_cnn_best.pth        imaging/final_imaging_model_metadata    │
│  nlp/medical_text_embeddings.npy                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. ML Models & Artifacts

### Clinical XGBoost Classifier

| Property | Value |
|---|---|
| Algorithm | XGBoost (`multi:softprob`) |
| Classes | 37 diseases |
| Features | 174 binary symptom features |
| Training records | ~99,970 rows |
| Class balancing | `compute_sample_weight('balanced')` |
| Accuracy | 61.46% |
| Macro F1 | 41.20% |
| Weighted F1 | 62.53% |
| Explainability | TreeSHAP (exact game-theoretic attribution) |
| Artifact | `models/clinical_xgboost.pkl` |

**37 Disease Classes:**
Amyotrophic Lateral Sclerosis, Asthma, COPD, COVID-19, Chronic Kidney Disease, Cirrhosis, Common Cold, Coronary Artery Disease, Cystic Fibrosis, Dengue, Depression, Ehlers-Danlos Syndrome, Epilepsy, Flu, Gastritis, Gaucher Disease, Generalized Anxiety Disorder, Hypertension, Hyperthyroidism, Hypothyroidism, Inflammatory Bowel Disease, Irritable Bowel Syndrome, Marfan Syndrome, Migraine, Multiple Sclerosis, Niemann-Pick Disease, Obesity, Osteoarthritis, Osteopetrosis, Peptic Ulcer Disease, Pneumonia, Polycystic Ovary Syndrome, Spinal Muscular Atrophy, Stroke, Systemic Lupus Erythematosus, Tuberculosis, Type 2 Diabetes

### Custom CNN — Chest X-Ray

| Property | Value |
|---|---|
| Architecture | 4-Block CNN (PyTorch) |
| Task | Binary: Normal vs Pneumonia |
| Dataset | Kaggle Chest X-Ray (5,863 images) |
| Test Accuracy | **84.46%** |
| ROC-AUC | **93.25%** |
| Grad-CAM target | `block4.0` (Conv2d 128→256) |
| Artifact | `models/imaging/custom_cnn_best.pth` |

### Biomedical NLP

| Property | Value |
|---|---|
| NER model | `d4data/biomedical-ner-all` (BioBERT) |
| Embedding model | `pritamdeka/S-PubMedBert-MS-MARCO` |
| Knowledge base | 4,966 MTSamples clinical transcriptions |
| Embedding dim | 768 |
| Entity categories | 11 (PROBLEM, SYMPTOM, MEDICATION, TEST, ANATOMY, PROCEDURE, ...) |
| Context modifiers | PRESENT, NEGATED, UNCERTAIN, HISTORICAL |

### Late Evidence Fusion

| Property | Value |
|---|---|
| Architecture | Dynamic weight rebalancing engine |
| Modalities | Clinical (40%) + Imaging (40%) + NLP (20%) |
| Output | Overall Evidence Index (0–100) + Concordance status |
| Demonstration cases | 500 precomputed synthetic profiles |

---

## 4. Project Structure

```
MedIntel_AI/
├── backend/
│   ├── app/
│   │   ├── config.py                   # Pydantic-settings, path resolvers
│   │   ├── database.py                 # SQLAlchemy engine & session factory
│   │   ├── dependencies.py             # DB session FastAPI dependency
│   │   ├── main.py                     # Lifespan, CORS, router mounting
│   │   ├── models/
│   │   │   ├── custom_cnn.py           # Custom CNN architecture
│   │   │   └── db_models.py            # SQLAlchemy ORM models
│   │   ├── routes/
│   │   │   ├── clinical.py             # /api/clinical/*
│   │   │   ├── imaging.py              # /api/imaging/*
│   │   │   ├── nlp.py                  # /api/nlp/*
│   │   │   ├── fusion.py               # /api/fusion/*
│   │   │   ├── explainability.py       # /api/explainability/*
│   │   │   ├── assistant.py            # /api/assistant/*
│   │   │   ├── cases.py                # /api/cases/*
│   │   │   └── analytics.py            # /api/analytics/*
│   │   ├── schemas/                    # Pydantic V2 request/response models
│   │   └── services/
│   │       ├── model_manager.py        # Singleton artifact loader (loads at startup)
│   │       ├── clinical_service.py     # XGBoost vectorisation, TreeSHAP, validation
│   │       ├── imaging_service.py      # CNN inference, dynamic Grad-CAM
│   │       ├── nlp_service.py          # NER extraction, semantic retrieval
│   │       ├── fusion_service.py       # Late evidence fusion engine
│   │       ├── agent_service.py        # 8-tool clinical assistant orchestrator
│   │       └── case_service.py         # Case registry & audit log
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/client.ts               # Typed API client for all endpoints
│   │   ├── components/
│   │   │   ├── GaugeChart.tsx          # Confidence gauge widget
│   │   │   ├── Header.tsx              # Top navigation bar
│   │   │   ├── ImageComparator.tsx     # X-ray vs Grad-CAM slider
│   │   │   ├── SafetyDisclaimer.tsx    # Mandatory clinical disclaimer
│   │   │   ├── Sidebar.tsx             # Left navigation sidebar
│   │   │   ├── SyntheticBadge.tsx      # SYNTHETIC DEMONSTRATION badge
│   │   │   └── ThemeToggle.tsx         # Dark/light mode toggle
│   │   ├── views/
│   │   │   ├── LandingView.tsx         # Public landing page
│   │   │   ├── DashboardView.tsx       # Module overview dashboard
│   │   │   ├── ClinicalView.tsx        # Clinical symptom assessment
│   │   │   ├── ImagingView.tsx         # Chest X-ray analysis
│   │   │   ├── NLPView.tsx             # Medical NLP (roadmap preview)
│   │   │   ├── FusionView.tsx          # Multimodal late evidence fusion
│   │   │   ├── ExplainabilityView.tsx  # XAI studio
│   │   │   ├── AssistantView.tsx       # AI healthcare assistant chat
│   │   │   ├── CasesView.tsx           # Clinical case browser
│   │   │   ├── AnalyticsView.tsx       # Usage analytics
│   │   │   └── ModelInfoView.tsx       # Model benchmark comparison
│   │   ├── App.tsx                     # Root router (hash-based navigation)
│   │   ├── main.tsx                    # React DOM entry point
│   │   └── types/index.ts              # TypeScript interfaces
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── models/
│   ├── clinical_xgboost.pkl            # Trained XGBoost classifier
│   ├── clinical_features.pkl           # Ordered 174-feature list (training order)
│   ├── clinical_label_encoder.pkl      # sklearn LabelEncoder (37 classes)
│   ├── clinical_class_mapping.json     # {index: disease_name} mapping
│   ├── clinical/
│   │   ├── clinical_global_shap_importance.csv
│   │   ├── clinical_patient_shap_example.csv
│   │   └── backups/                    # Auto-backups of old model artifacts
│   ├── imaging/
│   │   ├── custom_cnn_best.pth
│   │   └── final_imaging_model_metadata.json
│   ├── nlp/
│   │   ├── medical_text_embeddings.npy  # 4,966 × 768 precomputed embeddings
│   │   ├── final_ner_config.json
│   │   └── nlp_module_metadata.json
│   └── fusion/
│       └── final_fusion_metadata.json
│
├── datasets/
│   ├── clinical_dataset.csv            # 99,970-row synthetic symptom-disease dataset
│   ├── mtsamples.csv                   # 4,966 clinical transcription records
│   └── chest_xray/                     # Kaggle Chest X-Ray image dataset
│
├── results/
│   ├── imaging/gradcam/                # Precomputed Grad-CAM overlays (.png)
│   ├── nlp/
│   │   ├── standardized_nlp_output.jsonl
│   │   └── nlp_explainability_examples.json
│   └── fusion/
│       ├── synthetic_multimodal_cases.jsonl
│       └── final_multimodal_explanations.jsonl
│
├── scripts/
│   ├── retrain_clinical_model.py       # Clinical XGBoost retraining pipeline
│   ├── clinical_sanity_test.py         # 5-case regression test suite
│   ├── sample_clinical_call.py         # CLI clinical prediction demo
│   ├── start_backend.ps1               # Backend launcher (PowerShell)
│   ├── start_frontend.ps1              # Frontend launcher (PowerShell)
│   └── start_all.bat                   # Unified Windows launcher
│
├── tests/
│   ├── test_backend_foundation.py      # App startup & health check (5 tests)
│   ├── test_clinical_service.py        # Clinical prediction & SHAP (6 tests)
│   ├── test_imaging_service.py         # CNN & Grad-CAM (5 tests)
│   ├── test_nlp_service.py             # NER & embeddings (3 tests)
│   ├── test_fusion_and_explainability.py  # Fusion & XAI (6 tests)
│   └── test_cases_analytics_and_assistant.py  # Cases & chat (6 tests)
│
├── medintel.db                         # SQLite database (auto-created)
├── .env                                # Environment variables
├── .env.example                        # Environment variable template
└── README.md                           # This file
```

---

## 5. Installation & Setup

### Prerequisites

- **Python 3.10–3.14**
- **Node.js 18+ and npm**
- **Windows** (PowerShell scripts provided) or Linux/macOS

### Step 1 — Clone & enter the project

```bash
cd c:\Projects\MedIntel_AI
```

### Step 2 — Backend Python dependencies

```powershell
pip install -r backend/requirements.txt
```

Key packages installed:
- `fastapi`, `uvicorn`, `pydantic-settings`
- `xgboost==2.1.4`, `scikit-learn`, `shap`
- `torch`, `torchvision`, `pillow`
- `pandas`, `numpy`, `scipy`
- `sqlalchemy`, `httpx`, `pytest`

### Step 3 — Frontend Node dependencies

```powershell
cd frontend
npm install
cd ..
```

### Step 4 — Environment variables

Copy `.env.example` to `.env` and adjust if needed:

```powershell
copy .env.example .env
```

To enable natural-language explanations in the Clinical Assistant, add a Groq API key to `.env`:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
```

The key stays on the backend. MEDINTEL's analysis tools produce the findings; Groq only explains those findings. Without a key, the assistant uses its built-in response. Do not send identifiable patient information to an external API.

Key variables (defaults work out of the box):

```env
DEBUG=True
HOST=127.0.0.1
PORT=8000
DATABASE_URL=sqlite:///./medintel.db
CLINICAL_MODEL_PATH=models/clinical_xgboost.pkl
CLINICAL_FEATURES_PATH=models/clinical_features.pkl
CLINICAL_CLASS_MAPPING_PATH=models/clinical_class_mapping.json
CLINICAL_LABEL_ENCODER_PATH=models/clinical_label_encoder.pkl
IMAGING_MODEL_PATH=models/imaging/custom_cnn_best.pth
```

---

## 6. Running the Application

### Option A — Unified Windows Launcher (Recommended)

```powershell
```

Opens two terminal windows automatically — one for backend, one for frontend.

### Option B — Manual (two separate terminals)

**Terminal 1 — Backend:**
```powershell
.\scripts\start_backend.ps1
# OR directly:
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```powershell
.\scripts\start_frontend.ps1
# OR directly:
cd frontend && npm run dev
```

### Access Points

| URL | Purpose |
|---|---|
| `http://localhost:5173` | Main application (React frontend) |
| `http://127.0.0.1:8000/docs` | Interactive Swagger API documentation |
| `http://127.0.0.1:8000/redoc` | ReDoc API documentation |
| `http://127.0.0.1:8000/health` | Backend health check (JSON) |

### Startup Sequence

When the backend starts, it loads all ML artifacts in order:
1. ✅ Clinical XGBoost + features + label encoder + class mapping (validated: 174 features, 37 classes)
2. ✅ Custom CNN (PyTorch, eval mode)
3. ✅ NLP embeddings (4,966 × 768) + standardised records
4. ✅ Fusion metadata + 500 synthetic cases

If any required artifact is missing, the server **refuses to start** and logs the exact missing file path.

---

## 7. Tab-by-Tab Usage Guide

### 🏠 Landing Page

The public entry page. Shows the system overview and module cards.

- Click **"Enter Clinical Workspace"** → enters the app at the Dashboard
- Click any module card → jumps directly to that tab
- URL: `/` (no hash)

---

### 📊 Dashboard

High-level status overview of all four AI modules.

- Shows live accuracy and status cards for Clinical, Imaging, NLP, and Fusion
- Click any card → navigates to that module's tab
- URL: `/#/app/dashboard`

---

### 🩺 Clinical Symptom Assessment

**Inputs:** Select symptoms from the 174-feature catalog
**Output:** Top-5 disease predictions + TreeSHAP attribution

**Step-by-step:**

1. **Load a preset scenario** (optional):
   - Click one of the 4 quick-load buttons (Respiratory, Cardiovascular, Neurological, Hepatobiliary)
   - Instantly loads a curated set of symptom IDs

2. **Manual selection**:
   - Use the **Search bar** to find symptoms by name (e.g. "cough", "fever", "photophobia")
   - Use **Category filter pills** to narrow to one organ system
   - Click a symptom chip → turns **blue** = selected, **grey** = not selected
   - Selected symptoms appear in the **Active Patient Vector** shelf — click any chip to remove it

3. Click **"Run Clinical Assessment"**

4. **Results panel** shows:
   - **Primary classification** — top predicted disease + confidence %
   - **Top-5 Differential Conditions** — probability bars for the 5 most likely diseases
   - **Symptoms Used for Prediction** — confirms the exact features the model received
   - **TreeSHAP Attribution** — green = symptom supports prediction, red = symptom opposes it
   - **Clinical disclaimer** in amber box

> **Important:** Symptoms must be selected using the catalog IDs (e.g. `symptom_fever`). Free-text input is not supported in the current UI. URL: `/#/app/clinical`

---

### 🔬 Chest X-Ray Imaging

**Inputs:** Chest X-ray image (JPG/PNG, max 10 MB)
**Output:** Normal vs Pneumonia classification + Grad-CAM heatmap

**Step-by-step:**

1. **Load a sample** (optional):
   - Click **"Normal Sample"** or **"Pneumonia Sample"** → loads a built-in test image from the backend

2. **Upload your own image**:
   - Drag & drop a `.jpg`/`.jpeg`/`.png` file onto the upload zone, OR
   - Click the zone to open the file picker

3. Click **"Analyze Radiograph"**

4. **Results panel** shows:
   - **Gauge chart** — visual confidence meter (0–100%)
   - **Classification label** — NORMAL or PNEUMONIA
   - **Probability scores** for both classes
   - **Before/After image comparator** — drag the slider to compare the original X-ray vs Grad-CAM overlay
   - The Grad-CAM heatmap (blue→red scale) highlights regions that drove the prediction

> **Note:** The model classifies **frontal (PA/AP) chest X-rays only**. It does not handle CT scans, lateral views, or non-chest images. URL: `/#/app/imaging`

---

### 📄 Biomedical NLP

**Status: In Development (UI roadmap preview)**

The backend NLP API is fully operational, but the interactive frontend is not yet wired up. The tab currently shows:
- A description of the planned 6-category NER system
- A sample clinical transcription demonstrating what the module will extract
- The entity category colour scheme

**To use the NLP API directly (backend):**

```bash
# Text input
curl -X POST http://127.0.0.1:8000/api/nlp/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "Patient has fever and productive cough. No hemoptysis.", "retrieve_similar": true, "top_k": 3}'

# File upload
curl -X POST http://127.0.0.1:8000/api/nlp/upload \
  -F "file=@clinical_note.txt" \
  -F "retrieve_similar=true" \
  -F "top_k=3"
```

URL: `/#/app/nlp`

---

### 🔗 Multimodal Fusion

**Inputs:** Any combination of symptoms + chest X-ray + clinical note
**Output:** Unified Evidence Profile with concordance status

The tab has two modes:

#### Mode 1 — Synthetic Demonstration Cases (default)

Pre-built demonstration profiles using data from three independent research datasets.

1. The page auto-loads the first of 500 synthetic cases
2. Select a different case from the **dropdown list** on the left panel
3. Click **"Load Case"** to view its evidence profile
4. Each profile shows:
   - Per-modality predictions (Clinical, Imaging, NLP)
   - **Evidence Index gauge** (0–100) — how much evidence is present overall
   - **Concordance status** — CONCORDANT (all modalities agree) or DISCORDANT (conflict detected)
   - Modality contribution weights
   - SYNTHETIC DEMONSTRATION badge (🔶) — these are not real patient records

#### Mode 2 — Custom Live Analysis

1. Switch to the **"Custom Analysis"** tab at the top
2. Toggle each modality on/off:
   - **Clinical** — type comma-separated symptom IDs (e.g. `symptom_fever, symptom_cough`)
   - **Imaging** — upload a chest X-ray file
   - **NLP** — paste a clinical report in the text box
3. Click **"Run Multimodal Analysis"**

URL: `/#/app/fusion`

---

### 🧠 Explainability (XAI Studio)

Four explainability panels:

#### Clinical SHAP — Global
- Bar chart of the **top 30 most influential symptoms** across all training data
- Based on TreeSHAP mean absolute values computed over the training set
- Higher bar = that symptom had more influence on model decisions overall

#### Clinical SHAP — Patient Level
- SHAP waterfall chart for a **single example patient**
- Green = symptom pushed the prediction **upward** toward the top disease
- Red = symptom pushed the prediction **downward**
- Shows the base value + each symptom's additive contribution

#### Grad-CAM Gallery (Imaging)
- Precomputed Grad-CAM visual overlays from the CNN model
- Heatmap applied at layer `block4.0` (final convolutional block)
- Red/warm regions = areas most influential for the prediction

#### NLP Explainability Examples
- Sample clinical notes with entity-level confidence scores
- Shows which spans were classified as PROBLEM, MEDICATION, SYMPTOM, etc.
- Negation (🚫), Uncertainty (?), and Historical context are highlighted

URL: `/#/app/explainability`

---

### 🤖 AI Healthcare Assistant

**Inputs:** Natural-language questions, optional symptoms, medical note text, and an uploaded chest X-ray
**Output:** MEDINTEL model results, optional Groq explanation, and tool execution status

**Step-by-step:**

1. Ask a question or enter symptoms in the optional clinical information panel
2. Optionally paste a medical note or attach a JPG/PNG chest X-ray
3. Press **Enter** or click **Send**
4. MEDINTEL runs the relevant models and displays which tools succeeded or failed
5. If Groq is configured, it explains the MEDINTEL results; without Groq, built-in responses are used

**What to ask:**

| Example Message | Tools Called |
|---|---|
| "What does this model output mean?" with symptoms entered | `analyze_symptoms` |
| "Analyze this X-ray" with an image attached | `analyze_xray` |
| Paste a medical note in the optional note field | `analyze_medical_report` |
| "Show me case CASE-001" | `get_case_history` |
| "How does SHAP attribution work?" | `get_model_explanation` |
| Enter symptoms and attach an X-ray or medical note | `get_multimodal_evidence` |
| "Find similar reports to: right lower lobe pneumonia" | `retrieve_similar_reports` |
| "Summarize case CASE-042" | `summarize_case` |

X-ray analysis never substitutes a built-in demo image for an upload. Groq is optional and receives the user's question, recent chat context, and MEDINTEL's analysis results for explanation; do not submit identifying or sensitive patient information.

**Response structure:**
- Tool execution trace (which tools were called and why)
- Clinical findings summary
- Concordance/discordance flag if multimodal
- Mandatory CDSS safety disclaimer

All conversations are **persisted to SQLite** and can be retrieved from the Cases tab.

URL: `/#/app/assistant`

---

### 📁 Cases

Browsable registry of all clinical consultations and analyses.

- **List view** — all cases with filters: case type, evidence level
- **Pagination** — 25 cases per page
- **Case detail** — full evidence profile, modalities used, timestamps
- Cases are created automatically when using the Assistant or Fusion module

URL: `/#/app/cases`

---

### 📈 Analytics

System-level usage statistics.

- Total cases processed
- Module utilisation breakdown (how often each AI module was used)
- Concordance rate across multimodal cases
- Data sourced from `GET /api/analytics/summary`

URL: `/#/app/analytics`

---

### ℹ️ Model Info

Deep-dive benchmark comparison across all models.

- **Clinical**: XGBoost vs Logistic Regression vs Random Forest (accuracy, macro F1, weighted F1, precision, recall)
- **Imaging**: Custom CNN architecture details, training history
- **NLP**: Pipeline description, embedding model info
- **Fusion**: Architecture description, ablation benchmark results
- All disclaimer and governance notes

URL: `/#/app/model-info`

---

## 8. API Reference

Full interactive documentation: `http://127.0.0.1:8000/docs`

### Clinical

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/clinical/symptoms` | Returns all 174 symptoms grouped by organ system |
| `POST` | `/api/clinical/predict` | Predict disease from symptom list + SHAP evidence |
| `GET` | `/api/clinical/model-info` | Model benchmarks and metadata |

**Predict request body:**
```json
{
  "symptoms": ["symptom_fever", "symptom_cough", "symptom_shortness_of_breath"]
}
```

### Imaging

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/imaging/predict` | Upload X-ray → CNN classification + Grad-CAM |
| `GET` | `/api/imaging/model-info` | CNN architecture and performance metrics |
| `GET` | `/api/imaging/sample/{type}` | Load sample image (`normal` or `pneumonia`) |

### NLP

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/nlp/analyze` | Analyse clinical text → NER + semantic retrieval |
| `POST` | `/api/nlp/upload` | Upload text file for NLP analysis |

### Fusion

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/fusion/analyze` | Trimodal late evidence fusion (form-data) |
| `GET` | `/api/fusion/synthetic-cases` | List 500 synthetic demo cases |
| `GET` | `/api/fusion/synthetic-cases/{case_id}` | Full evidence profile for one case |
| `GET` | `/api/fusion/analysis-summary` | Precomputed ablation benchmarks |

### Explainability

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/explainability/clinical/global` | Global SHAP importance (174 features) |
| `GET` | `/api/explainability/clinical/example` | Patient-level SHAP example |
| `GET` | `/api/explainability/imaging/samples` | Grad-CAM sample metadata |
| `GET` | `/api/explainability/nlp/examples` | NLP entity attribution examples |

### Assistant

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/assistant/chat` | Send message → assistant response + tool traces |
| `GET` | `/api/assistant/tools` | List all 8 diagnostic tools |

### System

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Full health check — all module statuses |
| `GET` | `/` | System info and API links |

---

## 9. Running Tests

```powershell
# Set environment variables first
$env:KMP_DUPLICATE_LIB_OK = "TRUE"
$env:OMP_NUM_THREADS = "1"
$env:PYTHONPATH = "."

# Run full test suite
pytest tests/ -v
```

| Test file | Coverage | Tests |
|---|---|---|
| `test_backend_foundation.py` | App startup, health check, CORS | 5 |
| `test_clinical_service.py` | Symptom vectorisation, prediction, SHAP | 6 |
| `test_imaging_service.py` | CNN inference, Grad-CAM generation | 5 |
| `test_nlp_service.py` | NER extraction, embedding retrieval | 3 |
| `test_fusion_and_explainability.py` | Fusion engine, SHAP/Grad-CAM endpoints | 6 |
| `test_cases_analytics_and_assistant.py` | Case registry, analytics, assistant chat | 6 |
| **Total** | | **31 tests** |

---

## 10. Scripts Reference

| Script | Command | Purpose |
|---|---|---|
| `start_all.bat` | `.\scripts\start_all.bat` | Launches both backend and frontend (Windows) |
| `start_backend.ps1` | `.\scripts\start_backend.ps1` | Backend only (uvicorn + env guards) |
| `start_frontend.ps1` | `.\scripts\start_frontend.ps1` | Frontend only (Vite dev server) |
| `retrain_clinical_model.py` | `python scripts/retrain_clinical_model.py` | Retrain XGBoost with class balancing + save artifacts |
| `clinical_sanity_test.py` | `python scripts/clinical_sanity_test.py` | Run 5 clinical sanity test cases on current model |
| `sample_clinical_call.py` | `python scripts/sample_clinical_call.py` | Quick CLI demo of the clinical predict endpoint |

---

## 11. Clinical Governance & Safety

Every module in MedIntel AI is governed by the following principles:

1. **CDSS Framing** — Every API response and UI panel carries the mandatory disclaimer:
   > *"AI-assisted clinical decision support. Not a substitute for professional medical judgment. Outputs do not constitute confirmed diagnoses, prescriptions, or autonomous medical decisions. Human and clinician oversight is strictly required."*

2. **Synthetic Demonstration Badges** — All benchmark profiles constructed from synthetic/research datasets are labelled with a prominent `🔶 SYNTHETIC DEMONSTRATION` badge.

3. **Top-5 Differentials Always Shown** — The UI never shows only a single "predicted disease". Always displays Top-5 probabilities so the clinician sees the model's uncertainty.

4. **Calibrated Language** — Outputs report **Model Confidence** (raw `predict_proba` output), not calibrated epidemiological risk.

5. **Discordance Safeguards** — When multimodal signals conflict (e.g. chest X-ray is normal but symptoms suggest respiratory disease), the fusion engine flags `DISCORDANT` status and recommends urgent human review.

6. **No Hallucinated Diagnoses** — Empty or invalid inputs return structured `400 Bad Request` errors, never speculative outputs.

7. **No Hardcoded Rules** — Disease predictions are never overridden by manual if/else rules. All outputs come from the trained ML models.

---

## 12. Known Limitations

### Clinical Prediction Quality

| Limitation | Detail |
|---|---|
| **Synthetic training dataset** | The `clinical_dataset.csv` is synthetically generated with noisy, non-clinical symptom-disease associations. Fever+cough maps to Asthma (20.7%) more than Flu (5.1%) in the dataset — the model learns these incorrect associations. |
| **Sanity test pass rate** | 2/5 representative clinical scenarios pass. Tests 1, 2, 5 (respiratory, diabetes, pneumonia) fail due to dataset noise, not pipeline bugs. |
| **Missing features** | `symptom_weight_loss` and `symptom_blurred_vision` are absent from the 174-feature list. |
| **Uncalibrated probabilities** | Raw XGBoost `predict_proba` outputs are not probability-calibrated. Use relative ranking, not absolute values. |

### NLP Module

| Limitation | Detail |
|---|---|
| **UI not wired** | The NLP tab shows a roadmap preview only. The backend API works but the frontend interactive UI is not built yet. |

### General

| Limitation | Detail |
|---|---|
| **No authentication** | The application has no user login system. All endpoints are publicly accessible. |
| **No rate limiting** | The `/predict` endpoints have no per-client rate limiting. |
| **Binary imaging only** | The CNN classifies only Normal vs Pneumonia. Multi-class chest pathology classification is not implemented. |

---

## Academic Context

- **Project type**: Final-Year Major Project
- **Focus areas**: Multimodal Deep Learning · Biomedical NLP · Explainable AI · Clinical Decision Support
- **Models trained in**: Google Colab
- **Inference deployed in**: FastAPI (Python) + React (TypeScript)
