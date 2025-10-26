import DarkmodeButton from "@blocks/darkmode-button";
import { setThemeStore, t, themeStore } from "@storage/theme";
import Button from "@widgets/button";
import Card from "@widgets/card";
import Popover from "@widgets/popover";
import { Show } from "solid-js";

export function ThemeBoxContent() {
  return (
    <div class="flex flex-col space-y-2 min-w-48">
      <Card contentClass="flex flex-col p-0 hover:p-2 hover:space-y-2 transition-all duration-300 group">
        <DarkmodeButton />
        <Button
          ghost
          size="sm"
          class="min-h-0! h-0! group-hover:min-h-8! group-hover:h-8! overflow-hidden border-none"
          onClick={() => {
            setThemeStore({
              colorSchemeFollowsSystem: !themeStore.colorSchemeFollowsSystem,
            });
          }}
        >
          <span class="flex-1 text-start">{t("theme.followSystem")}</span>
          <Show
            when={themeStore.colorSchemeFollowsSystem}
            fallback={<span class="shrink-0 icon-[fluent--position-forward-20-regular] w-5 h-5 opacity-60" />}
          >
            <span class="shrink-0 icon-[fluent--position-forward-20-filled] w-5 h-5 text-primary" />
          </Show>
        </Button>
      </Card>
    </div>
  );
}

export default function ThemeBox() {
  return (
    <Popover
      btnContent={<span class="shrink-0 icon-[fluent--wand-20-regular] w-5 h-5" />}
      square
      ghost
      popContentClass="pt-2"
      positioning={{
        placement: 'top'
      }}
      title={t("theme.title")}
    >
      <ThemeBoxContent />
    </Popover>
  );
}
