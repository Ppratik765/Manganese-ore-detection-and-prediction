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
