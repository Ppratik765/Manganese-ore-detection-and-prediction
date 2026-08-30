# 🚀 MOIL Space-Tech Platform: University Lab Training & Laptop Deployment Guide

This guide details the complete, step-by-step workflow for training the expanded **20-Sector National Manganese AI/ML Pipeline (20×20 km)** on high-compute university computers and seamlessly syncing the trained model artifacts back to your laptop for presentation on the Next.js Mission Control Dashboard.

---

## 🏗️ Architecture: How Data & Models Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             GITHUB REPO                                  │
│         https://github.com/Ppratik765/Manganese-ore-detection-and-prediction│
│           (Source Code, Pipelines, Lightweight ONNX/PKL Models)          │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                 git pull            │            git push
         ┌───────────────────────────┴─────────────────────────────┐
         │                                                         │
         ▼                                                         ▼
┌──────────────────────────────────────┐          ┌───────────────────────────────────┐
│       UNIVERSITY LAB COMPUTER        │          │       YOUR PERSONAL LAPTOP        │
│       (High Compute / GPU Hub)       │          │     (Mission Control Dashboard)   │
├──────────────────────────────────────┤          ├───────────────────────────────────┤
│ 1. Clones repository                 │          │ 1. Pulls newly trained ONNX/PKL   │
│ 2. Downloads Sentinel-2 20x20km data │          │    models via 'git pull'          │
│ 3. Generates 256x256 spectral chips  │          │ 2. Starts FastAPI backend         │
│ 4. Trains 10-Channel U-Net (PyTorch) │          │ 3. Starts Next.js frontend        │
│ 5. Exports 'reserves_unet.onnx' (29MB│          │ 4. Instant real-time telemetry    │
│ 6. Trains 'shortfall_xgb.pkl' (2MB)  │          │    and Leaflet heatmaps across    │
│ 7. Pushes models to GitHub           │          │    all 20 national mining belts   │
└──────────────────────────────────────┘          └───────────────────────────────────┘
```

> [!NOTE]
> **Why this solves the GitHub Data Trap:**  
> Large raw multi-spectral satellite rasters (several gigabytes) stay local on the lab computer and are excluded via `.gitignore`. Only the **lightweight, optimized ONNX neural graph (`~29 MB`)**, **XGBoost model (`~2 MB`)**, and **inference metadata (`~440 KB`)** are pushed to GitHub. This bypasses GitHub's 100 MB limit completely!

---

## 🏛️ PART 1: Steps to Execute in Your College / Lab

### Step 1.1: Open Terminal & Clone the Repository
Open PowerShell / Terminal on the lab workstation:
```bash
# Clone the repository
git clone https://github.com/Ppratik765/Manganese-ore-detection-and-prediction.git

# Navigate into the project root
cd Manganese-ore-detection-and-prediction
```

---

### Step 1.2: Set Up Python Environment & Install Dependencies
Create an isolated virtual environment and install all AI/ML, PyTorch, and geospatial packages:
```bash
# Create virtual environment (Windows / Linux)
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# (If PowerShell scripts are restricted, run: Set-ExecutionPolicy Unrestricted -Scope Process)
# On Windows (Command Prompt):
.\venv\Scripts\activate.bat
# On Linux / Mac:
source venv/bin/activate

# Upgrade pip and install all required libraries
pip install --upgrade pip
pip install -r requirements.txt
```

*(If `requirements.txt` is missing specific packages on the lab PC, install the core stack directly):*
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install numpy pandas scikit-learn xgboost onnx onnxruntime rasterio pystac-client planetary-computer fastapi uvicorn
```

---

### Step 1.3: Run the Master Training Orchestrator
Execute the automated end-to-end 20-sector training pipeline:

```bash
# Default run (15 Epochs on 20 Sectors with Batch Size 8):
python scripts/train_university_cluster.py

# Optional: Custom GPU parameters (e.g. 25 Epochs with Batch Size 16 on lab NVIDIA GPU):
python scripts/train_university_cluster.py --epochs 25 --batch-size 16 --lr 0.001
```

#### 🔍 What this single command does automatically:
1. **Verifies Hardware**: Detects CUDA GPUs (e.g. NVIDIA RTX 3080/4090/A100) or uses multi-threaded CPU.
2. **Ingests 20 National Belts (20×20 km)**:
   * *Central India (MOIL Core)*: Bharweli, Ukwa, Tirodi, Dongri Buzurg, Chikla, Kandri, Gumgaon, Beldongri-Satak, Sausar-Gowari.
   * *Western India (Champaner/Aravalli)*: Pavi Jetpur, Halol/Shivrajpur, Banswara-Tambesra.
   * *Eastern India (IOG/Gangpur)*: Barbil/Joda, Sundargarh/Bonai, Sundargarh/Patmunda, Singhbhum/Chaibasa.
   * *Southern India (Dharwar/Eastern Ghats)*: Sandur-Kumaraswamy, Shimoga-Kumsi, Vizianagaram-Garividi, Goa-Sanguem.
3. **Calculates Spectral Diagnostic Indices**: NDVI, Clay Alteration, Ferrous Minerals, and Iron Oxide Gossan signatures.
4. **Trains PyTorch 10-Channel U-Net**: Multi-task learning (Dice Loss + Focal Loss + Grade MAE Regression).
5. **Exports `backend/app/models/reserves_unet.onnx`**: C++ static computation graph validated with ONNX Runtime.
6. **Trains `backend/app/models/shortfall_xgb.pkl`**: Gradient-boosted operational risk forecaster with prescriptive AI dispatch.
7. **Precomputes `backend/app/models/sector_grid_cache.json`**: Pre-generated inference grids for instantaneous UI loading across all 20 sectors.

---

### Step 1.4: Push the Trained Models Back to GitHub
Once the training completes, push the newly generated model artifacts to your GitHub repository:

```bash
# Stage the lightweight model artifacts and cache
git add backend/app/models/reserves_unet.onnx
git add backend/app/models/shortfall_xgb.pkl
git add backend/app/models/sector_grid_cache.json
git add data/processed/dataset_split.json

# Commit the changes (adds to your GitHub commit activity graph)
git commit -m "feat(models): train 14-sector national manganese U-Net ONNX and XGBoost models on university cluster"

# Push to main branch
git push origin main
```

*(If Git asks for credentials, provide your GitHub username and Personal Access Token [Classic PAT with `repo` scope]).*

---

## 💻 PART 2: What to Do When You Come Back Home (Laptop)

When you return to your laptop, you only need to pull the updated models and start the local servers.

### Step 2.1: Open Terminal on Your Laptop & Pull Latest Models
Open PowerShell in your laptop project folder:
```bash
cd c:\Users\ppmak\Downloads\SIH-Manganese-project

# Pull the freshly trained models from GitHub
git pull origin main
```

---

### Step 2.2: Launch the FastAPI AI/ML Backend Server
Start the Python backend service:
```bash
# Start backend on Port 8000
py -3.13 backend/run_backend.py --port 8000
```
* **Status Verification**: Open [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health) in your browser.  
  You should see `status: healthy` and `sectors_registered: 14`.

---

### Step 2.3: Launch the Next.js Mission Control Frontend
Open a **new terminal window** on your laptop and start the web dashboard:
```bash
cd c:\Users\ppmak\Downloads\SIH-Manganese-project\frontend

# Start frontend dev server
npm run dev
```

---

### Step 2.4: Open the Command Center
Navigate in your browser to:
👉 **[http://localhost:3000](http://localhost:3000)**

#### 🎯 What You Will See:
* **Interactive 14-Belt Sector Switcher** in the top navigation bar with scrollable region selection.
* **Real-Time ONNX Neural Segmentation**: 2D Leaflet space-tech heatmaps displaying manganese prospectivity at 20×20 km resolution.
* **Exploratory Core Drilling Targets**: Automated AI-derived borehole coordinates (`DH_BAL_01`, `DH_BHA_01`, etc.) with depth and expected Mn purity.
* **Prescriptive AI Dispatch Feed**: Autonomous equipment reallocation and road-wetness mitigation plans triggered by your XGBoost forecaster.
* **What-If Scenario Simulation**: Stress-test blasting misfires, monsoons, and excavator breakdowns across all 14 sectors.

---

## 🛠️ Troubleshooting & Pro-Tips for College Machines

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `OutOfMemoryError` during PyTorch training | Lab GPU VRAM is full | Run with smaller batch size: `python scripts/train_university_cluster.py --batch-size 4` |
| `git push` rejected due to file size | Accidentally staged a `.tif` or `.npy` file | Run `git reset data/raw/` and verify `.gitignore` is active |
| `pystac_client` connection timeout | College firewall blocks Microsoft Planetary Computer | The script automatically switches to the built-in deterministic physical lithology synthesizer without failing! |
| Git asks for password on push | GitHub discontinued password authentication | Use a GitHub Personal Access Token (Settings -> Developer Settings -> Personal Access Tokens -> Tokens classic -> check `repo`) |
