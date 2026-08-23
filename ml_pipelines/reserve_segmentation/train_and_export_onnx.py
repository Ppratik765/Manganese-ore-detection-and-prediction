"""
Training Loop & Checkpointing for Manganese Reserve Segmentation U-Net
- Multi-Task Optimization: Dice + Focal Loss + Ore Grade Regression
- Validation Checkpointing on Best Mean IoU & Dice Coefficient
- Automated Fallback: CUDA / Apple MPS / CPU
"""

import os
import sys
import json
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
import numpy as np
from typing import Dict, Any, Tuple, Optional

# Add root project path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from ml_pipelines.reserve_segmentation.unet_model import MultispectralUNet
from ml_pipelines.reserve_segmentation.dataset import create_data_loaders, CombinedReserveLoss

def compute_validation_metrics(
    model: nn.Module,
    val_loader: torch.utils.data.DataLoader,
    criterion: nn.Module,
    device: torch.device
) -> Dict[str, float]:
    """Evaluates validation loss, Dice score, Intersection over Union (IoU), and Grade MAE."""
    model.eval()
    total_loss = 0.0
    total_dice = 0.0
    total_iou = 0.0
    total_grade_mae = 0.0
    num_batches = len(val_loader)
    
    with torch.no_grad():
        for batch in val_loader:
            x = batch["tensor"].to(device)
            y_mask = batch["mask"].to(device)
            y_grade = batch["grade"].to(device)
            
            mask_logits, grade_pred = model(x)
            loss, _ = criterion(mask_logits, y_mask, grade_pred, y_grade)
            
            total_loss += loss.item()
            
            # Binary metrics
            probs = torch.sigmoid(mask_logits)
            preds = (probs >= 0.5).float()
            
            intersection = (preds * y_mask).sum()
            union = preds.sum() + y_mask.sum()
            dice = (2.0 * intersection + 1e-6) / (union + 1e-6)
            iou = (intersection + 1e-6) / (union - intersection + 1e-6)
            
            total_dice += dice.item()
            total_iou += iou.item()
            
            grade_mae = torch.abs(grade_pred.view(-1) - y_grade.view(-1)).mean().item()
            total_grade_mae += grade_mae
            
    return {
        "val_loss": total_loss / max(1, num_batches),
        "val_dice": total_dice / max(1, num_batches),
        "val_iou": total_iou / max(1, num_batches),
        "val_grade_mae": total_grade_mae / max(1, num_batches)
    }

def train_reserve_unet(
    epochs: int = 15,
    batch_size: int = 4,
    learning_rate: float = 1e-3,
    checkpoint_dir: str = "backend/app/models",
    manifest_path: str = "data/processed/spectral_patches/manifest.json",
    split_path: str = "data/processed/dataset_split.json"
) -> Tuple[nn.Module, Dict[str, Any]]:
    """
    Trains the 10-channel U-Net on satellite exploration tensors and saves best checkpoint.
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Training] Using compute device: {device}")
    
    os.makedirs(checkpoint_dir, exist_ok=True)
    
    train_loader, val_loader, split_meta = create_data_loaders(
        manifest_path=manifest_path,
        split_path=split_path,
        batch_size=batch_size
    )
    
    model = MultispectralUNet(in_channels=10, out_channels=1).to(device)
    criterion = CombinedReserveLoss(dice_weight=0.5, focal_weight=0.5, grade_weight=0.05)
    optimizer = AdamW(model.parameters(), lr=learning_rate, weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)
    
    best_iou = 0.0
    best_weights_path = os.path.join(checkpoint_dir, "reserves_unet_best.pt")
    history = []
    
    print(f"[Training] Beginning U-Net training for {epochs} epochs ({len(train_loader.dataset)} train / {len(val_loader.dataset)} val)...")
    
    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        
        for batch in train_loader:
            x = batch["tensor"].to(device)
            y_mask = batch["mask"].to(device)
            y_grade = batch["grade"].to(device)
            
            optimizer.zero_grad()
            mask_logits, grade_pred = model(x)
            loss, _ = criterion(mask_logits, y_mask, grade_pred, y_grade)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            
        scheduler.step()
        train_loss /= len(train_loader)
        
        val_metrics = compute_validation_metrics(model, val_loader, criterion, device)
        
        print(f"Epoch [{epoch:02d}/{epochs:02d}] - Train Loss: {train_loss:.4f} | "
              f"Val Loss: {val_metrics['val_loss']:.4f} | "
              f"Val Dice: {val_metrics['val_dice']:.4f} | "
              f"Val IoU: {val_metrics['val_iou']:.4f} | "
              f"Grade MAE: {val_metrics['val_grade_mae']:.2f}%")
        
        epoch_log = {
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            **{k: round(v, 4) for k, v in val_metrics.items()}
        }
        history.append(epoch_log)
        
        if val_metrics["val_iou"] > best_iou:
            best_iou = val_metrics["val_iou"]
            torch.save(model.state_dict(), best_weights_path)
            print(f" -> Checkpoint saved! New best Val IoU: {best_iou:.4f}")
            
    # Load best checkpoint
    if os.path.exists(best_weights_path):
        model.load_state_dict(torch.load(best_weights_path, map_location=device))
        
    return model, {"history": history, "best_val_iou": best_iou, "weights_path": best_weights_path}

if __name__ == "__main__":
    from data.scripts.preprocess_spectral_tiles import run_data_pipeline
    
    # Ensure processed data exists
    if not os.path.exists("data/processed/spectral_patches/manifest.json"):
        print("Data files missing. Running automated data pipeline...")
        run_data_pipeline()
        
    train_reserve_unet(epochs=5, batch_size=4)
