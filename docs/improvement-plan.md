# KeysDock Hardware Improvement Plan

## Scope and Review Basis

This review covers the current `hardware/` design only. It is based on the current KiCad schematics/PCBs and the local datasheets for:

- `ESP32-C6-WROOM-1`
- `BQ24074` / `BQ2407x`
- `TPS62142` / `TPS6214x`
- `TLA2518`
- `XL4067TS`
- `SC4823S6-TR`
- `WS2812`-compatible RGB LEDs

The goal is not to redesign the product from scratch. The goal is to identify which parts of the present architecture are already viable, which parts are likely to block a stable next revision, and what firmware behavior is realistically enabled or constrained by the hardware.

## Overall Assessment

The system architecture is fundamentally workable. The distributed hall front end is coherent, the controller partition is sensible, the USB-C sink network is closer to production practice than a first skim suggests, and the main board already exposes meaningful low-power hooks. The highest-risk items are not the hall scanning concept itself; they are charge-path configuration, voltage-domain mistakes on charger status lines, ground-return partitioning, and LED power distribution.

The current revision already includes several things that are worth preserving: correct 5.1k USB-C CC pull-downs, USB ESD parts on CC and D lines, a safe 100k/100k battery divider into `TLA2518 AIN7`, explicit 3.3V decoupling on the typeboard and external dock, and controller-side bias networks on `EN`, `GPIO8`, `GPIO9`, `SAKI_MOVE`, and `RANA`.

## What Is Already Sound

### Hall scan chain

- `SC4823S6-TR` supports `2.5V` to `5.5V`, low active current, and fast sleep recovery.
- `XL4067TS` is valid on a `3.3V` analog domain.
- `TLA2518` uses `AVDD` as its reference and accepts `0..AVDD` single-ended inputs.
- The architecture is ratiometric: the hall sensors and ADC both live on the same `P,+3.3` domain.
- The 64-key main board plus 14-key dock occupy 78 active sensor channels inside 80 scan slots.

This means the core keyboard sensing concept is not the main risk in the present hardware.

### USB front end

- The controller is a proper USB-C sink with `5.1k` resistors on both CC pins.
- `TPD4E05U06` protects `CC1`, `CC2`, `USB_D+`, and `USB_D-`.
- `TPD1E10B06` protects the post-connector power rail.

This is already much closer to production-ready USB front-end practice than a minimal prototype.

### Battery telemetry path

- `VBAT` is not tied directly into the ADC.
- The present `R20 = 100k`, `R21 = 100k`, `C13 = 100nF` network scales the battery into a safe range for `AIN7`.

### Main-board low-power hooks

- `RANA` and `SAKI_MOVE` are real shared hall sleep/wake nets, not placeholders.
- `SAKI_MOVE` lands on `ESP32-C6 GPIO3`, which is in the LP domain and can be used as a deep-sleep wake source.
- `RANA` is explicitly biased and can be driven with GPIO hold across deep sleep.

## Critical Corrections for the Next Board Spin

### 1. Decide whether fixed `TS` bias is enough

The current `BQ24074 TS` wiring is not the fault case that an earlier draft suspected. The present board uses `R1 = 10k` from `TS` to ground, which is the standard fixed-resistor approach when no battery-pack NTC is routed. So the current `TS` network is electrically plausible if the product intentionally omits pack temperature-qualified charging.

The real limitation is functional rather than electrical: the charger has no knowledge of the battery temperature. If this product is expected to meet pack-vendor temperature charging limits in hardware, the current fixed `10k` strap is not enough.

Recommended change:

- If this revision intentionally has no pack NTC, keep `R1 = 10k` and document that decision explicitly in the schematic and hardware notes.
- If pack temperature matters, route a real battery-pack NTC into `TS` and replace the fixed strap with the datasheet-compliant network.
- Validate hot/cold behavior on bench after the final battery sensing choice is made.

### 2. Move `BAT_PGOOD` and `BAT_CHG` pull-ups to the 3.3V domain

`BAT_PGOOD` and `BAT_CHG` are correctly routed into the MCU, but both open-drain outputs are pulled up to `P,+5` through `R25 = 1.5k` and `R17 = 1.5k`. On this board, `P,+5` is the charger `OUT` rail, not a 3.3V logic rail. It can sit around `4.4V` with input present and near battery voltage otherwise. Those nets land directly on `ESP32-C6 GPIO4` and `GPIO5`, which are 3.3V-domain pins. This is a real voltage-domain mistake, and both pins are also early-boot `MTMS` / `MTDI` pins.

Recommended change:

