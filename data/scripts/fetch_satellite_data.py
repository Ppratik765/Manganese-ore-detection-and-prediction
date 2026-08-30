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

# Multi-Region Spatial Coordinate Registry: 14 Major Indian Manganese & Strategic Mineral Belts
MINING_SECTORS: Dict[str, Dict[str, Any]] = {
    # 1. Central India - Sausar Belt (MOIL Core Operations)
    "balaghat_bharweli": {
        "name": "Balaghat Belt (Bharweli Mine)",
        "state": "Madhya Pradesh",
        "bbox": [80.10, 21.75, 80.30, 21.95],  # 20x20 km [min_lon, min_lat, max_lon, max_lat]
        "centroid": [21.850, 80.200],
        "mine_type": "Underground & Open Cast",
        "primary_mineral": "Braunite / Pyrolusite",
        "avg_grade_pct": 44.5,
        "est_reserves_mt": 14.2,
        "geological_formation": "Sausar Group (Mansar Formation)",
        "target_tonnage_shift": 2800.0,
        "active_fleet_count": 12,
    },
    "balaghat_ukwa_tirodi": {
        "name": "Balaghat Belt (Ukwa & Tirodi Mines)",
        "state": "Madhya Pradesh",
        "bbox": [79.65, 21.80, 79.85, 22.00],
        "centroid": [21.900, 79.750],
        "mine_type": "Underground & Open Cast",
        "primary_mineral": "Braunite / Bixbyite",
        "avg_grade_pct": 42.8,
        "est_reserves_mt": 11.5,
        "geological_formation": "Sausar Group (Tirodi Gneissic Complex)",
        "target_tonnage_shift": 2400.0,
        "active_fleet_count": 11,
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
        "active_fleet_count": 10,
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
        "active_fleet_count": 9,
    },
    "nagpur_kandri_mansar": {
        "name": "Nagpur Belt (Kandri, Mansar & Satak)",
        "state": "Maharashtra",
        "bbox": [79.15, 21.30, 79.35, 21.50],
        "centroid": [21.400, 79.250],
        "mine_type": "Underground & Open Cast",
        "primary_mineral": "Braunite / Jacobsite",
        "avg_grade_pct": 40.5,
        "est_reserves_mt": 10.2,
        "geological_formation": "Sausar Group (Lohangi Formation - GSR 723(E))",
        "target_tonnage_shift": 2100.0,
        "active_fleet_count": 9,
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
        "active_fleet_count": 8,
    },
    "chhindwara_sausar": {
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
        "active_fleet_count": 7,
    },

    # 2. Western India - Champaner & Aravalli Supergroup (Gujarat / Rajasthan)
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
        "active_fleet_count": 6,
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
        "active_fleet_count": 7,
    },
    "rajasthan_banswara": {
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
        "active_fleet_count": 6,
    },

    # 3. Eastern India - Iron Ore Group & Gangpur Supergroup (Odisha / Jharkhand)
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
        "active_fleet_count": 14,
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
        "active_fleet_count": 11,
    },
    "jharkhand_singhbhum": {
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
        "active_fleet_count": 7,
    },

    # 4. Southern India - Sandur Schist Belt (Karnataka)
    "karnataka_sandur_bellary": {
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
        "active_fleet_count": 12,
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

def search_planetary_computer_stac(
    bbox: List[float],
    datetime_range: str = "2024-01-01/2024-12-31",
    max_cloud_cover: float = 20.0
) -> List[Dict[str, Any]]:
    """
    Queries Microsoft Planetary Computer STAC API for Sentinel-2 L2A assets.
    Falls back gracefully if network or credentials are not present.
    """
    try:
        from pystac_client import Client
        import planetary_computer as pc
        
        stac_api_url = "https://planetarycomputer.microsoft.com/api/stac/v1"
        client = Client.open(stac_api_url, modifier=pc.sign_inplace)
        
        search = client.search(
            collections=["sentinel-2-l2a"],
            bbox=bbox,
            datetime=datetime_range,
            query={"eo:cloud_cover": {"lt": max_cloud_cover}},
            max_items=5
        )
        items = list(search.items())
        results = []
        for item in items:
            results.append({
                "id": item.id,
                "datetime": item.datetime.isoformat() if item.datetime else None,
                "cloud_cover": item.properties.get("eo:cloud_cover", 0.0),
                "assets": {k: v.href for k, v in item.assets.items() if k in ["B02", "B03", "B04", "B08", "B11", "B12"]}
            })
        return results
    except Exception as e:
        print(f"[STAC Harvester Notice] Live STAC query returned exception ({e}). Utilizing deterministic physics-based geological generator.")
        return []

def synthesize_multispectral_bands(
    sector_id: str,
    height: int = 256,
    width: int = 256,
    seed: int = 42
) -> Dict[str, np.ndarray]:
    """
    Deterministically synthesizes realistic Sentinel-2 surface reflectance bands
    (B02, B03, B04, B08, B11, B12) based on authentic gondite-manganese lithology,
    quartzite ridges, iron gossans, and vegetation signatures in Central & Eastern India.
    """
    np.random.seed(seed + hash(sector_id) % 10000)
    
    # Coordinate grid for realistic spatial structures (fault lines, ore veins, lithology contacts)
    y, x = np.mgrid[0:height, 0:width]
    
    # Structural geology strike angle (e.g. ENE-WSW trending Sausar belt)
    angle = np.deg2rad(65 if sector_id != "keonjhar" else 30)
    rotated_coord = x * np.cos(angle) + y * np.sin(angle)
    cross_coord = -x * np.sin(angle) + y * np.cos(angle)
    
    # Geological vein/fault structure
    vein_feature = np.exp(-((cross_coord - width * 0.48) ** 2) / (2 * (16.0 ** 2))) + \
                   0.6 * np.exp(-((cross_coord - width * 0.72) ** 2) / (2 * (10.0 ** 2)))
    
    # Regional lithology base reflectance
    base_rock = 0.18 + 0.05 * np.sin(rotated_coord / 25.0) + 0.03 * np.random.randn(height, width)
    
    # Vegetation distribution (deciduous forest / scrub around ridge)
    veg_mask = np.clip(0.4 + 0.3 * np.sin(y / 40.0) * np.cos(x / 40.0) - 0.5 * vein_feature + 0.05 * np.random.randn(height, width), 0.05, 0.95)
    
    # Band 02 (Blue - 490nm): Low in manganese & veg
    b02 = np.clip(0.04 + 0.03 * base_rock + 0.01 * np.random.randn(height, width), 0.01, 0.25)
    
    # Band 03 (Green - 560nm): Moderate in vegetation
    b03 = np.clip(0.06 + 0.04 * base_rock + 0.08 * veg_mask + 0.01 * np.random.randn(height, width), 0.02, 0.40)
    
    # Band 04 (Red - 665nm): High iron oxide / gossan reflectance, low in vegetation
    b04 = np.clip(0.08 + 0.06 * base_rock + 0.12 * vein_feature + 0.02 * np.random.randn(height, width), 0.03, 0.55)
    
    # Band 08 (NIR - 842nm): High in veg, strong absorption in manganese oxide zones
    b08 = np.clip(0.12 + 0.35 * veg_mask - 0.22 * vein_feature + 0.02 * np.random.randn(height, width), 0.04, 0.85)
    
    # Band 11 (SWIR-1 - 1610nm): High reflectance in altered clay / quartz-mica schists
    b11 = np.clip(0.16 + 0.14 * base_rock + 0.18 * vein_feature + 0.02 * np.random.randn(height, width), 0.05, 0.70)
    
    # Band 12 (SWIR-2 - 2190nm): Diagnostic absorption in manganese carbonates/oxides & clays
    b12 = np.clip(0.14 + 0.10 * base_rock + 0.08 * vein_feature + 0.02 * np.random.randn(height, width), 0.04, 0.65)
    
    return {
        "B02": b02.astype(np.float32),
        "B03": b03.astype(np.float32),
        "B04": b04.astype(np.float32),
        "B08": b08.astype(np.float32),
        "B11": b11.astype(np.float32),
        "B12": b12.astype(np.float32),
    }

def compute_spectral_indices(bands: Dict[str, np.ndarray], eps: float = 1e-6) -> Dict[str, np.ndarray]:
    """
    Computes diagnostic exploration band ratios and indices for manganese & host rock alteration:
    - NDVI: (B08 - B04) / (B08 + B04 + eps) -> Vegetation cover vs rock exposure
    - Clay / Alteration Index: B11 / (B12 + eps) -> Al-OH clays and phyllosilicates
    - Ferrous Minerals Index: B12 / (B08 + eps) -> Fe2+ silicates, pyrolusite & braunite association
    - Iron Oxide Index: B04 / (B02 + eps) -> Gossans, limonite, hematite cappings
    """
    b02 = bands["B02"]
    b04 = bands["B04"]
    b08 = bands["B08"]
    b11 = bands["B11"]
    b12 = bands["B12"]

    ndvi = (b08 - b04) / (b08 + b04 + eps)
    clay_index = b11 / (b12 + eps)
    ferrous_index = b12 / (b08 + eps)
    iron_oxide_index = b04 / (b02 + eps)

    return {
        "NDVI": np.clip(ndvi, -1.0, 1.0).astype(np.float32),
        "Clay_Index": np.clip(clay_index, 0.0, 10.0).astype(np.float32),
        "Ferrous_Index": np.clip(ferrous_index, 0.0, 10.0).astype(np.float32),
        "Iron_Oxide_Index": np.clip(iron_oxide_index, 0.0, 10.0).astype(np.float32),
    }

def extract_10channel_tensor(bands: Dict[str, np.ndarray], indices: Dict[str, np.ndarray]) -> np.ndarray:
    """
    Stacks raw Sentinel-2 bands and diagnostic exploration indices into a standardized 10-channel tensor:
    [0]: B04 (Red)
    [1]: B03 (Green)
    [2]: B02 (Blue)
    [3]: B08 (Near-IR)
    [4]: B11 (SWIR-1)
    [5]: B12 (SWIR-2)
    [6]: NDVI
    [7]: Clay / Alteration Index
    [8]: Ferrous Minerals Index
    [9]: Iron Oxide Index
    Shape: (10, H, W)
    """
    stacked = np.stack([
        bands["B04"],
        bands["B03"],
        bands["B02"],
        bands["B08"],
        bands["B11"],
        bands["B12"],
        indices["NDVI"],
        indices["Clay_Index"],
        indices["Ferrous_Index"],
        indices["Iron_Oxide_Index"],
    ], axis=0).astype(np.float32)
    return stacked

def generate_ground_truth_mask(
    bands: Dict[str, np.ndarray],
    indices: Dict[str, np.ndarray],
    sector_id: str
) -> np.ndarray:
    """
    Synthesizes binary ground truth segmentation mask for high-grade Manganese reserve anomaly:
    Criteria: Strong Ferrous/Clay alteration + Iron oxide cap + Low NDVI (bare rock exposure) + SWIR absorption.
    Shape: (1, H, W)
    """
    ferrous = indices["Ferrous_Index"]
    iron = indices["Iron_Oxide_Index"]
    clay = indices["Clay_Index"]
    ndvi = indices["NDVI"]
    b12 = bands["B12"]
    
    # Anomaly indicator
    score = (0.35 * (ferrous / (ferrous.max() + 1e-6)) +
             0.30 * (iron / (iron.max() + 1e-6)) +
             0.25 * (clay / (clay.max() + 1e-6)) -
             0.30 * (ndvi - ndvi.min()) / (ndvi.max() - ndvi.min() + 1e-6))
    
    threshold = np.percentile(score, 78)
    mask = (score >= threshold).astype(np.float32)
    
    # Morphological cleaning / smoothing
    from scipy.ndimage import gaussian_filter
    smoothed = gaussian_filter(mask, sigma=1.2)
    binary_mask = (smoothed >= 0.45).astype(np.float32)
    return np.expand_dims(binary_mask, axis=0)

def tile_and_save_dataset(
    output_dir: str = "data/processed/spectral_patches",
    patches_per_sector: int = 12,
    patch_size: int = 256
) -> str:
    """
    Extracts and tiles multispectral tensors across all registered mining sectors.
    Saves compressed .npz tiles and outputs a manifest JSON.
    """
    os.makedirs(output_dir, exist_ok=True)
    manifest = []
    
    for sector_id, sector_info in MINING_SECTORS.items():
        for i in range(patches_per_sector):
            seed = 100 * (i + 1) + len(sector_id)
            bands = synthesize_multispectral_bands(sector_id, height=patch_size, width=patch_size, seed=seed)
            indices = compute_spectral_indices(bands)
            tensor = extract_10channel_tensor(bands, indices)
            mask = generate_ground_truth_mask(bands, indices, sector_id)
            
            # Grade distribution estimation for reserve
            ore_pixels = mask.sum()
            total_pixels = patch_size * patch_size
            reserve_area_ratio = float(ore_pixels / total_pixels)
            estimated_grade = float(np.clip(sector_info["avg_grade_pct"] + np.random.normal(0, 1.5), 28.0, 52.0))
            
            filename = f"patch_{sector_id}_{i:03d}.npz"
            filepath = os.path.join(output_dir, filename)
            
            np.savez_compressed(
                filepath,
                tensor=tensor,
                mask=mask,
                sector=sector_id,
                grade=estimated_grade,
                bbox=sector_info["bbox"],
                area_ratio=reserve_area_ratio
            )
            
            manifest.append({
                "filename": filename,
                "filepath": filepath.replace("\\", "/"),
                "sector": sector_id,
                "state": sector_info["state"],
                "formation": sector_info["geological_formation"],
                "grade_pct": estimated_grade,
                "ore_pixel_ratio": reserve_area_ratio,
                "tensor_shape": list(tensor.shape),
                "mask_shape": list(mask.shape)
            })
            
    manifest_path = os.path.join(output_dir, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
        
    print(f"[Success] Generated {len(manifest)} multispectral 10-channel tiles across {len(MINING_SECTORS)} sectors in '{output_dir}'.")
    return manifest_path

if __name__ == "__main__":
    print(f"Registered Manganese Mining Sectors ({len(MINING_SECTORS)} Total):")
    for sid, info in MINING_SECTORS.items():
        print(f" - [{sid.upper()}] {info['name']} ({info['state']}) | BBox: {info['bbox']}")
    
    print(f"\nGenerating multispectral patch dataset across {len(MINING_SECTORS)} sectors...")
    manifest_file = tile_and_save_dataset()
    print(f"Manifest written to: {manifest_file}")



