# SPICE Model Inventory & Assessment

## Ngspice Compatibility Warning

Both TI official models (`TPS62142_TRANS.lib` and `TLA2528_TRANS.LIB`) currently **fail to parse** in ngspice 46 due to:
- PSpice-specific `S` (voltage-controlled switch) elements referencing subcircuit models (ngspice requires `.model` definitions)
- PSpice `IF()` function syntax in behavioral sources (ngspice uses `u()` ternary instead)
- TINA-TI `.TSM` macros not convertible to SPICE netlists

**Verdict**: Official models are **preserved for reference** and potential future adaptation. The working simulation netlists use the **custom behavioral models** which are sufficient for the target analyses (DC accuracy, transient settling, power path). For detailed switching waveform analysis, use **PSpice for TI** (free) or **LTspice**.

## Summary

| Device | Official Model | Type | Ngspice Compat? | Working Model |
|--------|---------------|------|-----------------|---------------|
| TPS62142 | PSpice Transient (slvm442) | Switching | **No** (S-switch issue) | TPS62142_BEHAV (custom) |
| TLA2518 | TLA2528 TINA-TI (sbam431) | ADC AFE + mux | **No** (S-switch issue) | TLA2518_AFE (custom) |
| BQ24074 | None | — | — | BQ24074_VOUT (custom) |
| TPS22910 | None found | — | — | Ideal switch + Ron |
| TPD4E05U06 | IBIS only | IBIS | N/A | Diode clamp model |
| TPD1E10B06 | IBIS only (assumed) | IBIS | N/A | Diode clamp model |
| XL4067TS | None | — | — | XL4067TS_SINGLE (custom) |
| SC4823S6 | None | — | — | SC4823S6_SIMPLE (custom) |
| ESP32-C6 | None | — | — | GPIO as ideal + parasitics |
| WS2812B LED | None | — | — | Transmission line only |

## Detailed Assessment

### TPS62142 — TI PSpice Model (REFERENCE ONLY — NOT NGPTICE-COMPATIBLE)

- **File**: `models/ti/TPS62142_PSPICE_TRANS/TPS62142_TRANS.lib`
- **Type**: Full switching transistor-level transient model (~16KB)
- **Pins**: PVIN1, PVIN2, AVIN, EN, SS_TR, DEF, FSW, PGND2, PGND1, ETPAD, AGND, PG, FB, VOS, SW3, SW2, SW1
- **Ngspice status**: **Fails** — uses PSpice `S` switches referencing subcircuit models and PSpice `IF()` syntax not supported by ngspice 46.
- **To use**: Requires PSpice for TI (free, Windows/Linux) or LTspice with model adaptation.
- **Verdict**: Use custom `TPS62142_BEHAV` for ngspice. For detailed switching waveforms, use PSpice for TI.

### TLA2518 — TINA-TI Model via TLA2528 (REFERENCE ONLY — NOT NGPTICE-COMPATIBLE)

- **File**: `models/ti/TLA2528_TRANS.LIB`
- **Note**: TLA2518 (SPI) and TLA2528 (I2C) share the same analog core.
- **Ngspice status**: **Fails** — TINA-TI format uses internal S-switches and proprietary macro syntax.
- **Verdict**: Use custom `TLA2518_AFE` for ngspice. The custom model accurately captures the SAR ADC input sampling behavior (CSH=12pF, RIN=500Ω).

### BQ24074 — NO MODEL (KEEP CUSTOM, THOROUGHLY VERIFIED)

- **TI official website**: ❌ Only EVM board, Gerber files, NTC calculator — no PSpice/TINA-TI model
- **Sister parts (BQ24072/75/79)**: ❌ None have SPICE models
- **TI unencrypted model archive (slvm350-430)**: ❌ None contain BQ2407x models
- **GitHub**: ❌ No SPICE models found in any public repos (only hardware design files)
- **SnapEDA/UltraLibrarian**: ❌ Only CAD symbol/footprint, no SPICE
- **TI E2E forum**: ❌ No discussions about BQ24074 SPICE models
- **EVM design files (SLUC342)**: ❌ Gerber only, no simulation
- **PSpice for TI**: Unconfirmed — currently not installable in this environment; likely not included since TI doesn't publish it on web

