# MOIL Space-Tech Platform: Technical Brief & Presentation Guide

> [!IMPORTANT]
> **To the Team:** This document contains the complete technical breakdown of our SIH 2026 hackathon project. Use this to design the PowerPoint slides and prepare for the Q&A with the judges.

## 1. Project Overview & Architecture
We have built an end-to-end **AI/ML & Space-Tech Manganese Exploration Platform**. It acts as a "Mission Control" dashboard for MOIL to:
1. Geographically identify high-yield manganese deposits using satellite multispectral analysis.
2. Automatically target precise GPS coordinates for core drilling exploration.
3. Predict operational production shortfalls using a machine learning forecaster.

**How We Are Doing It:**
* **Frontend:** Next.js, React, TailwindCSS, Leaflet.js (Geospatial Mapping)
* **Backend Pipeline:** Python, FastAPI, ONNX Runtime (High-performance inference). The backend performs instantaneous calculations on massive satellite matrices.
* **AI/ML Core:** PyTorch (U-Net architecture for Computer Vision and Geospatial Segmentation), XGBoost (Gradient boosting for Tabular forecasting). The PyTorch models are serialized into highly optimized C++ `.onnx` computational graphs for lightning-fast production deployment.

---

## 2. The Dataset Strategy (Synthetic vs. Real)

> [!WARNING]
> **Crucial Pitch Strategy:** Do not claim the data is live MOIL data. Pitch this as a **production-ready architecture built on synthetic physics-based models** pending MOIL data integration.

### What is REAL:
* **Geospatial Mapping:** The 20 sectors on our map are the exact GPS coordinates and bounding boxes of real Indian Manganese belts (e.g., Balaghat, Bhandara, Keonjhar).
* **Geology:** The expected ore grades, primary minerals (Braunite, Pyrolusite), and rock formations (Sausar Group) are historically accurate.
* **The Software:** The AI algorithms and code architecture are 100% real and production-ready.

### What is SYNTHETIC (Simulated for the Hackathon):
Because we do not have paid API keys for high-res satellite imagery or MOIL's proprietary core-drilling logs, we built a **Geological Physics Synthesizer**.
* **The Satellite Dataset:** Our system mathematically simulates Sentinel-2 multispectral imagery across 20 mining sectors. Each sector is mapped as a 20x20 km grid. The synthesizer outputs 256x256 pixel patches at 10m/pixel spatial resolution. It mathematically simulates structural geology (fault lines, strike angles) and surface reflectance data based on how Iron, Vegetation, and Manganese structurally appear from space across 6 optical/infrared bands (B02, B03, B04, B08, B11, B12).
* **The Telemetry Dataset:** Operational data (excavator breakdowns, rainfall, production shortfalls) was simulated using probability distributions of real-world mining constraints.

---

## 3. Mathematical Calculations & Algorithms

You can put these equations directly on the presentation slides to impress the technical judges.

### A. Spectral Diagnostic Indices
We simulate Sentinel-2 satellite bands and combine them to detect geological anomalies.

* **NDVI (Normalized Difference Vegetation Index):** Removes dense forest cover to find bare rock.
```text
       (B08_NIR - B04_Red)
NDVI = -------------------
       (B08_NIR + B04_Red)
```

* **Iron Oxide Index:** Detects gossans and hematite cappings (surface weathering).
```text
              B04_Red
Iron_Oxide = ----------
              B02_Blue
```

* **Ferrous Minerals Index:** Detects Fe2+ silicates associated with braunite.
```text
                 B12_SWIR2
Ferrous_Index = -----------
                  B08_NIR
```

* **Clay Alteration Index:** Detects phyllosilicates associated with hydrothermal ore veins.
```text
              B11_SWIR1
Clay_Index = -----------
              B12_SWIR2
```

### B. Geological Reserve Estimation Math
Once the U-Net AI highlights the high-probability manganese pixels, we calculate the physical reserves.

1. **Delineated Area (Square Kilometers):** 
Since each Sentinel-2 pixel represents 10m x 10m (100 square meters):
```text
Area (km²) = (Total_Ore_Pixels * 100) / 1,000,000
```

2. **Estimated Tonnage (Metric Tonnes):** 
Using a standard open-cast exploration depth of 25 meters and the Specific Gravity (SG) of Manganese (3.8):
```text
Tonnage (MT) = Area (km²) * 25m * 3.8 * 1,000,000
```

### C. The Anomaly Scoring Function (Ground Truth Generation)
To train the AI, we scored regions mathematically using this weighted equation:
```text
Anomaly_Score = (0.35 * Ferrous_norm) + (0.30 * IronOxide_norm) + (0.25 * Clay_norm) - (0.30 * NDVI_norm)
```

---

## 4. What Happens When MOIL Gives Us Live Data?

When presenting, emphasize the roadmap. When MOIL provides their proprietary database, our platform requires **zero architectural changes**. We will simply execute the following swap:

1. **Live Satellite Integration:** Our `fetch_satellite_data.py` script already contains the code to connect to the **Microsoft Planetary Computer STAC API**. Once authorized, the synthesizer is disabled, and the system instantly pulls live Sentinel-2 / Landsat-9 tensors directly from space instead of simulating them.
2. **Transfer Learning via Drill Logs:** We will take MOIL's historical drilling logs (exact GPS coordinates of where they actually found manganese) and use them as Ground Truth. We will retrain our PyTorch U-Net model on these logs, aligning the AI's spectral pattern recognition with 100% real ground truth.
3. **IoT Telemetry Connectivity:** Our XGBoost operations forecaster accepts standard JSON payloads. It can be directly connected to MOIL's SCADA and Fleet Management databases via simple REST API webhooks to predict live production shortfalls.

> [!TIP]
> **Summary for the Judges:** *"We didn't just build a dashboard; we built a scalable, enterprise-grade AI pipeline. The math, the models, and the infrastructure are complete. The second MOIL plugs their data into our API, this system goes into production."*
