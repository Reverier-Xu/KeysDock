# KeysDock Improvement Plan

## Scope

This document is a hardware-only correction plan for the current KeysDock design.

- It is based on the KiCad schematics and PCB files under `hardware/`.
- It uses the local component documentation under `hardware/docs/` as the electrical reference.
- Firmware and software in this repository are still demo-stage and are treated only as temporary mitigation paths, not as the primary fix.

## Priority Model

- `P0 - Must fix`: correct in the next board revision before reliable shared bring-up, battery testing, or serious firmware work.
- `P1 - Strongly recommended`: not always an immediate bring-up blocker, but should be corrected before productization or extended validation.
- `P2 - Next revision improvements`: useful architectural cleanup or feature-complete improvements after the main electrical risks are removed.

## P0 - Must Fix

### 1. Add a proper ESP32-C6 `CHIP_PU` / `EN` reset network

Problem:

- In `hardware/controller.kicad_sch`, `EN` is only tied to the reset button path and does not show the normal external pull-up and RC delay network recommended by Espressif.
- Espressif explicitly states that `CHIP_PU` / `EN` must not be left floating.

Recommended correction:

- Add `10k` from `EN` to `P,+3.3` close to the module.
- Add `1uF` from `EN` to ground close to the module.
- Keep the reset switch as a pull-down to ground; the existing small series resistor may stay if desired.
- Keep the `EN` trace short and quiet.
- If the next revision expects slow supply ramps or aggressive brownout conditions, consider a dedicated reset supervisor in addition to the RC network.

Analysis and reason:

- The ESP32-C6 samples strapping pins at reset release, so reset integrity and strap integrity are coupled.
- Without a proper `EN` network, the chip can start before the 3.3 V rail and external logic have settled.
- This board is especially exposed to slow-ramp conditions because it includes a battery, charger power path, and USB source switching.
- Even if the rest of the pinout is acceptable, an undefined or noisy `EN` node can still cause intermittent boot failures, random recovery-mode entry, or inconsistent behavior between USB-only and battery-powered starts.

Validation:

- Verify cold boot, warm reset, and brownout recovery on USB-only, battery-only, and charge-plus-load conditions.
- Verify repeatable reset timing on at least 100 consecutive reset cycles.
- Scope `P,+3.3` and `EN` together during power-up and reset.

### 2. Complete the ESP32-C6 boot strapping network and make the boot mode deterministic

Problem:

- `GPIO8` and `GPIO9` are the boot-mode strapping pins on ESP32-C6.
- The current design places a button on `GPIO9` (`BOOT_0`), but `GPIO8` (`BOOT_1`) is left floating.
- `GPIO9` does have an internal weak pull-up by default, but `GPIO8` does not.
- The current hardware may still default into normal SPI boot, but manual entry into Joint Download Boot is not deterministic.

Recommended correction:

- Add `10k` pull-up from `GPIO8` to `P,+3.3`.
- Add `10k` pull-up from `GPIO9` to `P,+3.3`.
- Keep the existing `GPIO9` boot button that pulls the line low through the current small series resistor.
- Do not add a large capacitor on `GPIO9`; Espressif explicitly warns against this.
- If board area allows, expose `EN`, `GPIO8`, `GPIO9`, `U0TX`, and `U0RX` on a test or recovery header.

Analysis and reason:

- The ESP32-C6 internal pulls are weak, on the order of tens of kilo-ohms, and are only intended as defaults, not as a substitute for board-level biasing.
- In the current design, `GPIO9` being weakly high is probably why normal boot can still work on many power cycles.
- `GPIO8` floating is the more serious gap because it leaves the download-mode path underdefined.
- This becomes a real risk once firmware starts using USB normally, because Espressif notes that USB auto-download is not guaranteed to remain available after application firmware repurposes the USB block or USB IOs.
- The controller currently uses `GPIO15` and `GPIO5` on strap-sensitive pins as well. Those uses are acceptable only because the attached external loads are currently light or high-impedance. They should stay that way.

Validation:

- Verify that default power-up always enters SPI boot.
- Verify that holding the boot button while resetting always enters Joint Download Boot.
- Verify the same behavior on USB-only and battery-only starts.
- Verify recovery from intentionally broken firmware without relying on USB auto-download.

