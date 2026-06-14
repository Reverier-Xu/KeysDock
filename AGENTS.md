# AGENTS.md

## Repo Priority

This repository is currently hardware-first.

- Primary review targets are the KiCad files under `hardware/`.
- `firmware/` and `software/` are still demo-stage and should not be treated as final product architecture unless the user explicitly asks.
- `suitekits/` is mechanical / 3D content and can usually be ignored for electrical reviews.

## Project Structure

The hardware is a single unified 4-layer board (rev 0.3.0) in one KiCad project:

- `hardware/keysdock.kicad_pro` — project file
- `hardware/keysdock.kicad_sch` — root schematic (A3, page 1)
- `hardware/keysdock.kicad_pcb` — PCB layout (4-layer, 1.2mm FR4)
- `hardware/keysdock.kicad_prl` — project local settings
- `hardware/components.kicad_sym` — project symbol library
- `hardware/components.pretty/` — project footprint library
- `hardware/docs/` — datasheets

### Sheet Hierarchy

| Page | Sheet name | File | Contents |
|------|-----------|------|----------|
| 1 | keysdock (root) | `keysdock.kicad_sch` | MCU, power, USB, ADC |
| 2 | keysgroup-1 | `keysgroup.kicad_sch` | 1 × XL4067TS + 16 hall sensors |
| 3 | keysgroup-2 | `keysgroup.kicad_sch` | 1 × XL4067TS + 16 hall sensors |
| 4 | keysgroup-3 | `keysgroup.kicad_sch` | 1 × XL4067TS + 16 hall sensors |
| 5 | keysgroup-4 | `keysgroup.kicad_sch` | 1 × XL4067TS + 16 hall sensors |
| 6 | keysgroup-5 | `keysgroup-last.kicad_sch` | 1 × XL4067TS + 14 hall sensors |
| 7 | leds | `leds.kicad_sch` | WS2812 LED chain |

## Key Components

### Main Controller (root sheet)

| Component | Footprint | Role |
|-----------|-----------|------|
| ESP32-C6-WROOM-1-N8 | ESP32-C6-WROOM-1 | MCU (Wi-Fi 6, BLE 5, Zigbee, Thread) |
| BQ24074RGTR | QFN50P300X300X80-17N | Battery charger / power-path |
| TPS62142RGTR | QFN50P300X300X80-17N | 3.3V buck converter |
| TLA2518IRTER | QFN50P300X300X80-17N | 8-ch 12-bit ADC (SPI) |
| TPS22910AYZVR | BGA4N50P2X2_88X88X50N | Load switch |
| TPD4E05U06DQAR | IC_TPD4E05U06DQAR | 4-ch ESD protection (USB D+/D-) |
| TPD1E10B06DPYR | DIO_TPD1E05U06DPYR | 1-ch ESD protection (VBAT) |
| TS24CA | TS24CA | Bidirectional TVS diode |
| SM4007PL | D_SOD-123FL | Schottky rectifier |
| SSSS811101 | SW-SMD_SSSS811101 | Slide switch (power) |
| FTC252012S2R2MBCA | IND-SMD_L2.5-W2.0_MHCHL2520 | 2.2µH inductor (buck) |
| — | USB-C-SMD_SHOUHAN_TYPE-C-16PFS-2JCB1.2-H6.5 | USB-C connector |
| — | SW_TS-1088-AR02016 | Tactile button (boot/reset) |
| — | HC-1.25-2PWT | Battery connector |
| — | HC-1.25-4PWT | Auxiliary connector |

### Hall Sensor Side (keysgroup sub-sheets)

| Component | Count (PCB) | Role |
|-----------|-------------|------|
| SC4823S6-TR | 78 | Linear hall-effect sensor |
| XL4067TS | 5 | 16:1 analog multiplexer |
| XL-6028RGBW-WS2812B | 82 | RGB LED (WS2812-compatible) |

### Passive Summary (PCB placed)

