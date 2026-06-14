# SPICE Simulation Plan — KeysDock rev 0.3.0

## 1. Tool Selection

### Recommended: Ngspice + KiCad Native Integration

| Tool | Strengths | Weaknesses | Verdict |
|------|-----------|------------|---------|
| **Ngspice** (recommended) | KiCad 9/10 built-in; open source; Linux native; direct schematic simulation | Some ICs lack SPICE models | **Primary** |
| LTspice | Industry standard; rich model library; extensive TI/ADI models | Linux requires Wine; no KiCad schematic linkage | Backup (critical paths) |
| Qucs-S | Qt GUI; same ngspice backend | Must manually redraw circuits | Not recommended |
| PySpice | Programmable; parameter sweeps/Monte Carlo | Also lacks models | Auxiliary (batch analysis) |

### Final Strategy

- **Primary**: KiCad → Ngspice (netlist export from schematic for simulation)
- **Supplement**: LTspice (TI official model verification, e.g. BQ24074 / TPS62142 / TLA2518)
- **Auxiliary**: PySpice (parameter sweeps, Monte Carlo, noise analysis)

---

## 2. Simulation Prioritization

### P0 — Must Simulate (directly affects functional correctness)

| ID | Simulation | Risk | Input Conditions |
|----|-----------|------|------------------|
| **SP01** | **VBAT → TLA2518 AIN7 overvoltage** | Marked high-risk in AGENTS.md | VBAT = 3.0~4.2V, AIN7 max = AVDD (3.3V) |
| **SP02** | **BQ24074 power path transient** | System main rail stability | USB plug/unplug, battery switch transient |
| **SP03** | **TPS62142 buck output ripple + load transient** | 3.3V rail feeds all logic/analog | 0~500mA load step, 4.4V input |
| **SP04** | **Hall sensor → XL4067TS → ADC analog link** | Analog signal integrity | Sensor output 1.65±1.65V, mux Ron + parasitic cap |

| **SP12** | **TPS22910 load switch inrush + LED current budget** | 82 LEDs on one switch; 2A limit; 500mA USB | Turn-on inrush into 8.2µF, worst-case 4.1A load step |
| **SP16** | **BQ24074 TS pin voltage compliance** | TS=47kΩ to +3.3V may violate VIN-referenced TS range | DC sweep VIN 4.0-5.5V, TS/VIN ratio check |

### P1 — Recommended (affects reliability and precision)

| ID | Simulation | Risk | Input Conditions |
|----|-----------|------|------------------|
| **SP05** | **Crosstalk during simultaneous mux switching** | Adjacent channel analog crosstalk | 5 muxes switching simultaneously, coupling analysis |
| **SP06** | **GNDA/GNDD single-point ground effectiveness** | Digital noise coupling to analog | LED PWM noise injection, ADC input interference |
| **SP07** | **PDN impedance analysis** | Power delivery to sensors | Z21 frequency sweep, decoupling effectiveness |
| **SP08** | **RANA/SAKI_MOVE sleep/wake timing** | Low-power mode reliability | Level transition time, wake latency |

### P2 — Optional (design optimization)

| ID | Simulation | Risk | Input Conditions |
|----|-----------|------|------------------|
| **SP09** | **USB-C CC pulldown resistor accuracy** | Charge current negotiation | 100Ω ±1%, VBUS establishment timing |
| **SP10** | **ESD protection clamp characteristics** | ESD protection effectiveness | IEC 61000-4-2 human body model |
| **SP11** | **WS2812 data line signal integrity** | 82-LED cascading reliability | Transmission line model, end-of-chain waveform |
| **SP16** | **BQ24074 TS pin voltage compliance** | Charge suspend due to out-of-range TS voltage | TS=47kΩ to +3.3V, not VIN-referenced |

---

## 3. SPICE Model Sourcing

### Devices with Official SPICE Models

| Device | Model Source | Format | Status |
|--------|-------------|--------|--------|
| TPS62142 | TI official PSpice model | .lib | Downloaded; fails in ngspice (see MODELS.md) |
| BQ24074 | TI official PSpice model | .lib | **No model exists** (verified exhaustively) |
| TLA2518 | TI (TLA2528 analog core, TINA-TI) | IBIS / TINA | Needs behavioral model |
| TPS22910 | TI official PSpice model | .lib | Model not found (product page 404) |
| TPD4E05U06 | TI official | IBIS only | IBIS only; needs behavioral |
| TPD1E10B06 | TI official | IBIS only | IBIS only; needs behavioral |

### Devices Requiring Custom Modeling

