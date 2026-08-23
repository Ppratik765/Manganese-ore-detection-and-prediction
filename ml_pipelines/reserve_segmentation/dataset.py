"""
Geospatial PyTorch Dataset & Loss Functions for Manganese Reserve Segmentation
Includes:
- Dice Loss (for spatial boundary overlap)
- Focal Loss (for class-imbalanced mineral anomaly targets)
- Combined Multi-Task Loss (Segmentation + Ore Grade Regression)
- SpectralAugmentation & PyTorch Dataset for (10, 256, 256) satellite tensors
"""

import os
import json
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
import numpy as np
from typing import Dict, Any, List, Tuple, Optional

# ==============================================================================
# LOSS FUNCTIONS (Dice Loss + Focal Loss + Combined Multi-Task Loss)
# ==============================================================================

class DiceLoss(nn.Module):
    """
    Sørensen–Dice coefficient loss for binary segmentation.
    Optimizes spatial overlap of predicted manganese anomaly masks against ground truth.
    """
    def __init__(self, smooth: float = 1e-6):
        super().__init__()
        self.smooth = smooth

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        probs = torch.sigmoid(logits)
        probs_flat = probs.view(-1)
        targets_flat = targets.view(-1)
        
        intersection = (probs_flat * targets_flat).sum()
        dice = (2.0 * intersection + self.smooth) / (probs_flat.sum() + targets_flat.sum() + self.smooth)
        return 1.0 - dice

class FocalLoss(nn.Module):
    """
    Binary Focal Loss for class imbalance mitigation in mineral prospectivity mapping.
    Focuses training on hard boundary pixels and subtle alteration halos.
    """
    def __init__(self, alpha: float = 0.75, gamma: float = 2.0, reduction: str = "mean"):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.reduction = reduction

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        bce_loss = F.binary_cross_entropy_with_logits(logits, targets, reduction="none")
        probs = torch.sigmoid(logits)
        p_t = probs * targets + (1.0 - probs) * (1.0 - targets)
        alpha_t = self.alpha * targets + (1.0 - self.alpha) * (1.0 - targets)
        focal_weight = alpha_t * torch.pow((1.0 - p_t), self.gamma)
        loss = focal_weight * bce_loss
        
        if self.reduction == "mean":
            return loss.mean()
        elif self.reduction == "sum":
            return loss.sum()
        return loss

class CombinedReserveLoss(nn.Module):
    """
    Joint loss function combining Dice Loss, Focal Loss, and Ore Grade MSE regression:
    Loss = w_dice * L_dice + w_focal * L_focal + w_grade * L_grade
    """
    def __init__(
        self,
        dice_weight: float = 0.5,
        focal_weight: float = 0.5,
        grade_weight: float = 0.05
    ):
        super().__init__()
        self.dice_loss = DiceLoss()
        self.focal_loss = FocalLoss(alpha=0.75, gamma=2.0)
        self.mse_loss = nn.MSELoss()
        self.dice_weight = dice_weight
        self.focal_weight = focal_weight
        self.grade_weight = grade_weight

    def forward(
        self,
        mask_logits: torch.Tensor,
        mask_targets: torch.Tensor,
        grade_preds: Optional[torch.Tensor] = None,
        grade_targets: Optional[torch.Tensor] = None
    ) -> Tuple[torch.Tensor, Dict[str, float]]:
        l_dice = self.dice_loss(mask_logits, mask_targets)
        l_focal = self.focal_loss(mask_logits, mask_targets)
        total_loss = self.dice_weight * l_dice + self.focal_weight * l_focal
        
        metrics = {
            "dice_loss": float(l_dice.item()),
            "focal_loss": float(l_focal.item())
        }
        
        if grade_preds is not None and grade_targets is not None:
            l_grade = self.mse_loss(grade_preds.view(-1), grade_targets.view(-1))
            total_loss += self.grade_weight * l_grade
            metrics["grade_mse"] = float(l_grade.item())
            
        metrics["total_loss"] = float(total_loss.item())
        return total_loss, metrics

# ==============================================================================
# DATASET & GEOSPATIAL AUGMENTATION LOADER
# ==============================================================================