- 116 × 0402 capacitors (decoupling, bulk, filter)
- 23 × 0402 resistors (pull-ups, current limit, impedance matching)
- 2 × 1206 capacitors (bulk, 100µF)

## Power Rails

| Rail | Source | Typical voltage | Notes |
|------|--------|-----------------|-------|
| VUSB | USB-C VBUS | 5V | External input |
| VBAT | Battery | 3.7–4.2V | Li-ion, via slide switch and protection |
| P,+4V | BQ24074 SYS output | ~4.4V (USB) / VBAT-following (battery) | Charger system output, not a fixed 5V rail |
| P,+3.3V | TPS62142 output | 3.3V | Regulated supply for MCU, ADC, sensors |
| VCC | LED power | Varies | LED power rail |

## Ground Scheme

- **P,GND** — power ground (charger, buck, USB)
- **GNDA** — analog ground (ADC, muxes, hall sensors)
- **GNDD** — digital ground (MCU, LED digital)

The root schematic defines NetTie symbols for bridging analog and digital ground domains. PCB layout must ensure single-point star grounding at the ADC reference.

## Scan Architecture

5 × XL4067TS muxes scan the 78 hall sensors. Each keysgroup:

- **Inputs** from root: RANA (sleep), KEYS_CH_A/B/C/D/CE (mux address + chip enable via E#)
- **Outputs** to root: KEYS_ADC_OUT (analog mux output), SAKI_MOVE (wake interrupt)

The 5 mux outputs route to KEYS_ADC_1 through KEYS_ADC_5 on the TLA2518 ADC. All 5 groups share the same mux address bus (KEYS_CH_A–D) and are selected individually via KEYS_CH_CE (connected to each mux's E# pin).

### Hall Sensor Pinout (SC4823S6-TR)

- H1: HE_V3.3 (power)
- H2: GND
- H3: HE_VOUT (analog output to mux)
- H4: HE_SLEEP (sleep input, driven by RANA)
- H5: GND
- H6: HE_AWAKE (wake output, OR'd into SAKI_MOVE)

### LED Chain

82 × WS2812B-compatible RGB LEDs in a single daisy chain driven by the TOMO0 signal from ESP32-C6.

## Known Hardware Facts

- The `P,+4V` rail is the BQ24074 system output — not a true 5V rail. It is ~4.4V with external USB input and follows battery voltage when unplugged.
- Analog ground (GNDA) and digital ground (GNDD) are separate nets. They must be bridged at exactly one point on the PCB.
- SC4823S6-TR hall sensors support a sleep mode (HE_SLEEP pin) and output a wake signal (HE_AWAKE). The RANA line drives all sensor sleep pins; SAKI_MOVE is a combined wake interrupt from all sensors.
- The TLA2518 is an 8-channel 12-bit SPI ADC. Channels 1–5 are used for mux returns. Verify that analog input range accommodates hall sensor output swing and VBAT monitoring.
- All passives use 0402 footprints unless noted (100µF bulk caps are 1206).
- The 4-layer stackup is: signal (F.Cu) / power (In1.Cu, PV) / power (In2.Cu, PE) / signal (B.Cu), 1.2mm total.

## SPICE Simulation Framework

`hardware/spice/` contains a ngspice-based circuit simulation framework for validating critical analog and power circuits before fabrication. Simulations are runnable in batch mode via `python scripts/run_all.py`.

### Simulation Plan (`plan.md`)

Simulations are prioritized across three tiers:

- **P0 (must-simulate, completed)**: VBAT overvoltage (SP01), charger power path (SP02), buck regulator (SP03), hall→mux→ADC signal chain (SP04).
- **P1 (reliability, completed)**: TPS22910 LED load switch inrush + current budget (SP12).
- **P1 (reliability, pending)**: Mux crosstalk (SP05), ground noise coupling (SP06), PDN impedance (SP07), sleep/wake timing (SP08).
- **P2 (optional, completed)**: BQ24074 TS pin compliance (SP16).

### Model Inventory

| Model | File | Source | Notes |
|-------|------|--------|-------|
| XL4067TS | `models/custom/xl4067ts.lib` | Custom behavioral | Ron=200Ω, Cch=5pF, Cout=20pF |
| SC4823S6 | `models/custom/sc4823s6.lib` | Custom behavioral | Active/hi-Z modes, 3.3mV/Gs sensitivity |
| TLA2518 AFE | `models/custom/tla2518_afe.lib` | Custom behavioral | Rsw=500Ω, CSH=12pF, ESD clamp diodes |
| BQ24074 | (inline in SP02) | Custom behavioral | No TI model exists; behavioral for system-level only |
| TPS62142 | `models/custom/` (inline) | Custom behavioral | TI official model incompatible with ngspice |
| Passives | `models/passive/passive.lib` | Custom | 0402/0603 caps, resistors, ferrites, PCB traces, battery, USB |

Official TI models (`models/ti/`) for TPS62142 and TLA2528 are **reference only** — they use PSpice constructs that fail to parse in ngspice 46.

### Key Simulation Findings (P0)

- **SP01 (overvoltage)**: R9 in the VBAT divider connects to +3.3V instead of GND, causing AIN7 to reach 3.75V at VBAT=4.2V — exceeding the TLA2518's 3.3V AVDD. Fix: connect R9 to GND.
- **SP02 (power path)**: +4V rail is ~4.4V with USB present, follows VBAT−50mV on battery. CC resistors are 100Ω (500mA advertisement).
- **SP03 (buck)**: TPS62142 regulates with VIN > 3.5V. Total output capacitance 222.3µF is high — may cause inrush. Battery below 3.3V causes dropout.
- **SP04 (signal chain)**: Settling time 56ns vs 400ns acquisition window — 7× margin. 78-key full scan ~156µs. Decoupling adequate per group.
- **SP12 (LED inrush)**: TPS22910 inrush into 8.2µF LED decoupling is manageable with controlled 200µs rise time. Worst case 4.1A (82 LEDs full white) exceeds 2A load switch rating, 500mA USB-C advertisement, and BQ24074 SYS capability. Firmware must enforce LED current budget: USB-only safe limit ~300mA, max ~2A on battery.
- **SP16 (TS compliance)**: BQ24074 TS pin pulled to +3.3V via 47kΩ. At VIN=5V, TS/VIN=66% — well above 45.1% COLD threshold. Verify datasheet for NTC-disabled mode tolerance; if non-compliant, use standard VIN-referenced divider.

## Review Workflow

When asked to review or extend the hardware:

1. Start from the KiCad schematics, beginning with the root sheet.
2. Confirm the same conclusions in the PCB file.
3. Cross-check all critical assumptions with the datasheets in `hardware/docs/`.
4. Pay special attention to:
   - the GNDA / GNDD / P,GND split and bridge points,
   - the real meaning of the P,+4V rail (not 5V),
   - ADC input range versus hall sensor / battery signals,
   - decoupling capacitor placement on the keysgroup and LED sheets,
   - USB protection and CC resistor values,
   - power-path behavior of the BQ24074,
   - ESP32-C6 GPIO assignments and strapping pins.

## Documentation Targets

Prefer updating the dedicated hardware docs instead of the README when adding review output.

- `docs/architecture.md`
- `docs/improvement-plan.md`

## Firmware / Software Planning Guidance

If asked for future firmware or software plans, base the plan on the actual hardware constraints:

- TLA2518-driven hall scanning with multiplexed channel selection (5 muxes, shared address bus, chip-select per mux)
- Power-aware RGB limiting (the LED chain can draw significant current; limit based on battery state and charger status)
- Sleep / wake support through RANA (output, sleep all hall sensors) and SAKI_MOVE (input, wake from any key press)
- Battery monitoring via TLA2518 channel (likely AIN6 or AIN7)
- USB HID over ESP32-C6 native USB or BLE
- Charger status signals: ~BAT_CHG (charging indicator), ~BAT_PGOOD (power good)
