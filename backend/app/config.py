"""
Backend Configuration & Sector Geospatial Settings
"""

import os
from typing import Dict, Any, List

class Settings:
    PROJECT_NAME: str = "MOIL AI/ML & Space-Tech Manganese Intelligence Platform"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # CORS Origins for Next.js Mission Control Frontend
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "*"
    ]
    
    # Model Artifact Paths
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    UNET_ONNX_PATH: str = os.path.join(os.path.dirname(__file__), "models", "reserves_unet.onnx")
    SHORTFALL_XGB_PATH: str = os.path.join(os.path.dirname(__file__), "models", "shortfall_xgb.pkl")
    OPERATIONS_DATA_PATH: str = os.path.join(BASE_DIR, "data", "processed", "mine_operations.csv")
    SPECTRAL_MANIFEST_PATH: str = os.path.join(BASE_DIR, "data", "processed", "spectral_patches", "manifest.json")
    
    # Registered 5 Indian Manganese Mining Sectors
    SECTORS: Dict[str, Dict[str, Any]] = {
        "balaghat": {
            "name": "Balaghat Belt (Bharweli Mine)",
            "state": "Madhya Pradesh",
            "bbox": [80.10, 21.75, 80.25, 21.90],
            "centroid": [21.825, 80.175],
            "mine_type": "Underground & Open Cast",
            "primary_mineral": "Braunite / Pyrolusite",
            "avg_grade_pct": 44.5,
            "est_reserves_mt": 12.8,
            "target_tonnage_shift": 2800.0,
            "active_fleet_count": 12
        },
        "bhandara": {
            "name": "Bhandara Belt (Dongri Buzurg Mine)",
            "state": "Maharashtra",
            "bbox": [79.60, 21.40, 79.80, 21.60],
            "centroid": [21.500, 79.700],
            "mine_type": "Open Cast",
            "primary_mineral": "Psilomelane / Pyrolusite",
            "avg_grade_pct": 41.2,
            "est_reserves_mt": 9.4,
            "target_tonnage_shift": 2200.0,
            "active_fleet_count": 10
        },
        "nagpur": {
            "name": "Nagpur Belt (Gumgaon/Kandri Mines)",
            "state": "Maharashtra",
            "bbox": [79.15, 21.25, 79.35, 21.45],
            "centroid": [21.350, 79.250],
            "mine_type": "Underground",
            "primary_mineral": "Braunite / Jacobsite",
            "avg_grade_pct": 39.8,
            "est_reserves_mt": 8.1,
            "target_tonnage_shift": 1900.0,
            "active_fleet_count": 8
        },
        "chhindwara": {
            "name": "Chhindwara Belt (Tirodi Extension)",
            "state": "Madhya Pradesh",
            "bbox": [78.80, 21.90, 79.00, 22.10],
            "centroid": [22.000, 78.900],
            "mine_type": "Open Cast & Exploratory",
            "primary_mineral": "Braunite / Hollandite",
            "avg_grade_pct": 37.5,
            "est_reserves_mt": 6.7,
            "target_tonnage_shift": 1600.0,
            "active_fleet_count": 7
        },
        "keonjhar": {
            "name": "Keonjhar Belt (Barbil / Joda Region)",
            "state": "Odisha",
            "bbox": [85.20, 21.80, 85.50, 22.10],
            "centroid": [21.950, 85.350],
            "mine_type": "Open Cast",
            "primary_mineral": "Cryptomelane / Pyrolusite",
            "avg_grade_pct": 42.0,
            "est_reserves_mt": 14.5,
            "target_tonnage_shift": 3100.0,
            "active_fleet_count": 14
        },
    }

settings = Settings()
