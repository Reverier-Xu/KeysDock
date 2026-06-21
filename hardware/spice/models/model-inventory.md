# SPICE Model Inventory

## First-party manufacturer models (reference)

| Part | Literature | Download URL | File location | Compatibility |
|------|------------|--------------|---------------|---------------|
| TPS22910AYZVR | SLVMA45A | https://www.ti.com/lit/zip/SLVMA45A | `models/vendor/ti/SLVMA45A/` | PSpice; uses digital primitives that fail in ngspice 46 |
| TPS62142RGTR | SLVM442B | https://www.ti.com/lit/zip/SLVM442B | `models/vendor/ti/SLVM442B/` | PSpice unencrypted; uses constructs incompatible with ngspice 46 |
| TLA2528 (TLA2518 family) | SBAM431 | https://www.ti.com/lit/zip/SBAM431 | `models/vendor/ti/SBAM431/` | TINA format; not ngspice compatible |

## Third-party / open-source searches

- KiCad Spice Library (GitHub): no matches for XL4067TS, SC4823S6, BQ24074, TLA2518.
- LTwiki / ngspice examples: no specific models for these parts.
- Diodes Inc / ON Semi / Infineon libraries: not applicable to these TI/XINLUDA/Semiment parts.

## Custom behavioral models (used in simulations)

| Part | File | Basis |
|------|------|-------|
| BQ24074RGTR | `models/custom/bq24074.lib` | Datasheet equations for charge current, input current limit, power-path, TS window |
| TPS62142RGTR | `models/custom/tps62142.lib` | Datasheet: fixed 3.3V, 2A current limit, soft-start, PG |
| TLA2518 AFE | `models/custom/tla2518_afe.lib` | Datasheet: 500Ω input switch, 12pF sample cap, 12-bit quantizer |
| TPS22910AYZVR | `models/custom/tps22910a.lib` | Datasheet: 60mΩ Ron, active-low, slew-limited turn-on, reverse-current protection |
| XL4067TS | `models/custom/xl4067ts.lib` | Datasheet: 200Ω Ron, 5pF channel cap, 20pF output cap |
| SC4823S6-TR | `models/custom/sc4823s6.lib` | Datasheet: 1.65V quiescent, 3.3mV/Gs, sleep/wake |
| WS2812B LED | `models/custom/ws2812b.lib` | Datasheet: 18-60mA per LED, 100nF decoupling |
| TVS diodes | `models/custom/diode.lib` | Datasheet clamp levels for TPD4E05U06, TPD1E10B06, TS24CA |
| Passives / traces | `models/custom/passive.lib` | Vendor typical ESL/ESR values for 0402/1206 caps and 2.2µH inductor |
