"""
Multi-Spectral U-Net Architecture for Manganese Ore Reserve Identification
Input: 10-Channel Sentinel-2 Tensor (6 Raw Optical/SWIR Bands + 4 Band Ratio Indices)
Outputs:
1. Pixel-wise Manganese Reserve Probability Mask (B, 1, H, W)
2. Auxiliary Global Ore Grade Estimation Head (B, 1)
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple, Optional, Dict

class DoubleConv(nn.Module):
    """(Conv2D -> BatchNorm -> ReLU -> Dropout) x 2"""
    def __init__(self, in_channels: int, out_channels: int, dropout_p: float = 0.15):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Dropout2d(p=dropout_p),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.conv(x)

class MultispectralUNet(nn.Module):
    """
    Modular 10-channel U-Net with skip connections and multi-task ore grade estimation.
    Designed for spaceborne mineral deposit delineation in Indian Precambrian shield terrains.
    """
    def __init__(
        self,
        in_channels: int = 10,
        out_channels: int = 1,
        features: Tuple[int, ...] = (32, 64, 128, 256),
        dropout_p: float = 0.15
    ):
        super().__init__()
        self.in_channels = in_channels
        self.out_channels = out_channels
        
        # Encoder (Contracting Path)
        self.inc = DoubleConv(in_channels, features[0], dropout_p=dropout_p)
        self.down1 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(features[0], features[1], dropout_p=dropout_p))
        self.down2 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(features[1], features[2], dropout_p=dropout_p))
        self.down3 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(features[2], features[3], dropout_p=dropout_p))
        
        # Bottleneck
        self.bottleneck = nn.Sequential(
            nn.MaxPool2d(2),
            DoubleConv(features[3], features[3] * 2, dropout_p=dropout_p * 1.5)
        )
        
        # Decoder (Expanding Path) with Skip Connections
        self.up1 = nn.ConvTranspose2d(features[3] * 2, features[3], kernel_size=2, stride=2)
        self.conv_up1 = DoubleConv(features[3] * 2, features[3], dropout_p=dropout_p)
        
        self.up2 = nn.ConvTranspose2d(features[3], features[2], kernel_size=2, stride=2)
        self.conv_up2 = DoubleConv(features[2] * 2, features[2], dropout_p=dropout_p)
        
        self.up3 = nn.ConvTranspose2d(features[2], features[1], kernel_size=2, stride=2)
        self.conv_up3 = DoubleConv(features[1] * 2, features[1], dropout_p=dropout_p)
        
        self.up4 = nn.ConvTranspose2d(features[1], features[0], kernel_size=2, stride=2)
        self.conv_up4 = DoubleConv(features[0] * 2, features[0], dropout_p=dropout_p)
        
        # Final Segmentation Head
        self.out_conv = nn.Conv2d(features[0], out_channels, kernel_size=1)
        
        # Auxiliary Ore Grade Regression Head (Global Bottleneck Pooling)
        self.grade_head = nn.Sequential(
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Linear(features[3] * 2, 64),
            nn.ReLU(inplace=True),
            nn.Linear(64, 1)
        )

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Forward pass.
        Args:
            x: Tensor of shape (B, 10, H, W)
        Returns:
            logits_or_prob: Tensor of shape (B, 1, H, W)
            est_grade: Tensor of shape (B, 1)
        """
        # Contracting path
        x1 = self.inc(x)         # (B, 32, H, W)
        x2 = self.down1(x1)      # (B, 64, H/2, W/2)
        x3 = self.down2(x2)      # (B, 128, H/4, W/4)
        x4 = self.down3(x3)      # (B, 256, H/8, W/8)
        
        # Bottleneck
        b = self.bottleneck(x4)  # (B, 512, H/16, W/16)
        
        # Auxiliary grade prediction
        grade_pred = self.grade_head(b)
        
        # Expanding path with skip connections
        u1 = self.up1(b)
        u1 = torch.cat([u1, x4], dim=1)
        u1 = self.conv_up1(u1)
        
        u2 = self.up2(u1)
        u2 = torch.cat([u2, x3], dim=1)
        u2 = self.conv_up2(u2)
        
        u3 = self.up3(u2)
        u3 = torch.cat([u3, x2], dim=1)
        u3 = self.conv_up3(u3)
        
        u4 = self.up4(u3)
        u4 = torch.cat([u4, x1], dim=1)
        u4 = self.conv_up4(u4)
        
        mask_logits = self.out_conv(u4) # (B, 1, H, W)
        
        return mask_logits, grade_pred

if __name__ == "__main__":
    model = MultispectralUNet(in_channels=10, out_channels=1)
    dummy_input = torch.randn(2, 10, 256, 256)
    mask_out, grade_out = model(dummy_input)
    print(f"U-Net Verification Successful!")
    print(f"Input shape:  {dummy_input.shape}")
    print(f"Mask shape:   {mask_out.shape}")
    print(f"Grade shape:  {grade_out.shape}")
    total_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"Total Trainable Parameters: {total_params:,}")
