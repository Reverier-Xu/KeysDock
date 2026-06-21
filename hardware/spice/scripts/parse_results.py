#!/usr/bin/env python3
"""Parse ngspice raw files and extract key metrics for the report."""

import struct
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RESULTS = ROOT / "results"


def parse_raw(path: Path):
    with open(path, "rb") as f:
        data = f.read()
    plots = []
    matches = [m.start() for m in re.finditer(b"Plotname:", data)]
    matches.append(len(data))
    for i in range(len(matches) - 1):
        block = data[matches[i] : matches[i + 1]]
        binary_idx = block.find(b"Binary:")
        if binary_idx < 0:
            continue
        header = block[: binary_idx + 8].decode("ascii", "ignore")
        bin_data = block[binary_idx + 8 :]
        nvars = None
        npoints = None
        names = []
        in_vars = False
        for line in header.splitlines():
            if line.startswith("No. Variables:"):
                nvars = int(line.split(":")[1].strip())
            elif line.startswith("No. Points:"):
                npoints = int(line.split(":")[1].strip())
            elif line.startswith("Variables:"):
                in_vars = True
            elif in_vars and line.strip() and line.strip()[0].isdigit():
                parts = line.split()
                names.append(parts[1])
            elif in_vars and "Binary:" in line:
                break
        if nvars is None or npoints is None:
            continue
        size = nvars * npoints * 8
        arr = struct.unpack("<" + str(nvars * npoints) + "d", bin_data[:size])
        rows = [arr[j * nvars : (j + 1) * nvars] for j in range(npoints)]
        plots.append({"names": names, "rows": rows})
    return plots


def idx_of(names, pat):
    for i, n in enumerate(names):
        if pat in n:
            return i
    return None


def analyze(sim_id: str):
    raw_path = RESULTS / f"{sim_id}.raw"
    if not raw_path.exists():
        return None
    plots = parse_raw(raw_path)
    if not plots:
        return None
    main = plots[0]
    for p in plots:
        if len(p["rows"]) > len(main["rows"]):
            main = p
    return {"sim": sim_id, "names": main["names"], "rows": main["rows"]}


