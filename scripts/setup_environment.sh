#!/usr/bin/env bash
# ==============================================================================
# MOIL Limited - SIH 2026 Space-Tech & Mine Shortfall Platform
# Master Environment Bootstrap & Dependency Installation Script
# ==============================================================================

set -e

echo "================================================================================"
echo ">>> MOIL LIMITED: AI/ML & SPACE-TECH MANGANESE PLATFORM SETUP <<<"
echo "================================================================================"

# 1. Check Python installation
echo ""
echo "[Step 1/3] Validating Python environment..."
if command -v py &>/dev/null; then
    PYTHON_CMD="py -3"
elif command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo "[-] Error: Python is not found on PATH. Please install Python 3.10+."
    exit 1
fi

echo " -> Using Python: $($PYTHON_CMD --version)"

# 2. Install Backend Python Dependencies
echo ""
echo "[Step 2/3] Installing Python AI/ML and FastAPI dependencies..."
$PYTHON_CMD -m pip install --upgrade pip
$PYTHON_CMD -m pip install -r backend/requirements.txt

# 3. Install Frontend Node Packages
echo ""
echo "[Step 3/3] Installing Next.js Mission Control Node dependencies..."
if ! command -v npm &>/dev/null; then
    echo "[-] Error: npm is not found. Please install Node.js (v18+)."
    exit 1
fi

cd frontend
npm install
cd ..

echo ""
echo "================================================================================"
echo "[SUCCESS] Environment initialized successfully!"
echo "Run 'bash scripts/run_all.sh' to execute models and start the platform."
echo "================================================================================"
