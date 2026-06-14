# Schematic-to-Simulation Mapping — KeysDock rev 0.3.0

Generated from `kicad-cli sch export netlist` on keysdock.kicad_sch.

## 1. Power Architecture

```
USB-C (J1)
  │ VUSB
  ├── D2 (TPD1E10B06) ── GNDD         [ESD clamp]
  ├── C12 (1µF) ── GNDD                [input bypass]
  ├── D1 (SM4007PL) ── VUSB            [reverse polarity]
  └── U4 (BQ24074) pin 13 (IN)
      │
      ├── U4 pin 2,3 (BAT) ──── /VBAT
      │   │
      │   ├── C14 (4.7µF) ── GNDD      [battery bypass]
      │   ├── S3 (SSSS811101) ── VBAT  [slide switch]
      │   ├── R8 pin 1 (100kΩ)         [→ AIN7 divider]
      │   └── PC1 (battery connector 2-pin)
      │
      ├── U4 pin 10,11 (VOUT) ──── +4V
      │   │
      │   ├── C10 (10µF) ── GNDD
      │   ├── C13 (4.7µF) ── GNDD
      │   ├── C16 (10µF) ── GNDD
      │   └── U3 (TPS62142) pin 10-13 (VIN/PVIN)
      │
      ├── U4 pin 9 (~{CHG}) ──── /~{BAT_CHG}
      │   ├── R12 (1.5kΩ) ── +3.3V   [pull-up]
      │   └── U1 (ESP32-C6) MTDI/GPIO5
      │
      ├── U4 pin 7 (~{PGOOD}) ──── /~{BAT_PGOOD}
      │   ├── R13 (1.5kΩ) ── +3.3V   [pull-up]
      │   └── U1 (ESP32-C6) MTMS/GPIO4
      │
      ├── U4 pin 15 (ISET) ──── R15 (1.10kΩ) ── GNDD  [ICHG ≈ 809mA]
      └── U4 pin 1 (TS) ──── R16 (47kΩ) ── +3.3V       [NTC disabled]
```

## 2. 3.3V Regulator

```
U3 (TPS62142) pin 10-13 (VIN) ← +4V
  ├── U3 pin 5 (EN) ← R11 (100kΩ) ── VUSB  [enabled when USB present]
  ├── U3 pin 14,15 (SW) ── L1 (2.2µH) ── +3.3V
  │   ├── C6 (22µF) ── GNDD
  │   ├── C7 (100nF) ── GNDD
  │   ├── C8 (100nF) ── GNDD
  │   ├── C9 (100nF) ── GNDD
  │   ├── C35 (100µF) ── GNDD
  │   └── C36 (100µF) ── GNDD
  └── U3 pin 16 (FB) ── R17 (3kΩ) ── +3.3V   [fixed 3.3V version]
```

## 3. VBAT Monitoring (TLA2518 AIN7) — ⚠️ OVERVOLTAGE RISK

```
/VBAT ──── R8 (100kΩ) ──┬── AIN7 ── R9 (100kΩ) ──── +3.3V
                        │
                        ├── C3 (100nF) ── +3.3V
                        └── U2 (TLA2518) pin 6 (AIN7/GPIO7)
```

**Analysis**: This is a resistor divider between VBAT and +3.3V (not GND!).
- V_AIN7 = (VBAT × 100k + 3.3V × 100k) / 200k = (VBAT + 3.3V) / 2
- VBAT=3.0V → AIN7=3.15V ✓ (below 3.3V)
- VBAT=3.7V → AIN7=3.50V ⚠️ (above 3.3V AVDD!)
- VBAT=4.2V → AIN7=3.75V ⚠️ (significant overvoltage)

**R9 should connect to GND, not +3.3V.** With R9 to GND:
- V_AIN7 = VBAT × 100k / 200k = VBAT / 2
- VBAT=4.2V → AIN7=2.1V ✓

**Also**: R14 (10kΩ) and R16 (47kΩ) both appear to have both pins on +3.3V — likely DNP placeholders.

## 4. Analog Signal Chain (per 16-key group)

