"""
========================================================================================
MOIL LIMITED — AI/ML & SPACE-TECH MANGANESE PLATFORM
UNIVERSITY CLUSTER & LAB WORKSTATION TRAINING ORCHESTRATOR
========================================================================================
This master script is designed to run on high-compute university/lab machines to:
1. Ingest/synthesize 20x20 km 10-channel Sentinel-2 multispectral tiles for all 14 sectors.
2. Calculate exploration band indices (NDVI, Clay Alteration, Ferrous Minerals, Iron Oxide).
3. Train the 10-Channel Multispectral U-Net Segmentation & Grade Estimation model.
4. Export the lightweight ONNX computation graph ('reserves_unet.onnx').
5. Train the XGBoost Shift Production Shortfall Forecaster ('shortfall_xgb.pkl').
6. Pre-generate lightweight offline inference caches ('sector_grid_cache.json').
7. Verify all model artifacts for deployment to the laptop dev server.
========================================================================================
"""

import os
import sys
import time
import json
import argparse
import numpy as np

# Add project root to sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, PROJECT_ROOT)

def print_header(title: str):
    print("\n" + "=" * 80)
    print(f" >>> {title.upper()} <<<")
    print("=" * 80)

def verify_environment():
    print_header("Step 0: Verifying University Lab Compute Environment")
    print(f"Python Version: {sys.version}")
    
    # Check PyTorch & GPU
    try:
        import torch
        print(f"[OK] PyTorch version: {torch.__version__}")
        if torch.cuda.is_available():
            device_name = torch.cuda.get_device_name(0)
            vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
            print(f"[OK] CUDA GPU DETECTED: {device_name} ({vram_gb:.1f} GB VRAM)")
        else:
            print("[INFO] No CUDA GPU detected. Utilizing multi-threaded CPU execution.")
    except ImportError:
        print("[ERROR] PyTorch not installed. Please run: pip install torch torchvision")
        sys.exit(1)

    # Check ONNX & ONNXRuntime
    try:
        import onnx
        import onnxruntime as ort
        print(f"[OK] ONNX {onnx.__version__} & ONNX Runtime {ort.__version__} available.")
    except ImportError:
        print("[ERROR] ONNX / ONNX Runtime not installed. Please run: pip install onnx onnxruntime")
        sys.exit(1)

    # Check XGBoost
    try:
        import xgboost as xgb
        print(f"[OK] XGBoost version: {xgb.__version__}")
    except ImportError:
        print("[ERROR] XGBoost not installed. Please run: pip install xgboost")
        sys.exit(1)

def run_data_preparation(patches_per_sector: int = 16, patch_size: int = 256):
    print_header("Step 1: Ingesting & Tiling 14 National Mining Sectors (20x20 km)")
    from data.scripts.preprocess_spectral_tiles import run_data_pipeline
    from data.scripts.fetch_satellite_data import MINING_SECTORS
    
    print(f"Targeting {len(MINING_SECTORS)} authentic Indian Manganese Belts:")
    for i, (sid, info) in enumerate(MINING_SECTORS.items(), 1):
        print(f" {i:02d}. [{sid}] {info['name']} ({info['state']}) — Avg Grade: {info['avg_grade_pct']}% Mn")
        
    split_meta = run_data_pipeline(
        spectral_out_dir=os.path.join(PROJECT_ROOT, "data", "processed", "spectral_patches"),
        ops_out_file=os.path.join(PROJECT_ROOT, "data", "processed", "mine_operations.csv"),
        split_out_file=os.path.join(PROJECT_ROOT, "data", "processed", "dataset_split.json"),
        patches_per_sector=patches_per_sector,
        patch_size=patch_size
    )
    return split_meta

def train_unet_model(epochs: int = 20, batch_size: int = 8, lr: float = 1e-3):
    print_header("Step 2: Training 10-Channel Multispectral U-Net (PyTorch -> ONNX)")
    from ml_pipelines.reserve_segmentation.train_and_export_onnx import train_reserve_unet, export_unet_to_onnx
    
    checkpoint_dir = os.path.join(PROJECT_ROOT, "backend", "app", "models")
    onnx_target = os.path.join(checkpoint_dir, "reserves_unet.onnx")
    
    model, train_res = train_reserve_unet(
        epochs=epochs,
        batch_size=batch_size,
        learning_rate=lr,
        checkpoint_dir=checkpoint_dir,
        manifest_path=os.path.join(PROJECT_ROOT, "data", "processed", "spectral_patches", "manifest.json"),
        split_path=os.path.join(PROJECT_ROOT, "data", "processed", "dataset_split.json")
    )
    
    print(f"\n[Training Summary] Best Validation Mean IoU: {train_res['best_val_iou']:.4f}")
    
    # Export to ONNX
    onnx_path = export_unet_to_onnx(model, output_onnx_path=onnx_target)
    print(f"[Success] Exported ONNX model ({os.path.getsize(onnx_path) / (1024*1024):.2f} MB) to: {onnx_path}")
    return onnx_path