- Pull `BAT_PGOOD` and `BAT_CHG` up to `P,+3.3`, not `P,+5`.
- If a higher-voltage pull-up is required for some other reason, add proper level translation or a divider.
- Keep the status telemetry to firmware, because the signals are useful once they are electrically safe.

### 3. Re-program the charger for the intended battery, not for a placeholder

The as-built charge-path setpoints are workable, but they do not match the battery now selected for the project:

- `R7 = 1.78k` on `ISET` gives about `500mA` fast-charge current.
- `R8 = 1.54k` on `ILIM`, with `EN2 = High` and `EN1 = Low`, gives about `1.0A` resistor-programmed input limit.
- `R11 = 3k` on `ITERM` gives about `50mA` termination current.
- `R1 = 10k` on `TS` is a fixed no-NTC bias.
- `TMR` is floating, so the charger uses its default timers.

None of those values are electrically invalid by themselves, but they are now conservative relative to a `2450mAh` cell with a `0.5C` target. The present `500mA` charge current is only about `0.2C`.

Recommended change:

- Re-derive `ISET` and `ITERM` from the actual pack capacity, allowed charge rate, thermals, and recharge-time target.
- Document the battery assumption in the schematic notes so the intent survives later board spins.
- Keep `ILIM` aligned to the real USB/input-source budget after LED current policy is decided.

Selected path for the current battery and charger choice:

- Keep `BQ24074` for now and accept that the present `4.35V` cell will be intentionally undercharged to the charger's fixed `4.2V` regulation target.
- The battery vendor's `2450mAh` pack and `0.5C` charge-rate target imply `1.225A` fast-charge current.
- Use the following resistor replacements for the next hardware spin:

| Function | Refdes | Old value | New value | Expected result |
| --- | --- | --- | --- | --- |
| `ISET` | `R7` | `1.78k` | `732 ohm`, `1%` | `ICHG_typ ~= 890 / 732 ~= 1.216A` |
| `ITERM` | `R11` | `3k` | keep `3k`, `1%` | `ITERM_typ ~= 0.03 x 3000 / 732 ~= 123mA` |
| `ILIM` | `R8` | `1.54k` | `1.10k`, `1%` | `IINMAX_typ ~= 1610 / 1100 ~= 1.46A`, effectively top-of-range programming |
| `TS` | `R1` | `10k` | keep `10k` if no real pack NTC is routed | valid fixed-TS bias for no-NTC operation |

- `123mA` termination current is close to `0.05C` for the chosen pack and is a reasonable taper-end threshold.
- Even with these values, the charger will still reduce charge current under DPPM or thermal regulation whenever the system load rises.

### 4. Simplify the ground strategy around the ADC and sub-boards

The present `P,E` versus `P,GND` split is the weakest architectural choice in the mixed-signal path.

Confirmed facts:

- Controller `U3` splits its ground pins: signal ground pins go to `P,GND`, while the exposed pad goes to `P,E`.
- Controller bridges `P,GND` to `P,E` with `R10`.
- Typeboard bridges `P,GND` to `P,E` with `R1`.
- External bridges `P,GND` to `P,E` with `R4`.
- On the typeboard, key-group local decouplers return to `P,E`, while top-level bulk caps return to `P,GND`.
- On the external board, active circuitry uses `P,E`, while explicit decouplers return to `P,GND`.

This means essential local decoupling is not always returned to the same copper domain as the circuitry it is meant to stabilize, and the ADC itself is referenced across the split.

Recommended change:

- For the next spin, default to one continuous ground plane unless there is measured evidence that the split helps.
- If a split must remain, keep the ADC, its decoupling, the hall returns, and the local sub-board decouplers on the same analog-return domain.
- If LED current needs special handling, separate only the high-current LED return path and join it at one clearly controlled star point on the controller side.

### 5. Treat the LED rail as a power-distribution problem, not as a naming problem

The RGB rail is still the charger `OUT` rail, so it is not a true fixed 5V bus. That matters because the system contains 66 WS2812-compatible devices total, and the LED datasheet uses a nominal `12mA` per color channel constant-current setting. A simple worst-case estimate is:

`66 LEDs x 3 channels x 12mA = 2.376A`

That is far above the hall front-end current, far above the present `500mA` charge current, and comfortably above what should be assumed safe without checking connector losses, copper heating, and battery current policy.

The current PCB facts make this more important:

- the typeboard has no capacitor footprint on `P,+5`,
- the connector/interposer routes `P,+5` segments at `0.3mm`,
- the typeboard is where 65 of the 66 LEDs live,
- `P,+5` itself can collapse with input-source changes or battery voltage.

