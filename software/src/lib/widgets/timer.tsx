import { DateTime, Duration } from "luxon";
import { type ComponentProps, createEffect, createSignal, onCleanup, untrack } from "solid-js";

export default function (
  props: ComponentProps<"span"> & { end: DateTime; hasHours?: boolean; onTimeout?: () => void }
) {
  const [duration, setDuration] = createSignal(props.end.diffNow());
  let interval: NodeJS.Timeout;
  function setup() {
    interval = setInterval(() => {
      setDuration(props.end > DateTime.now() ? props.end.diffNow() : Duration.fromObject({ seconds: 0 }));
      if (props.end <= DateTime.now()) {
        props.onTimeout?.();
        clearInterval(interval);
      }
    }, 1000);
  }
  createEffect(() => {
    if (props.end > DateTime.now()) {
      untrack(() => {
        clearInterval(interval);
        setup();
      });
    }
  });
  const cleanup = () => clearInterval(interval);
  onCleanup(cleanup);
  const format = props.hasHours ? "hh:mm:ss" : "mm:ss";
  return <span {...props}>{duration().toFormat(format)}</span>;
}
