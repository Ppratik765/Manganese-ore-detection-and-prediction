# AI/ML & Space Technology for Manganese Reserve Identification and Mine Production Shortfall Prevention

<div align="center">

![MOIL Mission Control Banner](https://img.shields.io/badge/MOIL_Limited-SIH_2026-06b6d4?style=for-the-badge&logo=satellite&logoColor=white)
![AI/ML Architecture](https://img.shields.io/badge/Architecture-10--Channel_U--Net_%2B_XGBoost-10b981?style=for-the-badge&logo=pytorch&logoColor=white)
![Frontend Stack](https://img.shields.io/badge/Mission_Control-Next.js_14_%7C_Leaflet_%7C_Tailwind-f59e0b?style=for-the-badge&logo=next.js&logoColor=white)
![Deployment](https://img.shields.io/badge/Deployment-Vercel_Serverless-black?style=for-the-badge&logo=vercel&logoColor=white)

**An End-to-End Enterprise Geospatial Space-Tech & Prescriptive Mining Intelligence System for MOIL Limited**

*Submitted for Smart India Hackathon (SIH 2026)*  
**Repository:** [https://github.com/Ppratik765/Manganese-ore-detection-and-prediction](https://github.com/Ppratik765/Manganese-ore-detection-and-prediction)

</div>

---

## 🧭 Executive Summary & Problem Overview

**MOIL Limited** is India's largest producer of manganese ore. Maintaining national supply chains requires solving two mission-critical challenges simultaneously:

1. **Spaceborne Reserve Identification:** Traditional geological exploration is resource-intensive and slow. Spaceborne optical and Short-Wave Infrared (SWIR) remote sensing can detect subtle hydrothermal alteration haloes, gossan caps, and manganese host rock lithologies across vast terrains.
2. **Mine Production Shortfall Prevention:** Operational production is continuously disrupted by seasonal monsoon downpours, haul road traction loss, blasting fragmentation variations, and heavy equipment mechanical fatigue.

This solution provides a **unified, real-time command center** integrating **Sentinel-2 L2A multispectral space-tech**, a **10-channel PyTorch U-Net**, an **XGBoost shortfall prediction engine**, and a **Prescriptive Dispatch AI** that automatically computes actionable mitigation plans.

---

## 🚀 Vercel Deployment & Local Development

This project features a decoupled architecture allowing the Next.js frontend to be deployed instantly on Vercel **without needing a live Python backend**. 

It uses an advanced `api.ts` interceptor that automatically serves pre-computed neural network inferences and geospatial heatmaps from a static JSON cache (`vercel_static_api_cache.json`) when running in the cloud.

### 1. Run the Dashboard Locally (Demo Mode)
You do not need Python or the PyTorch backend to run the dashboard! 
```bash
cd frontend
npm install
npm run dev
```
*Visit `http://localhost:3000` to see the Mission Control dashboard running via the static cache.*

### 2. Deploy to Vercel
1. Push this repository to GitHub.
2. Go to [Vercel](https://vercel.com/) and import the repository.
3. The framework will automatically be detected as Next.js.
4. Click **Deploy**. The site will instantly go live!

### 3. Regenerating the AI Cache (Full Training Mode)
If you want to train new models or regenerate the `vercel_static_api_cache.json` using the PyTorch/FastAPI backend:
1. Start the Python backend: `py -3.13 backend/run_backend.py --port 8000`
2. Run the exporter script: `py -3.13 data/scripts/export_static_api.py`
3. Commit the new JSON cache to GitHub.

---

## 🛰️ Multi-Region Space-Tech Coverage

The system natively monitors the 20 major Indian Manganese mining sectors across multiple states, including:

| Sector ID | Mining Belt & Key Mine | State | Geological Formation | Primary Mineralogy | Target Grade |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `balaghat_bharweli` | **Balaghat Belt (Bharweli Mine)** | Madhya Pradesh | Sausar Group (Mansar Fm) | Braunite / Pyrolusite | 44.5% Mn |
| `bhandara_dongri` | **Bhandara Belt (Dongri Buzurg)** | Maharashtra | Sausar Group (Dongri Fm) | Psilomelane / Pyrolusite | 41.2% Mn |
| `keonjhar_joda` | **Keonjhar Belt (Barbil / Joda)** | Odisha | Iron Ore Group (IOG) Shales | Cryptomelane / Pyrolusite | 42.0% Mn |

---

## 🔬 Mathematical Formulations & Band Ratio Engine

Each satellite patch is processed into a **10-channel multi-spectral tensor (10, 256, 256)** combining 6 surface reflectance bands and 4 diagnostic exploration ratios:

### Diagnostic Spectral Indices:
1. **NDVI (Normalized Difference Vegetation Index):** Separates rock exposures from dense forest canopy.
   `NDVI = (B08 - B04) / (B08 + B04)`
2. **Clay / Alteration Index:** Highlights Al-OH phyllosilicates & hydrothermal schists.
   `Clay_Index = B11 / B12`
3. **Ferrous Minerals Index:** Delineates pyrolusite, braunite, and jacobsite lithologies.
   `Ferrous_Index = B12 / B08`
4. **Iron Oxide Index:** Identifies gossans, limonite, and hematite surface caps.
   `Iron_Oxide = B04 / B02`

### Ground Truth Anomaly Scoring:
To train the AI, we mathematically score regions using this weighted equation:
`Anomaly_Score = (0.35 * Ferrous_norm) + (0.30 * IronOxide_norm) + (0.25 * Clay_norm) - (0.30 * NDVI_norm)`

---

## 🏆 Smart India Hackathon (SIH 2026) Innovations

1. **Spaceborne Mineral Anomaly Delineation:** 10-channel U-Net eliminates exploratory blindness by synthesizing surface reflectance and diagnostic hydrothermal band ratios into calibrated Mn% prospectivity maps.
2. **Prescriptive Mitigation AI vs Passive Dashboards:** Instead of simply reporting that a shortfall will occur, the neural optimizer outputs dispatch plans (e.g., pumping rates, dumper rerouting, crusher settings) with quantified tonnage recoveries.
3. **Serverless Vercel Architecture:** By decoupling the heavy PyTorch inference engine from the presentation layer via static state caching, the dashboard can be deployed anywhere, instantly, with zero backend hosting costs.
4. **Responsive Mobile Command Center:** The Next.js frontend utilizes complex Tailwind flexbox grids to ensure the geospatial maps, AI telemetry, and what-if simulation modals run flawlessly on standard smartphones used by mining foremen.

---

### Developed for MOIL Limited • SIH 2026

