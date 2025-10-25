/* @refresh reload */
import { render } from "solid-js/web";
import { routes } from "./routes/routes";
import "overlayscrollbars/overlayscrollbars.css";
import "@widgets/styles/base.css";
import { Router } from "@solidjs/router";
import { fullTheme, initTheme } from "@storage/theme";
import { OverlayScrollbarsComponent } from "overlayscrollbars-solid";
import { ErrorBoundary, onMount } from "solid-js";

render(() => {
  initTheme();
  onMount(() => {
    setTimeout(() => {
      document.documentElement.classList.add("transition-colors", "duration-700");
      document.body.classList.add("transition-colors", "duration-700");
    }, 1000);
  });
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div class="relative w-screen h-screen gap-12 flex flex-col items-center justify-center bg-layer">
          <h1 class="text-3xl font-bold space-x-2">
            <span class="opacity-60">Oops x_x,</span>
            <span>
              <span class="opacity-60">[</span>
              <span class="text-primary">KEYS</span>
              <span class="opacity-60">]</span>
              <span>&nbsp;</span>
              <span class="opacity-60">[</span>
              <span class="text-error">@</span>
              <span class="opacity-60">]</span>
              <span>&nbsp;</span>
              <span class="opacity-60 animate-ping">_</span>
              <span>seems load failed.</span>
            </span>
          </h1>
          <p class="opacity-60 max-w-5xl text-wrap p-3 text-center">
            Sometimes this error will happen after an update of frontend, just refresh this page and everything will
            work normally.
          </p>
          <h2 class="text-2xl flex items-center gap-2">
            <span class="shrink-0 icon-[fluent-emoji-flat--globe-with-meridians] w-8 h-8" />
            <span class="shrink-0 icon-[fluent-emoji-flat--collision] w-8 h-8" />
            <span class="shrink-0 icon-[fluent-emoji-flat--right-arrow] w-8 h-8" />
            <span class="shrink-0 icon-[fluent-emoji-flat--knocked-out-face] w-8 h-8" />
            <span>,</span>
            <span class="shrink-0 icon-[fluent-emoji-flat--thinking-face] w-8 h-8" />
            <span class="shrink-0 icon-[fluent-emoji-flat--right-arrow] w-8 h-8" />
            <span class="shrink-0 icon-[fluent-emoji-flat--index-pointing-up] w-8 h-8" />
            <span class="shrink-0 icon-[fluent-emoji-flat--nerd-face] w-8 h-8" />
            <span>,</span>
            <span class="shrink-0 icon-[fluent-emoji-flat--man-bowing] w-8 h-8" />
            <span class="shrink-0 icon-[fluent-emoji-flat--backhand-index-pointing-right] w-8 h-8" />
            <button
              class="icon-[fluent-emoji-flat--repeat-button] transition-all hover:bg-layer-content/15 cursor-pointer"
              type="button"
              onClick={() => {
                reset();
                window.location.reload();
              }}
            />
            <span class="shrink-0 icon-[fluent-emoji-flat--backhand-index-pointing-left] w-8 h-8" />
          </h2>
          <p class="opacity-60 max-w-5xl text-wrap p-8 rounded-md bg-layer-content/5">{error.message}</p>
        </div>
      )}
    >
      <OverlayScrollbarsComponent
        options={{
          scrollbars: {
            theme: `os-theme-${fullTheme()}`,
            autoHide: "scroll",
          },
        }}
        class="relative w-screen h-screen print:h-auto print:overflow-auto"
        defer
      >
        <div class="flex flex-col min-h-full min-w-fit">
          <Router explicitLinks>{routes}</Router>
        </div>
      </OverlayScrollbarsComponent>
    </ErrorBoundary>
  );
}, document.getElementById("root") || document.body);