Recommended change:

- Add explicit `P,+5` bulk capacitance at the typeboard entry and near the first LED segment.
- Consider larger-package MLCCs or polymer bulk for the LED rail, not only high-value `0402` parts.
- Re-evaluate the controller-to-typeboard power path and connector temperature rise against the real lighting policy.
- If a later product revision truly needs bright RGB, consider a dedicated LED rail strategy instead of reusing the charger system rail.

Selected lighting policy for the current design:

- Keep the current shared `P,+5` LED rail architecture, but hard-cap user-visible LED brightness to `20%` in firmware.
- The user interface should not expose any path above this `20%` ceiling.
- With `66` WS2812-compatible LEDs and a nominal `36mA` full-white current per LED, the average worst-case LED current at the firmware ceiling is approximately:

`66 x 36mA x 0.20 ~= 475mA`

- This brightness cap materially improves the feasibility of keeping the existing `BQ24074` power-path approach, but it does not remove the need for LED-rail bulk capacitance and connector current review.

Potential hard LED power gating on a future controller spin:

- `GPIO8` can be reused as a regular GPIO after reset because ESP32-C6 strapping pins are latched during reset and then released for normal IO use.
- However, `GPIO8` should not drive a high-side PMOS gate on `P,+5` directly. The PMOS gate must be pulled up to the LED rail for the OFF state, and that rail can sit near `4.4V`, which is above the ESP32-C6 GPIO supply range.
- Keep the existing `R15 = 10k` pull-up on `GPIO8/BOOT_1`, because the current hardware has no separate manual override on `GPIO8`, and the existing `GPIO9` boot button assumes `GPIO8` remains high for manual download entry.
- The preferred implementation is an active-low high-side load switch or an equivalent level-shifted PMOS driver, where:
  - `GPIO8` is configured after boot as open-drain,
  - `GPIO8 = low` enables LED power,
  - `GPIO8 = high-Z` disables LED power,
  - the external pull-up keeps the switch disabled during reset and keeps the strapping default intact.
- If a dedicated load switch is chosen, prefer a device that tolerates at least the full `P,+5` rail, has low `RON`, and provides at least `1.5A` class current capability so the design has margin over the `~475mA` average LED ceiling and the LED-rail inrush event.

### 6. Review effective capacitance, not only nominal capacitance

The design already includes more decoupling than an earlier rough reading suggested, but many `10uF` and `22uF` parts are implemented as `0402` footprints. For both the controller power stages and the sub-boards, DC-bias derating can make the effective capacitance much smaller than the printed value. That is especially relevant for:

- `TPS62142` loop stability and transient response,
- `BQ24074` input/output bypassing,
- the typeboard's `22uF` top-level `P,+3.3` caps,
- any future attempt to stabilize the LED rail only with MLCCs.

Recommended change:

- Check the real part curves in the capacitor datasheet at the actual DC bias.
- Up-size the most critical bulk capacitors where effective capacitance matters.
- Do not assume a nominal `22uF 0402` behaves like a true 22uF bulk capacitor in-circuit.

### 7. Add an explicit bias to `GPIO15/KEYS_CH_C` if boot robustness matters

The controller already biases `EN`, `GPIO8`, `GPIO9`, `SAKI_MOVE`, and `RANA`. `GPIO15` is the exception. On ESP32-C6, `GPIO15` participates in early-boot JTAG source selection and does not have an internal pull resistor. In this design it is reused as `KEYS_CH_C`, so its initial state depends on the external mux-address network across the interconnect.

Recommended change:

- Add a weak explicit bias on `GPIO15/KEYS_CH_C` that matches the intended boot behavior.
- If current hardware boots reliably enough, this can be a lower-priority cleanup rather than a blocker.

### 8. Keep the battery ADC channel out of the fast scan loop

The `VBAT` divider into `AIN7` is electrically safe, but its source impedance is relatively high: `100k || 100k = 50k` Thevenin. The TLA2518 can absolutely read that channel, but it should not be treated like the fast hall channels that benefit from short acquisition times. The hall scan path is low-impedance and mux-driven; the battery divider is slow and quasi-static.

Recommended change:

- Sample `AIN7` as a slow housekeeping channel in firmware, not inside the highest-rate key scan sequence.
- If a future revision needs faster battery telemetry on the ADC, lower the divider resistance or buffer the node.

## Board-by-board Revision Guidance

### Controller board

Highest-priority controller changes are:

