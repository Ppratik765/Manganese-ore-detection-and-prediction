"""
Mine Production Feature Engineering & Preprocessing Pipeline
Extracts rolling temporal lags, physical mining interactions, and equipment telemetry
features to forecast shift-level ore production shortfalls.
"""

import os
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple

FEATURE_COLUMNS = [
    "rainfall_mm",
    "pit_water_level_m",
    "road_friction_coeff",
    "p80_fragmentation_cm",
    "blast_delay_hrs",
    "powder_factor_kg_t",
    "air_temp_c",
    "torque_nm",
    "tool_wear_min",
    "strain_index",
    "machine_failure",
    "fleet_availability_pct",
    "active_dumpers",
    "haul_cycle_mins",
    "target_tonnage",
    "weather_friction_index",
    "equipment_load_factor",
    "haul_capacity_ratio",
    "fragmentation_burden",
    "rainfall_lag3_mean",
    "is_monsoon_season",
    "sector_balaghat",
    "sector_bhandara",
    "sector_nagpur",
    "sector_chhindwara",
    "sector_keonjhar",
    "shift_Shift_A_Morning",
    "shift_Shift_B_Evening",
    "shift_Shift_C_Night"
]

def engineer_mining_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes domain-specific mining interaction features and temporal lag statistics.
    """
    df = df.copy()
    
    # 1. Physical Domain Interactions
    df["weather_friction_index"] = df["rainfall_mm"] * (1.0 - df["road_friction_coeff"])
    df["equipment_load_factor"] = (df["torque_nm"] / 45.0) * (df["tool_wear_min"] / 100.0) + (df["strain_index"] / 2.0)
    df["haul_capacity_ratio"] = (df["active_dumpers"] * 100.0) / (df["haul_cycle_mins"] * 12.0 + 1e-6)
    df["fragmentation_burden"] = (df["p80_fragmentation_cm"] / 20.0) * (1.0 + df["blast_delay_hrs"])
    
    # 2. Rolling Temporal Lag Features (grouped per sector)
    if "date" in df.columns:
        df["date_dt"] = pd.to_datetime(df["date"])
        df = df.sort_values(by=["sector", "date_dt"]).reset_index(drop=True)
        df["rainfall_lag3_mean"] = df.groupby("sector")["rainfall_mm"].transform(lambda s: s.rolling(3, min_periods=1).mean())
        df["is_monsoon_season"] = df["date_dt"].dt.dayofyear.between(160, 270).astype(int)
    else:
        df["rainfall_lag3_mean"] = df["rainfall_mm"]
        df["is_monsoon_season"] = 0
        
    # 3. Categorical Encodings (Sector & Shift)
    for s in ["balaghat", "bhandara", "nagpur", "chhindwara", "keonjhar"]:
        df[f"sector_{s}"] = (df["sector"] == s).astype(int)
        
    for sh in ["Shift_A_Morning", "Shift_B_Evening", "Shift_C_Night"]:
        df[f"shift_{sh}"] = (df["shift"] == sh).astype(int)
        
    return df

def prepare_training_matrices(
    csv_path: str = "data/processed/mine_operations.csv"
) -> Tuple[pd.DataFrame, pd.Series, List[str]]:
    """Loads CSV, applies feature engineering, and formats feature matrix X and target y."""
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Operations dataset not found: {csv_path}")
        
    df = pd.read_csv(csv_path)
    df_feat = engineer_mining_features(df)
    
    X = df_feat[FEATURE_COLUMNS].astype(np.float32)
    y = df_feat["shortfall_flag"].astype(int)
    
    return X, y, FEATURE_COLUMNS

if __name__ == "__main__":
    from data.scripts.generate_synthetic_operations import export_operations_dataset
    if not os.path.exists("data/processed/mine_operations.csv"):
        export_operations_dataset()
        
    X, y, cols = prepare_training_matrices()
    print(f"Engineered feature matrix shape: {X.shape}, Target shape: {y.shape}")
    print(f"Feature columns ({len(cols)}): {cols[:6]} ...")
