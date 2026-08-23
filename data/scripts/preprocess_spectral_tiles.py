"""
Automated Data Pipeline Orchestrator & Tile Preprocessing
Orchestrates:
1. Multi-spectral satellite patch extraction & band ratio generation across 5 mining sectors
2. Mine operations & equipment telemetry blending into shift records
3. Dataset verification, tensor normalization statistics, and 80/20 train-validation splitting
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, List

# Add parent directory to path for cross-module imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from data.scripts.fetch_satellite_data import tile_and_save_dataset, MINING_SECTORS
from data.scripts.generate_synthetic_operations import export_operations_dataset

def run_data_pipeline(
    spectral_out_dir: str = "data/processed/spectral_patches",
    ops_out_file: str = "data/processed/mine_operations.csv",
    split_out_file: str = "data/processed/dataset_split.json",
    patches_per_sector: int = 16,
    patch_size: int = 256
) -> Dict[str, Any]:
    """
    Executes end-to-end data generation, normalization check, and train/val partitioning.
    """
    print("=" * 70)
    print(">>> MOIL SPACE-TECH & MINE OPERATIONS DATA PIPELINE ORCHESTRATOR <<<")
    print("=" * 70)
    
    # Step 1: Synthesize and tile 10-channel Sentinel-2 spectral cubes
    print("\n[Step 1/3] Generating 10-Channel Multi-Spectral Exploration Cubes...")
    manifest_path = tile_and_save_dataset(
        output_dir=spectral_out_dir,
        patches_per_sector=patches_per_sector,
        patch_size=patch_size
    )
    
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
        
    print(f" -> Processed {len(manifest)} multispectral patches across {len(MINING_SECTORS)} sectors.")
    
    # Step 2: Ingest AI4I 2020 telemetry and blend shift operations
    print("\n[Step 2/3] Ingesting Telemetry & Blending Operational Logs...")
    ops_path = export_operations_dataset(output_path=ops_out_file)
    ops_df = pd.read_csv(ops_path)
    print(f" -> Generated {len(ops_df)} mining shifts with shortfall rate {ops_df['shortfall_flag'].mean()*100:.1f}%.")
    
    # Step 3: Compute channel normalization stats & generate 80/20 train/val split
    print("\n[Step 3/3] Computing Tensor Statistics and Creating Train/Val Splits...")
    np.random.seed(42)
    indices = np.arange(len(manifest))
    np.random.shuffle(indices)
    split_idx = int(0.8 * len(manifest))
    
    train_indices = [int(x) for x in indices[:split_idx]]
    val_indices = [int(x) for x in indices[split_idx:]]
    
    # Calculate channel-wise means and stds across training sample
    sample_tensors = []
    for idx in train_indices[:10]:
        item = manifest[idx]
        data = np.load(item["filepath"])
        sample_tensors.append(data["tensor"])
        
    stacked_samples = np.stack(sample_tensors, axis=0) # (N, 10, 256, 256)
    channel_means = stacked_samples.mean(axis=(0, 2, 3)).tolist()
    channel_stds = stacked_samples.std(axis=(0, 2, 3)).tolist()
    
    split_metadata = {
        "total_patches": len(manifest),
        "train_count": len(train_indices),
        "val_count": len(val_indices),
        "train_files": [manifest[i]["filename"] for i in train_indices],
        "val_files": [manifest[i]["filename"] for i in val_indices],
        "channel_names": [
            "B04_Red", "B03_Green", "B02_Blue", "B08_NIR", "B11_SWIR1", "B12_SWIR2",
            "NDVI", "Clay_Index", "Ferrous_Index", "Iron_Oxide_Index"
        ],
        "channel_means": [round(m, 4) for m in channel_means],
        "channel_stds": [round(s, 4) for s in channel_stds],
        "sectors": list(MINING_SECTORS.keys())
    }
    
    os.makedirs(os.path.dirname(split_out_file), exist_ok=True)
    with open(split_out_file, "w", encoding="utf-8") as f:
        json.dump(split_metadata, f, indent=2)
        
    print(f" -> Train / Validation Split saved to: {split_out_file}")
    print("=" * 70)
    print("DATA PIPELINE COMPLETED SUCCESSFULLY!")
    print("=" * 70)
    return split_metadata

if __name__ == "__main__":
    run_data_pipeline()
