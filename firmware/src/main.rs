#![no_std]
#![no_main]
#![deny(
  clippy::mem_forget,
  reason = "mem::forget is generally not safe to do with esp_hal types, especially those holding buffers for the duration of a data transfer."
)]
#![deny(clippy::large_stack_frames)]

use esp_backtrace as _;

// This creates a default app-descriptor required by the esp-idf bootloader.
// For more information see: <https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/system/app_image_format.html#application-description>
esp_bootloader_esp_idf::esp_app_desc!();

#[esp_rtos::main]
async fn main(spawner: embassy_executor::Spawner) {
  rtt_target::rtt_init_defmt!();

  let config = esp_hal::Config::default().with_cpu_clock(esp_hal::clock::CpuClock::max());
  let peripherals = esp_hal::init(config);

  esp_alloc::heap_allocator!(#[esp_hal::ram(reclaimed)] size: 65536);
  // COEX needs more RAM
  esp_alloc::heap_allocator!(size: 64 * 1024);

  let timg0 = esp_hal::timer::timg::TimerGroup::new(peripherals.TIMG0);
  let sw_interrupt =
    esp_hal::interrupt::software::SoftwareInterruptControl::new(peripherals.SW_INTERRUPT);
  esp_rtos::start(timg0.timer0, sw_interrupt.software_interrupt0);

  let _ = spawner;

  loop {
    embassy_time::Timer::after(embassy_time::Duration::from_secs(1)).await;

    defmt::info!("Hello, world!");
  }
}

#[panic_handler]
fn panic(_: &core::panic::PanicInfo) -> ! {
  loop {}
}
