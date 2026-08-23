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

def synthesize_mining_operations(
    telemetry_df: Optional[pd.DataFrame] = None,
    num_records: int = 1500,
    start_date: str = "2024-01-01",
    seed: int = 42
) -> pd.DataFrame:
    """
    Synthesizes shift-level open-cast & underground manganese mining operational logs
    blended with ingested mechanical telemetry and realistic environmental constraints:
    - Rolling precipitation (monsoon spikes) & pit water level
    - Blasting fragmentation (P80 index) & safety delays
    - Haul fleet cycle time, excavator payload, and road grade
    - Target vs Actual tonnage and Shortfall binary risk target
    """
    np.random.seed(seed)
    
    if telemetry_df is None:
        telemetry_df = load_and_preprocess_equipment_telemetry()
        
    date_range = pd.date_range(start=start_date, periods=num_records // 3 + 1, freq="D")
    sectors = ["balaghat", "bhandara", "nagpur", "chhindwara", "keonjhar"]
    shifts = ["Shift_A_Morning", "Shift_B_Evening", "Shift_C_Night"]
    
    records = []
    
    for i in range(num_records):
        date = date_range[(i // 3) % len(date_range)]
        sector = sectors[i % len(sectors)]
        shift = shifts[i % len(shifts)]
        day_of_year = date.dayofyear
        
        # 1. Weather Dynamics (Central/Eastern India Monsoon between Day 160 - 270)
        is_monsoon = 160 <= day_of_year <= 270
        base_rain = np.random.exponential(scale=18.0) if is_monsoon else np.random.exponential(scale=1.2)
        rainfall_mm = float(np.clip(base_rain, 0.0, 110.0))
        
        pit_water_level_m = float(np.clip(0.5 + 0.08 * rainfall_mm + np.random.normal(0, 0.1), 0.2, 4.5))
        road_friction_coeff = float(np.clip(0.85 - 0.005 * rainfall_mm, 0.35, 0.90))
        
        # 2. Blasting Dynamics
        p80_fragmentation_cm = float(np.clip(18.0 + 0.12 * rainfall_mm + np.random.normal(0, 3.5), 10.0, 48.0))
        blast_delay_hrs = float(np.clip(0.2 + (1.5 if rainfall_mm > 25 else 0.0) + (np.random.exponential(0.4) if np.random.rand() > 0.8 else 0.0), 0.0, 4.5))
        powder_factor_kg_t = float(np.clip(0.45 + np.random.normal(0, 0.04), 0.35, 0.60))
        
        # 3. Fleet & Telemetry Ingestion Sample
        telem_sample = telemetry_df.sample(n=1, random_state=(seed + i) % 100000).iloc[0]
        mach_fail = int(telem_sample["machine_failure"])
        strain_idx = float(telem_sample["strain_index"])
        air_temp = float(telem_sample["air_temp_k"] - 273.15) # Celsius
        torque = float(telem_sample["torque_nm"])
        tool_wear = float(telem_sample["tool_wear_min"])
        
        fleet_availability_pct = float(np.clip(94.0 - 15.0 * mach_fail - 0.05 * strain_idx - 0.08 * rainfall_mm + np.random.normal(0, 2.0), 45.0, 99.0))
        active_dumpers = int(np.clip(round(12 * (fleet_availability_pct / 100.0)), 4, 14))
        haul_cycle_mins = float(np.clip(24.0 + (10.0 if road_friction_coeff < 0.55 else 0.0) + 1.2 * blast_delay_hrs + np.random.normal(0, 2.0), 18.0, 55.0))
        
        # 4. Production Tonnage & Shortfall Logic
        # Standard shift target per sector
        target_base = {"balaghat": 2800, "bhandara": 2200, "nagpur": 1900, "chhindwara": 1600, "keonjhar": 3100}
        target_tonnage = float(target_base[sector] * (1.0 if shift == "Shift_A_Morning" else 0.9 if shift == "Shift_B_Evening" else 0.75))
        
        # Output capacity calculation
        effective_haul_factor = (active_dumpers / 12.0) * (26.0 / haul_cycle_mins)
        crusher_choke_penalty = 0.75 if p80_fragmentation_cm > 32.0 else 1.0
        weather_penalty = np.clip(1.0 - 0.006 * rainfall_mm, 0.45, 1.0)
        breakdown_penalty = 0.60 if mach_fail == 1 else 1.0
        
        actual_tonnage = float(np.clip(
            target_tonnage * effective_haul_factor * crusher_choke_penalty * weather_penalty * breakdown_penalty * np.random.normal(1.0, 0.04),
            200.0,
            target_tonnage * 1.15
        ))
        
        shortfall_tonnage = float(max(0.0, target_tonnage - actual_tonnage))
        shortfall_pct = (shortfall_tonnage / target_tonnage) * 100.0
        shortfall_flag = int(shortfall_pct >= 15.0)  # >15% deficit is flagged as shortfall
        
        severity = "LOW" if shortfall_pct < 15.0 else "MODERATE" if shortfall_pct < 30.0 else "CRITICAL"
        
        records.append({
            "record_id": f"REC_{i+1:05d}",
            "date": date.strftime("%Y-%m-%d"),
            "sector": sector,
            "shift": shift,
            "rainfall_mm": round(rainfall_mm, 2),
            "pit_water_level_m": round(pit_water_level_m, 2),
            "road_friction_coeff": round(road_friction_coeff, 3),
            "p80_fragmentation_cm": round(p80_fragmentation_cm, 2),
            "blast_delay_hrs": round(blast_delay_hrs, 2),
            "powder_factor_kg_t": round(powder_factor_kg_t, 3),
            "air_temp_c": round(air_temp, 2),
            "equipment_model": telem_sample["equipment_model"],
            "torque_nm": round(torque, 2),
            "tool_wear_min": round(tool_wear, 1),
            "strain_index": round(strain_idx, 3),
            "machine_failure": mach_fail,
            "fleet_availability_pct": round(fleet_availability_pct, 1),
            "active_dumpers": active_dumpers,
            "haul_cycle_mins": round(haul_cycle_mins, 2),
            "target_tonnage": round(target_tonnage, 1),
            "actual_tonnage": round(actual_tonnage, 1),
            "shortfall_tonnage": round(shortfall_tonnage, 1),
            "shortfall_pct": round(shortfall_pct, 2),
            "shortfall_flag": shortfall_flag,
            "severity": severity
        })
        
    return pd.DataFrame(records)

def export_operations_dataset(output_path: str = "data/processed/mine_operations.csv") -> str:
    """Generates and persists the complete mine operations dataset."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    telem = load_and_preprocess_equipment_telemetry()
    ops_df = synthesize_mining_operations(telem, num_records=1500)
    ops_df.to_csv(output_path, index=False)
    print(f"[Success] Generated {len(ops_df)} mining operational shift records -> {output_path}")
    print(f"Shortfall incidents: {ops_df['shortfall_flag'].sum()} / {len(ops_df)} ({ops_df['shortfall_flag'].mean()*100:.1f}%)")
    return output_path

if __name__ == "__main__":
    print("Testing telemetry ingestion & mining operations synthesis...")
    export_operations_dataset()