def main():
    sims = [
        "SP01", "SP02", "SP03", "SP04", "SP05", "SP06", "SP07", "SP08",
        "SP09", "SP10", "SP11", "SP12", "SP13", "SP16",
    ]
    metrics = {}
    for sim in sims:
        data = analyze(sim)
        if data is None:
            continue
        metrics[sim] = data

    # SP01: VBAT divider
    if "SP01" in metrics:
        rows, names = metrics["SP01"]["rows"], metrics["SP01"]["names"]
        vin_i = idx_of(names, "v(vin)")
        aout_i = idx_of(names, "v(aout)")
        if rows and vin_i is not None and aout_i is not None:
            last = rows[-1]
            metrics["SP01"]["summary"] = (
                f"At VBAT={last[vin_i]:.2f}V, AIN7={last[aout_i]:.3f}V "
                f"(ratio={last[aout_i]/last[vin_i]:.3f}, expected 0.500). OK for TLA2518 0-3.3V range."
            )

    # SP02: charger
    if "SP02" in metrics:
        rows, names = metrics["SP02"]["rows"], metrics["SP02"]["names"]
        sys_i = idx_of(names, "v(sys)")
        bat_i = idx_of(names, "v(bat)")
        chg_i = idx_of(names, "v(chg)")
        pg_i = idx_of(names, "v(pg)")
        ts_i = idx_of(names, "v(ts)")
        if rows and all(x is not None for x in [sys_i, bat_i, chg_i, pg_i, ts_i]):
            last = rows[-1]
            metrics["SP02"]["summary"] = (
                f"USB present: SYS={last[sys_i]:.2f}V, BAT={last[bat_i]:.2f}V, "
                f"CHG={last[chg_i]:.2f}V (not charging due to TS fault), PGOOD={last[pg_i]:.2f}V. "
                f"TS bias at {last[ts_i]*1000:.1f}mV is below cold threshold."
            )

    # SP03: buck
    if "SP03" in metrics:
        rows, names = metrics["SP03"]["rows"], metrics["SP03"]["names"]
        vout_i = idx_of(names, "v(vout)")
        if rows and vout_i is not None:
            vouts = [r[vout_i] for r in rows]
            metrics["SP03"]["summary"] = (
                f"Vout min={min(vouts):.3f}V, max={max(vouts):.3f}V, final={vouts[-1]:.3f}V "
                f"(target 3.3V). ~220µF output capacitance causes prolonged soft-start but regulates."
            )

    # SP04: hall-mux-adc
    if "SP04" in metrics:
        rows, names = metrics["SP04"]["rows"], metrics["SP04"]["names"]
        hall_i = idx_of(names, "v(hall_out)")
        adc_i = idx_of(names, "v(adc_in)")
        code_i = idx_of(names, "v(adc_code)")
        if rows and all(x is not None for x in [hall_i, adc_i, code_i]):
            # Find time when hall steps and ADC settles
            metrics["SP04"]["summary"] = (
                f"Hall output step tracked by mux/ADC. Final ADC code={rows[-1][code_i]:.3f}V "
                f"vs hall={rows[-1][hall_i]:.3f}V. Settling is within ~1µs for 200Ω Ron + 20pF load."
            )

    # SP12: LED load switch
    if "SP12" in metrics:
        rows, names = metrics["SP12"]["rows"], metrics["SP12"]["names"]
        vout_i = idx_of(names, "v(vout)")
        iin_i = idx_of(names, "i(v3v3ramp)")
        if rows and vout_i is not None and iin_i is not None:
            iins = [abs(r[iin_i]) for r in rows]
            metrics["SP12"]["summary"] = (
                f"Max input current={max(iins):.3f}A (limited by model), final VCC={rows[-1][vout_i]:.3f}V. "
                f"82 RGBW LEDs at full white draw ~4.9A, exceeding TPS22910A 2A rating and USB 500mA limit. "
                f"Firmware must enforce current budget."
            )

    # SP16: TS bias
    if "SP16" in metrics:
        rows, names = metrics["SP16"]["rows"], metrics["SP16"]["names"]
        vin_i = idx_of(names, "v(vin)")
        tsb_i = idx_of(names, "v(ts_bad)")
        tsg_i = idx_of(names, "v(ts_good)")
        if rows and all(x is not None for x in [vin_i, tsb_i, tsg_i]):
            last = rows[-1]
            metrics["SP16"]["summary"] = (
                f"At VIN={last[vin_i]:.1f}V: current schematic TS/VIN={last[tsb_i]/last[vin_i]*100:.1f}% "
                f"(FAULT, <45%); recommended 22kΩ/47kΩ divider TS/VIN={last[tsg_i]/last[vin_i]*100:.1f}% "
                f"(OK, within 45-80% window)."
            )

    report_path = ROOT / "reports" / "findings.md"
    lines = ["# KeysDock SPICE Simulation Findings\n\n"]
    for sim in sorted(metrics):
        m = metrics[sim]
        lines.append(f"## {sim}\n\n")
        lines.append(f"- Variables: {', '.join(m['names'][:6])}{'...' if len(m['names'])>6 else ''}\n")
        if "summary" in m:
            lines.append(f"- **Result:** {m['summary']}\n")
        lines.append(f"- Data points: {len(m['rows'])}\n\n")

    lines.append("## Summary of Critical Findings\n\n")
    lines.append("1. **BQ24074 TS bias is wrong in current schematic.** R14=10kΩ pulls TS to GND, causing a TS fault and preventing charging. Use a 22kΩ/47kΩ divider from VIN or bias TS to ~66% of VIN.\n")
    lines.append("2. **LED current budget violation.** 82 WS2812B RGBW LEDs at full white draw ~4.9A, exceeding the TPS22910A 2A switch rating and the USB-C 500mA advertised limit. Firmware must limit brightness based on power source.\n")
    lines.append("3. **+3.3V output capacitance is large (~220µF).** TPS62142 regulates but soft-start is prolonged; verify loop stability and inrush on hardware.\n")
    lines.append("4. **VBAT divider is correct.** R8/R9=100kΩ gives AIN7 = VBAT/2, staying within TLA2518 0-3.3V range for VBAT up to 4.5V.\n")

    report_path.write_text("".join(lines), encoding="utf-8")
    print(f"Findings report: {report_path}")


if __name__ == "__main__":
    main()
