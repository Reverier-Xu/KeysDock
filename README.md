# ![Keys Dock](arts/keysdock.svg)

The hall-effect powered, high performance, feature riched keyboard!

> [!WARNING]
> **STILL IN EARLY DEVELOPMENT!**
>
> - [ ] PCB design
> - [ ] Suitkit design
> - [ ] Firmware
> - [ ] Software
> - [ ] Extended external controllers

## Keys layout

KeysDock uses main dock with 80-keys ANSI layout.

## Suitkit design

Designed use [FreeCAD](https://www.freecad.org/) for 3D modeling and [QCAD](https://www.qcad.org/) for nameplate drawn.

Fonts used in design:

- [Iosevka](https://typeof.net/Iosevka/): An elegant monospace coding font;
- [Hershey Fonts](https://en.wikipedia.org/wiki/Hershey_fonts): a collection of vector fonts originally designed to be rendered using vectors on early cathode ray tube displays.

## Hardware design

Designed use [KiCAD](https://www.kicad.org/), validated on [QUCS-s](https://ra3xdh.github.io/).

- MCU and BLE/WiFi: ESP32-C6
- ADC: TLA2518
- Hall-effect sensors: SC4823S6-TR
- Magnetic switch: Gateron Low Profile Magnetic Jade Pro Switch

More component info is available under [here](hardware/docs).

> [!WARNING]
> LIMITATIONS: the extended F-keys suite do not have sleep mode, awake functions and RGB lights.
> Hall-effect keyboard requires too many I/O pins, which makes difficulty in transfer additional features to external dock.

## Firmware

Rust 1.94 is required for build firmware.

## Software

WIP...

## Credits

This project is built entirely with opensource softwares, with power of opensource RISC-V instruction-set.

- [KiCAD](https://www.kicad.org): GPLv3
- [FreeCAD](https://www.freecad.org): LGPLv2.1
- [QCAD](https://www.qcad.org): GPLv3
- [Inkscape](https://www.inkscape.org): GPLv2
- [QUCS-s](https://ra3xdh.github.io): GPLv2
- [Rust](https://www.rust-lang.org): Apache-2.0 & MIT
- [esp-rs](https://docs.espressif.com/projects/rust/): Apache-2.0 & MIT

The current keyboard scheme can roughly be regarded as an original one.

Additionally, special thanks to [LCEDA](https://lceda.cn/), some 3D component models in this project are sourced from here.
