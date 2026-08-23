"""
XGBoost Production Shortfall Prediction & Prescriptive Optimization Service
Ingests operational constraints, runs serialized XGBoost risk scoring, and invokes
the prescriptive mitigation engine to return actionable mining interventions.
"""

import os
import sys
import pickle
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional

# Add project root for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from ml_pipelines.production_forecasting.prescriptive_engine import PrescriptiveMiningEngine
from ml_pipelines.production_forecasting.train_xgboost import FEATURE_COLUMNS, engineer_mining_features

class ShortfallOptimizationService:
    """
    Service wrapper for XGBoost Shortfall Classifier and Prescriptive AI Mitigations.
    """
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or os.path.join(os.path.dirname(__file__), "../models/shortfall_xgb.pkl")
        self.artifact = None
        self.prescriptive_engine = PrescriptiveMiningEngine()
        self._load_model()

    def _load_model(self):
        """Loads serialized XGBoost model artifact."""
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    self.artifact = pickle.load(f)
                print(f"[XGBoost Service] Loaded shortfall model artifact from: {self.model_path}")
            except Exception as e:
                print(f"[XGBoost Service Warning] Failed to load artifact ({e}). Running in fallback mode.")
                self.artifact = None
        else:
            print(f"[XGBoost Service Notice] Artifact not found at {self.model_path}. Fallback active.")

    def predict_shortfall_risk(
        self,
        sector: str = "balaghat",
        shift: str = "Shift_A_Morning",
        rainfall_mm: float = 0.0,
        pit_water_level_m: float = 0.8,
        road_friction_coeff: float = 0.82,
        p80_fragmentation_cm: float = 20.0,
        blast_delay_hrs: float = 0.5,
        powder_factor_kg_t: float = 0.48,
        air_temp_c: float = 32.0,
        torque_nm: float = 42.0,
        tool_wear_min: float = 40.0,
        strain_index: float = 1.68,
        machine_failure: int = 0,
        fleet_availability_pct: float = 92.0,
        active_dumpers: int = 11,
        haul_cycle_mins: float = 24.0,
        target_tonnage: float = 2800.0
    ) -> Dict[str, Any]:
        """
        Calculates shortfall probability and generates prescriptive mitigation workflows.
        """
        # Ensure model is loaded if available
        if self.artifact is None and os.path.exists(self.model_path):
            self._load_model()

        # Construct single-row DataFrame for feature engineering
        raw_dict = {
            "sector": sector,
            "shift": shift,
            "rainfall_mm": rainfall_mm,
            "pit_water_level_m": pit_water_level_m,
            "road_friction_coeff": road_friction_coeff,
            "p80_fragmentation_cm": p80_fragmentation_cm,
            "blast_delay_hrs": blast_delay_hrs,
            "powder_factor_kg_t": powder_factor_kg_t,
            "air_temp_c": air_temp_c,
            "torque_nm": torque_nm,
            "tool_wear_min": tool_wear_min,
            "strain_index": strain_index,
            "machine_failure": machine_failure,
            "fleet_availability_pct": fleet_availability_pct,
            "active_dumpers": active_dumpers,
            "haul_cycle_mins": haul_cycle_mins,
            "target_tonnage": target_tonnage
        }
        
        df_row = pd.DataFrame([raw_dict])
        df_feat = engineer_mining_features(df_row)
        
        # Extract features matching model schema
        feature_cols = self.artifact.get("feature_columns", FEATURE_COLUMNS) if self.artifact else FEATURE_COLUMNS
        X = df_feat[feature_cols].astype(np.float32)

        # Inference
        if self.artifact is not None:
            model = self.artifact["model"]
            shortfall_prob = float(model.predict_proba(X)[0, 1])
            is_shortfall = int(shortfall_prob >= 0.50)
        else:
            # Physics-heuristic fallback
            friction_penalty = max(0.0, (0.75 - road_friction_coeff) * 2.0)
            rain_penalty = min(0.4, rainfall_mm / 100.0)
            avail_penalty = max(0.0, (85.0 - fleet_availability_pct) / 50.0)
            shortfall_prob = float(np.clip(0.08 + friction_penalty + rain_penalty + avail_penalty + (0.35 if machine_failure else 0.0), 0.02, 0.98))
            is_shortfall = int(shortfall_prob >= 0.50)

        # Output tonnage calculation
        effective_capacity = (active_dumpers / 12.0) * (26.0 / max(10.0, haul_cycle_mins))
        breakdown_mult = 0.65 if machine_failure else 1.0
        weather_mult = max(0.45, 1.0 - 0.006 * rainfall_mm)
        crush_mult = 0.75 if p80_fragmentation_cm > 32.0 else 1.0
        
        predicted_tonnage = round(float(np.clip(
            target_tonnage * effective_capacity * breakdown_mult * weather_mult * crush_mult,
            250.0,
            target_tonnage * 1.12
        )), 1)
        
        expected_deficit = round(float(max(0.0, target_tonnage - predicted_tonnage)), 1)

        # Prescriptive AI Mitigations
        prescriptive_plan = self.prescriptive_engine.generate_prescriptive_plan(
            sector=sector,
            rainfall_mm=rainfall_mm,
            pit_water_level_m=pit_water_level_m,
            p80_fragmentation_cm=p80_fragmentation_cm,
            blast_delay_hrs=blast_delay_hrs,
            active_dumpers=active_dumpers,
            haul_cycle_mins=haul_cycle_mins,
            fleet_availability_pct=fleet_availability_pct,
            target_tonnage=target_tonnage,
            predicted_tonnage=predicted_tonnage,
            shortfall_probability=shortfall_prob,
            machine_failure=machine_failure
        )

        return {
            "sector": sector,
            "shift": shift,
            "target_tonnage": target_tonnage,
            "predicted_tonnage": predicted_tonnage,
            "expected_deficit_tonnes": expected_deficit,
            "shortfall_probability": round(shortfall_prob, 3),
            "shortfall_flag": is_shortfall,
            "risk_level": "CRITICAL" if shortfall_prob > 0.65 else "MODERATE" if shortfall_prob > 0.35 else "LOW",
            "telemetry_inputs": raw_dict,
            "prescriptive_optimization": prescriptive_plan
        }

# Global Singleton Service
optimizer_service = ShortfallOptimizationService()
