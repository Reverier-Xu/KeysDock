import { Reverier } from "@assets/animates/Reverier";
import Background from "@assets/background.webp";
import Navigator from "@blocks/navigator";
import LoadingTips from "@widgets/loading-tips";
import clsx from "clsx";
import { type ComponentProps, createSignal } from "solid-js";

function LoadingCurtain() {
  const [progress, setProgress] = createSignal(0);
  const [smallProgress, setSmallProgress] = createSignal(0);
  const [shownProgress, setShownProgress] = createSignal(false);

  const progressInterval = setInterval(() => {
    if (!shownProgress()) {
      return;
    }
    if (smallProgress() < 30) {
      setSmallProgress(smallProgress() + 1);
      return;
    }
    if (progress() === 30 && smallProgress() < 60) {
      setSmallProgress(smallProgress() + 1);
      return;
    }
    if (progress() === 60 && smallProgress() < 70) {
      setSmallProgress(smallProgress() + 1);
      return;
    }
    if (progress() === 90 && smallProgress() < 80) {
      setSmallProgress(smallProgress() + 1);
      return;
    }
    if (progress() === 100) {
      clearInterval(progressInterval);
      return;
    }
    setProgress(progress() + 1);
  }, 10);
  setTimeout(() => {
    setShownProgress(true);
  }, 1500);
  return (
    <div
      class={clsx(
        "overflow-hidden fixed w-screen transition-all duration-1000 p-0 m-0 bg-layer",
        progress() < 100 ? "h-screen" : "h-0"
      )}
    >
      <div class="w-screen h-screen flex flex-col items-center justify-center relative">
        <img
          src={Background}
          alt="Background"
          class={clsx(
            "absolute w-full h-full object-cover top-0 left-0 -z-50 transition-opacity duration-1000",
            shownProgress() ? "opacity-100" : "opacity-0"
          )}
        />
        <div class="absolute w-full h-full top-0 left-0 -z-40 bg-layer/80 backdrop-blur-xl" />
        <div class="flex-1" />
        <Reverier width={256} height={256} class="transition-all" />
        <div class="h-8" />
        <div class="flex-1 flex flex-col justify-end w-full">
          <div
            class={clsx(
              "w-full flex items-center justify-center overflow-hidden transition-all duration-1000 gap-2",
              shownProgress() ? "max-h-8 h-8" : "max-h-0 h-0"
            )}
          >
            <LoadingTips />
          </div>
          <div
            class={clsx(
              "w-full flex items-center justify-center overflow-hidden transition-all duration-1000 gap-2",
              shownProgress() ? "max-h-8 h-8" : "max-h-0 h-0"
            )}
          >
            <div class="flex-1 relative h-px max-w-[calc(48vw-4rem)]">
              <div
                class="h-px bg-layer-content absolute right-0 top-0"
                style={{
                  width: `${progress()}%`,
                }}
              />
            </div>
            <span class="text-xl text-primary">{progress().toString(10).padStart(3, "0")}</span>
            <span class="text-xl opacity-60">%</span>
            <div class="flex-1 relative h-px max-w-[calc(48vw-4rem)]">
              <div
                class="h-px bg-layer-content absolute left-0 top-0"
                style={{
                  width: `${progress()}%`,
                }}
              />
            </div>
          </div>
          <div class="h-8" />
        </div>
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
        class={clsx("absolute w-full h-full object-cover top-0 left-0 -z-50 transition-opacity duration-1000 blur-xl opacity-10")}
      />
      {props.children}
      <Navigator />
      <LoadingCurtain />
    </>
  );
}
