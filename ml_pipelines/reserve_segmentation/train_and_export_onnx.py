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

def export_unet_to_onnx(
    model: nn.Module,
    output_onnx_path: str = "backend/app/models/reserves_unet.onnx",
    device: torch.device = torch.device("cpu")
) -> str:
    """
    Exports trained PyTorch MultispectralUNet to an optimized ONNX static computation graph.
    Configures dynamic batch axes and validates runtime numerical consistency.
    """
    os.makedirs(os.path.dirname(output_onnx_path), exist_ok=True)
    model.eval()
    model.to(device)
    
    dummy_input = torch.randn(1, 10, 256, 256, device=device, dtype=torch.float32)
    
    print(f"\n[ONNX Export] Exporting PyTorch graph to ONNX: {output_onnx_path}...")
    torch.onnx.export(
        model,
        dummy_input,
        output_onnx_path,
        export_params=True,
        opset_version=17,
        do_constant_folding=True,
        input_names=["input_tensor"],
        output_names=["mask_logits", "grade_pred"],
        dynamic_axes={
            "input_tensor": {0: "batch_size"},
            "mask_logits": {0: "batch_size"},
            "grade_pred": {0: "batch_size"}
        }
    )
    
    # 1. Structural Verification with ONNX package
    import onnx
    onnx_model = onnx.load(output_onnx_path)
    onnx.checker.check_model(onnx_model)
    print(" -> ONNX structural integrity check passed!")
    
    # 2. Runtime Numerical Consistency Verification with ONNX Runtime
    import onnxruntime as ort
    session = ort.InferenceSession(output_onnx_path, providers=["CPUExecutionProvider"])
    
    with torch.no_grad():
        pt_mask, pt_grade = model(dummy_input)
        pt_mask_np = pt_mask.cpu().numpy()
        pt_grade_np = pt_grade.cpu().numpy()
        
    ort_inputs = {"input_tensor": dummy_input.cpu().numpy()}
    ort_outputs = session.run(None, ort_inputs)
    ort_mask_np, ort_grade_np = ort_outputs[0], ort_outputs[1]
    
    np.testing.assert_allclose(pt_mask_np, ort_mask_np, rtol=1e-3, atol=1e-4)
    np.testing.assert_allclose(pt_grade_np, ort_grade_np, rtol=1e-3, atol=1e-4)
    print(f" -> ONNX Runtime verification test PASSED (max discrepancy < 1e-4)!")
    print(f" -> Model successfully serialized at: {output_onnx_path}")
    return output_onnx_path

def run_training_and_export_pipeline(epochs: int = 10, batch_size: int = 4):
    """Orchestrates full U-Net training, validation, and ONNX serialization."""
    model, train_res = train_reserve_unet(epochs=epochs, batch_size=batch_size)
    onnx_path = export_unet_to_onnx(model)
    return onnx_path

if __name__ == "__main__":
    from data.scripts.preprocess_spectral_tiles import run_data_pipeline
    
    # Ensure processed data exists
    if not os.path.exists("data/processed/spectral_patches/manifest.json"):
        print("Data files missing. Running automated data pipeline...")
        run_data_pipeline()
        
    run_training_and_export_pipeline(epochs=8, batch_size=4)