class ManganeseSpectralDataset(Dataset):
    """
    PyTorch Dataset for 10-Channel Sentinel-2 multispectral tensors and binary reserve masks.
    Supports random geometric augmentations (flips, 90-deg rotations) and channel-wise normalization.
    """
    def __init__(
        self,
        manifest_entries: List[Dict[str, Any]],
        channel_means: Optional[List[float]] = None,
        channel_stds: Optional[List[float]] = None,
        is_train: bool = True
    ):
        self.entries = manifest_entries
        self.is_train = is_train
        
        # Default normalization statistics (if not supplied)
        self.channel_means = np.array(channel_means if channel_means else [
            0.18, 0.14, 0.08, 0.38, 0.28, 0.20, 0.45, 1.25, 0.65, 1.40
        ], dtype=np.float32).reshape(-1, 1, 1)
        
        self.channel_stds = np.array(channel_stds if channel_stds else [
            0.06, 0.05, 0.03, 0.12, 0.08, 0.06, 0.20, 0.40, 0.25, 0.45
        ], dtype=np.float32).reshape(-1, 1, 1)

    def __len__(self) -> int:
        return len(self.entries)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        entry = self.entries[idx]
        data = np.load(entry["filepath"])
        
        tensor = data["tensor"].astype(np.float32) # (10, H, W)
        mask = data["mask"].astype(np.float32)     # (1, H, W)
        grade = np.array([float(data["grade"])], dtype=np.float32) # (1,)
        
        # Data Augmentations (Training only)
        if self.is_train:
            # 1. Random Horizontal Flip
            if np.random.rand() > 0.5:
                tensor = np.flip(tensor, axis=2).copy()
                mask = np.flip(mask, axis=2).copy()
            # 2. Random Vertical Flip
            if np.random.rand() > 0.5:
                tensor = np.flip(tensor, axis=1).copy()
                mask = np.flip(mask, axis=1).copy()
            # 3. Random 90-degree Rotation
            k = np.random.randint(0, 4)
            if k > 0:
                tensor = np.rot90(tensor, k=k, axes=(1, 2)).copy()
                mask = np.rot90(mask, k=k, axes=(1, 2)).copy()
            # 4. Subtle Gaussian channel jitter on raw optical bands (0-5)
            if np.random.rand() > 0.5:
                noise = np.random.normal(0.0, 0.015, size=(6, tensor.shape[1], tensor.shape[2])).astype(np.float32)
                tensor[:6] = np.clip(tensor[:6] + noise, 0.0, 1.0)
                
        # Normalization
        norm_tensor = (tensor - self.channel_means) / (self.channel_stds + 1e-6)
        
        return {
            "tensor": torch.from_numpy(norm_tensor),
            "mask": torch.from_numpy(mask),
            "grade": torch.from_numpy(grade),
            "sector": entry["sector"],
            "filename": entry["filename"]
        }

def create_data_loaders(
    manifest_path: str = "data/processed/spectral_patches/manifest.json",
    split_path: str = "data/processed/dataset_split.json",
    batch_size: int = 4,
    num_workers: int = 0
) -> Tuple[DataLoader, DataLoader, Dict[str, Any]]:
    """
    Instantiates PyTorch DataLoaders for Training and Validation subsets.
    """
    if not os.path.exists(manifest_path):
        raise FileNotFoundError(f"Manifest not found: {manifest_path}. Please run data pipeline first.")
    if not os.path.exists(split_path):
        raise FileNotFoundError(f"Split metadata not found: {split_path}. Please run data pipeline first.")
        
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    with open(split_path, "r", encoding="utf-8") as f:
        split_meta = json.load(f)
        
    train_files = set(split_meta["train_files"])
    val_files = set(split_meta["val_files"])
    
    train_entries = [m for m in manifest if m["filename"] in train_files]
    val_entries = [m for m in manifest if m["filename"] in val_files]
    
    means = split_meta.get("channel_means")
    stds = split_meta.get("channel_stds")
    
    train_dataset = ManganeseSpectralDataset(train_entries, means, stds, is_train=True)
    val_dataset = ManganeseSpectralDataset(val_entries, means, stds, is_train=False)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=num_workers)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers)
    
    return train_loader, val_loader, split_meta

if __name__ == "__main__":
    logits = torch.randn(4, 1, 256, 256)
    targets = torch.randint(0, 2, (4, 1, 256, 256)).float()
    grade_pred = torch.tensor([[42.5], [44.1], [38.0], [40.2]])
    grade_gt = torch.tensor([[43.0], [43.5], [39.0], [41.0]])
    
    loss_fn = CombinedReserveLoss()
    total_loss, metrics = loss_fn(logits, targets, grade_pred, grade_gt)
    print("Combined Loss Function Verification:")
    for k, v in metrics.items():
        print(f" - {k}: {v:.6f}")

