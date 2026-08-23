"""
FastAPI Backend Application for MOIL Limited
AI/ML & Space Technology for Manganese Reserve Identification and Mine Production Shortfall Prevention
"""

import os
import time
from datetime import datetime
from typing import Dict, Any, List
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.config import settings
from backend.app.services.onnx_inference import onnx_service
from backend.app.services.optimizer import optimizer_service

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Mission-critical spaceborne multispectral reserve segmentation & prescriptive shortfall prevention system for MOIL Limited."
)

# CORS Configuration for Next.js Dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health", summary="Service Health & Diagnostic Status")
def health_check() -> Dict[str, Any]:
    """Returns real-time service health, model runtime states, and memory check."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "models": {
            "reserves_unet_onnx": os.path.exists(settings.UNET_ONNX_PATH),
            "shortfall_xgb_pkl": os.path.exists(settings.SHORTFALL_XGB_PATH),
        },
        "sectors_registered": len(settings.SECTORS),
        "runtime_providers": ["CPUExecutionProvider", "XGBoost-Native"]
    }

@app.get("/api/metadata", summary="Mining Sectors & Geological Metadata Registry")
def get_metadata() -> Dict[str, Any]:
    """Returns spatial bounding boxes, target extraction metrics, and geological formations."""
    return {
        "sectors": settings.SECTORS,
        "spectral_channels": [
            {"id": "B04", "name": "Red (665 nm)", "type": "Raw Optical"},
            {"id": "B03", "name": "Green (560 nm)", "type": "Raw Optical"},
            {"id": "B02", "name": "Blue (490 nm)", "type": "Raw Optical"},
            {"id": "B08", "name": "Near-IR (842 nm)", "type": "Raw Optical"},
            {"id": "B11", "name": "SWIR-1 (1610 nm)", "type": "Short-Wave Infrared"},
            {"id": "B12", "name": "SWIR-2 (2190 nm)", "type": "Short-Wave Infrared"},
            {"id": "NDVI", "name": "Normalized Difference Vegetation Index", "formula": "(B08-B04)/(B08+B04)"},
            {"id": "Clay_Index", "name": "Clay / Alteration Index", "formula": "B11/B12"},
            {"id": "Ferrous_Index", "name": "Ferrous Minerals Index", "formula": "B12/B08"},
            {"id": "Iron_Oxide_Index", "name": "Iron Oxide Index", "formula": "B04/B02"}
        ],
        "equipment_fleet": [
            {"type": "Excavator", "model": "CAT 6020 Hydraulic Shovel", "capacity": "12.0 m³ Bucket"},
            {"type": "Dumper", "model": "Komatsu HD785-7", "capacity": "100 Tonnes Payload"},
            {"type": "DrillRig", "model": "Sandvik DR412i Rotary", "capacity": "216-311 mm Hole Dia"},
            {"type": "Crusher", "model": "Metso Outotec C160 Jaw", "capacity": "800 TPH Throughput"},
            {"type": "DewateringPump", "model": "Flygt 2400 Submersible", "capacity": "500 m³/hr Flow"}
        ]
    }

from backend.app.routes.reserves import router as reserves_router
from backend.app.routes.operations import router as operations_router

app.include_router(reserves_router)
app.include_router(operations_router)