### 3. Add a real pull-up to `BAT_CHG` and stop leaving `GPIO5/MTDI` undefined at reset

Problem:

- `BAT_CHG` connects ESP32-C6 `GPIO5/MTDI` to the `BQ24074` `CHG` status output.
- The charger datasheet defines `CHG` as an open-drain output.
- The current controller schematic does not show a pull-up on this net.

Recommended correction:

- Add a pull-up from `BAT_CHG` to `P,+3.3`; `47k` is a good starting value, while `10k` to `100k` is acceptable depending on desired edge stiffness and leakage budget.
- Keep the net dedicated to charger status sensing.
- In the same revision, strongly consider routing `PGOOD` to the MCU as a separate source-present signal.

Analysis and reason:

- Without a pull-up, `BAT_CHG` is not a valid logic signal when the charger output is released.
- Because the net lands on `GPIO5/MTDI`, which is also a strapping pin, the undefined high-impedance state can leak into early reset behavior.
- That means the boot result can become dependent on charging state, source condition, and reset timing instead of just the intended strap network.
- A pull-up fixes two problems at once: it makes charger telemetry valid and it removes one more undefined early-boot condition.

Validation:

- Verify logic level on `BAT_CHG` when charging, when charge is complete, and when no external source is present.
- Verify repeated reset behavior in all of those source states.
- Confirm that the MCU can distinguish low versus released states without false toggling.

### 4. Add defined bias and documented default polarity for `RANA` and `SAKI_MOVE`

Problem:

- `RANA` is the shared main-board hall sleep-control net.
- `SAKI_MOVE` is the shared main-board hall activity or wake net.
- On the typeboard, 64 hall sensors share both nets.
- The current controller-side implementation does not show a visible pull-up on `SAKI_MOVE` and does not show a default bias on `RANA`.

Recommended correction:

- Add about `10k` pull-up from `SAKI_MOVE` to `P,+3.3`.
- Add a weak default resistor on `RANA` so the hall array powers up in a known state.
- Recommended default: weak pull-down on `RANA`, so the main hall array comes up active by default, matching the external board's existing `HE_SLEEP` low implementation.
- Keep `RANA` under MCU control for intentional sleep entry.
- If the controller pinout is being reconsidered more broadly, consider moving `RANA` from `GPIO21` to an LP-domain GPIO in a future revision.

Analysis and reason:

- The main board ties many `HE_AWAKE` outputs together into one shared line, which strongly implies a wire-OR style signal that needs passive biasing.
- The external dock already uses a `10k` pull-up on its equivalent awake bus, which reinforces that interpretation.
- A floating `SAKI_MOVE` line can create false wake events, missed wake events, or unstable idle current behavior.
- `RANA` is currently on `GPIO21`, which is not in the ESP32-C6 LP GPIO domain. That means deep-sleep behavior depends on firmware setting the final level before sleep and then enabling GPIO hold.
- A default hardware bias is still needed so the board has a safe and predictable state during first power-up, reset, and firmware crashes.

Validation:

- Verify the idle level and active polarity of `SAKI_MOVE` on real hardware.
- Verify that `SAKI_MOVE` can wake the MCU from deep-sleep on the main board.
- Verify that `RANA` defaults to the intended active state before firmware initialization.
- Verify current draw and wake reliability with the board idle for long periods.

### 5. Protect the ADC battery measurement input

Problem:

- `VBAT` is connected directly to `TLA2518` `AIN7`.
- `TLA2518` analog inputs must stay within `0 .. AVDD`, and `AVDD` is `3.3 V` in this design.
- A one-cell Li-ion battery reaches about `4.2 V`, so the current connection can overdrive the ADC input.

Recommended correction:

- Add a resistor divider between `VBAT` and `AIN7`.
- Start with a `2:1` divider such as `100k / 100k` or `47k / 47k`.
- Add a small local capacitor near the ADC side of the divider, for example `100nF`, if the final sample bandwidth still allows it.
- Update firmware scaling after the hardware change.

Analysis and reason:

