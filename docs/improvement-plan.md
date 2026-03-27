# KeysDock Hardware Improvement Plan

## Scope

This plan tracks only the remaining hardware work after the current schematic / PCB / datasheet review.

The following topics are intentionally removed from the plan:

- `BQ24074 TS` routing. The current `TS -> 10k -> GND` implementation is accepted for the no-NTC product version.
- LED `P,+5` naming and wide-voltage LED compatibility. The open issue is current distribution and rail integrity, not the net name itself.
- The `ATL3237115` pack being charged to `4.2 V`. The battery vendor explicitly accepts `4.2 V` charging for longer cycle life, so the current `BQ24074` charge-voltage choice is treated as intentional.

## Priority Summary

- `P0`: make USB-C input behavior safe and predictable when plugged into a computer host
- `P1`: add LED-rail energy storage and validate the LED current budget against battery and interconnect limits
- `P1`: simplify the ground / return architecture around the ADC, buck, and sub-boards
- `P2`: clean up boot-related pin biasing and reset determinism
- `P2`: review effective capacitance and critical capacitor footprints
- `P3`: decide whether the external dock should remain always-on or gain low-power parity with the main board

## P0 - USB Host Compatibility

### Problem

The present controller board behaves like an adapter-oriented sink.

- `CC1` and `CC2` only provide the required `5.1k` sink pull-downs.
- There is no CC voltage sensing, no BC1.2 source classification, and no USB PD negotiation.
- `BQ24074` is not left in `USB100` or `USB500` mode. It is hard-configured into resistor-programmed `ILIM` mode.
- With `R8 = 1.10k`, the charger input-current limit is about `1.46 A typ`, while `R7 = 750 ohm` requests about `1.19 A` fast-charge current.

For a battery-powered keyboard that may plug directly into a laptop or desktop USB port, this is the highest remaining design risk.

### Required Changes

1. Adopt a consumer-keyboard-style host-safe default policy.
   - Do not let the charger boot into the present `~1.46 A` resistor-programmed mode.
   - Make ordinary PC connection work by limiting default charge current rather than assuming source detection.
2. Preferred low-complexity implementation for the next spin:
   - Strap `BQ24074` to `USB500` mode in hardware.
   - Set `EN2 = Low` permanently.
   - Set `EN1 = High` whenever `USB_PWR_SUPP` is present.
   - Keep `ILIM` populated if desired, but treat it as future-only unless a stronger source path is later added.
3. Add charger enable control, but keep the rest simple.
   - Disconnect `~CE` from ground.
   - Add a weak pull-up on `~CE` so charging is disabled during attach and early boot.
   - Drive `~CE` from a spare MCU GPIO, preferably `ESP32-C6 GPIO22`.
   - Firmware should only enable charging after the wired link is established and the board has applied its host-power policy.
4. Use firmware, not extra analog hardware, for the first level of load management.
   - On VBUS attach: force wired mode, disable RF, reduce RGB to a host-safe ceiling, keep charging disabled.
   - After USB configuration: enable charging in `USB500` mode.
   - Under high LED load or low bus margin: dim RGB first, then reduce or pause charging.
5. Optional advanced path, only if higher USB-C charge performance is still needed later:
   - Add `CC1` / `CC2` sensing or a dedicated USB-C / PD controller.
   - Only then allow switching into resistor-programmed `ILIM` mode for `1.5 A` / `3 A` Type-C sources.
6. Re-tune the battery-charge target to fit host-powered use if `USB500` mode becomes the default operating assumption.
   - Accept that charging from a PC host will be slower than the pack's nominal `0.5C` target.
   - Reserve the present `~1.19 A` target for future adapter- or source-detected modes, if those modes are implemented.

### Exit Criteria

- Stable USB enumeration and no brownout / reset loops when connected to a PC host.
- Verified behavior for:
  - empty battery,
  - half-charged battery,
  - full battery,
  - charging active,
  - representative RGB load.
- Verified startup policy:
  - before firmware takes control: charging disabled and RGB limited;
  - after generic host configuration: charging allowed in `USB500` mode;
  - if an advanced future source-detect path is added: stronger sources may unlock resistor-programmed `ILIM` mode.

## P1 - LED Rail Energy Storage and Current Budget

### Problem

The current LED architecture is still power-integrity limited.

- The typeboard carries 65 LEDs, but it does not currently show explicit `P,+` bulk capacitance near the board entry.
- The clear top-level bulk capacitors on the typeboard (`C13`, `C14`) are on `P,+3.3`, not on the LED rail.
- The portable version now assumes the `ATL3237115` pack, whose vendor-reported maximum discharge current is `2 A`.
- The controller-to-typeboard mezzanine is part of the LED current path.
- The Panasonic P5KF family used on the 20-pin mezzanine is rated for `0.5 A` per pin contact, with `10 A` total across contacts.

This does not make the LED rail unusable, but it means the final current budget must be validated rather than assumed.

### Required Changes

1. Add explicit `P,+` bulk capacitance on the typeboard.
   - Place one bulk capacitor close to the 20-pin entry.
   - Place another close to the first LED segment.
   - Use realistic bulk parts, not only high-value `0402` MLCCs.
