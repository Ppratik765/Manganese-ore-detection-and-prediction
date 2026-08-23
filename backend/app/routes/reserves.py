"""
Manganese Mineral Reserves & Geospatial Exploration Endpoints
"""

import os
import sys
import numpy as np
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Query, HTTPException

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))
from backend.app.config import settings
from backend.app.services.onnx_inference import onnx_service
from data.scripts.fetch_satellite_data import (
    synthesize_multispectral_bands,
    compute_spectral_indices,
    extract_10channel_tensor,
    MINING_SECTORS
)

router = APIRouter(prefix="/api/reserves", tags=["Reserves & Geospatial Space-Tech"])

@router.get("/grid", summary="Retrieve Geospatial Mineral Probability Grid & Reserve Estimates")
def get_reserve_grid(
    sector: str = Query(default="balaghat", description="Mining sector identifier: balaghat, bhandara, nagpur, chhindwara, keonjhar"),
    resolution: int = Query(default=32, description="Output 2D heatmap matrix resolution (e.g. 32x32)")
) -> Dict[str, Any]:
    """
    Returns pixel-level mineral probability matrices, spatial bounding boxes,
    estimated ore grade (Mn %), confidence scores, and exploratory drill hole targets.
    """
    sector_key = sector.lower().strip()
    if sector_key not in settings.SECTORS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown sector '{sector}'. Available sectors: {list(settings.SECTORS.keys())}"
        )
        
    sector_info = settings.SECTORS[sector_key]
    
    # Generate / Fetch 10-Channel multispectral exploration tensor
    bands = synthesize_multispectral_bands(sector_key, height=256, width=256, seed=42 + hash(sector_key) % 1000)
    indices = compute_spectral_indices(bands)
    tensor_10ch = extract_10channel_tensor(bands, indices)
    
    # Run ONNX segmentation inference
    inference_result = onnx_service.segment_reserve(
        tensor_10ch=tensor_10ch,
        sector_id=sector_key,
        downsample_grid_size=resolution
    )
    
    # Generate high-value exploratory core drilling targets based on top anomaly peaks
    grid = np.array(inference_result["probability_grid"])
    min_lon, min_lat, max_lon, max_lat = sector_info["bbox"]
    
    # Find top 4 peak locations in probability grid
    drill_targets = []
    top_indices = np.dstack(np.unravel_index(np.argsort(grid.ravel())[::-1], grid.shape))[0][:4]
    
    for i, (r, c) in enumerate(top_indices):
        lat = min_lat + (1.0 - r / resolution) * (max_lat - min_lat)
        lon = min_lon + (c / resolution) * (max_lon - min_lon)
        prob = float(grid[r, c])
        drill_targets.append({
            "target_id": f"DH_{sector_key[:3].upper()}_{i+1:02d}",
            "lat": round(lat, 5),
            "lng": round(lon, 5),
            "anomaly_probability": round(prob, 3),
            "priority": "HIGH" if prob > 0.85 else "MEDIUM",
            "target_depth_m": int(80 + 35 * i),
            "estimated_target_grade_pct": round(sector_info["avg_grade_pct"] + (prob - 0.5) * 6.0, 1)
        })
        
    return {
        "sector": sector_key,
        "sector_name": sector_info["name"],
        "state": sector_info["state"],
        "bbox": sector_info["bbox"],
        "centroid": sector_info["centroid"],
        "mine_type": sector_info["mine_type"],
        "geological_formation": MINING_SECTORS.get(sector_key, {}).get("geological_formation", "Sausar Group"),
        "primary_mineral": sector_info["primary_mineral"],
        "estimated_grade_pct": inference_result["estimated_grade_pct"],
        "confidence_score": inference_result["confidence_score"],
        "delineated_area_km2": inference_result["delineated_area_km2"],
        "estimated_reserve_mt": sector_info["est_reserves_mt"],
        "unfc_classification": inference_result["unfc_classification"],
        "spectral_diagnostics": {
            "mean_ndvi": round(float(indices["NDVI"].mean()), 3),
            "mean_clay_index": round(float(indices["Clay_Index"].mean()), 3),
            "mean_ferrous_index": round(float(indices["Ferrous_Index"].mean()), 3),
            "mean_iron_oxide_index": round(float(indices["Iron_Oxide_Index"].mean()), 3),
        },
        "probability_grid": inference_result["probability_grid"],
        "drill_hole_targets": drill_targets
    }

@router.get("/sectors", summary="List All Registered Mining Belts")
def list_sectors() -> List[Dict[str, Any]]:
    """Returns overview list of all 5 Indian Manganese belts."""
    return [
        {"id": k, **v} for k, v in settings.SECTORS.items()
    ]
