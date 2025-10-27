import Nichiko from "@assets/nichiko-small.webp";
import { useWindowSize } from "@solid-primitives/resize-observer";
import Button from "@widgets/button";
import clsx from "clsx";
import { createSignal } from "solid-js";

export function Key(props: {
  label: {
    shift?: string;
    normal: string;
    fn?: string;
  };
  unit?: number;
}) {
  const windowSize = useWindowSize();
  const vPxPerMm = () => windowSize.width / 400;

  const unit = 19.05;
  const pad = 1;
  const fontSize = () => 4 * vPxPerMm();
  const keySize = () => unit * (props.unit || 1) * vPxPerMm();
  return (
    <div
      class="flex items-center justify-center"
      style={{
        width: `${keySize()}px`,
        height: `${unit * vPxPerMm()}px`,
      }}
    >
      <button
        type="button"
        class="box-border border-layer-content/15 transition-colors hover:cursor-pointer bg-layer-content/5 hover:bg-layer-content/15 active:bg-layer-content/10 flex flex-col"
        style={{
          'border-width': `${vPxPerMm() * 0.5}px`,
          width: `${keySize() - 2 * pad * vPxPerMm()}px`,
          height: `${unit * vPxPerMm() - 2 * pad * vPxPerMm()}px`,
          "font-size": `${fontSize()}px`,
          "border-radius": `${vPxPerMm()}px`,
          'padding-top': `${1 * vPxPerMm()}px`,
          'padding-left': `${2 * vPxPerMm()}px`,
          'padding-right': `${2 * vPxPerMm()}px`,
        }}
      >
        <div class="flex-1 shrink-0 flex items-center opacity-60" style={{
          "font-size": `${fontSize() * 0.9}px`,
        }}>
          <span>{props.label.shift}</span>
          <div class="flex-1">&nbsp;</div>
          <span class="text-warning">{props.label.fn}</span>
        </div>
        <div class="flex-1 shrink-0 flex items-center justify-center">{props.label.normal}</div>
        <div class="flex-1" />
      </button>
    </div>
  );
}

