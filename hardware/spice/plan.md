# KeysDock SPICE Simulation Plan

## Objective
Use ngspice to validate the KeysDock rev 0.3.0 hardware across power, analog, digital, and reliability domains.

## Model Sourcing Strategy
1. **First-party manufacturer models** — downloaded from TI where available and unencrypted.
2. **Third-party open-source libraries** — KiCad Spice Library, LTwiki, ngspice examples (checked; no direct matches for the exotic parts).
3. **Custom behavioral models** — built from datasheets when no compatible model exists.

## Model Inventory

| Component | MPN | Source | File | ngspice status | Usage |
|-----------|-----|--------|------|----------------|-------|
| Load switch | TPS22910AYZVR | TI first-party (SLVMA45A) | `models/vendor/ti/SLVMA45A/SLVMA45/TPS22910A_TRANS.LIB` | Reference only — uses PSpice digital primitives incompatible with ngspice 46 | Behavioral replacement used in sims |
| Buck converter | TPS62142RGTR | TI first-party (SLVM442B) | `models/vendor/ti/SLVM442B/TPS62142_PSPICE_TRANS/TPS62142_TRANS.lib` | Reference only — uses PSpice constructs incompatible with ngspice 46 | Behavioral replacement used in sims |
| ADC | TLA2528 (similar family) | TI first-party (SBAM431) | `models/vendor/ti/SBAM431/TLA2528_TRANS.LIB` | Reference only — TINA format, not ngspice compatible | Behavioral TLA2518 AFE used in sims |
| Charger / power-path | BQ24074RGTR | TI — **no SPICE model offered** | N/A | Custom behavioral | `models/custom/bq24074.lib` |
| Analog mux | XL4067TS | XINLUDA — no model | N/A | Custom behavioral | `models/custom/xl4067ts.lib` |
| Hall sensor | SC4823S6-TR | Semiment — no model | N/A | Custom behavioral | `models/custom/sc4823s6.lib` |
| RGB LED | XL-6028RGBW-WS2812B | XINGLIGHT — no model | N/A | Custom behavioral load | `models/custom/ws2812b.lib` |
| ESD array | TPD4E05U06DQAR | TI — no SPICE model | N/A | Generic TVS behavioral | `models/custom/tvs.lib` |
| ESD diode | TPD1E10B06DPYR | TI — no SPICE model | N/A | Generic TVS behavioral | `models/custom/tvs.lib` |
| TVS | TS24CA | SHOU HAN — no model | N/A | Generic TVS behavioral | `models/custom/tvs.lib` |
| Schottky | SM4007PL | MCC — generic model | N/A | Generic diode | ngspice built-in + `models/custom/diode.lib` |
| Inductor | 2.2µH | cjiang — no model | N/A | Ideal + DCR | `models/custom/passive.lib` |

## Simulation Matrix

| ID | Title | Circuit | Key Metrics | Priority |
|----|-------|---------|-------------|----------|
| SP01 | VBAT monitor divider & ADC input range | `circuits/sp01_vbat_divider.cir` | AIN7 vs VBAT, overvoltage at VBAT=4.5V | P0 |
| SP02 | BQ24074 power-path & charger behavior | `circuits/sp02_charger.cir` | +4V vs VIN/VBAT, charge current, TS fault | P0 |
| SP03 | TPS62142 buck regulation & load transient | `circuits/sp03_buck.cir` | Vout regulation, ripple, inrush with 220µF | P0 |
| SP04 | Hall → mux → ADC signal chain | `circuits/sp04_hall_mux_adc.cir` | Settling time, scan time, noise | P0 |
| SP05 | Mux crosstalk | `circuits/sp05_mux_crosstalk.cir` | Coupling from active channel to quiet channel | P1 |
| SP06 | Ground noise / NetTie star ground | `circuits/sp06_ground_noise.cir` | GNDA bounce vs GNDD with LED switching | P1 |
| SP07 | PDN impedance | `circuits/sp07_pdn_impedance.cir` | |Z| of +3.3V vs frequency | P1 |
| SP08 | Hall sleep / wake timing | `circuits/sp08_sleep_wake.cir` | RANA latency, SAKI_MOVE pulse | P1 |
| SP09 | USB VBUS TVS clamp | `circuits/sp09_usb_vbus_tvs.cir` | Clamp voltage, peak current | P1 |
| SP10 | USB data-line ESD clamp | `circuits/sp10_usb_data_tvs.cir` | D+/D- clamp, loading capacitance | P1 |
| SP11 | ADC reference / sampling glitches | `circuits/sp11_adc_sampling.cir` | Acquisition error vs source impedance | P1 |
| SP12 | TPS22910A LED load-switch inrush & current budget | `circuits/sp12_led_load_switch.cir` | Inrush, VCC droop, max DC current | P1 |
| SP13 | VBAT ripple and Schottky behavior | `circuits/sp13_vbat_ripple.cir` | Schottky behavior, battery ripple | P2 |
| SP14 | ESP32 strapping / power-on (behavioral) | `circuits/sp14_strapping.cir` | Boot pin levels at power-up | P2 |
| SP15 | Buck inductor current ripple | `circuits/sp15_inductor_ripple.cir` | Inductor current, saturation margin | P2 |
| SP16 | BQ24074 TS bias compliance | `circuits/sp16_ts_bias.cir` | TS/VIN window vs bias network | P0/P1 |

## How to Run

```bash
cd /home/reverier/Code/Hardware/KeysDock/hardware/spice
python3 scripts/run_all.py
```

Results are written to `results/` as CSV/PNG-compatible raw files and summarized in `reports/simulation-summary.md`.
