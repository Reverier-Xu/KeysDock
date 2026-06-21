#!/usr/bin/env python3
"""Run all KeysDock SPICE simulations and collect results."""

import os
import subprocess
import glob
import re
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CIRCUITS = ROOT / "circuits"
RESULTS = ROOT / "results"
REPORTS = ROOT / "reports"

RESULTS.mkdir(parents=True, exist_ok=True)
REPORTS.mkdir(parents=True, exist_ok=True)

SIMS = {
    "SP01": "sp01_vbat_divider.cir",
    "SP02": "sp02_charger.cir",
    "SP03": "sp03_buck.cir",
    "SP04": "sp04_hall_mux_adc.cir",
    "SP05": "sp05_mux_crosstalk.cir",
    "SP06": "sp06_ground_noise.cir",
    "SP07": "sp07_pdn_impedance.cir",
    "SP08": "sp08_sleep_wake.cir",
    "SP09": "sp09_usb_vbus_tvs.cir",
    "SP10": "sp10_usb_data_tvs.cir",
    "SP11": "sp11_adc_sampling.cir",
    "SP12": "sp12_led_load_switch.cir",
    "SP13": "sp13_vbat_ripple.cir",
    "SP16": "sp16_ts_bias.cir",
}


def run_ngspice(sim_id: str, cir_file: str):
    cir_path = CIRCUITS / cir_file
    raw_path = RESULTS / f"{sim_id}.raw"
    log_path = RESULTS / f"{sim_id}.log"

    cmd = [
        "ngspice",
        "-b",  # batch mode
        "-r", str(raw_path),
        "-o", str(log_path),
        str(cir_path),
    ]

    try:
        proc = subprocess.run(
            cmd,
            cwd=ROOT,
            text=True,
            capture_output=True,
            timeout=120,
        )
        success = proc.returncode == 0
        errors = ""
        if not success:
            errors = proc.stderr or proc.stdout
        return {
            "id": sim_id,
            "file": cir_file,
            "returncode": proc.returncode,
            "success": success,
            "log": str(log_path),
            "raw": str(raw_path) if raw_path.exists() else None,
            "errors": errors,
        }
    except subprocess.TimeoutExpired:
        return {
            "id": sim_id,
            "file": cir_file,
            "returncode": -1,
            "success": False,
            "log": str(log_path),
            "raw": None,
            "errors": "Timeout after 120s",
        }
    except Exception as e:
        return {
            "id": sim_id,
            "file": cir_file,
            "returncode": -1,
            "success": False,
            "log": str(log_path),
            "raw": None,
            "errors": str(e),
        }


def parse_log_for_metrics(log_path: Path):
    """Very simple log grepping for common metrics."""
    if not log_path.exists():
        return {}
    text = log_path.read_text(errors="ignore")
    metrics = {}
    # Look for convergence / error markers
    if "Error" in text or "error" in text:
        metrics["has_error_keyword"] = True
    else:
        metrics["has_error_keyword"] = False
    return metrics


def main():
    summary = []
    for sim_id, cir_file in SIMS.items():
        print(f"Running {sim_id}: {cir_file} ...")
        result = run_ngspice(sim_id, cir_file)
        metrics = parse_log_for_metrics(Path(result["log"]))
        result["metrics"] = metrics
        summary.append(result)
        status = "OK" if result["success"] else "FAIL"
        print(f"  -> {status} (rc={result['returncode']})")
        if not result["success"] and result["errors"]:
            # Print first few lines of error
            for line in result["errors"].splitlines()[:8]:
                print(f"     {line}")

    # Write JSON summary
    summary_path = RESULTS / "summary.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    # Write Markdown report
    report_lines = ["# KeysDock SPICE Simulation Summary\n"]
    report_lines.append(f"Date: {subprocess.check_output(['date','-Iseconds'],text=True).strip()}\n")
    report_lines.append("| Sim | File | Status | Notes |\n")
    report_lines.append("|-----|------|--------|-------|\n")
    for r in summary:
        notes = ""
        if not r["success"]:
            notes = (r["errors"].splitlines()[0] if r["errors"] else "unknown error").replace("|", "\\|")
        report_lines.append(f"| {r['id']} | {r['file']} | {'OK' if r['success'] else 'FAIL'} | {notes} |\n")

    report_path = REPORTS / "simulation-summary.md"
    report_path.write_text("".join(report_lines), encoding="utf-8")

    print(f"\nSummary written to {summary_path}")
    print(f"Report written to {report_path}")


if __name__ == "__main__":
    main()