export default function (props: { upPlugged?: boolean }) {
  const windowSize = useWindowSize();
  const vPxPerMm = () => windowSize.width / 400;

  const unit = 19.05;
  const border = 5;
  const sideContainer = 30;
  const cols = 15;
  const rows = 5;
  const width = () => (unit * cols + border * 3 + sideContainer) * vPxPerMm();
  const height = () => (unit * rows + border * 2) * vPxPerMm();
  const fWidth = () => (unit * cols + border * 2) * vPxPerMm();
  const fHeight = () => (unit + border * 2) * vPxPerMm();
  const fontSize = () => 4 * vPxPerMm();
  const [currentLayer, setCurrentLayer] = createSignal(0);
  return (
<div class="flex flex-row justify-center space-x-12">
  <div class="w-16 border border-layer-content/15 space-y-2 flex flex-col items-center p-2 rounded-2xl bg-layer-content/5">
    <Button square ghost>
      <span class="icon-[fluent--save-20-regular] w-5 h-5" />
    </Button>
    <Button square ghost>
      <span class="icon-[fluent--arrow-hook-up-left-20-regular] w-5 h-5" />
    </Button>
    <div class="flex-1" />
    <Button square onClick={() => setCurrentLayer(5)} ghost={currentLayer() !== 5}>5</Button>
    <Button square onClick={() => setCurrentLayer(4)} ghost={currentLayer() !== 4}>4</Button>
    <Button square onClick={() => setCurrentLayer(3)} ghost={currentLayer() !== 3}>3</Button>
    <Button square onClick={() => setCurrentLayer(2)} ghost={currentLayer() !== 2}>2</Button>
    <Button square onClick={() => setCurrentLayer(1)} ghost={currentLayer() !== 1}>1</Button>
    <Button square onClick={() => setCurrentLayer(0)} ghost={currentLayer() !== 0}>0</Button>
    {/* <div class="flex-1" /> */}
  </div>
      <div class="flex flex-col space-y-4">
      <div
        class="border box-border border-layer-content/15 self-end bg-layer flex items-center justify-center"
        style={{
          width: `${fWidth()}px`,
          height: `${fHeight()}px`,
          "border-radius": `${6 * vPxPerMm()}px`,
        }}
      >
        <div
          class={clsx("flex", props.upPlugged ? "opacity-100" : "opacity-30")}
          style={{
            "border-radius": `${vPxPerMm()}px`,
            height: `${unit * vPxPerMm()}px`,
            width: `${unit * cols * vPxPerMm()}px`,
          }}
        >
          <Key label={{ normal: "Esc" }} />
          <div style={{ width: `${unit * 0.25 * vPxPerMm()}px` }} />
          <Key label={{ normal: "F1" }} />
          <Key label={{ normal: "F2" }} />
          <Key label={{ normal: "F3" }} />
          <Key label={{ normal: "F4" }} />
          <div style={{ width: `${unit * 0.25 * vPxPerMm()}px` }} />
          <Key label={{ normal: "F5" }} />
          <Key label={{ normal: "F6" }} />
          <Key label={{ normal: "F7" }} />
          <Key label={{ normal: "F8" }} />
          <div style={{ width: `${unit * 0.25 * vPxPerMm()}px` }} />
          <Key label={{ normal: "F9" }} />
          <Key label={{ normal: "F10" }} />
          <Key label={{ normal: "F11" }} />
          <Key label={{ normal: "F12" }} />
          <div style={{ width: `${unit * 0.25 * vPxPerMm()}px` }} />
          <Key label={{ normal: "Del" }} />
        </div>
      </div>
      <div
        class="border box-border border-layer-content/15 flex flex-row bg-layer items-center justify-center"
        style={{
          width: `${width()}px`,
          height: `${height()}px`,
          "border-radius": `${6 * vPxPerMm()}px`,
        }}
      >
        <div
          class="border box-border border-layer-content/15 h-full flex flex-col bg-layer-content/5"
          style={{
            width: `${sideContainer * vPxPerMm()}px`,
            "border-radius": `${vPxPerMm()}px`,
            height: `${unit * 5 * vPxPerMm()}px`,
          }}
        >
          <h3
            class="w-full flex items-center justify-center flex-1"
            style={{
              "font-size": `${fontSize()}px`,
            }}
          >
            <span>
              <span class="font-bold opacity-80">[</span>
              <span class="text-primary">KEYS</span>
              <span class="font-bold opacity-80">]</span>
              <br />
              <span class="font-bold opacity-80">[</span>
              <span class="font-bold text-error">@</span>
              <span class="font-bold opacity-80">]</span>
              <span class="font-bold opacity-80">$</span>
              <span>&nbsp;</span>
              <span class="font-bold opacity-80">_</span>
            </span>
          </h3>
          <button
            type="button"
            class="border box-border border-layer-content/15 transition-colors hover:cursor-pointer bg-layer-content/5 hover:bg-layer-content/10 active:bg-layer-content/15 flex space-x-2 items-center justify-center"
            style={{
              "margin-left": `${border * 0.6 * vPxPerMm()}px`,
              "margin-right": `${border * 0.6 * vPxPerMm()}px`,
              "margin-bottom": `${border * 0.6 * vPxPerMm()}px`,
              height: `${unit * 0.4 * vPxPerMm()}px`,
              "border-radius": `${vPxPerMm()}px`,
              'font-size': `${fontSize() * 0.8}px`,
            }}
          >
            <span class="icon-[fluent--arrow-rotate-clockwise-20-regular] animate-spin" style={{
              width: `${fontSize()}px`,
            }} />
            <span>WHEEL</span>
          </button>
          <div style={{
            height: `${unit * 0.2 * vPxPerMm()}px`,
          }} />
          <button
            type="button"
            class="border box-border border-layer-content/15 hover:cursor-pointer bg-layer hover:bg-layer-content/5 active:bg-layer-content/10 transition-colors overflow-hidden"
            style={{
              "margin-left": `${border * 0.6 * vPxPerMm()}px`,
              "margin-right": `${border * 0.6 * vPxPerMm()}px`,
              "margin-bottom": `${border * 0.6 * vPxPerMm()}px`,
              height: `${unit * 2.55 * vPxPerMm()}px`,
              "border-radius": `${vPxPerMm()}px`,
            }}
          >
            <img src={Nichiko} alt="Nichiko" class="w-full h-full object-cover" />
          </button>
          <div style={{
            height: `${unit * 0.2 * vPxPerMm()}px`,
          }} />
        </div>
        <div
          class="flex flex-col"
          style={{
            "margin-left": `${border * vPxPerMm()}px`,
            height: `${unit * rows * vPxPerMm()}px`,
            width: `${unit * cols * vPxPerMm()}px`,
            "border-radius": `${vPxPerMm()}px`,
          }}
        >
          <div class="flex">
            <Key label={{ normal: "`", shift: "~", fn: "Esc" }} />
            <Key label={{ normal: "1", shift: "!", fn: "F1" }} />
            <Key label={{ normal: "2", shift: "@", fn: "F2" }} />
            <Key label={{ normal: "3", shift: "#", fn: "F3" }} />
            <Key label={{ normal: "4", shift: "$", fn: "F4" }} />
            <Key label={{ normal: "5", shift: "%", fn: "F5" }} />
            <Key label={{ normal: "6", shift: "^", fn: "F6" }} />
            <Key label={{ normal: "7", shift: "&", fn: "F7" }} />
            <Key label={{ normal: "8", shift: "*", fn: "F8" }} />
            <Key label={{ normal: "9", shift: "(", fn: "F9" }} />
            <Key label={{ normal: "0", shift: ")", fn: "F10" }} />
            <Key label={{ normal: "-", shift: "_", fn: "F11" }} />
            <Key label={{ normal: "=", shift: "+", fn: "F12" }} />
            <Key label={{ normal: "Backspace" }} unit={2} />
          </div>
          <div class="flex">
            <Key label={{ normal: "Tab" }} unit={1.5} />
            <Key label={{ normal: "Q", fn: "BLE-1" }} />
            <Key label={{ normal: "W", fn: "BLE-2" }} />
            <Key label={{ normal: "E", fn: "BLE-3" }} />
            <Key label={{ normal: "R", fn: "2.4G" }} />
            <Key label={{ normal: "T" }} />
            <Key label={{ normal: "Y" }} />
            <Key label={{ normal: "U" }} />
            <Key label={{ normal: "I" }} />
            <Key label={{ normal: "O" }} />
            <Key label={{ normal: "P" }} />
            <Key label={{ normal: "[", shift: "{" }} />
            <Key label={{ normal: "]", shift: "}" }} />
            <Key label={{ normal: "\\", shift: "|" }} unit={1.5} />
          </div>
          <div class="flex">
            <Key label={{ normal: "Caps Lock" }} unit={1.75} />
            <Key label={{ normal: "A" }} />
            <Key label={{ normal: "S" }} />
            <Key label={{ normal: "D" }} />
            <Key label={{ normal: "F" }} />
            <Key label={{ normal: "G" }} />
            <Key label={{ normal: "H" }} />
            <Key label={{ normal: "J" }} />
            <Key label={{ normal: "K" }} />
            <Key label={{ normal: "L" }} />
            <Key label={{ normal: ";", shift: ":" }} />
            <Key label={{ normal: "'", shift: '"' }} />
            <Key label={{ normal: "Enter" }} unit={2.25} />
          </div>
          <div class="flex">
            <Key label={{ normal: "Shift" }} unit={2} />
            <Key label={{ normal: "Z" }} />
            <Key label={{ normal: "X" }} />
            <Key label={{ normal: "C" }} />
            <Key label={{ normal: "V" }} />
            <Key label={{ normal: "B" }} />
            <Key label={{ normal: "N" }} />
            <Key label={{ normal: "M" }} />
            <Key label={{ normal: ",", shift: "<", fn: "Home" }} />
            <Key label={{ normal: ".", shift: ">", fn: "End" }} />
            <Key label={{ normal: "/", shift: "?" }} />
            <Key label={{ normal: "▣" }} />
            <Key label={{ normal: "▲" }} />
            <Key label={{ normal: "▣" }} />
          </div>
          <div class="flex">
            <Key label={{ normal: "Ctrl" }} unit={1.25} />
            <Key label={{ normal: "Meta" }} unit={1.25} />
            <Key label={{ normal: "Alt" }} unit={1.25} />
            <Key label={{ normal: "Space" }} unit={6.25} />
            <Key label={{ normal: "Alt" }} />
            <Key label={{ normal: "Fn" }} />
            <Key label={{ normal: "◄" }} />
            <Key label={{ normal: "▼" }} />
            <Key label={{ normal: "►" }} />
          </div>
        </div>
      </div>
    </div>
</div>
  );
}
