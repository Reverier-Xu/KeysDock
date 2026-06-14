#!/usr/bin/env python3
"""
KeysDock SPICE Test Runner
Runs all simulation netlists and collects results.
Uses PySpice to interface with ngspice.
"""

import sys
import os
import subprocess
from pathlib import Path

SPICE_DIR = Path(__file__).resolve().parent.parent
SCHEMATICS_DIR = SPICE_DIR / "schematics"

SIMULATIONS = {
    "SP01": {
        "name": "VBAT Overvoltage Analysis",
        "path": SCHEMATICS_DIR / "sp01_vbat_adc" / "sp01_vbat_overvoltage.cir",
        "priority": "P0",
    },
    "SP02": {
        "name": "BQ24074 Charger Power Path",
        "path": SCHEMATICS_DIR / "sp02_charger" / "sp02_charger_power_path.cir",
        "priority": "P0",
    },
    "SP03": {
        "name": "TPS62142 Buck Regulator",
        "path": SCHEMATICS_DIR / "sp03_buck" / "sp03_buck_regulator.cir",
        "priority": "P0",
    },
    "SP04": {
        "name": "Hall Sensor → Mux → ADC Signal Chain",
        "path": SCHEMATICS_DIR / "sp04_signal_chain" / "sp04_signal_chain.cir",
        "priority": "P0",
    },
    "SP12": {
        "name": "TPS22910 Load Switch — LED Inrush & Budget",
        "path": SCHEMATICS_DIR / "sp12_led_power" / "sp12_led_power.cir",
        "priority": "P1",
    },
    "SP16": {
        "name": "BQ24074 TS Pin Voltage Compliance Check",
        "path": SCHEMATICS_DIR / "sp16_bq24074_ts" / "sp16_bq24074_ts.cir",
        "priority": "P2",
    },
}

def run_simulation(sim_id: str, info: dict) -> dict:
    """Run a single ngspice simulation and return status."""
    cir_path = info["path"]
    if not cir_path.exists():
        return {"status": "SKIP", "error": f"File not found: {cir_path}"}

    try:
        result = subprocess.run(
            ["ngspice", "-b", str(cir_path)],
            cwd=str(cir_path.parent),
            capture_output=True,
            text=True,
            timeout=60,
        )
        ok = result.returncode == 0 and "ERROR: fatal error" not in result.stdout

        # Extract key findings
        lines = result.stdout.split("\n")
        conclusions = [l.strip() for l in lines if "CONCLUSIONS" in l or "RECOMMENDATION" in l]

        return {
            "status": "PASS" if ok else "FAIL",
            "stderr": result.stderr[:500] if result.stderr else "",
            "conclusions": conclusions[:10],
        }
    except subprocess.TimeoutExpired:
        return {"status": "TIMEOUT", "error": "Simulation timed out"}
    except Exception as e:
        return {"status": "ERROR", "error": str(e)}

def main():
    print("=" * 60)
    print("KeysDock SPICE Simulation Test Runner")
    print("=" * 60)
    print(f"Ngspice: ", end="")
    subprocess.run(["ngspice", "--version"], capture_output=True, text=True)

    results = {}
    for sim_id, info in SIMULATIONS.items():
        print(f"\n[{sim_id}] {info['name']} ({info['priority']})")
        print(f"  File: {info['path'].name}")
        result = run_simulation(sim_id, info)
        results[sim_id] = result
        print(f"  Status: {result['status']}")
        if result.get("conclusions"):
            for c in result["conclusions"]:
                print(f"    {c}")
        if result.get("error"):
            print(f"  Error: {result['error']}")

    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    passed = sum(1 for r in results.values() if r["status"] == "PASS")
    failed = sum(1 for r in results.values() if r["status"] == "FAIL")
    print(f"  PASS: {passed}/{len(results)}")
    print(f"  FAIL: {failed}/{len(results)}")
    for sim_id, result in results.items():
        status = result["status"]
        print(f"  [{status:5s}] {sim_id}: {SIMULATIONS[sim_id]['name']}")

if __name__ == "__main__":
    main()