- This is a direct electrical overstress risk, not just a measurement error.
- Overdriving an ADC input can produce corrupted readings, injected current into protection structures, or long-term reliability issues.
- Because battery telemetry is not an optional feature for a battery-powered design, it should be corrected in hardware instead of being worked around permanently in firmware.

Validation:

- Measure the ADC pin voltage at full charge, mid-charge, and low battery.
- Confirm the ADC pin never exceeds `AVDD`.
- Verify battery reading accuracy after scaling correction.

### 6. Add proper local decoupling and bulk capacitance to the typeboard and external board

Problem:

- The current typeboard and external board do not show explicit capacitor placements for the hall and mux power domains.
- The hall sensors, muxes, and RGB rail therefore share a relatively weak local supply environment.

Recommended correction:

- Add at least one `100nF` decoupling capacitor per `XL4067`.
- Add `4.7uF` to `10uF` local support on `P,+3.3` per board section or per mux cluster.
- Add bulk capacitance at the typeboard power entry, starting around `47uF` to `220uF` on the LED rail side.
- Add minimal but real local decoupling on the external board near the pogo entry and mux.

Analysis and reason:

- The hall architecture is fundamentally sound, but it assumes a reasonably quiet supply.
- The board also carries a large RGB load on a rail that is not a true fixed 5 V source, so load steps can modulate local references.
- Because the ADC is ratiometric to the hall supply, supply noise does not disappear; it still appears as threshold shift, repeatability loss, and sensitivity to LED activity.
- This is the main reason decoupling remains a P0 hardware item even though per-LED decoupling is not required.

Validation:

- Scope `P,+3.3`, `P,+5`, and several analog outputs while switching worst-case RGB patterns.
- Compare ADC repeatability before and after the added decoupling.
- Verify no brownout or visible LED color shift at the far end of the board.

### 7. Re-enable essential battery-charge safety features

Problem:

- `TMR` is tied low, so `BQ24074` safety timers are disabled.
- `TS` is hard-strapped, so battery temperature qualification is effectively disabled.
- This means the current charger implementation is optimized for bring-up convenience rather than battery safety.

Recommended correction:

- Connect a real battery-pack NTC to `TS` using the charger-recommended network.
- Select an intentional `TMR` resistor value so the safety timer is enabled.
- Re-check the programmed input and charge currents after thermal testing.

Analysis and reason:

- This is not just a production nicety; it affects how safely the system behaves during charge faults, thermal stress, or abnormal battery conditions.
- If the design is going to remain battery-powered, the next revision should not keep the charger in a permanently de-safed lab configuration.
- Battery safety risks outrank most convenience or compliance issues, which is why this remains in `P0`.

Validation:

- Verify precharge, fast charge, taper, and termination behavior.
- Verify hot and cold battery qualification with the intended NTC.
- Verify charger temperature during simultaneous system load and battery charging.

## P1 - Strongly Recommended

### 8. Fix the USB-C front end for standards compliance and robustness

Problem:

- `CC1` and `CC2` currently use `4.7k` pulldowns instead of the standard `5.1k` sink value.
- No obvious USB ESD device is shown.
- The controller does not show the small `22R` or `33R` series resistors recommended by Espressif on `D+` and `D-`.
- No clear VBUS protection, fuse, or load-switch stage is shown.

Recommended correction:

- Change both CC pulldowns to `5.1k`.
- Add a USB ESD array close to the connector.
- Add `22R` or `33R` series resistors close to the ESP32-C6 USB pins.
- Reserve footprints for optional small shunt capacitors if later signal-integrity tuning is needed.
- Decide whether VBUS needs a fuse, current-limit switch, or other protection based on the intended usage model.

Analysis and reason:

- The current routing direction is correct because `GPIO12` and `GPIO13` are the native USB pins on ESP32-C6.
- The remaining issues are robustness and standards quality, not basic architecture.
- Because the design is intended to connect to many hosts and hubs, connector-side protection and correct CC termination should be treated as normal engineering practice.

Validation:

- Enumerate on multiple hosts and hubs.
- Verify suspend and resume behavior.
- Run basic ESD and hot-plug robustness tests.

### 9. Route a reliable source-present signal to the MCU

Problem:

- The MCU currently sees `CHG`, but `CHG` alone is not enough to distinguish `USB present but not charging` from `USB absent`.
- `PGOOD` is currently unused.

