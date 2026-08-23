/**
 * MOIL Mission Control API Client & TypeScript Interfaces
 * Strongly typed client for FastAPI backend with robust offline fallbacks.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface SectorInfo {
  id: string;
  name: string;
  state: string;
  bbox: [number, number, number, number]; // [min_lon, min_lat, max_lon, max_lat]
  centroid: [number, number]; // [lat, lng]
  mine_type: string;
  primary_mineral: string;
  avg_grade_pct: number;
  est_reserves_mt: number;
  target_tonnage_shift: number;
  active_fleet_count: number;
}

export interface DrillHoleTarget {
  target_id: string;
  lat: number;
  lng: number;
  anomaly_probability: number;
  priority: 'HIGH' | 'MEDIUM';
  target_depth_m: number;
  estimated_target_grade_pct: number;
}

export interface SpectralDiagnostics {
  mean_ndvi: number;
  mean_clay_index: number;
  mean_ferrous_index: number;
  mean_iron_oxide_index: number;
}

export interface ReserveGridResponse {
  sector: string;
  sector_name: string;
  state: string;
  bbox: [number, number, number, number];
  centroid: [number, number];
  mine_type: string;
  geological_formation: string;
  primary_mineral: string;
  estimated_grade_pct: number;
  confidence_score: number;
  delineated_area_km2: number;
  estimated_reserve_mt: number;
  unfc_classification: string;
  spectral_diagnostics: SpectralDiagnostics;
  probability_grid: number[][];
  drill_hole_targets: DrillHoleTarget[];
}

export interface LiveMachineTelemetry {
  equipment_id: string;
  type: string;
  model: string;
  status: 'OPERATIONAL' | 'WARNING' | 'CRITICAL_LOAD' | 'STANDBY';
  rpm: number;
  torque_nm: number;
  temp_c: number;
  tool_wear_min: number;
  strain_index: number;
  failure_risk_pct: number;
  operator: string;
}

export interface ProductionHistoryRecord {
  date: string;
  day_name: string;
  is_current: boolean;
  target_tonnage: number;
  actual_tonnage: number;
  predicted_tonnage: number;
  shortfall_tonnage: number;
  shortfall_flag: number;
  rainfall_mm: number;
  road_friction: number;
  efficiency_pct: number;
}

export interface CurrentShiftStatus {
  shift_name: string;
  sector: string;
  sector_name: string;
  target_tonnage: number;
  current_achieved_tonnage: number;
  forecasted_shift_total: number;
  active_haul_trucks: number;
  fleet_availability_pct: number;
  average_haul_cycle_mins: number;
  current_rainfall_mm: number;
  pit_water_level_m: number;
  road_friction_coeff: number;
  shortfall_risk_score: number;
  risk_category: 'LOW' | 'MODERATE' | 'CRITICAL';
}

export interface OperationsTelemetryResponse {
  sector: string;
  sector_name: string;
  timestamp: string;
  current_shift: CurrentShiftStatus;
  live_equipment_fleet: LiveMachineTelemetry[];
  production_history_7days: ProductionHistoryRecord[];
}

export interface PrescriptiveAction {
  id: string;
  category: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  title: string;
  description: string;
  potential_recovery_tonnes: number;
  urgency_mins: number;
  status: 'RECOMMENDED' | 'DISPATCHED' | 'ACKNOWLEDGED';
}

export interface PrescriptiveOptimizationPlan {
  sector: string;
  shortfall_probability: number;
  risk_level: 'LOW' | 'MODERATE' | 'CRITICAL';
  original_predicted_tonnage: number;
  target_tonnage: number;
  estimated_recovery_tonnes: number;
  post_mitigation_tonnage: number;
  shortfall_reduction_pct: number;
  action_count: number;
  prescriptive_actions: PrescriptiveAction[];
}

export interface SimulationRequestPayload {
  sector: string;
  shift?: string;
  rainfall_mm: number;
  pit_water_level_m: number;
  road_friction_coeff: number;
  p80_fragmentation_cm: number;
  blast_delay_hrs: number;
  fleet_availability_pct: number;
  active_dumpers: number;
  haul_cycle_mins: number;
  machine_failure_simulated: number;
  target_tonnage_override?: number;
}

export interface SimulationResponse {
  status: string;
  simulation_id: string;
  timestamp: string;
  sector: string;
  sector_name: string;
  simulation_inputs: Record<string, any>;
  target_tonnage: number;
  predicted_tonnage: number;
  expected_deficit_tonnes: number;
  shortfall_probability: number;
  shortfall_flag: number;
  risk_level: 'LOW' | 'MODERATE' | 'CRITICAL';
  prescriptive_optimization: PrescriptiveOptimizationPlan;
}

export const SECTORS_LIST: SectorInfo[] = [
  {
    id: 'balaghat',
    name: 'Balaghat Belt (Bharweli Mine)',
    state: 'Madhya Pradesh',
    bbox: [80.10, 21.75, 80.25, 21.90],
    centroid: [21.825, 80.175],
    mine_type: 'Underground & Open Cast',
    primary_mineral: 'Braunite / Pyrolusite',
    avg_grade_pct: 44.5,
    est_reserves_mt: 12.8,
    target_tonnage_shift: 2800.0,
    active_fleet_count: 12,
  },
  {
    id: 'bhandara',
    name: 'Bhandara Belt (Dongri Buzurg Mine)',
    state: 'Maharashtra',
    bbox: [79.60, 21.40, 79.80, 21.60],
    centroid: [21.500, 79.700],
    mine_type: 'Open Cast',
    primary_mineral: 'Psilomelane / Pyrolusite',
    avg_grade_pct: 41.2,
    est_reserves_mt: 9.4,
    target_tonnage_shift: 2200.0,
    active_fleet_count: 10,
  },
  {
    id: 'nagpur',
    name: 'Nagpur Belt (Gumgaon/Kandri Mines)',
    state: 'Maharashtra',
    bbox: [79.15, 21.25, 79.35, 21.45],
    centroid: [21.350, 79.250],
    mine_type: 'Underground',
    primary_mineral: 'Braunite / Jacobsite',
    avg_grade_pct: 39.8,
    est_reserves_mt: 8.1,
    target_tonnage_shift: 1900.0,
    active_fleet_count: 8,
  },
  {
    id: 'chhindwara',
    name: 'Chhindwara Belt (Tirodi Extension)',
    state: 'Madhya Pradesh',
    bbox: [78.80, 21.90, 79.00, 22.10],
    centroid: [22.000, 78.900],
    mine_type: 'Open Cast & Exploratory',
    primary_mineral: 'Braunite / Hollandite',
    avg_grade_pct: 37.5,
    est_reserves_mt: 6.7,
    target_tonnage_shift: 1600.0,
    active_fleet_count: 7,
  },
  {
    id: 'keonjhar',
    name: 'Keonjhar Belt (Barbil / Joda Region)',
    state: 'Odisha',
    bbox: [85.20, 21.80, 85.50, 22.10],
    centroid: [21.950, 85.350],
    mine_type: 'Open Cast',
    primary_mineral: 'Cryptomelane / Pyrolusite',
    avg_grade_pct: 42.0,
    est_reserves_mt: 14.5,
    target_tonnage_shift: 3100.0,
    active_fleet_count: 14,
  },
];

export async function fetchReserveGrid(sector: string = 'balaghat', resolution: number = 32): Promise<ReserveGridResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/reserves/grid?sector=${sector}&resolution=${resolution}`, {
      next: { revalidate: 30 }
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API Client] Falling back to local sector generation for '${sector}':`, err);
    const targetSector = SECTORS_LIST.find(s => s.id === sector) || SECTORS_LIST[0];
    
    // Generate fallback 32x32 probability grid
    const grid: number[][] = [];
    for (let r = 0; r < resolution; r++) {
      const row: number[] = [];
      for (let c = 0; c < resolution; c++) {
        const dist = Math.sqrt((r - resolution * 0.45) ** 2 + (c - resolution * 0.55) ** 2);
        const val = Math.max(0.05, Math.min(0.96, Math.exp(-(dist ** 2) / 60) + (Math.sin(r/4) * Math.cos(c/4)) * 0.15 + Math.random() * 0.08));
        row.push(Number(val.toFixed(3)));
      }
      grid.push(row);
    }
    
    return {
      sector: targetSector.id,
      sector_name: targetSector.name,
      state: targetSector.state,
      bbox: targetSector.bbox,
      centroid: targetSector.centroid,
      mine_type: targetSector.mine_type,
      geological_formation: 'Sausar Group (Mansar Formation)',
      primary_mineral: targetSector.primary_mineral,
      estimated_grade_pct: targetSector.avg_grade_pct,
      confidence_score: 87.5,
      delineated_area_km2: 2.14,
      estimated_reserve_mt: targetSector.est_reserves_mt,
      unfc_classification: 'Measured Mineral Resource (UNFC 331)',
      spectral_diagnostics: {
        mean_ndvi: 0.28,
        mean_clay_index: 1.42,
        mean_ferrous_index: 0.88,
        mean_iron_oxide_index: 1.65,
      },
      probability_grid: grid,
      drill_hole_targets: [
        { target_id: `DH_${targetSector.id.slice(0,3).toUpperCase()}_01`, lat: targetSector.centroid[0] + 0.012, lng: targetSector.centroid[1] - 0.008, anomaly_probability: 0.94, priority: 'HIGH', target_depth_m: 85, estimated_target_grade_pct: 46.2 },
        { target_id: `DH_${targetSector.id.slice(0,3).toUpperCase()}_02`, lat: targetSector.centroid[0] - 0.015, lng: targetSector.centroid[1] + 0.014, anomaly_probability: 0.89, priority: 'HIGH', target_depth_m: 120, estimated_target_grade_pct: 44.8 },
        { target_id: `DH_${targetSector.id.slice(0,3).toUpperCase()}_03`, lat: targetSector.centroid[0] + 0.024, lng: targetSector.centroid[1] + 0.021, anomaly_probability: 0.78, priority: 'MEDIUM', target_depth_m: 150, estimated_target_grade_pct: 41.5 }
      ]
    };
  }
}

export async function fetchOperationsTelemetry(sector: string = 'balaghat'): Promise<OperationsTelemetryResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/operations/telemetry?sector=${sector}`, {
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API Client] Fallback telemetry for '${sector}':`, err);
    const targetSector = SECTORS_LIST.find(s => s.id === sector) || SECTORS_LIST[0];
    const baseTarget = targetSector.target_tonnage_shift;
    
    return {
      sector: targetSector.id,
      sector_name: targetSector.name,
      timestamp: new Date().toISOString(),
      current_shift: {
        shift_name: 'Shift_A_Morning (06:00 - 14:00 IST)',
        sector: targetSector.id,
        sector_name: targetSector.name,
        target_tonnage: baseTarget,
        current_achieved_tonnage: Number((baseTarget * 0.72).toFixed(1)),
        forecasted_shift_total: Number((baseTarget * 0.95).toFixed(1)),
        active_haul_trucks: targetSector.active_fleet_count,
        fleet_availability_pct: 92.4,
        average_haul_cycle_mins: 23.5,
        current_rainfall_mm: 0.0,
        pit_water_level_m: 0.7,
        road_friction_coeff: 0.84,
        shortfall_risk_score: 0.12,
        risk_category: 'LOW',
      },
      live_equipment_fleet: [
        { equipment_id: 'EXC-01', type: 'Hydraulic Shovel', model: 'CAT 6020', status: 'OPERATIONAL', rpm: 1540, torque_nm: 42.5, temp_c: 38.2, tool_wear_min: 45, strain_index: 1.91, failure_risk_pct: 4.2, operator: 'Rajesh Sharma (Shift Leader)' },
        { equipment_id: 'DMP-04', type: '100T Haul Dumper', model: 'Komatsu HD785-7', status: 'OPERATIONAL', rpm: 1420, torque_nm: 48.0, temp_c: 36.5, tool_wear_min: 68, strain_index: 3.26, failure_risk_pct: 7.8, operator: 'Amit Verma' },
        { equipment_id: 'DMP-09', type: '100T Haul Dumper', model: 'Komatsu HD785-7', status: 'WARNING', rpm: 1680, torque_nm: 56.4, temp_c: 44.8, tool_wear_min: 182, strain_index: 10.26, failure_risk_pct: 38.5, operator: 'Suresh Patel (Overheating Alert)' },
        { equipment_id: 'DRL-02', type: 'Rotary Drill', model: 'Sandvik DR412i', status: 'OPERATIONAL', rpm: 1750, torque_nm: 31.0, temp_c: 35.0, tool_wear_min: 32, strain_index: 0.99, failure_risk_pct: 2.1, operator: 'Vikram Rathore' },
        { equipment_id: 'CRS-01', type: 'Primary Jaw Crusher', model: 'Metso Outotec C160', status: 'OPERATIONAL', rpm: 1350, torque_nm: 49.2, temp_c: 39.4, tool_wear_min: 115, strain_index: 5.65, failure_risk_pct: 12.0, operator: 'Plant Control SCADA' },
        { equipment_id: 'PMP-03', type: 'Submersible Pump', model: 'Flygt 2400', status: 'STANDBY', rpm: 0, torque_nm: 0.0, temp_c: 28.0, tool_wear_min: 14, strain_index: 0.0, failure_risk_pct: 0.5, operator: 'Automated Sump Sensor' }
      ],
      production_history_7days: [
        { date: '2026-08-17', day_name: 'Mon', is_current: false, target_tonnage: baseTarget, actual_tonnage: baseTarget * 0.96, predicted_tonnage: baseTarget * 0.95, shortfall_tonnage: baseTarget * 0.04, shortfall_flag: 0, rainfall_mm: 0, road_friction: 0.85, efficiency_pct: 96.0 },
        { date: '2026-08-18', day_name: 'Tue', is_current: false, target_tonnage: baseTarget, actual_tonnage: baseTarget * 0.98, predicted_tonnage: baseTarget * 0.97, shortfall_tonnage: baseTarget * 0.02, shortfall_flag: 0, rainfall_mm: 0, road_friction: 0.86, efficiency_pct: 98.0 },
        { date: '2026-08-19', day_name: 'Wed', is_current: false, target_tonnage: baseTarget, actual_tonnage: baseTarget * 0.65, predicted_tonnage: baseTarget * 0.68, shortfall_tonnage: baseTarget * 0.35, shortfall_flag: 1, rainfall_mm: 42.5, road_friction: 0.52, efficiency_pct: 65.0 },
        { date: '2026-08-20', day_name: 'Thu', is_current: false, target_tonnage: baseTarget, actual_tonnage: baseTarget * 0.74, predicted_tonnage: baseTarget * 0.76, shortfall_tonnage: baseTarget * 0.26, shortfall_flag: 1, rainfall_mm: 28.0, road_friction: 0.61, efficiency_pct: 74.0 },
        { date: '2026-08-21', day_name: 'Fri', is_current: false, target_tonnage: baseTarget, actual_tonnage: baseTarget * 0.92, predicted_tonnage: baseTarget * 0.90, shortfall_tonnage: baseTarget * 0.08, shortfall_flag: 0, rainfall_mm: 4.0, road_friction: 0.81, efficiency_pct: 92.0 },
        { date: '2026-08-22', day_name: 'Sat', is_current: false, target_tonnage: baseTarget, actual_tonnage: baseTarget * 1.02, predicted_tonnage: baseTarget * 0.99, shortfall_tonnage: 0, shortfall_flag: 0, rainfall_mm: 0, road_friction: 0.85, efficiency_pct: 102.0 },
        { date: '2026-08-23', day_name: 'Sun', is_current: true, target_tonnage: baseTarget, actual_tonnage: baseTarget * 0.95, predicted_tonnage: baseTarget * 0.94, shortfall_tonnage: baseTarget * 0.05, shortfall_flag: 0, rainfall_mm: 0, road_friction: 0.84, efficiency_pct: 95.0 },
      ]
    };
  }
}

export async function simulateOperations(payload: SimulationRequestPayload): Promise<SimulationResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/operations/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API Client] Fallback simulation execution:', err);
    const targetSector = SECTORS_LIST.find(s => s.id === payload.sector) || SECTORS_LIST[0];
    const target = payload.target_tonnage_override || targetSector.target_tonnage_shift;
    
    // Heuristic simulation
    const rainPenalty = Math.min(0.45, payload.rainfall_mm / 90.0);
    const fleetPenalty = Math.max(0, (90.0 - payload.fleet_availability_pct) / 60.0);
    const failurePenalty = payload.machine_failure_simulated ? 0.35 : 0.0;
    const prob = Math.min(0.98, Math.max(0.04, 0.08 + rainPenalty + fleetPenalty + failurePenalty));
    
    const factor = (payload.active_dumpers / 12.0) * (26.0 / payload.haul_cycle_mins) * (1.0 - rainPenalty) * (payload.machine_failure_simulated ? 0.65 : 1.0);
    const predicted = Number(Math.max(250, Math.min(target * 1.1, target * factor)).toFixed(1));
    const deficit = Number(Math.max(0, target - predicted).toFixed(1));
    
    const actions: PrescriptiveAction[] = [];
    if (payload.rainfall_mm > 20 || payload.pit_water_level_m > 1.8) {
      actions.push({
        id: 'ACTION_DEWATER_01',
        category: 'Drainage / Weather',
        priority: 'HIGH',
        title: 'Deploy Auxiliary High-Head Sump Dewatering',
        description: `Heavy rain (${payload.rainfall_mm}mm) & Pit Water (${payload.pit_water_level_m}m). Deploy 2x Flygt 2400 pumps (500 m³/hr) and grit haul ramp #4.`,
        potential_recovery_tonnes: Number((target * 0.12).toFixed(1)),
        urgency_mins: 20,
        status: 'RECOMMENDED'
      });
    }
    if (payload.p80_fragmentation_cm > 28 || payload.blast_delay_hrs > 1.5) {
      actions.push({
        id: 'ACTION_CRUSH_02',
        category: 'Blasting & Fragmentation',
        priority: 'CRITICAL',
        title: 'Dispatch Secondary Rock Breaker & Crusher Pacing',
        description: `Fragmentation P80 (${payload.p80_fragmentation_cm}cm) risks jaw crusher choking. Dispatch CAT 336 Breaker to Bench 3.`,
        potential_recovery_tonnes: Number((target * 0.15).toFixed(1)),
        urgency_mins: 15,
        status: 'RECOMMENDED'
      });
    }
    if (payload.active_dumpers < 10 || payload.haul_cycle_mins > 28) {
      actions.push({
        id: 'ACTION_HAUL_03',
        category: 'Fleet Dispatch',
        priority: 'HIGH',
        title: 'Dynamic Haul Fleet Reallocation',
        description: `Haul cycle (${payload.haul_cycle_mins}m) high. Reroute 3x Komatsu HD785 dumpers from Overburden Dump B to Face #1.`,
        potential_recovery_tonnes: Number((target * 0.18).toFixed(1)),
        urgency_mins: 10,
        status: 'RECOMMENDED'
      });
    }
    if (payload.machine_failure_simulated || payload.fleet_availability_pct < 80) {
      actions.push({
        id: 'ACTION_MAINT_04',
        category: 'Preventive Maintenance',
        priority: 'CRITICAL',
        title: 'Hot-Swap Standby Mining Shovel & Rapid Hydraulic Flush',
        description: 'Fleet availability degraded. Shift shovel loading to Standby CAT 6020 #3 immediately.',
        potential_recovery_tonnes: Number((target * 0.14).toFixed(1)),
        urgency_mins: 5,
        status: 'RECOMMENDED'
      });
    }
    
    const recoveryTotal = actions.reduce((sum, a) => sum + a.potential_recovery_tonnes, 0);
    const postMitigation = Math.min(target, predicted + recoveryTotal);
    
    return {
      status: 'success',
      simulation_id: `SIM_${Date.now()}`,
      timestamp: new Date().toISOString(),
      sector: targetSector.id,
      sector_name: targetSector.name,
      simulation_inputs: payload,
      target_tonnage: target,
      predicted_tonnage: predicted,
      expected_deficit_tonnes: deficit,
      shortfall_probability: Number(prob.toFixed(3)),
      shortfall_flag: prob >= 0.5 ? 1 : 0,
      risk_level: prob > 0.65 ? 'CRITICAL' : prob > 0.35 ? 'MODERATE' : 'LOW',
      prescriptive_optimization: {
        sector: targetSector.id,
        shortfall_probability: Number(prob.toFixed(3)),
        risk_level: prob > 0.65 ? 'CRITICAL' : prob > 0.35 ? 'MODERATE' : 'LOW',
        original_predicted_tonnage: predicted,
        target_tonnage: target,
        estimated_recovery_tonnes: Number(recoveryTotal.toFixed(1)),
        post_mitigation_tonnage: Number(postMitigation.toFixed(1)),
        shortfall_reduction_pct: Number((Math.min(100, Math.max(0, (recoveryTotal / Math.max(1, deficit)) * 100))).toFixed(1)),
        action_count: actions.length,
        prescriptive_actions: actions
      }
    };
  }
}
