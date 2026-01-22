import { Reverier } from "@assets/animates/Reverier";
import Background from "@assets/background.webp";
import Navigator from "@blocks/navigator";
import clsx from "clsx";
import { type ComponentProps, createSignal } from "solid-js";

function LoadingCurtain() {
  const [shownProgress, setShownProgress] = createSignal(true);

  setTimeout(() => {
    setShownProgress(false);
  }, 1000);
  return (
    <div
      class={clsx(
        "overflow-hidden fixed w-screen transition-all duration-1000 p-0 m-0 bg-layer z-50",
        shownProgress() ? "h-screen" : "h-0"
      )}
    >
      <div class="w-screen h-screen flex flex-col items-center justify-center relative">
        <div class="flex-1" />
        <Reverier width={200} height={200} />
        <div class="flex-1" />
        <div class="h-8" />
      </div>
    </div>
  );
}

export default function (props: ComponentProps<"div">) {
  return (
    <>
      <img
        src={Background}
        alt="Background"
        class={clsx(
          "absolute w-full h-full object-cover top-0 left-0 -z-50 transition-opacity duration-600 blur-xl opacity-30"
        )}
      />
      {props.children}
      <Navigator />
      <LoadingCurtain />
    </>
  );
}
