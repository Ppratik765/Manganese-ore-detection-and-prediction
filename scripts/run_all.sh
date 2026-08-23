#!/usr/bin/env bash
# ==============================================================================
# MOIL Limited - SIH 2026 Space-Tech & Mine Shortfall Platform
# Master One-Click Orchestrator: Trains Models & Concurrently Launches Backend + Frontend
# ==============================================================================

set -e

echo "================================================================================"
echo ">>> LAUNCHING MOIL SPACE-TECH & MINE OPERATIONS MISSION CONTROL PLATFORM <<<"
echo "================================================================================"

# Identify Python command
if command -v py &>/dev/null; then
    PYTHON_CMD="py -3"
elif command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi

# Step 1: Check Data Pipeline
if [ ! -f "data/processed/spectral_patches/manifest.json" ] || [ ! -f "data/processed/mine_operations.csv" ]; then
    echo ""
    echo "[Step 1/4] Running Geospatial Multi-Spectral & Telemetry Data Pipeline..."
    $PYTHON_CMD data/scripts/preprocess_spectral_tiles.py
fi

# Step 2: Train & Export ML Models (if missing)
if [ ! -f "backend/app/models/shortfall_xgb.pkl" ]; then
    echo ""
    echo "[Step 2/4] Training and Serializing XGBoost Production Shortfall Classifier..."
    $PYTHON_CMD ml_pipelines/production_forecasting/train_xgboost.py
fi

if [ ! -f "backend/app/models/reserves_unet.onnx" ]; then
    echo ""
    echo "[Step 3/4] Training 10-Channel U-Net & Exporting Static ONNX Graph..."
    $PYTHON_CMD ml_pipelines/reserve_segmentation/train_and_export_onnx.py
fi

echo ""
echo "[Step 4/4] Launching FastAPI Backend & Next.js Mission Control..."

# Handle process cleanup upon Ctrl+C / Exit
cleanup() {
    echo ""
    echo ">>> Shutting down MOIL Platform services..."
    kill $(jobs -p) 2>/dev/null || true
    echo "Services stopped gracefully."
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start FastAPI Backend on Port 8000
echo " -> Starting FastAPI Backend Service (http://127.0.0.1:8000)..."
$PYTHON_CMD backend/run_backend.py --port 8000 &
BACKEND_PID=$!

# Wait 2 seconds for backend to initialize
sleep 2

# Start Next.js Frontend on Port 3000
echo " -> Starting Next.js Mission Control (http://localhost:3000)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "================================================================================"
echo ">>> MOIL MISSION CONTROL PLATFORM IS LIVE! <<<"
echo "Frontend Dashboard:   http://localhost:3000"
echo "Backend Swagger Docs: http://127.0.0.1:8000/docs"
echo "Press Ctrl+C to terminate all services."
echo "================================================================================"

# Keep alive
wait