Recommended correction:

- Route `PGOOD` to an MCU GPIO or, at minimum, to a test point.
- If more detailed power policy is needed later, also consider a simple VBUS sense divider or digital detect path.

Analysis and reason:

- A battery-powered product needs more than charge-state visibility; it needs source-state visibility.
- Without that information, firmware power policy becomes ambiguous around USB attach, USB suspend, charging complete, and battery-only operation.
- This is also valuable during bring-up because it makes power-path debugging much easier.

Validation:

- Verify source detection when USB is attached, detached, brownout-limited, or charge-complete.
- Verify that charger state and source state can be distinguished correctly.

### 10. Decide what the RGB rail is supposed to be and redesign if needed

Problem:

- The net named `P,+5` is not a true regulated 5 V rail; it is the charger system output.
- It sits around `4.4 V` with external input present and follows battery voltage when external input is absent.
- The worst-case RGB load is far above the configured USB input budget.

Recommended correction:

- Choose one of these paths explicitly:
  - keep the current rail and treat RGB as permanently power-limited,
  - add a dedicated LED rail with appropriate conversion and switching,
  - move to LED devices that are intentionally compatible with the available rail.
- Update current budgeting, connector budgeting, and firmware policy to match the chosen path.

Analysis and reason:

- The current design can still light LEDs, but it cannot honestly support unconstrained full-brightness RGB as if it had a real 5 V rail.
- This is an architectural power-budget issue, not just a software-brightness issue.
- It affects USB current draw, battery life, connector heating, and color consistency across source states.

Validation:

- Define and verify the maximum safe RGB current for USB and battery modes.
- Measure rail sag and connector temperature under the chosen LED policy.
- Verify acceptable LED behavior at low battery.

### 11. Rework or clearly justify the split-ground strategy (`P,E` versus `P,GND`)

Problem:

- The design uses two local ground nets that are bridged with `0-ohm` resistors on each board.
- The typeboard and external board do not keep a single obvious analog return path for sensors, LEDs, and interconnect currents.

Recommended correction:

- Either collapse the design to one practical ground system, or keep the split intentionally and document a real star-join strategy.
- If the split is preserved, place and route the `0-ohm` joins based on measured return-current goals rather than symbol naming alone.

Analysis and reason:

- Split grounds are not automatically wrong, but they only help if the return-current behavior is actually controlled.
- In this design, the largest concern is not EMC theory; it is ADC repeatability while RGB and inter-board currents share copper and connector resistance.
- The pogo link is especially sensitive because the two boards do not even use the same local ground name at the interface.

Validation:

- Measure ground delta across the local joins during LED load steps.
- Compare ADC noise and baseline drift before and after the grounding revision.
- Verify stable external-dock behavior through the pogo return path.

### 12. Strengthen the inter-board power path

Problem:

- The connector board routes `P,+5` and `P,+3.3` with relatively thin traces.
- This is not ideal given the possible LED current and the fact that the connector board sits in the only power path between controller and typeboard.

Recommended correction:

- Widen the connector-board power traces.
- Re-check current sharing across duplicated supply pins.
- If a future mechanical revision allows it, allocate more connector pins to the LED rail and return path.

Analysis and reason:

- Logic and hall-sensor current are not the concern here; the LED rail is.
- A passive interposer should not be the narrowest or hottest part of the system.
- Even if firmware limits current, reducing avoidable IR drop improves margin and color consistency.

Validation:

- Measure voltage drop from the controller rail to the far end of the typeboard.
- Check connector and interposer temperature rise under worst intended LED load.

### 13. Add small analog input conditioning near the `TLA2518`

Problem:

- The five mux return lines currently land directly at the ADC.
- There is no obvious per-channel input conditioning for connector noise or mux edge residue.

Recommended correction:

- Add a small RC at each ADC input near the `TLA2518`.
- Start with about `47R` to `100R` series and `100pF` to `220pF` shunt per channel.
- Tune the values only after checking real scan-settle timing.

Analysis and reason:

- The scan architecture is fast enough that a very small input filter is unlikely to become the throughput bottleneck.
- A carefully chosen RC can improve repeatability and reduce the amount of averaging firmware needs to hide analog artifacts.
- This is a refinement item rather than a first-order architectural fix, which is why it sits in `P1`.