def train_xgboost_model():
    print_header("Step 3: Training XGBoost Shift Shortfall & Anomaly Predictor")
    from ml_pipelines.production_forecasting.train_xgboost import train_and_evaluate_xgboost
    
    ops_csv = os.path.join(PROJECT_ROOT, "data", "processed", "mine_operations.csv")
    model, metrics, df_feat = train_and_evaluate_xgboost(csv_path=ops_csv)
    
    print(f"\n[XGBoost Performance] Test Accuracy: {metrics['accuracy']*100:.1f}% | AUC-ROC: {metrics['roc_auc']:.4f} | F1-Score: {metrics['f1_score']:.4f}")
    
    # Serialize model artifact
    import pickle
    model_out = os.path.join(PROJECT_ROOT, "backend", "app", "models", "shortfall_xgb.pkl")
    from ml_pipelines.production_forecasting.train_xgboost import FEATURE_COLUMNS
    
    artifact = {
        "model": model,
        "metrics": metrics,
        "feature_columns": FEATURE_COLUMNS,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    with open(model_out, "wb") as f:
        pickle.dump(artifact, f)
        
    print(f"[Success] Serialized XGBoost artifact to: {model_out}")
    return model_out

def precompute_sector_grid_cache():
    print_header("Step 4: Precomputing Lightweight High-Res Inference Grid Cache")
    from backend.app.services.onnx_inference import ONNXReserveInferenceService
    from data.scripts.fetch_satellite_data import (
        MINING_SECTORS,
        synthesize_multispectral_bands,
        compute_spectral_indices,
        extract_10channel_tensor
    )
    
    onnx_path = os.path.join(PROJECT_ROOT, "backend", "app", "models", "reserves_unet.onnx")
    service = ONNXReserveInferenceService(onnx_model_path=onnx_path)
    
    grid_cache = {}
    resolution = 32
    
    for sector_key, sector_info in MINING_SECTORS.items():
        bands = synthesize_multispectral_bands(sector_key, height=256, width=256, seed=42 + hash(sector_key) % 1000)
        indices = compute_spectral_indices(bands)
        tensor_10ch = extract_10channel_tensor(bands, indices)
        
        result = service.segment_reserve(
            tensor_10ch=tensor_10ch,
            sector_id=sector_key,
            downsample_grid_size=resolution
        )
        
        grid = np.array(result["probability_grid"])
        min_lon, min_lat, max_lon, max_lat = sector_info["bbox"]
        
        top_indices = np.dstack(np.unravel_index(np.argsort(grid.ravel())[::-1], grid.shape))[0][:4]
        drill_targets = []
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
            
        grid_cache[sector_key] = {
            "sector": sector_key,
            "sector_name": sector_info["name"],
            "state": sector_info["state"],
            "bbox": sector_info["bbox"],
            "centroid": sector_info["centroid"],
            "mine_type": sector_info["mine_type"],
            "geological_formation": sector_info["geological_formation"],
            "primary_mineral": sector_info["primary_mineral"],
            "estimated_grade_pct": result["estimated_grade_pct"],
            "confidence_score": result["confidence_score"],
            "delineated_area_km2": result["delineated_area_km2"],
            "estimated_reserve_mt": sector_info["est_reserves_mt"],
            "unfc_classification": result["unfc_classification"],
            "probability_grid": result["probability_grid"],
            "drill_hole_targets": drill_targets
        }
        
    cache_path = os.path.join(PROJECT_ROOT, "backend", "app", "models", "sector_grid_cache.json")
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(grid_cache, f, indent=2)
        
    print(f"[Success] Precomputed inference cache for {len(grid_cache)} sectors ({os.path.getsize(cache_path) / 1024:.1f} KB) saved to: {cache_path}")

def main():
    parser = argparse.ArgumentParser(description="MOIL Space-Tech Master University Training Pipeline")
    parser.add_argument("--epochs", type=int, default=15, help="Number of U-Net training epochs (default: 15)")
    parser.add_argument("--batch-size", type=int, default=8, help="Batch size for U-Net training (default: 8)")
    parser.add_argument("--patches-per-sector", type=int, default=16, help="Number of 256x256 spectral patches per sector (default: 16)")
    parser.add_argument("--lr", type=float, default=1e-3, help="Learning rate (default: 0.001)")
    args = parser.parse_args()

    start_time = time.time()
    print("=" * 80)
    print("   MOIL LIMITED — AI/ML & SPACE-TECH MANGANESE PLATFORM")
    print("   NATIONAL 14-SECTOR TRAINING & ONNX SERIALIZATION PIPELINE")
    print("=" * 80)

    verify_environment()
    run_data_preparation(patches_per_sector=args.patches_per_sector, patch_size=256)
    train_unet_model(epochs=args.epochs, batch_size=args.batch_size, lr=args.lr)
    train_xgboost_model()
    precompute_sector_grid_cache()

    elapsed = time.time() - start_time
    print_header("Training Pipeline Finished Successfully!")
    print(f"Total Pipeline Execution Time: {elapsed / 60:.2f} minutes")
    print("\nNext Steps for Git Commit & Sync back to Laptop:")
    print("------------------------------------------------------------------------")
    print("git add backend/app/models/reserves_unet.onnx")
    print("git add backend/app/models/shortfall_xgb.pkl")
    print("git add backend/app/models/sector_grid_cache.json")
    print('git commit -m "feat(models): update 14-sector national manganese models from university cluster"')
    print("git push origin main")
    print("------------------------------------------------------------------------")
    print("On your laptop, simply run 'git pull origin main' and launch the dev servers!")

if __name__ == "__main__":
    main()
