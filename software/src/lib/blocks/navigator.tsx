import Logo from "@assets/logo-full.svg";
import Button from "@widgets/button";

export default function () {
  return (
    <div class="bg-layer-content/5 w-[calc(100vw-1.5rem)] h-16 fixed bottom-3 left-3 border rounded-xl border-layer-content/5 backdrop-blur flex items-center pr-2">
      <img src={Logo} class="h-16 w-auto transition-transform duration-300 hover:scale-105" alt="Keys Dock" />
      <div class="flex-1" />
      <Button type="button" level="primary" square>
        <span class="icon-[fluent--send-20-regular] w-5 h-5" />
      </Button>
    </div>
  );
}