Validation:

- Compare per-key noise floor with and without the RC network.
- Verify no noticeable latency or settle-time regression.

## P2 - Next Revision Improvements

### 14. Add real low-power integration for the external dock

Problem:

- The main typeboard exposes `RANA` and `SAKI_MOVE`, but the external dock does not return equivalent control or wake signals to the controller.
- The current external dock is effectively an always-on analog expansion board.

Recommended correction:

- Extend the dock interface so the controller can explicitly sleep the external hall array and receive a wake signal back.
- If pin budget is tight, at least decide whether dock wake support or dock presence detection matters more for the next revision.

Analysis and reason:

- The main board already has the beginnings of a real low-power hall architecture.
- The dock is the outlier, so system deep-sleep current and wake behavior are defined by the least power-aware board.
- This is a useful architectural improvement, but not as urgent as fixing the main controller reset, strap, and ADC issues.

Validation:

- Verify dock-attached sleep current.
- Verify wake from both main-board and dock activity sources.

### 15. Add a dedicated dock-detect signal

Problem:

- The external dock is currently a passive analog add-on with no explicit presence signal.

Recommended correction:

- Add a dedicated dock-detect GPIO or analog ID resistor path.

Analysis and reason:

- A deterministic dock-present signal simplifies firmware policy, calibration profile management, and diagnostics.
- It also helps prevent ambiguous behavior when pogo contact quality is marginal.

Validation:

- Verify hot attach and detach handling.
- Verify correct profile selection with and without the dock.

### 16. Add more formal bring-up, recovery, and test access

Problem:

- Important debug and validation nodes are not all exposed in a structured way.

Recommended correction:

- Add or formalize test access for at least these nets:
  - `EN`
  - `GPIO8`
  - `GPIO9`
  - `U0TX`
  - `U0RX`
  - `VBAT`
  - `P,+5`
  - `P,+3.3`
  - `KEYS_DT_1..5`
  - `RANA`
  - `SAKI_MOVE`
  - charger status pins

Analysis and reason:

- This is not just for manufacturing; it materially speeds up board bring-up and failure analysis.
- It is especially helpful for any design that depends on boot straps, battery power, and shared analog buses.

Validation:

- Use the exposed points to build a repeatable bring-up checklist.
- Verify that field recovery remains possible after intentionally loading bad firmware.

## Temporary Firmware Mitigations for the Current Revision

These are not the preferred fixes, but they can reduce risk on the existing hardware.

### Immediate

- Do not enable the battery ADC channel until a safe divider exists.
- Keep RGB disabled or very dim during first electrical bring-up.
- Treat `BAT_CHG` as advisory only until a real pull-up is added.
- Assume the external dock has no sleep or wake behavior.
- Do not rely on USB auto-download as the only recovery path.

### Before user-facing firmware

- Add a hard global RGB current cap.
- Dim or disable RGB on low battery.
- Reduce RGB brightness during charging.
- If deep-sleep is used on the current hardware, drive `RANA` to the intended level before sleep and enable GPIO hold.
- Use `GPIO3` / `SAKI_MOVE` as the main-board wake source only after measuring its real idle polarity on hardware.

## Validation Checklist for the Next Revision

### Power and charging

- USB-only, battery-only, and charge-plus-load operation
- Long-duration charge test at the chosen current
- Charger thermal check
- Buck thermal and ripple check

### Boot and recovery

- 100-cycle cold boot test
- 100-cycle warm reset test
- Deterministic manual download-mode entry
- Recovery from intentionally broken firmware

### Analog signal chain

- No-key and pressed-key voltage distribution
- Mux settling time per address step
- ADC repeatability with RGB off and on
- Main-board versus external-dock comparison

### USB

- Enumeration across multiple hosts and hubs
- Suspend and resume
- Hot-plug behavior
- Basic ESD robustness

### Low power

- Main-board sleep current
- Wake from `SAKI_MOVE`
- Dock-attached sleep current
- Wake behavior with dock attached and detached

### Interconnect

- Board-to-board voltage drop
- Pogo contact resistance and stability
- Repeated mating and unmating test
