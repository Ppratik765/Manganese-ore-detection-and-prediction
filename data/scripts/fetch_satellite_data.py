"""
Multi-Region Space-Tech Pipeline for Manganese Ore Detection
Coordinates Registry for 5 Major Indian Manganese Belts (MOIL Operations):
- Balaghat Belt (MP - Bharweli Mine)
- Bhandara Belt (MH - Dongri Buzurg Mine)
- Nagpur Belt (MH - Gumgaon/Kandri Mines)
- Chhindwara Belt (MP)
- Keonjhar Belt (Odisha)
"""

import os
import json
import numpy as np
from typing import Dict, Any, List, Tuple

# Multi-Region Spatial Coordinate Registry
MINING_SECTORS: Dict[str, Dict[str, Any]] = {
    "balaghat": {
        "name": "Balaghat Belt (Bharweli Mine)",
        "state": "Madhya Pradesh",
        "bbox": [80.10, 21.75, 80.25, 21.90],  # [min_lon, min_lat, max_lon, max_lat]
        "centroid": [21.825, 80.175],
        "mine_type": "Underground & Open Cast",
        "primary_mineral": "Braunite / Pyrolusite",
        "avg_grade_pct": 44.5,
        "est_reserves_mt": 12.8,
        "geological_formation": "Sausar Group (Mansar Formation)",
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
        "geological_formation": "Sausar Group (Dongri Buzurg Formation)",
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
        "geological_formation": "Sausar Group (Lohangi Formation)",
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
        "geological_formation": "Tirodi Gneissic Complex",
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
        "geological_formation": "Iron Ore Group (IOG) Shales",
    },
}

def get_sector_registry() -> Dict[str, Dict[str, Any]]:
    """Returns the registered mining sector metadata."""
    return MINING_SECTORS

def get_sector_bbox(sector_id: str) -> List[float]:
    """Retrieve bounding box [min_lon, min_lat, max_lon, max_lat] for a given sector."""
    if sector_id not in MINING_SECTORS:
        raise ValueError(f"Unknown sector '{sector_id}'. Available: {list(MINING_SECTORS.keys())}")
    return MINING_SECTORS[sector_id]["bbox"]

if __name__ == "__main__":
    print("Registered Manganese Mining Sectors:")
    for sid, info in MINING_SECTORS.items():
        print(f" - [{sid.upper()}] {info['name']} | BBox: {info['bbox']} | Formation: {info['geological_formation']}")