2. Review the LED rail copper and via count on the typeboard.
3. Re-check current sharing through the two `P,+` contacts and the available return contacts on the mezzanine.
4. Define a validated firmware brightness ceiling.
   - This ceiling must respect both the battery `2 A` discharge limit and the connector current path.

### Exit Criteria

- Measured `P,+` droop at the controller and at the typeboard under LED load steps.
- Measured connector temperature rise under the chosen brightness ceiling.
- Measured inrush and transient behavior with the added bulk capacitors.
- Confirmed battery-only LED behavior stays below the pack discharge limit with margin.

## P1 - Ground and Return Architecture

### Problem

`P,E` and `P,GND` remain split across all active boards, but they are not used consistently.

- `TLA2518` uses `P,GND` on its signal ground pin and `P,E` on its exposed pad.
- `TPS62142` uses `P,GND` for `AGND` and `P,E` for `PGND` and the exposed pad.
- The typeboard key groups return through `P,E`, while the board-level `3.3 V` bulk caps return through `P,GND`.
- The external dock uses `P,GND` for local hall / decoupling return, but the pogo return pin is `P,E`.

This makes the split ground strategy the main mixed-signal integrity risk that still remains in the design.

### Required Changes

1. Preferred direction: merge to one continuous ground plane across the active boards.
2. If the split is intentionally retained:
   - keep the ADC, hall returns, and local analog decoupling on one return domain,
   - isolate only intentionally high-current LED return current,
   - make the dock return mapping consistent with its local circuitry.
3. Revisit the buck and ADC placement / return stitching so the exposed pads and local decouplers reference the same effective ground region.

### Exit Criteria

- Lower or unchanged hall-noise floor after the ground change.
- No regression in wake behavior.
- No new buck instability or layout-induced switching noise.

## P2 - Boot Determinism and Bias Cleanup

### Problem

Two reset-time details still need cleanup.

- `GPIO15 / KEYS_CH_C` has no dedicated external bias, even though `GPIO15` participates in early boot selection.
- `BAT_PGOOD` and `BAT_CHG` are now voltage-safe, but they still land on `MTMS / GPIO4` and `MTDI / GPIO5`, so their low / high reset state still depends on charger status.

### Required Changes

1. Add a weak external bias on `GPIO15 / KEYS_CH_C` that matches the intended boot state.
2. Bench-validate reset behavior of `GPIO4 / GPIO5` for these conditions:
   - USB present,
   - USB absent,
   - battery absent,
   - charging active,
   - charge complete.
3. Keep the existing `GPIO8` / `GPIO9` boot strategy unchanged unless a proper LED power-gating driver is added later.

### Exit Criteria

- Repeatable boot across all power-source and charger-state combinations.
- No dependence on floating or mux-defined startup state for `GPIO15`.

## P2 - Effective Capacitance and Critical Footprints

### Problem

Several of the most important capacitors still use `0402` footprints even at `10 uF` and `22 uF` values.

That is acceptable only if the effective capacitance under DC bias is still sufficient for the real circuit.

### Required Changes

1. Recalculate effective capacitance for the most critical nodes:
   - `BQ24074` input and output bypassing,
   - `TPS62142` input and output network,
   - typeboard `C13` / `C14`,
   - external-board `C2` / `C3`.
2. Up-size the footprints or reduce dependence on nominal values where the effective capacitance is too low.
3. Document the chosen capacitor series and DC-bias assumption in the schematic notes.

### Exit Criteria

- Effective capacitance numbers are documented.
- Critical power-stage and board-entry capacitors are sized from real bias conditions, not only the printed value.

## P3 - External Dock Low-Power Parity

### Problem

The external dock is still an active-mode-only expansion from a system power perspective.

- `HE_SLEEP` is hard-strapped locally.
- `HE_AWAKE` does not return to the controller.
- The pogo link carries no dock wake / sleep sideband.

### Required Changes

1. Decide whether this asymmetry is intentional for the product.
2. If the dock should participate in deep sleep / wake:
   - add a controllable sleep input,
   - add a wake / status return path,
   - update the pogo pin budget accordingly.
3. If the dock remains always-on, document that choice explicitly.

### Exit Criteria

- Dock power behavior is a deliberate documented product decision, not an accidental by-product of the current schematic.

## Validation Matrix for the Next Spin

The next hardware revision should be closed with measurements, not only schematic review.

- USB host current draw and enumeration stability
- charger thermals at the chosen battery-charge target
- `P,+` droop and connector heating under validated RGB limits
- hall-noise floor before and after the ground-return cleanup
- boot-state robustness of `GPIO4`, `GPIO5`, and `GPIO15`
- battery telemetry accuracy and settle time on `AIN7`

## Expected Outcome

If the items above are completed, the next revision should have:

- a host-compatible USB-C charging strategy,
- a validated lighting budget that respects both the battery and interconnect limits,
- a cleaner mixed-signal return path,
- more deterministic boot behavior,
- and more trustworthy power-stage capacitance margins.
