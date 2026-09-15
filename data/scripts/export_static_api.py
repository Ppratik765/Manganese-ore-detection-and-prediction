"""
Vercel Static API Exporter
Run this script AFTER training your models to generate a static JSON cache of all 20 sectors.
This allows you to host the frontend on Vercel completely free, without needing a heavy Python backend.
The frontend will read this JSON file and appear 100% "live" and connected.
"""

import os
import json
import time
import requests

BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_PUBLIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/public"))
CACHE_FILE_PATH = os.path.join(FRONTEND_PUBLIC_DIR, "vercel_static_api_cache.json")

def export_static_api():
    print("=" * 60)
    print("MOIL Mission Control - Vercel Static API Exporter")
    print("=" * 60)
    
    # 1. Fetch list of all sectors from local backend
    try:
        print(f"Fetching sectors from {BACKEND_URL}/api/reserves/sectors ...")
        response = requests.get(f"{BACKEND_URL}/api/reserves/sectors")
        response.raise_for_status()
        sectors = response.json()
        print(f"[OK] Found {len(sectors)} registered mining belts.")
    except Exception as e:
        print(f"[ERROR] Could not connect to local backend. Make sure 'run_backend.py' is running!")
        print(f"Details: {e}")
        return

    # 2. Iterate and fetch Reserves Grid & Telemetry for each sector
    export_data = {
        "metadata": {
            "exported_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "total_sectors": len(sectors),
            "note": "Static Vercel Cache for SIH 2026 Presentation"
        },
        "sectors": sectors,
        "reserves_grids": {},
        "telemetry": {}
    }

    for sector in sectors:
        sector_id = sector["id"]
        print(f"Processing sector: {sector_id} ...")
        
        # Fetch Reserve Grid
        try:
            res_grid = requests.get(f"{BACKEND_URL}/api/reserves/grid?sector={sector_id}&resolution=32")
            res_grid.raise_for_status()
            export_data["reserves_grids"][sector_id] = res_grid.json()
        except Exception as e:
            print(f"  [WARN] Failed to fetch reserve grid for {sector_id}")

        # Fetch Telemetry
        try:
            res_tel = requests.get(f"{BACKEND_URL}/api/operations/telemetry?sector={sector_id}")
            res_tel.raise_for_status()
            export_data["telemetry"][sector_id] = res_tel.json()
        except Exception as e:
            print(f"  [WARN] Failed to fetch telemetry for {sector_id}")

    # 3. Save to frontend/public folder
    os.makedirs(FRONTEND_PUBLIC_DIR, exist_ok=True)
    with open(CACHE_FILE_PATH, "w", encoding="utf-8") as f:
        json.dump(export_data, f, indent=2)
    
    print("=" * 60)
    print(f"[SUCCESS] Static API cache exported to:")
    print(f"   {CACHE_FILE_PATH}")
    print("=" * 60)
    print("Next Steps:")
    print("1. Commit this file to GitHub: git add frontend/public/vercel_static_api_cache.json && git commit -m 'Add static API cache for Vercel'")
    print("2. Deploy frontend to Vercel!")
    
if __name__ == "__main__":
    export_static_api()