- decide whether the fixed `TS` strap is sufficient or whether a real pack NTC is required,
- move `BAT_PGOOD` / `BAT_CHG` pull-ups to `P,+3.3`,
- re-size `ISET` / `ITERM` and `ILIM` for the current `2450mAh` pack,
- review effective buck and charger capacitance under DC bias,
- optionally add a defined `GPIO15` bias.

Lower-priority controller changes are:

- clean up the ADC-ground split,
- decide whether `U6 PG` should be consumed by firmware or left unused,
- keep `VBAT` sensing on `AIN7`, but treat it as a slow channel.

### Typeboard

Highest-priority typeboard changes are:

- add explicit `P,+5` bulk capacitance near the 20-pin input and first LED section,
- review whether the LED return and hall/analog return should really share the current `P,E` structure,
- re-check whether the `P,GND`-returned bulk caps are helping the actual analog load or only helping after the `R1` bridge.

### External dock

The external dock is electrically simple and mostly sound for active-mode scanning. The major question is not correctness; it is product intent.

- If always-on dock behavior is acceptable, keep the current `HE_SLEEP` low strap and simple analog-return model.
- If low-power dock parity is desired in a later revision, the dock needs its own sleep control and a wake-status return path back to the controller.

### Connector board

The interposer is logically simple, but it should be treated as part of the LED power path.

- Preserve its passive-only nature.
- Re-check `P,+5` copper width, copper fill, and thermal rise for the real lighting policy, not only for the logic/sensor load.

## Firmware-feasibility Implications Caused by the Hardware

### Hall scanning is fully feasible

The present hardware is enough for a production-grade hall scan engine. A practical firmware strategy is to:

- drive `KEYS_CH_A..D` and `KEYS_CH_CE` from the MCU,
- step through 16 mux addresses,
- read `AIN2..AIN6` at each address,
- keep `AIN7` out of the high-rate loop,
- use TLA2518 oversampling only where noise reduction is worth the bandwidth cost.

Because the hardware exposes 5 analog returns in parallel, full-board scan rates comfortably above normal keyboard requirements are realistic. Even with filtering and debounce, the scan chain is not the limiting factor in this design.

### Main-board sleep and wake are feasible, but policy matters

The main 64-key board already has the right hardware hooks for meaningful low-power behavior.

- `RANA` can put the hall sensors to sleep.
- `SAKI_MOVE` can wake the MCU through LP-domain `GPIO3`.
- The hall sensor wake function itself is not instantaneous; in sleep mode the sensor wakes itself on an internal detection interval of about `12.5ms`.

That means deep sleep wake is feasible, but the user-visible wake latency is set more by the hall sensors than by the ESP32.

Because `RANA` is on `GPIO21`, not an LP GPIO, deep-sleep behavior should assume:

- firmware sets `RANA` before sleep,
- firmware enables GPIO hold,
- default hardware fallback after reset is active scanning because `R19` pulls `RANA` low.

### External-dock low power is intentionally asymmetric

The external dock is not a peer in the low-power scheme.

- `HE_SLEEP` is forced low,
- `HE_AWAKE` is local only,
- no wake/status line returns to the controller.

So firmware can absolutely scan the dock during normal operation, but it cannot depend on dock activity as a symmetric deep-sleep wake source without hardware changes.

### Battery and source telemetry are useful after the status-line level fix

Once `BAT_PGOOD` and `BAT_CHG` are made 3.3V-safe, the current controller board already exposes the right signals for:

- USB-present versus battery-only state handling,
- charging-active state reporting,
- battery-voltage sampling on `AIN7`.

That is enough hardware for source-aware lighting policy, charge-state UI, battery logging, and sleep policy.

### RGB current limiting is mandatory, not optional

The hardware does not provide a true dedicated LED rail, so firmware has to act as the first line of power management.

- Limit global brightness and full-white duty cycle.
- Use source-aware brightness policies.
- Dim aggressively or disable RGB in low-battery operation.
- Expect LED behavior to vary with source state because `P,+5` is the charger/system rail, not a fixed 5V supply.

## Suggested Validation After the Next Hardware Spin

The next revision should be closed with measurements, not only with schematic review.

- charger `TS` hot/cold behavior or fixed-TS compliance, and actual charge current,
- MCU pin voltage on `BAT_PGOOD` and `BAT_CHG`,
- `P,+5` voltage drop from controller to typeboard under realistic RGB load,
- LED rail transient behavior with added bulk caps,
- key-noise floor with and without the ground-split simplification,
- wake latency of `RANA` / `SAKI_MOVE`,
- battery ADC accuracy and settle time on `AIN7`.
