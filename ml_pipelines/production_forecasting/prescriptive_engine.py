"""
Prescriptive Mine Optimization & Shortfall Mitigation Engine
Evaluates telemetry anomalies, environmental stress, and production deficits to generate
actionable, prioritized operational dispatch recommendations with expected tonnage recoveries.
"""

from typing import Dict, Any, List, Optional

class PrescriptiveMiningEngine:
    """
    Expert heuristic optimization engine generating prescriptive mine dispatch actions:
    - Haul route dynamic balancing
    - Dewatering pump scaling
    - Secondary rock breaking & crusher feed pacing
    - Preventive machine maintenance swap
    - Ore grade blending adjustments
    """
    
    def generate_prescriptive_plan(
        self,
        sector: str,
        rainfall_mm: float,
        pit_water_level_m: float,
        p80_fragmentation_cm: float,
        blast_delay_hrs: float,
        active_dumpers: int,
        haul_cycle_mins: float,
        fleet_availability_pct: float,
        target_tonnage: float,
        predicted_tonnage: float,
        shortfall_probability: float,
        machine_failure: int = 0
    ) -> Dict[str, Any]:
        """
        Generates structured mitigation workflows to eliminate production shortfall risk.
        """
        actions = []
        recovered_tonnage_est = 0.0
        
        # 1. Weather & Waterlogging Constraints
        if rainfall_mm > 20.0 or pit_water_level_m > 1.8:
            recovered = round(target_tonnage * 0.12, 1)
            recovered_tonnage_est += recovered
            actions.append({
                "id": "ACTION_DEWATER_01",
                "category": "Environmental / Drainage",
                "priority": "HIGH" if pit_water_level_m > 2.5 else "MEDIUM",
                "title": "Deploy Auxiliary High-Head Sump Dewatering",
                "description": f"Rainfall ({rainfall_mm:.1f}mm) & Pit Water ({pit_water_level_m:.1f}m) risk haul ramp flooding. Activate 2x Flygt 2400 pumps (500 m³/hr) and spread coarse gravel on Ramp #4.",
                "potential_recovery_tonnes": recovered,
                "urgency_mins": 20,
                "status": "RECOMMENDED"
            })
            
        # 2. Blasting & Fragmentation Oversize
        if p80_fragmentation_cm > 28.0 or blast_delay_hrs > 1.5:
            recovered = round(target_tonnage * 0.15, 1)
            recovered_tonnage_est += recovered
            actions.append({
                "id": "ACTION_CRUSH_02",
                "category": "Blasting & Fragmentation",
                "priority": "CRITICAL" if p80_fragmentation_cm > 35.0 else "HIGH",
                "title": "Dispatch Secondary Rock Breaker & Crusher Feed Pacing",
                "description": f"Oversize fragmentation (P80 = {p80_fragmentation_cm:.1f}cm) risks primary jaw crusher choking. Dispatch CAT 336 Breaker to Bench 3 and widen crusher CSS to 125mm.",
                "potential_recovery_tonnes": recovered,
                "urgency_mins": 15,
                "status": "RECOMMENDED"
            })
            
        # 3. Haulage Fleet Bottlenecks
        if active_dumpers < 10 or haul_cycle_mins > 28.0:
            recovered = round(target_tonnage * 0.18, 1)
            recovered_tonnage_est += recovered
            actions.append({
                "id": "ACTION_HAUL_03",
                "category": "Fleet Dispatch & Haulage",
                "priority": "HIGH",
                "title": "Dynamic Haul Fleet Reallocation",
                "description": f"Haul cycle time ({haul_cycle_mins:.1f}m) exceeds 24m baseline with {active_dumpers} active dumpers. Reroute 3x Komatsu HD785 dumpers from Overburden Dump B to Ore Face #1.",
                "potential_recovery_tonnes": recovered,
                "urgency_mins": 10,
                "status": "RECOMMENDED"
            })
            
        # 4. Equipment Mechanical Distress
        if machine_failure == 1 or fleet_availability_pct < 80.0:
            recovered = round(target_tonnage * 0.14, 1)
            recovered_tonnage_est += recovered
            actions.append({
                "id": "ACTION_MAINT_04",
                "category": "Preventive Maintenance",
                "priority": "CRITICAL",
                "title": "Hot-Swap Standby Mining Shovel & Urgent Coolant Flush",
                "description": f"Fleet availability degraded ({fleet_availability_pct:.1f}%). Shift shovel load to Standby CAT 6020 #3 and isolate failing hydraulic unit for rapid inspection.",
                "potential_recovery_tonnes": recovered,
                "urgency_mins": 5,
                "status": "RECOMMENDED"
            })
            
        # 5. Default Grade & Stockpile Optimization
        if not actions or shortfall_probability > 0.35:
            recovered = round(target_tonnage * 0.08, 1)
            recovered_tonnage_est += recovered
            actions.append({
                "id": "ACTION_BLEND_05",
                "category": "Mineral Grade Blending",
                "priority": "MEDIUM",
                "title": "High-Grade Face Feed Optimization",
                "description": "Blend 65% ROM feed from High-Grade Braunite Lens #2 with 35% medium-grade stockpile to ensure plant throughput parity.",
                "potential_recovery_tonnes": recovered,
                "urgency_mins": 30,
                "status": "RECOMMENDED"
            })
            
        # Cap recoverable tonnage
        net_tonnage_after_mitigation = min(target_tonnage, predicted_tonnage + recovered_tonnage_est)
        projected_shortfall_reduction_pct = (
            ((target_tonnage - predicted_tonnage) - (target_tonnage - net_tonnage_after_mitigation))
            / max(1.0, (target_tonnage - predicted_tonnage))
        ) * 100.0
        
        return {
            "sector": sector,
            "shortfall_probability": round(shortfall_probability, 3),
            "risk_level": "CRITICAL" if shortfall_probability > 0.65 else "MODERATE" if shortfall_probability > 0.35 else "LOW",
            "original_predicted_tonnage": round(predicted_tonnage, 1),
            "target_tonnage": round(target_tonnage, 1),
            "estimated_recovery_tonnes": round(recovered_tonnage_est, 1),
            "post_mitigation_tonnage": round(net_tonnage_after_mitigation, 1),
            "shortfall_reduction_pct": round(min(100.0, max(0.0, projected_shortfall_reduction_pct)), 1),
            "action_count": len(actions),
            "prescriptive_actions": actions
        }

if __name__ == "__main__":
    engine = PrescriptiveMiningEngine()
    plan = engine.generate_prescriptive_plan(
        sector="balaghat",
        rainfall_mm=35.0,
        pit_water_level_m=2.4,
        p80_fragmentation_cm=36.0,
        blast_delay_hrs=2.0,
        active_dumpers=7,
        haul_cycle_mins=38.0,
        fleet_availability_pct=72.0,
        target_tonnage=2800.0,
        predicted_tonnage=1750.0,
        shortfall_probability=0.88,
        machine_failure=1
    )
    print("\n--- Prescriptive Mine Optimization Plan ---")
    print(f"Risk Level: {plan['risk_level']} (Prob: {plan['shortfall_probability']*100:.1f}%)")
    print(f"Original Prediction: {plan['original_predicted_tonnage']} T / Target: {plan['target_tonnage']} T")
    print(f"Post-Mitigation Tonnage: {plan['post_mitigation_tonnage']} T (+{plan['estimated_recovery_tonnes']} T Recovered)")
    print(f"Generated {plan['action_count']} Prescriptive Actions:")
    for a in plan["prescriptive_actions"]:
        print(f"  [{a['priority']}] {a['title']} -> +{a['potential_recovery_tonnes']} T")