**Verdict**: Keep custom `BQ24074_VOUT` behavioral model. 

**Why the custom model is adequate:**
The BQ24074 is a linear charger — its power path behavior is deterministic:
- VOUT = 4.4V (regulated) when VUSB > 4.35V (UVLO)
- VOUT = VBAT − ~50mV (pass-through) when VUSB absent
- This is a DC-level behavioral model, trivially captured with `u()` step-function logic
- For transient analysis, the dominant dynamics are external: output capacitance, load step, cable inductance — not the IC itself
- Our custom model captures all power-path corner cases needed for system-level simulation

**Alternative for detailed charging simulation:** If charge current profiling (CC/CV transitions, termination, NTC behavior) is needed, use **PSpice for TI** (free) which may have a model in its built-in library — but this level of detail is unnecessary for the KeysDock power architecture analysis.

### TPS22910 — NO MODEL FOUND (KEEP CUSTOM)

- Product page at ti.com/product/TPS22910 returned 404
- The TPS22910 is a simple load switch (P-channel FET + control logic)
- **Verdict**: Keep custom model. A load switch can be modeled as an ideal switch with Ron, which is trivial.

### TPD4E05U06 / TPD1E10B06 — IBIS ONLY (KEEP CUSTOM)

- TI provides IBIS model and S-parameter model
- No SPICE model available
- IBIS models describe I/O buffer behavior, not the ESD clamp characteristics needed for SPICE
- **Verdict**: Keep custom ESD diode clamp model. For ESD simulation, the clamp diode model (BV=6.5V, Cjo=0.5pF, Rs=0.8Ω) is adequate. Full IEC 61000-4-2 surge simulation requires specialized tools (not practical in SPICE).

### XL4067TS / SC4823S6 — NO MODELS (KEEP CUSTOM)

- XINLUDA and Semiment are Chinese manufacturers; they typically don't provide SPICE models
- **Verdict**: Keep custom behavioral models. These are accurate enough for signal chain analysis (Ron, C, leakage, bandwidth).

## Model Priority for Simulation Netlists

| Simulation | Primary Model | Status |
|-----------|--------------|--------|
| SP01 (VBAT ADC) | TLA2518_AIN7_BAT (custom) | Working |
| SP02 (Charger) | BQ24074_VOUT (custom) | Working |
| SP03 (Buck) | TPS62142_BEHAV (custom) | Working |
| SP04 (Signal chain) | SC4823S6 + XL4067TS + TLA2518_AFE (custom) | Working |
| SP05-08 | Custom models | Pending |

> Official TI models (TPS62142_TRANS, TLA2528_TRANS) are preserved in `models/ti/` for reference and possible future adaptation. For detailed switching/buck waveforms, use PSpice for TI with these models.

## BQ24074 Third-Party Model Search Log

| Source | Method | Result |
|--------|--------|--------|
| ti.com/product/BQ24074 | Web page scrape | No SPICE model section |
| ti.com/product/BQ24072/75/79 | Sister parts check | No SPICE models |
| ti.com/lit/zip/slvm350-430 | Unencrypted model archive | None are BQ2407x |
| api.github.com/search/code | "BQ24074 spice pspice subckt" | 0 results |
| api.github.com/search/repositories | BQ24074 repos | HW design only, no models |
| snapeda.com | Symbol/footprint DB | CAD only, no SPICE |
| ti.com/lit/zip/sluc342 | EVM Gerber archive | Gerber/PCB, no simulation |
| e2e.ti.com | Forum search | No BQ24074 SPICE threads |
| google.com | General search | No third-party models found |

## Files

```
models/
├── ti/
│   ├── TPS62142_PSPICE_TRANS/
│   │   └── TPS62142_TRANS.lib          # Official TI PSpice model
│   ├── TLA2528_TRANS.LIB                # Official TI TINA-TI model
│   ├── TLA2528_TRANS.TSM                # TINA schematic macro
│   └── TLA2528_TRANS.TLD                # TINA library descriptor
├── custom/
│   ├── xl4067ts.lib                     # Custom mux behavioral model
│   ├── sc4823s6.lib                     # Custom hall sensor model
│   └── tla2518_afe.lib                  # Custom ADC AFE (fallback)
└── passive/
    └── passive.lib                      # RLC, trace, battery models
```
