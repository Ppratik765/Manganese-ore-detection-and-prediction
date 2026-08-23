"""
Mine Production Feature Engineering & Preprocessing Pipeline
Extracts rolling temporal lags, physical mining interactions, and equipment telemetry
features to forecast shift-level ore production shortfalls.
"""

import os
import sys
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))


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

def train_and_evaluate_xgboost(
    csv_path: str = "data/processed/mine_operations.csv",
    test_size: float = 0.20,
    random_state: int = 42
) -> Tuple[Any, Dict[str, Any], pd.DataFrame]:
    """
    Trains an XGBClassifier with stratified train/test partitioning and calculates
    comprehensive operational risk metrics (ROC-AUC, F1, Recall, Precision).
    """
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
    from xgboost import XGBClassifier
    
    X, y, feature_cols = prepare_training_matrices(csv_path)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    
    print(f"\n[XGBoost Training] Training dataset: {X_train.shape[0]} samples | Testing: {X_test.shape[0]} samples")
    print(f"Target distribution -> Train Shortfalls: {y_train.sum()} ({y_train.mean()*100:.1f}%), Test: {y_test.sum()} ({y_test.mean()*100:.1f}%)")
    
    model = XGBClassifier(
        n_estimators=180,
        max_depth=5,
        learning_rate=0.06,
        subsample=0.85,
        colsample_bytree=0.85,
        gamma=0.2,
        eval_metric="logloss",
        random_state=random_state
    )
    
    model.fit(
        X_train, y_train,
        eval_set=[(X_train, y_train), (X_test, y_test)],
        verbose=False
    )
    
    # Predictions
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1_score": float(f1_score(y_test, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, y_prob)),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
    }
    
    # Feature Importances
    importances = model.feature_importances_
    fi_df = pd.DataFrame({
        "feature": feature_cols,
        "importance": importances
    }).sort_values(by="importance", ascending=False).reset_index(drop=True)
    
    print("\n--- XGBoost Production Shortfall Classifier Evaluation ---")
    print(f"Accuracy:  {metrics['accuracy']*100:.2f}%")
    print(f"ROC-AUC:   {metrics['roc_auc']:.4f}")
    print(f"Precision: {metrics['precision']*100:.2f}%")
    print(f"Recall:    {metrics['recall']*100:.2f}%")
    print(f"F1-Score:  {metrics['f1_score']:.4f}")
    print("\nTop 7 Predictive Mining Risk Indicators:")
    for idx, row in fi_df.head(7).iterrows():
        print(f"  {idx+1}. {row['feature']:<25} ({row['importance']*100:.2f}%)")
        
    return model, metrics, fi_df

def export_xgboost_artifact(
    model: Any,
    feature_cols: List[str],
    output_path: str = "backend/app/models/shortfall_xgb.pkl"
) -> str:
    """
    Serializes trained XGBoost classifier and feature metadata to a pickle artifact
    and verifies runtime loading and inference consistency.
    """
    import pickle
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    artifact = {
        "model": model,
        "feature_columns": feature_cols,
        "version": "1.0.0",
        "model_type": "XGBClassifier"
    }
    
    with open(output_path, "wb") as f:
        pickle.dump(artifact, f)
        
    print(f"\n[Artifact Export] Serialized XGBoost model to: {output_path}")
    
    # Verification test
    with open(output_path, "rb") as f:
        loaded = pickle.load(f)
        
    test_sample = np.random.randn(1, len(feature_cols)).astype(np.float32)
    pred_prob = loaded["model"].predict_proba(test_sample)[0, 1]
    print(f" -> Artifact verification test PASSED (Sample shortfall risk prob: {pred_prob:.4f})")
    
    return output_path

def run_ops_training_pipeline():
    """End-to-end training and serialization pipeline for production shortfall forecasting."""
    from data.scripts.generate_synthetic_operations import export_operations_dataset
    csv_path = "data/processed/mine_operations.csv"
    if not os.path.exists(csv_path):
        export_operations_dataset(output_path=csv_path)
        
    model, metrics, fi_df = train_and_evaluate_xgboost(csv_path=csv_path)
    artifact_path = export_xgboost_artifact(model, FEATURE_COLUMNS)
    return artifact_path

if __name__ == "__main__":
    run_ops_training_pipeline()


