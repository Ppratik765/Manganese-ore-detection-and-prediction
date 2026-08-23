"""
Mine Operations & Production Telemetry Ingestion & Synthesis Engine
Integrates manual_data/ai4i2020.csv machine telemetry with realistic mining shift parameters:
- Equipment mechanical logs (Torque, RPM, Tool Wear, Temps, Failure Modes)
- Weather impact parameters (precipitation, monsoon waterlogging)
- Blasting fragmentation metrics (P80, flyrock margin, delay variance)
- Haulage cycle durations, fuel burn, and shift target shortfall flags
"""

import os
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Optional

def load_and_preprocess_equipment_telemetry(csv_path: str = "manual_data/ai4i2020.csv") -> pd.DataFrame:
    """
    Ingests raw equipment telemetry dataset (AI4I 2020 Predictive Maintenance Dataset).
    Standardizes column names and maps industrial machine features to heavy open-cast &
    underground mining fleet units (Excavators, 100T Haul Trucks, Drill Rigs, Crushers, Pumps).
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Equipment telemetry CSV not found at: {csv_path}")
        
    df = pd.read_csv(csv_path)
    
    # Rename columns to standardized operational identifiers
    column_mapping = {
        "Air temperature [K]": "air_temp_k",
        "Process temperature [K]": "process_temp_k",
        "Rotational speed [rpm]": "rotational_speed_rpm",
        "Torque [Nm]": "torque_nm",
        "Tool wear [min]": "tool_wear_min",
        "Machine failure": "machine_failure",
        "TWF": "tool_wear_failure",
        "HDF": "heat_dissipation_failure",
        "PWF": "power_failure",
        "OSF": "overstrain_failure",
        "RNF": "random_failure",
    }
    df = df.rename(columns=column_mapping)
    
    # Feature engineering for equipment strain & thermal gradients
    df["temp_diff_k"] = df["process_temp_k"] - df["air_temp_k"]
    df["power_kw"] = (2.0 * np.pi * df["rotational_speed_rpm"] * df["torque_nm"]) / 60000.0
    df["strain_index"] = (df["torque_nm"] * df["tool_wear_min"]) / 1000.0
    
    # Map to mining equipment classes based on Type and power profiles
    equipment_classes = ["Excavator_CAT6020", "Dumper_KomatsuHD785", "DrillRig_SandvikDR412", "Crusher_MetsoC160", "Pump_Flygt2400"]
    
    type_map = {"L": equipment_classes[1], "M": equipment_classes[0], "H": equipment_classes[2]}
    df["equipment_model"] = df["Type"].map(lambda t: type_map.get(t, "Dumper_KomatsuHD785"))
    
    return df

if __name__ == "__main__":
    print("Testing telemetry ingestion from manual_data/ai4i2020.csv...")
    df = load_and_preprocess_equipment_telemetry()
    print(f"Loaded {len(df)} telemetry records with columns: {list(df.columns)}")
    print(f"Total Machine Failures in dataset: {df['machine_failure'].sum()}")