```
SC4823S6 (SWn)
  ├── H1 (VCC) ──── +3.3V
  ├── H2,H5 (GND) ─ GNDA
  ├── H3 (VOUT) ──── XL4067TS Yn input
  ├── H4 (SLEEP) ─── /RANA (all 78 sensors in parallel)
  └── H6 (AWAKE) ─── /SAKI_MOVE (all 78 sensors in parallel, wired-OR)

XL4067TS (Tn)
  ├── Y0–Y15 ──── 16 sensor VOUTs (14 for keysgroup-5)
  ├── Z ──────── /KEYS_ADC_[1-5] → TLA2518
  ├── A,B,C,D ─── /KEYS_CH_A/B/C/D (shared across all 5 muxes)
  ├── E# ─────── /KEYS_CH_CE (shared across all 5 muxes, active low)
  ├── VCC ────── +3.3V
  └── GND ────── GNDA
  Decoupling (per group): C=100nF, 4.7µF, 10µF (0402 MLCCs)

TLA2518 (U2)
  ├── AIN0/GPIO0 ─ /KEYS_ADC_1  (keysgroup-1 via T1, 16 keys)
  ├── AIN1/GPIO1 ─ /KEYS_ADC_2  (keysgroup-2 via T2, 16 keys)
  ├── AIN2/GPIO2 ─ /KEYS_ADC_3  (keysgroup-3 via T3, 16 keys)
  ├── AIN3/GPIO3 ─ /KEYS_ADC_4  (keysgroup-4 via T4, 16 keys)
  ├── AIN4/GPIO4 ─ /KEYS_ADC_5  (keysgroup-5 via T5, 14 keys)
  ├── AIN5/GPIO5 ── NC
  ├── AIN6/GPIO6 ── NC
  ├── AIN7/GPIO7 ── VBAT monitor (via R8/R9 divider)
  ├── AVDD ─────── +3.3V   [C4=1µF, C5=1µF]
  ├── DVDD ─────── +3.3V
  ├── DECAP ────── C11 (3.3nF) ── GNDA
  └── GND ──────── GNDA
```

## 5. USB-C

```
J1 (TYPE-C 16P)
  ├── VBUS ─────── VUSB (via D1 reverse-polarity protection)
  │   └── D2 (TPD1E10B06) ── GNDD     [VBUS ESD]
  ├── D+ ───────── USB_D+ ── U1 GPIO12 (native USB)
  │   └── U5 (TPD4E05U06) ch1 ── GNDD [data line ESD]
  ├── D- ───────── USB_D- ── U1 GPIO13 (native USB)
  │   └── U5 (TPD4E05U06) ch2 ── GNDD
  ├── CC1 ──────── R5 (100Ω) ── GNDD   [500mA advertisement]
  │   └── U5 ch3 ── GNDD
  ├── CC2 ──────── R6 (100Ω) ── GNDD   [500mA advertisement]
  │   └── U5 ch4 ── GNDD
  └── GND ──────── GNDD
```

## 6. ESP32-C6 GPIO Map

| C6 Pin | GPIO | Net | Function |
|--------|------|-----|----------|
| 4 | GPIO4/MTMS | /~{BAT_PGOOD} | Charger power good input |
| 5 | GPIO5/MTDI | /~{BAT_CHG} | Charger status input |
| 6 | GPIO6/MTCK | /SPI_CLK | SPI clock to TLA2518 |
| 7 | GPIO7/MTDO | /SPI_MISO | SPI MISO from TLA2518 |
| 8 | GPIO0 | /BOOT_0 | Boot strapping |
| 9 | GPIO1 | /~{ANON} | LED enable (active low) → U6 ON |
| 10 | GPIO8 | — | — |
| 12 | GPIO12 | /USB_D- | Native USB |
| 13 | GPIO13 | /USB_D+ | Native USB |
| 16 | GPIO16 | /U0TX | Debug UART TX |
| 17 | GPIO17 | /U0RX | Debug UART RX |
| 18 | GPIO20 (?) | /RANA | Sleep control (all hall sensors) |
| 19 | GPIO21 (?) | /KEYS_CH_D | Mux address bit 3 |
| 20 | GPIO22 (?) | /KEYS_CH_C | Mux address bit 2 |
| 21 | GPIO23 (?) | /KEYS_CH_B | Mux address bit 1 |
| 22 | GPIO24 (?) | /KEYS_CH_A | Mux address bit 0 |
| 23 | GPIO25 (?) | /SPI_CS_ADC | TLA2518 chip select |
| 24 | GPIO26 (?) | /KEYS_CH_CE | Mux chip enable |
| 25 | GPIO27 (?) | /SPI_MOSI | SPI MOSI to TLA2518 |
| 26 | GPIO3 | /SAKI_MOVE | Wake on keypress input |
| — | — | /TOMO0 | WS2812 data output |