| Device | Modeling Approach | Complexity |
|--------|-----------------|------------|
| ESP32-C6 GPIO | Simplified behavioral (ideal switch + parasitic RLC + IBIS) | Medium |
| XL4067TS | Ron + parasitic capacitance + switch behavioral model | Low |
| SC4823S6 (Hall sensor) | Voltage source + output impedance (datasheet-based) | Low |
| WS2812B LED | Simplified behavioral (input capacitance + Schmitt trigger) | Medium |
| BQ24074 | Custom behavioral (see MODELS.md for justification) | Low |

### Model File Organization

```
hardware/spice/
├── plan.md              # This file
├── MODELS.md            # Model inventory & compatibility assessment
├── SCH_TO_SIM.md        # Schematic-to-simulation mapping
├── models/              # SPICE model library
│   ├── ti/              # TI device models (PSpice, reference only)
│   ├── custom/          # Custom behavioral models
│   └── passive/         # Passive device models (RLC)
├── schematics/          # Simulation schematics
│   ├── sp01_vbat_adc/
│   ├── sp02_charger/
│   ├── sp03_buck/
│   ├── sp04_signal_chain/
│   └── ...
├── results/             # Simulation output (waveforms, data)
└── scripts/             # PySpice batch scripts
```

---

## 4. Phased Implementation Plan

### Phase 1 — Infrastructure (Day 1–2)

1. [ ] Verify KiCad version and ngspice integration
   ```bash
   kicad-cli --version
   ngspice --version
   ```
2. [ ] Collect TI official SPICE/PSpice models
   - TPS62142, BQ24074, TPS22910, TPD4E05U06, TPD1E10B06
3. [ ] Build custom behavioral models
   - XL4067TS (Ron ~200Ω @3.3V, 50pF channel capacitance)
   - SC4823S6 (1.65V quiescent, 3.3mV/Gs, 1kΩ output impedance)
4. [ ] Set up simulation directory structure and naming conventions

### Phase 2 — P0 Critical Simulations (Day 3–5)

1. [x] **SP01** — VBAT divider circuit design and verification
2. [x] **SP02** — Power path transient simulation
3. [x] **SP03** — Buck regulator verification
4. [x] **SP04** — Analog signal chain
5. [x] **SP12** — TPS22910 load switch LED inrush + current budget (P1, added)
6. [x] **SP16** — BQ24074 TS pin voltage compliance (P2, added)

### Phase 3 — P1 Reliability Simulations (Day 6–8)

1. [ ] **SP05** — Mux crosstalk analysis
2. [ ] **SP06** — Ground bounce and digital noise coupling
3. [ ] **SP07** — PDN impedance analysis (Z21 sweep)
4. [ ] **SP08** — Sleep/wake timing

### Phase 4 — Report and Improvement Recommendations (Day 9–10)

1. [ ] Compile simulation results → `spice/results/report.md`
2. [ ] Output PCB design improvement recommendations → `docs/improvement-plan.md`
3. [ ] Provide schematic modifications where necessary

---

## 5. Key Simulation Parameters and Acceptance Criteria

| Parameter | Target | Criterion |
|-----------|--------|-----------|
| VBAT ADC input | ≤ 3.3V (full battery range) | Divided 0~3.3V mapping 0~4.2V |
| 3.3V ripple | ≤ 30mVpp | TPS62142 datasheet typical |
| +4V transient sag | ≤ 200mV / ≤ 100µs | BQ24074 linear regulator response |
| Mux channel settling time | ≤ ADC sample period / 2 | 12-bit accuracy requirement |
| Channel crosstalk | ≤ -60dB @ DC | Adjacent keys no false trigger |
| GNDA noise | ≤ 1 LSB (≈0.8mV) | 12-bit ADC @ 3.3V Vref |

---

## 6. Known Limitations

1. **No public SPICE model for ESP32-C6** — GPIO behavior approximated with ideal RLC + IBIS
2. **TLA2518 SPI interface not simulated** — only analog front-end (AINx to ADC core)
3. **PCB parasitics** — must extract trace RLCG from KiCad PCB (or manually estimate)
4. **82-LED full simulation infeasible** — simulate only first and last LED transmission line effects
5. **Magnetic circuit (Hall + magnet) not simulated** — simulate electrical signal path only
6. **TI official models reference only** — TPS62142 and TLA2528 models use PSpice constructs incompatible with ngspice 46

---

## 7. Environment Requirements

```bash
# Ubuntu/Debian
sudo apt install ngspice kicad

# Python auxiliary tools
pip install pyspice numpy matplotlib

# Verify installation
ngspice --version  # should be ≥ 38
```

KiCad → Schematic Editor → Inspect → Simulator → Select Ngspice engine.
