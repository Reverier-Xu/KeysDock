# AGENTS.md

## Repo Priority

This repository is currently hardware-first.

- Primary review targets are the KiCad files under `hardware/`.
- `firmware/` and `software/` are still demo-stage and should not be treated as final product architecture unless the user explicitly asks.
- `suitekits/` is mechanical / 3D content and can usually be ignored for electrical reviews.

## Board Map

- `hardware/controller.kicad_sch` and `hardware/controller.kicad_pcb`
  - ESP32-C6 main controller
  - USB-C input
  - battery charger / power-path (`BQ24074`)
  - 3.3V buck (`TPS62142`)
  - external SPI ADC (`TLA2518`)
  - rotary encoder

- `hardware/typeboard.kicad_sch` and `hardware/typeboard.kicad_pcb`
  - main 64-key hall-effect board
  - 4 x `XL4067TS`
  - 65 x WS2812-compatible LEDs
  - shared 20-pin board-to-board link
  - 8-pin pogo link to the external dock

- `hardware/external.kicad_sch` and `hardware/external.kicad_pcb`
  - 14-key hall-effect external dock
  - 1 x `XL4067TS`
  - no RGB chain

- `hardware/connector.kicad_sch` and `hardware/connector.kicad_pcb`
  - passive 20-pin interposer only

- `hardware/keys-group.kicad_sch`
  - reusable 16-key hall sub-sheet used by the typeboard

## Known Hardware Facts

- The main scan architecture is `4 x XL4067TS` on the typeboard plus `1 x XL4067TS` on the external board, feeding `5` analog return lines into `TLA2518`.
- The controller exports mux control lines and receives `KEYS_DT_1..5` through the 20-pin interconnect.
- `P,+5` is not a true fixed 5V rail. It is the charger system output rail from `BQ24074`.
  - roughly 4.4V with external input present
  - battery-following when external input is absent
- `P,E` and `P,GND` are separate local nets on multiple boards and are bridged by 0 ohm links.
  - controller: `R10`
  - typeboard: `R1`
  - external: `R4`
- The current `rev 0.2.7` controller ties `VBAT` directly into `TLA2518` AIN7. Treat that as an overvoltage risk until proven otherwise.
- The current typeboard and external board do not show explicit capacitor footprints. Power integrity review should treat that as a major concern.

## Review Workflow

When asked to review or extend the hardware:

1. Start from the KiCad schematics.
2. Confirm the same conclusions in the PCB files.
3. Cross-check all critical assumptions with the datasheets in `hardware/docs/`.
4. Pay special attention to:
   - the `P,E` versus `P,GND` split,
   - the real meaning of the `P,+5` rail,
   - ADC input range versus hall / battery signals,
   - missing decoupling on sub-boards,
   - inter-board current path limits,
   - USB protection and CC values.

## Documentation Targets

Prefer updating the dedicated hardware docs instead of the README when adding review output.

- `docs/architecture.md`
- `docs/improvement-plan.md`

## Firmware / Software Planning Guidance

If asked for future firmware or software plans, base the plan on the actual hardware constraints:

- TLA2518-driven hall scanning
- power-aware RGB limiting
- main-board sleep / wake support through `RANA` and `SAKI_MOVE`
- external dock treated as a simpler always-on analog expansion unless hardware changes later add equivalent low-power hooks