## 7. Ground Architecture

```
GNDA ←── NT1 (NetTie, single-point star) ──→ GNDD

GNDA nets: Hall sensors (all 78), XL4067TS muxes (5×),
           TLA2518 AGND, analog decoupling caps

GNDD nets: ESP32-C6, WS2812 LEDs (82×), USB-C,
           BQ24074 PGND, TPS62142 PGND, digital decoupling caps
```

## 8. Capacitor Inventory

| Area | Caps | Notes |
|------|------|-------|
| Root (controller) | C1-C16, C32-C36 | Input, output, decoupling — comprehensive |
| Keysgroup ×4 (16-key) | C17-C28 (3 per group) | 100nF + 4.7µF + 10µF each |
| Keysgroup-5 (14-key) | C29-C31 (3 total) | 100nF + 4.7µF + 10µF |
| LEDs | C37-C118 (82 total) | 100nF per WS2812B LED |
| **Total** | ~130 capacitors | All decoupling present on single unified board |

## 9. Key Architecture Facts (rev 0.3.0)

| Item | Value |
|------|-------|
| Architecture | Single unified 4-layer board |
| System rail name | `+4V` (BQ24074 SYS output, ~4.4V with USB) |
| VBAT→AIN7 divider | 100kΩ + 100kΩ to **+3.3V** (overvoltage risk!) |
| LED power rail | `VCC` (via load switch U6) |
| Mux CE | Shared `/KEYS_CH_CE` across all 5 muxes |
| Decoupling | Present: 3 MLCCs per keysgroup, 1 per LED |
| BQ24074 ISET | R15=1.10kΩ → ICHG≈809mA |
| BQ24074 TS/NTC | R16=47kΩ pull-up to +3.3V (NTC disabled) |
| USB CC resistors | R5,R6 = 100Ω (500mA advertisement) |
| TLA2518 DECAP | C11=3.3nF to GNDA |
| AIN5,AIN6 | NC (unconnected) |
| Hall sensors | 78 total (4×16 + 1×14) |
| Muxes | 5 × XL4067TS |
| LEDs | 82 × XL-6028RGBW-WS2812B |

## 10. Simulation Parameters from Real PCB

| Parameter | Value | Source |
|-----------|-------|--------|
| ICHG (charge current) | ~809 mA | R15 = 1.10kΩ |
| USB CC advertisement | 500 mA | R5,R6 = 100Ω to GND |
| VBAT divider top | 100 kΩ | R8 |
| VBAT divider bottom | 100 kΩ | R9 (to +3.3V — ⚠️) |
| Buck inductor | 2.2 µH | L1 (FTC252012S2R2MBCA) |
| Buck Cout total | ~233 µF | C6(22µF)+C35(100µF)+C36(100µF)+C7,C8,C9(100nF) |
| Mux Ron (3.3V) | ~200-350 Ω | XL4067 datasheet |
| Sensor sensitivity | 3.3 mV/Gs | SC4823S6 datasheet |
| TLA2518 CSH | 12 pF | TLA2518 datasheet |
| TLA2518 DECAP | 3.3 nF | C11 |
| Mux decoupling | 100nF+4.7µF+10µF | Per keysgroup (5 groups) |
| Sensor count | 78 | SW1-SW78 |
| Mux count | 5 | T1-T5 |
| LED count | 82 | LED1-LED82 |
| LED decoupling | 100nF each | C37-C118 |
