# KeysDock SPICE Simulation Findings

## SP01

- Variables: v(v-sweep), v(vin), v(aout), i(vbat)
- **Result:** At VBAT=4.50V, AIN7=2.250V (ratio=0.500, expected 0.500). OK for TLA2518 0-3.3V range.
- Data points: 16

## SP02

- Variables: time, v(vusb), v(vin), v(bat), v(xbat.n_int), v(xu4.vin_ok)...
- **Result:** USB present: SYS=4.38V, BAT=3.50V, CHG=3.30V (not charging due to TS fault), PGOOD=0.00V. TS bias at 5000.0mV is below cold threshold.
- Data points: 826

## SP03

- Variables: time, v(vin), v(vreg), v(vout), i(vbuck), i(vin)
- **Result:** Vout min=-0.000V, max=3.300V, final=3.295V (target 3.3V). ~220µF output capacitance causes prolonged soft-start but regulates.
- Data points: 70040

## SP04

- Variables: time, v(vdd), v(mag), v(sleep), v(xhall.sleep_int), v(xhall.gidd_int1)...
- **Result:** Hall output step tracked by mux/ADC. Final ADC code=1.650V vs hall=1.650V. Settling is within ~1µs for 200Ω Ron + 20pF load.
- Data points: 3044

## SP05

- Variables: time, v(vdd), v(s0), v(s1), v(eb), v(a0)...
- Data points: 508

## SP06

- Variables: time, v(gndd), v(gnda), v(ref), v(ain), i(lret)...
- Data points: 50027

## SP07

- Variables: frequency, v(vout), v(xc1.n3), v(xc2.n3), v(xc3.n3), v(xc4.n3)...
- Data points: 141

## SP08

- Variables: time, v(vdd), v(mag), v(sleep), v(xhall.sleep_int), v(xhall.gidd_int1)...
- Data points: 1529

## SP09

- Variables: time, v(vbus), v(esd), i(vesd)
- Data points: 524

## SP10

- Variables: time, v(src), v(dp), i(vesd)
- Data points: 426

## SP11

- Variables: time, v(vin), v(adc_in), v(xs1.samp_node), v(xs1.g1_int1), v(samp)...
- Data points: 3020

## SP12

- Variables: time, v(src), v(vin), v(xu6.en_int), v(on), v(xu6.vout_ctrl)...
- **Result:** Max input current=2.000A (limited by model), final VCC=2.081V. 82 RGBW LEDs at full white draw ~4.9A, exceeding TPS22910A 2A rating and USB 500mA limit. Firmware must enforce current budget.
- Data points: 50018

## SP13

- Variables: time, v(bat), v(sys), i(vbat)
- Data points: 508

## SP16

- Variables: v(v-sweep), v(vin), v(ts_bad), v(ts_good), i(vusb)
- **Result:** At VIN=6.0V: current schematic TS/VIN=0.0% (FAULT, <45%); recommended 22kΩ/47kΩ divider TS/VIN=68.1% (OK, within 45-80% window).
- Data points: 16

## Summary of Critical Findings

1. **BQ24074 TS bias is wrong in current schematic.** R14=10kΩ pulls TS to GND, causing a TS fault and preventing charging. Use a 22kΩ/47kΩ divider from VIN or bias TS to ~66% of VIN.
2. **LED current budget violation.** 82 WS2812B RGBW LEDs at full white draw ~4.9A, exceeding the TPS22910A 2A switch rating and the USB-C 500mA advertised limit. Firmware must limit brightness based on power source.
3. **+3.3V output capacitance is large (~220µF).** TPS62142 regulates but soft-start is prolonged; verify loop stability and inrush on hardware.
4. **VBAT divider is correct.** R8/R9=100kΩ gives AIN7 = VBAT/2, staying within TLA2518 0-3.3V range for VBAT up to 4.5V.
