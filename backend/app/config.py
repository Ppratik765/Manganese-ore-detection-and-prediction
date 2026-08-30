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
    
    # Registered 20 Indian Manganese & Strategic Mining Belts (MMDR Section 17A Gazette Notified)
    SECTORS: Dict[str, Dict[str, Any]] = {
        # 1. Central India - Sausar Belt (MOIL Core Hubs)
        "balaghat_bharweli": {
            "name": "Balaghat Belt (Bharweli Mine)",
            "state": "Madhya Pradesh",
            "bbox": [80.10, 21.75, 80.30, 21.95],
            "centroid": [21.850, 80.200],
            "mine_type": "Underground & Open Cast",
            "primary_mineral": "Braunite / Pyrolusite",
            "avg_grade_pct": 44.5,
            "est_reserves_mt": 14.2,
            "geological_formation": "Sausar Group (Mansar Formation)",
            "target_tonnage_shift": 2800.0,
            "active_fleet_count": 12
        },
        "balaghat_ukwa": {
            "name": "Balaghat Belt (Ukwa Underground Mine)",
            "state": "Madhya Pradesh",
            "bbox": [80.40, 21.90, 80.60, 22.10],
            "centroid": [22.000, 80.500],
            "mine_type": "Underground",
            "primary_mineral": "Braunite / Cryptomelane",
            "avg_grade_pct": 43.2,
            "est_reserves_mt": 10.8,
            "geological_formation": "Sausar Group (Ukwa Bedded Ore Horizon)",
            "target_tonnage_shift": 2300.0,
            "active_fleet_count": 10
        },
        "balaghat_tirodi": {
            "name": "Balaghat Belt (Tirodi & Sitapathore Mines)",
            "state": "Madhya Pradesh",
            "bbox": [79.65, 21.80, 79.85, 22.00],
            "centroid": [21.900, 79.750],
            "mine_type": "Open Cast & Underground",
            "primary_mineral": "Braunite / Bixbyite",
            "avg_grade_pct": 42.5,
            "est_reserves_mt": 11.5,
            "geological_formation": "Sausar Group (Tirodi Gneissic Complex)",
            "target_tonnage_shift": 2400.0,
            "active_fleet_count": 11
        },
        "bhandara_dongri_buzurg": {
            "name": "Bhandara Belt (Dongri Buzurg Mine)",
            "state": "Maharashtra",
            "bbox": [79.60, 21.40, 79.80, 21.60],
            "centroid": [21.500, 79.700],
            "mine_type": "Open Cast",
            "primary_mineral": "Psilomelane / Pyrolusite",
            "avg_grade_pct": 41.2,
            "est_reserves_mt": 9.8,
            "geological_formation": "Sausar Group (Dongri Buzurg Formation)",
            "target_tonnage_shift": 2200.0,
            "active_fleet_count": 10
        },
        "bhandara_chikla_sitasawangi": {
            "name": "Bhandara Belt (Chikla & Sitasawangi Block)",
            "state": "Maharashtra",
            "bbox": [79.75, 21.45, 79.95, 21.65],
            "centroid": [21.550, 79.850],
            "mine_type": "Underground",
            "primary_mineral": "Braunite / Pyrolusite",
            "avg_grade_pct": 43.0,
            "est_reserves_mt": 8.6,
            "geological_formation": "Sausar Group (GSR 723(E) Gazette Reserved Block)",
            "target_tonnage_shift": 2000.0,
            "active_fleet_count": 9
        },
        "nagpur_kandri_mansar": {
            "name": "Nagpur Belt (Kandri & Mansar Mines)",
            "state": "Maharashtra",
            "bbox": [79.15, 21.30, 79.35, 21.50],
            "centroid": [21.400, 79.250],
            "mine_type": "Underground & Open Cast",
            "primary_mineral": "Braunite / Jacobsite",
            "avg_grade_pct": 40.5,
            "est_reserves_mt": 10.2,
            "geological_formation": "Sausar Group (Lohangi Formation - GSR 723(E))",
            "target_tonnage_shift": 2100.0,
            "active_fleet_count": 9
        },
        "nagpur_gumgaon_ramdongri": {
            "name": "Nagpur Belt (Gumgaon, Kodegaon & Parsoda)",
            "state": "Maharashtra",
            "bbox": [78.95, 21.15, 79.15, 21.35],
            "centroid": [21.250, 79.050],
            "mine_type": "Underground",
            "primary_mineral": "Braunite / Hollandite",
            "avg_grade_pct": 39.2,
            "est_reserves_mt": 7.8,
            "geological_formation": "Sausar Group (Ramdongri Syncline)",
            "target_tonnage_shift": 1850.0,
            "active_fleet_count": 8
        },
        "nagpur_beldongri_satak": {
            "name": "Nagpur Belt (Beldongri, Satak & Nagardhan)",
            "state": "Maharashtra",
            "bbox": [79.25, 21.25, 79.45, 21.45],
            "centroid": [21.350, 79.350],
            "mine_type": "Open Cast & Underground",
            "primary_mineral": "Braunite / Hausmannite",
            "avg_grade_pct": 38.8,
            "est_reserves_mt": 6.8,
            "geological_formation": "Sausar Group (Satak-Nagardhan Reserved Sector)",
            "target_tonnage_shift": 1750.0,
            "active_fleet_count": 8
        },
        "chhindwara_sausar_gowari": {
            "name": "Chhindwara Belt (Gowari Wadhona & Sausar)",
            "state": "Madhya Pradesh",
            "bbox": [78.70, 21.80, 78.90, 22.00],
            "centroid": [21.900, 78.800],
            "mine_type": "Open Cast & Exploratory",
            "primary_mineral": "Braunite / Rhodonite",
            "avg_grade_pct": 38.0,
            "est_reserves_mt": 6.5,
            "geological_formation": "Sausar Group (Bichua Formation)",
            "target_tonnage_shift": 1600.0,
            "active_fleet_count": 7
        },

        # 2. Western India - Champaner & Aravalli Belts
        "gujarat_vadodara_pavi": {
            "name": "Vadodara Belt (Pavi Jetpur Block)",
            "state": "Gujarat",
            "bbox": [73.70, 22.25, 73.90, 22.45],
            "centroid": [22.350, 73.800],
            "mine_type": "Open Cast",
            "primary_mineral": "Pyrolusite / Manganese Carbonate",
            "avg_grade_pct": 36.5,
            "est_reserves_mt": 5.4,
            "geological_formation": "Champaner Group (GMDC Reserved Block)",
            "target_tonnage_shift": 1400.0,
            "active_fleet_count": 6
        },
        "gujarat_panchmahal_halol": {
            "name": "Panchmahal Belt (Halol & Shivrajpur)",
            "state": "Gujarat",
            "bbox": [73.55, 22.40, 73.75, 22.60],
            "centroid": [22.500, 73.650],
            "mine_type": "Open Cast & Beneficiation",
            "primary_mineral": "Pyrolusite / Psilomelane",
            "avg_grade_pct": 38.5,
            "est_reserves_mt": 7.2,
            "geological_formation": "Champaner Group (Shivrajpur Horizon)",
            "target_tonnage_shift": 1700.0,
            "active_fleet_count": 7
        },
        "rajasthan_banswara_tambesra": {
            "name": "Banswara Belt (Tambesra & Ghatia Block)",
            "state": "Rajasthan",
            "bbox": [74.35, 23.25, 74.55, 23.45],
            "centroid": [23.350, 74.450],
            "mine_type": "Open Cast",
            "primary_mineral": "Pyrolusite / Braunite",
            "avg_grade_pct": 35.0,
            "est_reserves_mt": 4.9,
            "geological_formation": "Aravalli Supergroup (Lunavada Group)",
            "target_tonnage_shift": 1300.0,
            "active_fleet_count": 6
        },

        # 3. Eastern India - Iron Ore Group & Gangpur Belts
        "odisha_keonjhar_joda": {
            "name": "Keonjhar Belt (Barbil, Joda & Thakurani)",
            "state": "Odisha",
            "bbox": [85.25, 21.90, 85.45, 22.10],
            "centroid": [22.000, 85.350],
            "mine_type": "Open Cast",
            "primary_mineral": "Cryptomelane / Pyrolusite",
            "avg_grade_pct": 43.5,
            "est_reserves_mt": 16.8,
            "geological_formation": "Iron Ore Group (IOG) Shales (SAIL/OMC)",
            "target_tonnage_shift": 3200.0,
            "active_fleet_count": 14
        },
        "odisha_sundargarh_bonai": {
            "name": "Sundargarh Belt (Bonai-Kendujhar Basin)",
            "state": "Odisha",
            "bbox": [84.95, 21.75, 85.15, 21.95],
            "centroid": [21.850, 85.050],
            "mine_type": "Open Cast",
            "primary_mineral": "Braunite / Manganite",
            "avg_grade_pct": 40.0,
            "est_reserves_mt": 12.1,
            "geological_formation": "Gangpur Group Metasediments",
            "target_tonnage_shift": 2600.0,
            "active_fleet_count": 11
        },
        "odisha_sundargarh_patmunda": {
            "name": "Sundargarh Belt (Patmunda & Koira Blocks)",
            "state": "Odisha",
            "bbox": [85.10, 21.85, 85.30, 22.05],
            "centroid": [21.950, 85.200],
            "mine_type": "Open Cast",
            "primary_mineral": "Pyrolusite / Lithiophorite",
            "avg_grade_pct": 41.5,
            "est_reserves_mt": 10.4,
            "geological_formation": "Bonai Iron-Manganese Synclinorium",
            "target_tonnage_shift": 2250.0,
            "active_fleet_count": 10
        },
        "jharkhand_singhbhum_chaibasa": {
            "name": "Singhbhum Belt (Chaibasa & Noamundi-Gua)",
            "state": "Jharkhand",
            "bbox": [85.55, 22.05, 85.75, 22.25],
            "centroid": [22.150, 85.650],
            "mine_type": "Open Cast",
            "primary_mineral": "Psilomelane / Pyrolusite",
            "avg_grade_pct": 37.8,
            "est_reserves_mt": 6.9,
            "geological_formation": "Kolhan Group / Iron Ore Series",
            "target_tonnage_shift": 1550.0,
            "active_fleet_count": 7
        },

        # 4. Southern India - Sandur Schist, Shimoga, Vizag & Goa Belts
        "karnataka_sandur_kumaraswamy": {
            "name": "Sandur & Bellary Belt (Kumaraswamy Range)",
            "state": "Karnataka",
            "bbox": [76.45, 14.95, 76.65, 15.15],
            "centroid": [15.050, 76.550],
            "mine_type": "Open Cast",
            "primary_mineral": "Pyrolusite / Wad / Manganite",
            "avg_grade_pct": 39.5,
            "est_reserves_mt": 13.4,
            "geological_formation": "Dharwar Supergroup (Sandur Schist Belt)",
            "target_tonnage_shift": 2700.0,
            "active_fleet_count": 12
        },
        "karnataka_shimoga_kumsi": {
            "name": "Shimoga-North Kanara Belt (Kumsi & Shikaripur)",
            "state": "Karnataka",
            "bbox": [75.40, 14.05, 75.60, 14.25],
            "centroid": [14.150, 75.500],
            "mine_type": "Open Cast",
            "primary_mineral": "Pyrolusite / Psilomelane",
            "avg_grade_pct": 36.0,
            "est_reserves_mt": 5.8,
            "geological_formation": "Dharwar Supergroup (Shimoga Schist Belt)",
            "target_tonnage_shift": 1450.0,
            "active_fleet_count": 6
        },
        "andhra_visakhapatnam_garividi": {
            "name": "Vizianagaram-Srikakulam Belt (Garividi & Chipurupalle)",
            "state": "Andhra Pradesh",
            "bbox": [83.45, 18.20, 83.65, 18.40],
            "centroid": [18.300, 83.550],
            "mine_type": "Open Cast",
            "primary_mineral": "Kodurite / Braunite / Jacobsite",
            "avg_grade_pct": 37.0,
            "est_reserves_mt": 7.6,
            "geological_formation": "Eastern Ghats Mobile Belt (Khondalite Suite)",
            "target_tonnage_shift": 1650.0,
            "active_fleet_count": 7
        },
        "goa_sanguem_bicholim": {
            "name": "Goa Mining Belt (Sanguem & Quepem Blocks)",
            "state": "Goa",
            "bbox": [74.05, 15.15, 74.25, 15.35],
            "centroid": [15.250, 74.150],
            "mine_type": "Open Cast",
            "primary_mineral": "Ferruginous Manganese / Wad",
            "avg_grade_pct": 34.5,
            "est_reserves_mt": 8.2,
            "geological_formation": "Dharwar Supergroup (Goa Group Metavolcanics)",
            "target_tonnage_shift": 1800.0,
            "active_fleet_count": 8
        },
    }


settings = Settings()
